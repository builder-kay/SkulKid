-- Immutable, course-level Public Learning publication revisions.
-- Teachers continue editing Subject/Unit/Topic/AdminLessonRecord while learners
-- only read the revision referenced by Subject.currentPublicRevisionId.

CREATE TABLE public."PublicLearningRevision" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "courseId" text NOT NULL REFERENCES public."Subject"("id") ON DELETE CASCADE,
  "version" integer NOT NULL CHECK ("version" > 0),
  "status" text NOT NULL
    CHECK ("status" IN ('pending_review', 'changes_requested', 'approved', 'superseded', 'archived')),
  "snapshot" jsonb NOT NULL,
  "contentHash" text NOT NULL,
  "submittedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "submittedAt" timestamptz NOT NULL DEFAULT now(),
  "reviewedBy" uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  "reviewedAt" timestamptz,
  "reviewNote" text,
  "publishedAt" timestamptz,
  UNIQUE ("courseId", "version")
);

CREATE UNIQUE INDEX "PublicLearningRevision_one_pending_per_course_idx"
ON public."PublicLearningRevision" ("courseId")
WHERE "status" = 'pending_review';

CREATE INDEX "PublicLearningRevision_status_submitted_idx"
ON public."PublicLearningRevision" ("status", "submittedAt" DESC);

ALTER TABLE public."Subject"
  ADD COLUMN IF NOT EXISTS "currentPublicRevisionId" uuid
    REFERENCES public."PublicLearningRevision"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Subject_current_public_revision_idx"
ON public."Subject" ("currentPublicRevisionId");

ALTER TABLE public."PublicLearningRevision" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read relevant public learning revisions"
ON public."PublicLearningRevision" FOR SELECT TO authenticated
USING (
  public.is_skulkid_admin()
  OR EXISTS (
    SELECT 1 FROM public."Subject" subject
    WHERE subject."id" = "PublicLearningRevision"."courseId"
      AND subject."createdBy" = auth.uid()
  )
);

GRANT SELECT ON public."PublicLearningRevision" TO authenticated;
GRANT ALL ON public."PublicLearningRevision" TO service_role;

-- Atomically approve one revision and make it the learner-visible version.
CREATE OR REPLACE FUNCTION public.activate_public_learning_revision(
  revision_id uuid,
  reviewer_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_course_id text;
BEGIN
  SELECT "courseId" INTO selected_course_id
  FROM public."PublicLearningRevision"
  WHERE "id" = revision_id
    AND "status" = 'pending_review'
  FOR UPDATE;

  IF selected_course_id IS NULL THEN
    RAISE EXCEPTION 'Publication revision is not awaiting approval.';
  END IF;

  UPDATE public."PublicLearningRevision"
  SET "status" = 'superseded'
  WHERE "courseId" = selected_course_id
    AND "status" = 'approved'
    AND "id" <> revision_id;

  UPDATE public."PublicLearningRevision"
  SET
    "status" = 'approved',
    "reviewedBy" = reviewer_id,
    "reviewedAt" = now(),
    "reviewNote" = NULL,
    "publishedAt" = now()
  WHERE "id" = revision_id;

  UPDATE public."Subject"
  SET
    "currentPublicRevisionId" = revision_id,
    "status" = 'ACTIVE',
    "updatedAt" = now()
  WHERE "id" = selected_course_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_public_learning_revision(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_public_learning_revision(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.unpublish_public_learning_course(
  selected_course_id text,
  archive_course boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF archive_course THEN
    UPDATE public."PublicLearningRevision"
    SET "status" = 'archived'
    WHERE "courseId" = selected_course_id
      AND "status" IN ('pending_review', 'changes_requested', 'approved');
  ELSE
    UPDATE public."PublicLearningRevision"
    SET "status" = 'archived'
    WHERE "id" = (
      SELECT "currentPublicRevisionId"
      FROM public."Subject"
      WHERE "id" = selected_course_id
    );
  END IF;

  UPDATE public."Subject"
  SET
    "currentPublicRevisionId" = NULL,
    "status" = CASE WHEN archive_course THEN 'ARCHIVED'::public."CurriculumStatus" ELSE "status" END,
    "updatedAt" = now()
  WHERE "id" = selected_course_id;
END;
$$;

REVOKE ALL ON FUNCTION public.unpublish_public_learning_course(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unpublish_public_learning_course(text, boolean) TO service_role;

-- Existing live platform courses are treated as already approved. This
-- idempotent backfill prevents them disappearing when learner APIs switch to
-- revision-backed reads.
WITH legacy_snapshots AS (
  SELECT
    subject."id" AS course_id,
    subject."createdBy" AS creator_id,
    jsonb_build_object(
      'course', jsonb_build_object(
        'id', subject."id",
        'name', subject."name",
        'slug', subject."slug",
        'description', subject."description",
        'color', subject."colourToken",
        'coverUrl', subject."coverUrl",
        'gradeLevels', subject."gradeLevels",
        'order', subject."order"
      ),
      'units', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', unit."id",
            'subjectId', unit."subjectId",
            'title', unit."name",
            'slug', unit."slug",
            'description', unit."description",
            'order', unit."order",
            'topics', COALESCE((
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', topic."id",
                  'unitId', topic."unitId",
                  'title', topic."name",
                  'slug', topic."slug",
                  'description', topic."description",
                  'order', topic."order",
                  'lessonIds', COALESCE((
                    SELECT jsonb_agg(lesson."id" ORDER BY lesson."position")
                    FROM public."AdminLessonRecord" lesson
                    WHERE lesson."topicId" = topic."id"
                      AND lesson."status" = 'published'
                  ), '[]'::jsonb)
                )
                ORDER BY topic."order"
              )
              FROM public."Topic" topic
              WHERE topic."unitId" = unit."id"
            ), '[]'::jsonb)
          )
          ORDER BY unit."order"
        )
        FROM public."Unit" unit
        WHERE unit."subjectId" = subject."id"
      ), '[]'::jsonb),
      'lessons', COALESCE((
        SELECT jsonb_agg(
          lesson."record" || jsonb_build_object(
            'courseId', lesson."courseId",
            'unitId', lesson."unitId",
            'topicId', lesson."topicId",
            'classId', lesson."classId"
          )
          ORDER BY lesson."position"
        )
        FROM public."AdminLessonRecord" lesson
        WHERE lesson."courseId" = subject."id"
          AND lesson."status" = 'published'
      ), '[]'::jsonb)
    ) AS snapshot
  FROM public."Subject" subject
  WHERE subject."status" = 'ACTIVE'
    AND subject."visibility" = 'platform'
    AND subject."currentPublicRevisionId" IS NULL
    AND EXISTS (
      SELECT 1 FROM public."AdminLessonRecord" lesson
      WHERE lesson."courseId" = subject."id"
        AND lesson."status" = 'published'
    )
),
inserted AS (
  INSERT INTO public."PublicLearningRevision"
    ("courseId", "version", "status", "snapshot", "contentHash", "submittedBy",
     "reviewedAt", "publishedAt")
  SELECT
    course_id, 1, 'approved', snapshot, md5(snapshot::text), creator_id,
    now(), now()
  FROM legacy_snapshots
  ON CONFLICT ("courseId", "version") DO NOTHING
  RETURNING "id", "courseId"
)
UPDATE public."Subject" subject
SET "currentPublicRevisionId" = inserted."id"
FROM inserted
WHERE subject."id" = inserted."courseId";

COMMENT ON TABLE public."PublicLearningRevision"
IS 'Frozen course snapshots submitted for Public Learning review and publication.';

-- A class-only course may be assigned to several classes owned by the same
-- teacher. Preserve the original ownerClassId compatibility while authorizing
-- every active class assignment.
DROP POLICY IF EXISTS "class members read class-only subjects" ON public."Subject";
CREATE POLICY "class members read class-only subjects" ON public."Subject"
FOR SELECT TO authenticated
USING (
  "status" = 'ACTIVE'
  AND "visibility" = 'class'
  AND (
    public.is_skulkid_staff()
    OR EXISTS (
      SELECT 1
      FROM public."ClassCourseAssignment" assignment
      JOIN public."ClassMembership" membership
        ON membership."classId" = assignment."classId"
      WHERE assignment."courseId" = "Subject"."id"
        AND membership."studentId" = auth.uid()
        AND membership."status" = 'active'
    )
  )
);

-- Canonical authoring tables contain working edits. Learners receive public
-- content through revision-backed server APIs, never through these tables.
DROP POLICY IF EXISTS "published platform subjects are readable" ON public."Subject";
DROP POLICY IF EXISTS "published nonempty subjects are readable" ON public."Subject";
DROP POLICY IF EXISTS "staff manage subject" ON public."Subject";
CREATE POLICY "creators manage own subjects" ON public."Subject"
FOR ALL TO authenticated
USING (public.is_skulkid_admin() OR "createdBy" = auth.uid())
WITH CHECK (public.is_skulkid_admin() OR "createdBy" = auth.uid());

DROP POLICY IF EXISTS "published units are readable" ON public."Unit";
DROP POLICY IF EXISTS "staff manage unit" ON public."Unit";
CREATE POLICY "creators manage own units" ON public."Unit"
FOR ALL TO authenticated
USING (
  public.is_skulkid_admin()
  OR EXISTS (
    SELECT 1 FROM public."Subject" subject
    WHERE subject."id" = "Unit"."subjectId"
      AND subject."createdBy" = auth.uid()
  )
)
WITH CHECK (
  public.is_skulkid_admin()
  OR EXISTS (
    SELECT 1 FROM public."Subject" subject
    WHERE subject."id" = "Unit"."subjectId"
      AND subject."createdBy" = auth.uid()
  )
);

DROP POLICY IF EXISTS "published topics are readable" ON public."Topic";
DROP POLICY IF EXISTS "staff manage topic" ON public."Topic";
CREATE POLICY "creators manage own topics" ON public."Topic"
FOR ALL TO authenticated
USING (
  public.is_skulkid_admin()
  OR EXISTS (
    SELECT 1
    FROM public."Unit" unit
    JOIN public."Subject" subject ON subject."id" = unit."subjectId"
    WHERE unit."id" = "Topic"."unitId"
      AND subject."createdBy" = auth.uid()
  )
)
WITH CHECK (
  public.is_skulkid_admin()
  OR EXISTS (
    SELECT 1
    FROM public."Unit" unit
    JOIN public."Subject" subject ON subject."id" = unit."subjectId"
    WHERE unit."id" = "Topic"."unitId"
      AND subject."createdBy" = auth.uid()
  )
);

DROP POLICY IF EXISTS "published lesson records are readable" ON public."AdminLessonRecord";
DROP POLICY IF EXISTS "staff manage lesson records" ON public."AdminLessonRecord";
CREATE POLICY "creators manage own lesson records"
ON public."AdminLessonRecord" FOR ALL TO authenticated
USING (public.is_skulkid_admin() OR "createdBy" = auth.uid())
WITH CHECK (public.is_skulkid_admin() OR "createdBy" = auth.uid());

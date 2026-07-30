-- Teacher Kay: media-led, all-grades Public Learning subject.
-- Rerunnable: replaces only teacher-kay-visual-discovery.

DO $seed$
DECLARE
  teacher_id uuid;
  teacher_count integer;
  subject_id text := 'teacher-kay-visual-discovery';
  unit_id text;
  topic_id text;
  lesson_id text;
  version_id text;
  revision_id uuid;
  public_snapshot jsonb;
  fixture jsonb;
  record_data jsonb;
  item record;
  timestamp_text text := to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  SELECT count(*) INTO teacher_count
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND coalesce(raw_app_meta_data ->> 'role', '') IN ('teacher','admin');

  IF teacher_count = 0 THEN
    RAISE EXCEPTION 'Teacher Kay was not found.';
  ELSIF teacher_count > 1 THEN
    RAISE EXCEPTION 'More than one Teacher Kay account was found.';
  END IF;

  SELECT id INTO teacher_id
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND coalesce(raw_app_meta_data ->> 'role', '') IN ('teacher','admin')
  LIMIT 1;

  -- Break the publication reference before replacing this one seed subject.
  UPDATE public."Subject"
  SET "currentPublicRevisionId" = NULL
  WHERE id = subject_id AND "createdBy" = teacher_id;

  DELETE FROM public."PublicLearningRevision"
  WHERE "courseId" = subject_id;

  DELETE FROM public."TeacherQuiz"
  WHERE "createdBy" = teacher_id
    AND (
      "courseId" = subject_id
      OR "lessonId" LIKE subject_id || '-lesson-%'
    );

  DELETE FROM public."AdminLessonRecord"
  WHERE "createdBy" = teacher_id
    AND (
      "courseId" = subject_id
      OR id LIKE subject_id || '-lesson-%'
    );

  DELETE FROM public."Topic"
  WHERE "unitId" LIKE subject_id || '-strand-%';

  DELETE FROM public."Unit"
  WHERE "subjectId" = subject_id;

  DELETE FROM public."Subject"
  WHERE id = subject_id AND "createdBy" = teacher_id;

  INSERT INTO public."Subject"
    ("id","name","slug","description","icon","colourToken","coverUrl","gradeLevels",
     "order","status","visibility","ownerClassId","createdBy","createdAt","updatedAt")
  VALUES
    (subject_id,
     'Visual Discovery Adventures',
     subject_id,
     'Travel through nature, space and creative technology using short videos, vivid photographs, observation missions and simple supporting text. Designed for learners in every primary grade.',
     'images',
     '#0EA5E9',
     'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1400&q=85',
     ARRAY[1,2,3,4,5,6],
     160,
     'ACTIVE',
     'platform',
     NULL,
     teacher_id,
     now(),
     now());

  -- Three strands, each with one sub-strand and three media-first lessons.
  FOR item IN
    SELECT * FROM (VALUES
      (1,1,'Earth in Motion','Our Changing Planet','The Water Cycle From Above',
       'Watch water travel between land, sky and sea, then trace the cycle in a photograph.',
       'https://www.youtube.com/watch?v=ncORPosDrjI',
       'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1400&q=85',
       'Water continuously moves through evaporation, condensation, precipitation and collection. Look for clouds, rivers, soil and sunlight in the visual evidence.'),
      (1,2,'Earth in Motion','Our Changing Planet','Clouds Tell a Weather Story',
       'Use cloud shapes and sky photographs to make careful weather observations.',
       'https://www.youtube.com/watch?v=QVZExLO0MWA',
       'https://images.unsplash.com/photo-1566010503302-2564ae0d47b6?auto=format&fit=crop&w=1400&q=85',
       'Clouds form when water vapour cools into tiny droplets or ice crystals. Their height, colour and shape can give clues about changing weather.'),
      (1,3,'Earth in Motion','Our Changing Planet','Landscapes Shaped by Water',
       'See how moving water slowly changes soil, rocks, valleys and coastlines.',
       'https://www.youtube.com/watch?v=R-Iak3Wvh9c',
       'https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=1400&q=85',
       'Water can weather rock, carry sediment and deposit it elsewhere. Compare smooth stones, river bends and coastal shapes in the images.'),
      (2,4,'Life Up Close','Patterns in Living Things','Plant Parts in Close-up',
       'Explore detailed plant images and connect each visible part to its job.',
       'https://www.youtube.com/watch?v=TD60-3rqPXg',
       'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85',
       'Roots absorb water, stems provide support, leaves capture light and flowers help many plants reproduce. A close observation reveals how form supports function.'),
      (2,5,'Life Up Close','Patterns in Living Things','Animal Adaptations on Camera',
       'Observe body coverings, movement and feeding structures that help animals survive.',
       'https://www.youtube.com/watch?v=mRidGna-V4E',
       'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=1400&q=85',
       'An adaptation is a feature or behaviour that helps a living thing survive. Use visible evidence before deciding what an adaptation may do.'),
      (2,6,'Life Up Close','Patterns in Living Things','Tiny Habitats, Big Communities',
       'Look closely at a small habitat and discover how many living things share it.',
       'https://www.youtube.com/watch?v=ZrSWYE37MJs',
       'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=85',
       'A habitat provides food, water, shelter and space. Even a tree, garden patch or pond can support a connected community of organisms.'),
      (3,7,'Space and Making','See, Imagine, Create','A Visual Tour of the Solar System',
       'Travel from the Sun across the planets and compare their visible features.',
       'https://www.youtube.com/watch?v=libKVRa01L8',
       'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=1400&q=85',
       'The solar system contains the Sun, planets, moons and smaller bodies. Scale images carefully: classroom diagrams often change sizes and distances so everything can fit.'),
      (3,8,'Space and Making','See, Imagine, Create','Light Up a Simple Circuit',
       'Follow a visual demonstration to connect a cell, wires and lamp safely.',
       'https://www.youtube.com/watch?v=x4pdzG-DHnY',
       'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
       'A lamp lights when a complete conducting path allows electric current to flow. A gap creates an open circuit and stops the flow. Use only classroom-safe cells, never wall electricity.'),
      (3,9,'Space and Making','See, Imagine, Create','Design With Shapes and Colour',
       'Study photographs and video frames, then create a visual story of your own.',
       'https://www.youtube.com/watch?v=GQl7wzKZJto',
       'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1400&q=85',
       'Artists and designers guide attention with shape, line, colour, contrast and space. A strong visual choice supports the idea you want another person to notice.')
    ) AS lessons(strand_no,lesson_no,strand_name,substrand_name,lesson_title,lesson_description,video_url,image_url,lesson_text)
  LOOP
    unit_id := subject_id || '-strand-' || item.strand_no;
    topic_id := unit_id || '-substrand-1';
    lesson_id := subject_id || '-lesson-' || lpad(item.lesson_no::text,2,'0');
    version_id := lesson_id || '-v1';

    INSERT INTO public."Unit" ("id","subjectId","name","slug","description","order","createdAt","updatedAt")
    VALUES (unit_id,subject_id,item.strand_name,'strand-' || item.strand_no,
      'A media-led strand for observing, discussing and creating.',item.strand_no,now(),now())
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO public."Topic" ("id","unitId","name","slug","description","order","createdAt","updatedAt")
    VALUES (topic_id,unit_id,item.substrand_name,'visual-exploration',
      'Video, picture and observation adventures supported by concise text.',1,now(),now())
    ON CONFLICT ("id") DO NOTHING;

    fixture := jsonb_build_object(
      'subjects',jsonb_build_array(jsonb_build_object(
        'id',subject_id,'name','Visual Discovery Adventures','slug',subject_id,
        'description','Media-led discovery for every primary grade.','icon','images',
        'colourToken','#0EA5E9','gradeLevels',jsonb_build_array(1,2,3,4,5,6),
        'order',160,'status','active','createdAt',timestamp_text,'updatedAt',timestamp_text
      )),
      'units',jsonb_build_array(jsonb_build_object(
        'id',unit_id,'subjectId',subject_id,'name',item.strand_name,'slug','strand-' || item.strand_no,
        'description','Observe and explore through media.','order',item.strand_no,
        'createdAt',timestamp_text,'updatedAt',timestamp_text
      )),
      'topics',jsonb_build_array(jsonb_build_object(
        'id',topic_id,'unitId',unit_id,'name',item.substrand_name,'slug','visual-exploration',
        'description','Video and picture-based learning.','order',1,
        'createdAt',timestamp_text,'updatedAt',timestamp_text
      )),
      'lessons',jsonb_build_array(jsonb_build_object(
        'id',lesson_id,'topicId',topic_id,'title',item.lesson_title,
        'slug',regexp_replace(lower(item.lesson_title),'[^a-z0-9]+','-','g'),
        'shortDescription',item.lesson_description,'order',item.lesson_no,
        'prerequisiteLessonId',CASE WHEN item.lesson_no IN (1,4,7) THEN NULL ELSE subject_id || '-lesson-' || lpad((item.lesson_no - 1)::text,2,'0') END,
        'createdAt',timestamp_text,'updatedAt',timestamp_text
      )),
      'lessonVersions',jsonb_build_array(jsonb_build_object(
        'id',version_id,'lessonId',lesson_id,'versionNumber',1,'status','published',
        'title',item.lesson_title,'description',item.lesson_description,
        'objectiveSummary','Observe visual evidence, explain one key idea and create or discuss a response.',
        'difficulty','developing','estimatedMinutes',18,'baseXpReward',80,'passingScore',70,
        'masteryScore',90,'maximumLessonRedos',3,'publishedAt',timestamp_text,
        'learningObjectives',jsonb_build_array(jsonb_build_object(
          'id',lesson_id || '-objective','lessonVersionId',version_id,'code','VIS.' || item.strand_no || '.' || item.lesson_no,
          'description','Use pictures, video and supporting text to explain the lesson idea.','order',1
        )),
        'blocks',jsonb_build_array(
          jsonb_build_object(
            'id',lesson_id || '-intro','type','lesson_intro','order',1,'required',true,'estimatedSeconds',45,
            'title',item.lesson_title,'shortDescription',item.lesson_description,
            'objectives',jsonb_build_array('Watch closely','Find visual evidence','Explain what you discovered'),
            'estimatedMinutes',18,'rewardPreview',jsonb_build_object('xp',80,'starsAvailable',3)
          ),
          jsonb_build_object(
            'id',lesson_id || '-video','type','video','order',2,'required',true,'estimatedSeconds',300,
            'source',item.video_url,'provider','youtube','title','Watch the adventure',
            'caption','Pause when needed. Name three details you can see or hear.'
          ),
          jsonb_build_object(
            'id',lesson_id || '-image','type','image','order',3,'required',true,'estimatedSeconds',120,
            'source',item.image_url,'altText','A detailed visual supporting ' || item.lesson_title,
            'caption','Zoom in mentally: what patterns, colours, shapes or changes do you notice?',
            'attribution','Unsplash educational photograph','decorative',false
          ),
          jsonb_build_object(
            'id',lesson_id || '-text','type','text','order',4,'required',true,'estimatedSeconds',180,
            'heading','What the pictures help us understand','body',item.lesson_text,
            'emphasisTerms',jsonb_build_array('observe','evidence','pattern','explain')
          ),
          jsonb_build_object(
            'id',lesson_id || '-reflection','type','reflection','order',5,'required',false,'estimatedSeconds',120,
            'prompt','What detail in the video or picture taught you the most? Explain why.',
            'responseType','short_text','optional',true
          ),
          jsonb_build_object(
            'id',lesson_id || '-summary','type','summary','order',6,'required',true,'estimatedSeconds',60,
            'heading','Discovery complete',
            'keyPoints',jsonb_build_array(
              'Careful observation helps us find evidence.',
              'Pictures and videos become more useful when we pause, compare and ask questions.',
              'Supporting text gives names and explanations to what we observe.'
            ),
            'nextStepText','Share one discovery with a classmate, teacher or family member.'
          )
        ),
        'createdAt',timestamp_text,'updatedAt',timestamp_text
      ))
    );

    record_data := jsonb_build_object(
      'id',lesson_id,'subject','science','courseId',subject_id,'unitId',unit_id,'topicId',topic_id,
      'grade',NULL,'gradeLevels',jsonb_build_array(1,2,3,4,5,6),
      'unit',item.strand_name,'chapter',item.strand_name,'topic',item.substrand_name,
      'contentStandard',NULL,'indicator',NULL,'lessonNumber',item.lesson_no,'title',item.lesson_title,
      'description',item.lesson_description,'estimatedMinutes',18,'xp',80,'questionCount',0,
      'format','video','status','published','createdAt',timestamp_text,'updatedAt',timestamp_text,
      'fixture',fixture,'createdBy',teacher_id
    );

    INSERT INTO public."AdminLessonRecord"
      ("id","subject","status","position","record","createdBy","courseId","unitId","topicId","createdAt","updatedAt")
    VALUES
      (lesson_id,'science','published',item.lesson_no,record_data,teacher_id,subject_id,unit_id,topic_id,now(),now());
  END LOOP;

  SELECT jsonb_build_object(
    'course',jsonb_build_object(
      'id',s.id,'name',s.name,'slug',s.slug,'description',s.description,
      'color',s."colourToken",'coverUrl',s."coverUrl",'gradeLevels',to_jsonb(s."gradeLevels"),'order',s."order"
    ),
    'units',coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id',u.id,'subjectId',u."subjectId",'title',u.name,'slug',u.slug,
        'description',u.description,'order',u."order",
        'topics',coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'id',t.id,'unitId',t."unitId",'title',t.name,'slug',t.slug,
            'description',t.description,'order',t."order",
            'lessonIds',coalesce((
              SELECT jsonb_agg(l.id ORDER BY l.position)
              FROM public."AdminLessonRecord" l
              WHERE l."topicId" = t.id AND l.status = 'published'
            ),'[]'::jsonb)
          ) ORDER BY t."order")
          FROM public."Topic" t WHERE t."unitId" = u.id
        ),'[]'::jsonb)
      ) ORDER BY u."order")
      FROM public."Unit" u WHERE u."subjectId" = s.id
    ),'[]'::jsonb),
    'lessons',coalesce((
      SELECT jsonb_agg(
        l.record || jsonb_build_object('classId',l."classId",'courseId',l."courseId",'unitId',l."unitId",'topicId',l."topicId")
        ORDER BY l.position
      )
      FROM public."AdminLessonRecord" l
      WHERE l."courseId" = s.id AND l.status = 'published'
    ),'[]'::jsonb)
  )
  INTO public_snapshot
  FROM public."Subject" s
  WHERE s.id = subject_id;

  INSERT INTO public."PublicLearningRevision"
    ("courseId","version","status","snapshot","contentHash","submittedBy","submittedAt",
     "reviewedBy","reviewedAt","reviewNote","publishedAt")
  VALUES
    (subject_id,1,'approved',public_snapshot,md5(public_snapshot::text),teacher_id,now(),
     NULL,now(),'Approved media-led demonstration subject for all grades.',now())
  RETURNING id INTO revision_id;

  UPDATE public."Subject"
  SET "currentPublicRevisionId" = revision_id, "updatedAt" = now()
  WHERE id = subject_id;

  RAISE NOTICE 'Created Visual Discovery Adventures for Teacher Kay: all grades, 3 strands and 9 media-led lessons.';
END
$seed$;

SELECT
  s.name,
  s."gradeLevels",
  u_count.strands,
  l_count.lessons,
  r.status AS publication_status,
  creator.raw_user_meta_data ->> 'display_name' AS assigned_teacher
FROM public."Subject" s
JOIN auth.users creator ON creator.id = s."createdBy"
JOIN LATERAL (SELECT count(*)::integer AS strands FROM public."Unit" u WHERE u."subjectId" = s.id) u_count ON true
JOIN LATERAL (SELECT count(*)::integer AS lessons FROM public."AdminLessonRecord" l WHERE l."courseId" = s.id) l_count ON true
LEFT JOIN public."PublicLearningRevision" r ON r.id = s."currentPublicRevisionId"
WHERE s.id = 'teacher-kay-visual-discovery';

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CurriculumStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonDifficulty" AS ENUM ('FOUNDATION', 'BEGINNER', 'DEVELOPING', 'PROFICIENT', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "LessonPublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonProgressStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'MASTERED', 'REVISION_RECOMMENDED');

-- CreateEnum
CREATE TYPE "LessonSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "BlockAttemptStatus" AS ENUM ('UNANSWERED', 'CORRECT', 'PARTIALLY_CORRECT', 'INCORRECT', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MasteryStatus" AS ENUM ('NOT_STARTED', 'EMERGING', 'DEVELOPING', 'PROFICIENT', 'MASTERED');

-- CreateEnum
CREATE TYPE "RewardSourceType" AS ENUM ('ANSWER', 'LESSON_COMPLETION', 'SCORE_IMPROVEMENT', 'PERFECT_LESSON', 'DAILY_GOAL', 'STREAK', 'BADGE', 'ADMIN_ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('LEARNING', 'MASTERY', 'IMPROVEMENT', 'CONSISTENCY', 'EXPLORATION');

-- CreateEnum
CREATE TYPE "CurriculumImportStatus" AS ENUM ('UPLOADED', 'EXTRACTING', 'READY_FOR_REVIEW', 'GENERATING', 'DRAFT_READY', 'FAILED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "CurriculumImportSubject" AS ENUM ('MATHEMATICS', 'ENGLISH_LANGUAGE', 'SCIENCE');

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "colourToken" TEXT NOT NULL,
    "gradeLevels" INTEGER[],
    "order" INTEGER NOT NULL,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculumImport" (
    "id" TEXT NOT NULL,
    "subject" "CurriculumImportSubject" NOT NULL,
    "title" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "sourceMimeType" TEXT NOT NULL,
    "sourceSizeBytes" INTEGER NOT NULL,
    "sourceChecksum" TEXT NOT NULL,
    "status" "CurriculumImportStatus" NOT NULL DEFAULT 'UPLOADED',
    "requestedGrades" INTEGER[],
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "sourceText" TEXT,
    "generatedDraftJson" JSONB,
    "validationJson" JSONB,
    "errorMessage" TEXT,
    "openaiResponseId" TEXT,
    "publishedSubjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurriculumImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "prerequisiteLessonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonVersion" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "LessonPublicationStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectiveSummary" TEXT NOT NULL,
    "difficulty" "LessonDifficulty" NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "baseXpReward" INTEGER NOT NULL,
    "passingScore" DOUBLE PRECISION NOT NULL,
    "masteryScore" DOUBLE PRECISION NOT NULL,
    "maximumLessonRedos" INTEGER NOT NULL DEFAULT 2,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningObjective" (
    "id" TEXT NOT NULL,
    "lessonVersionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LearningObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonBlock" (
    "id" TEXT NOT NULL,
    "lessonVersionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "required" BOOLEAN NOT NULL,
    "estimatedSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "totalXpCache" INTEGER NOT NULL DEFAULT 0,
    "currentLevelCache" INTEGER NOT NULL DEFAULT 1,
    "dailyGoalXp" INTEGER NOT NULL DEFAULT 60,
    "currentStreakDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentLessonProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "activeLessonVersionId" TEXT NOT NULL,
    "status" "LessonProgressStatus" NOT NULL,
    "currentBlockId" TEXT,
    "completedRequiredBlocks" INTEGER NOT NULL DEFAULT 0,
    "totalRequiredBlocks" INTEGER NOT NULL,
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latestAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "totalXpEarnedFromLesson" INTEGER NOT NULL DEFAULT 0,
    "firstStartedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "firstCompletedAt" TIMESTAMP(3),
    "masteredAt" TIMESTAMP(3),
    "revisionRecommendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lessonVersionId" TEXT NOT NULL,
    "status" "LessonSessionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "currentBlockId" TEXT,
    "deviceSessionId" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonAttempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lessonVersionId" TEXT NOT NULL,
    "lessonSessionId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "scorePercentage" DOUBLE PRECISION NOT NULL,
    "accuracyPercentage" DOUBLE PRECISION NOT NULL,
    "totalAssessments" INTEGER NOT NULL,
    "correctAssessments" INTEGER NOT NULL,
    "partiallyCorrectAssessments" INTEGER NOT NULL,
    "incorrectAssessments" INTEGER NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "starsAwarded" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "mastered" BOOLEAN NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,

    CONSTRAINT "LessonAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockAttempt" (
    "id" TEXT NOT NULL,
    "lessonAttemptId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "BlockAttemptStatus" NOT NULL,
    "scoreEarned" DOUBLE PRECISION NOT NULL,
    "scorePossible" DOUBLE PRECISION NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "hintUsed" BOOLEAN NOT NULL,
    "responseTimeSeconds" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentResponse" (
    "id" TEXT NOT NULL,
    "blockAttemptId" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "normalisedResponseJson" JSONB NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "feedbackShown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasteryRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "masteryStatus" "MasteryStatus" NOT NULL,
    "masteryScore" DOUBLE PRECISION NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "lastEvidenceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasteryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lessonVersionId" TEXT NOT NULL,
    "blockId" TEXT,
    "verb" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,
    "contextJson" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardTransaction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sourceType" "RewardSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "xpAmount" INTEGER NOT NULL,
    "metadataJson" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL,
    "reversedAt" TIMESTAMP(3),
    "reversalTransactionId" TEXT,

    CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelDefinition" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "minimumXp" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,
    "category" "BadgeCategory" NOT NULL,
    "rarity" TEXT NOT NULL,
    "criteriaType" TEXT NOT NULL,
    "criteriaJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeAward" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL,
    "metadataJson" JSONB NOT NULL,

    CONSTRAINT "BadgeAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "currentStreakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreakDays" INTEGER NOT NULL DEFAULT 0,
    "lastQualifyingDate" TEXT,
    "timezone" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreakRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");

-- CreateIndex
CREATE INDEX "Subject_status_order_idx" ON "Subject"("status", "order");

-- CreateIndex
CREATE INDEX "CurriculumImport_subject_status_idx" ON "CurriculumImport"("subject", "status");

-- CreateIndex
CREATE INDEX "CurriculumImport_createdAt_idx" ON "CurriculumImport"("createdAt");

-- CreateIndex
CREATE INDEX "Unit_subjectId_order_idx" ON "Unit"("subjectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_subjectId_slug_key" ON "Unit"("subjectId", "slug");

-- CreateIndex
CREATE INDEX "Topic_unitId_order_idx" ON "Topic"("unitId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_unitId_slug_key" ON "Topic"("unitId", "slug");

-- CreateIndex
CREATE INDEX "Lesson_topicId_order_idx" ON "Lesson"("topicId", "order");

-- CreateIndex
CREATE INDEX "Lesson_prerequisiteLessonId_idx" ON "Lesson"("prerequisiteLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_topicId_slug_key" ON "Lesson"("topicId", "slug");

-- CreateIndex
CREATE INDEX "LessonVersion_lessonId_status_idx" ON "LessonVersion"("lessonId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LessonVersion_lessonId_versionNumber_key" ON "LessonVersion"("lessonId", "versionNumber");

-- CreateIndex
CREATE INDEX "LearningObjective_lessonVersionId_order_idx" ON "LearningObjective"("lessonVersionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "LearningObjective_lessonVersionId_code_key" ON "LearningObjective"("lessonVersionId", "code");

-- CreateIndex
CREATE INDEX "LessonBlock_lessonVersionId_type_idx" ON "LessonBlock"("lessonVersionId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "LessonBlock_lessonVersionId_order_key" ON "LessonBlock"("lessonVersionId", "order");

-- CreateIndex
CREATE INDEX "StudentLessonProgress_studentId_status_idx" ON "StudentLessonProgress"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentLessonProgress_studentId_lessonId_key" ON "StudentLessonProgress"("studentId", "lessonId");

-- CreateIndex
CREATE INDEX "LessonSession_studentId_status_idx" ON "LessonSession"("studentId", "status");

-- CreateIndex
CREATE INDEX "LessonSession_studentId_lessonId_lessonVersionId_idx" ON "LessonSession"("studentId", "lessonId", "lessonVersionId");

-- CreateIndex
CREATE INDEX "LessonAttempt_lessonSessionId_idx" ON "LessonAttempt"("lessonSessionId");

-- CreateIndex
CREATE INDEX "LessonAttempt_studentId_lessonId_idx" ON "LessonAttempt"("studentId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonAttempt_studentId_lessonVersionId_attemptNumber_key" ON "LessonAttempt"("studentId", "lessonVersionId", "attemptNumber");

-- CreateIndex
CREATE INDEX "BlockAttempt_lessonAttemptId_idx" ON "BlockAttempt"("lessonAttemptId");

-- CreateIndex
CREATE INDEX "BlockAttempt_blockId_idx" ON "BlockAttempt"("blockId");

-- CreateIndex
CREATE INDEX "StudentResponse_blockAttemptId_idx" ON "StudentResponse"("blockAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "MasteryRecord_studentId_learningObjectiveId_key" ON "MasteryRecord"("studentId", "learningObjectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningEvent_idempotencyKey_key" ON "LearningEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LearningEvent_studentId_occurredAt_idx" ON "LearningEvent"("studentId", "occurredAt");

-- CreateIndex
CREATE INDEX "LearningEvent_lessonId_lessonVersionId_idx" ON "LearningEvent"("lessonId", "lessonVersionId");

-- CreateIndex
CREATE INDEX "LearningEvent_verb_objectType_idx" ON "LearningEvent"("verb", "objectType");

-- CreateIndex
CREATE UNIQUE INDEX "RewardTransaction_idempotencyKey_key" ON "RewardTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RewardTransaction_studentId_awardedAt_idx" ON "RewardTransaction"("studentId", "awardedAt");

-- CreateIndex
CREATE INDEX "RewardTransaction_sourceType_sourceId_idx" ON "RewardTransaction"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "LevelDefinition_level_key" ON "LevelDefinition"("level");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeDefinition_key_key" ON "BadgeDefinition"("key");

-- CreateIndex
CREATE INDEX "BadgeDefinition_active_category_idx" ON "BadgeDefinition"("active", "category");

-- CreateIndex
CREATE INDEX "BadgeAward_badgeId_idx" ON "BadgeAward"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeAward_studentId_badgeId_key" ON "BadgeAward"("studentId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "StreakRecord_studentId_key" ON "StreakRecord"("studentId");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_prerequisiteLessonId_fkey" FOREIGN KEY ("prerequisiteLessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonVersion" ADD CONSTRAINT "LessonVersion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningObjective" ADD CONSTRAINT "LearningObjective_lessonVersionId_fkey" FOREIGN KEY ("lessonVersionId") REFERENCES "LessonVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBlock" ADD CONSTRAINT "LessonBlock_lessonVersionId_fkey" FOREIGN KEY ("lessonVersionId") REFERENCES "LessonVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLessonProgress" ADD CONSTRAINT "StudentLessonProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLessonProgress" ADD CONSTRAINT "StudentLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLessonProgress" ADD CONSTRAINT "StudentLessonProgress_activeLessonVersionId_fkey" FOREIGN KEY ("activeLessonVersionId") REFERENCES "LessonVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_lessonVersionId_fkey" FOREIGN KEY ("lessonVersionId") REFERENCES "LessonVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAttempt" ADD CONSTRAINT "LessonAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAttempt" ADD CONSTRAINT "LessonAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAttempt" ADD CONSTRAINT "LessonAttempt_lessonVersionId_fkey" FOREIGN KEY ("lessonVersionId") REFERENCES "LessonVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonAttempt" ADD CONSTRAINT "LessonAttempt_lessonSessionId_fkey" FOREIGN KEY ("lessonSessionId") REFERENCES "LessonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockAttempt" ADD CONSTRAINT "BlockAttempt_lessonAttemptId_fkey" FOREIGN KEY ("lessonAttemptId") REFERENCES "LessonAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockAttempt" ADD CONSTRAINT "BlockAttempt_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "LessonBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResponse" ADD CONSTRAINT "StudentResponse_blockAttemptId_fkey" FOREIGN KEY ("blockAttemptId") REFERENCES "BlockAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryRecord" ADD CONSTRAINT "MasteryRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryRecord" ADD CONSTRAINT "MasteryRecord_learningObjectiveId_fkey" FOREIGN KEY ("learningObjectiveId") REFERENCES "LearningObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_lessonVersionId_fkey" FOREIGN KEY ("lessonVersionId") REFERENCES "LessonVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "LessonBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardTransaction" ADD CONSTRAINT "RewardTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "BadgeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakRecord" ADD CONSTRAINT "StreakRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase Auth integration ---------------------------------------------------

-- Student.id is the text representation of auth.users.id. The service-role
-- signup route creates auth.users; this trigger creates the matching profile.
CREATE OR REPLACE FUNCTION public.handle_new_skulkid_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.raw_app_meta_data ->> 'role', 'student') = 'student' THEN
    INSERT INTO public."Student" (
      "id",
      "displayName",
      "age",
      "dailyGoalXp",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      NEW.id::text,
      COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'display_name'), ''), 'Learner'),
      LEAST(18, GREATEST(5, COALESCE((NEW.raw_user_meta_data ->> 'age')::integer, 9))),
      60,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO UPDATE SET
      "displayName" = EXCLUDED."displayName",
      "age" = EXCLUDED."age",
      "updatedAt" = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT OR UPDATE OF raw_user_meta_data, raw_app_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_skulkid_user();

CREATE OR REPLACE FUNCTION public.handle_deleted_skulkid_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public."Student" WHERE "id" = OLD.id::text;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
AFTER DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_skulkid_user();

-- Database integrity ---------------------------------------------------------

ALTER TABLE "Student"
  ADD CONSTRAINT "Student_age_check" CHECK ("age" BETWEEN 5 AND 18),
  ADD CONSTRAINT "Student_dailyGoalXp_check" CHECK ("dailyGoalXp" > 0),
  ADD CONSTRAINT "Student_totalXpCache_check" CHECK ("totalXpCache" >= 0),
  ADD CONSTRAINT "Student_currentLevelCache_check" CHECK ("currentLevelCache" >= 1),
  ADD CONSTRAINT "Student_currentStreakDays_check" CHECK ("currentStreakDays" >= 0);

ALTER TABLE "LessonVersion"
  ADD CONSTRAINT "LessonVersion_scores_check"
  CHECK (
    "passingScore" BETWEEN 0 AND 100
    AND "masteryScore" BETWEEN 0 AND 100
    AND "masteryScore" >= "passingScore"
  ),
  ADD CONSTRAINT "LessonVersion_rewards_check"
  CHECK ("estimatedMinutes" > 0 AND "baseXpReward" >= 0 AND "maximumLessonRedos" >= 0);

ALTER TABLE "StudentLessonProgress"
  ADD CONSTRAINT "StudentLessonProgress_percentages_check"
  CHECK (
    "progressPercentage" BETWEEN 0 AND 100
    AND "latestScore" BETWEEN 0 AND 100
    AND "bestScore" BETWEEN 0 AND 100
    AND "latestAccuracy" BETWEEN 0 AND 100
    AND "bestAccuracy" BETWEEN 0 AND 100
  ),
  ADD CONSTRAINT "StudentLessonProgress_counts_check"
  CHECK (
    "completedRequiredBlocks" >= 0
    AND "totalRequiredBlocks" >= 0
    AND "attemptCount" >= 0
    AND "stars" BETWEEN 0 AND 3
    AND "totalXpEarnedFromLesson" >= 0
  );

ALTER TABLE "LessonAttempt"
  ADD CONSTRAINT "LessonAttempt_percentages_check"
  CHECK ("scorePercentage" BETWEEN 0 AND 100 AND "accuracyPercentage" BETWEEN 0 AND 100),
  ADD CONSTRAINT "LessonAttempt_counts_check"
  CHECK (
    "attemptNumber" > 0
    AND "totalAssessments" >= 0
    AND "correctAssessments" >= 0
    AND "partiallyCorrectAssessments" >= 0
    AND "incorrectAssessments" >= 0
    AND "xpAwarded" >= 0
    AND "starsAwarded" BETWEEN 0 AND 3
    AND "durationSeconds" >= 0
  );

-- Keep updatedAt correct for every database write.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_subject_updated_at BEFORE UPDATE ON "Subject" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_curriculum_import_updated_at BEFORE UPDATE ON "CurriculumImport" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_unit_updated_at BEFORE UPDATE ON "Unit" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_topic_updated_at BEFORE UPDATE ON "Topic" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_lesson_updated_at BEFORE UPDATE ON "Lesson" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_lesson_version_updated_at BEFORE UPDATE ON "LessonVersion" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_lesson_block_updated_at BEFORE UPDATE ON "LessonBlock" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_student_updated_at BEFORE UPDATE ON "Student" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_progress_updated_at BEFORE UPDATE ON "StudentLessonProgress" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_session_updated_at BEFORE UPDATE ON "LessonSession" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_mastery_updated_at BEFORE UPDATE ON "MasteryRecord" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_level_updated_at BEFORE UPDATE ON "LevelDefinition" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_badge_updated_at BEFORE UPDATE ON "BadgeDefinition" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_streak_updated_at BEFORE UPDATE ON "StreakRecord" FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row-level security ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_skulkid_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

REVOKE ALL ON FUNCTION public.is_skulkid_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_skulkid_admin() TO authenticated;

ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CurriculumImport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Unit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Topic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LearningObjective" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentLessonProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LessonAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlockAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MasteryRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LearningEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RewardTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LevelDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BadgeDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BadgeAward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StreakRecord" ENABLE ROW LEVEL SECURITY;

-- Published curriculum is readable by learners and visitors.
CREATE POLICY "published subjects are readable" ON "Subject"
FOR SELECT TO anon, authenticated USING ("status" = 'ACTIVE');

CREATE POLICY "published units are readable" ON "Unit"
FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM "Subject" s
    WHERE s."id" = "Unit"."subjectId" AND s."status" = 'ACTIVE'
  )
);

CREATE POLICY "published topics are readable" ON "Topic"
FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM "Unit" u
    JOIN "Subject" s ON s."id" = u."subjectId"
    WHERE u."id" = "Topic"."unitId" AND s."status" = 'ACTIVE'
  )
);

CREATE POLICY "published lessons are readable" ON "Lesson"
FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM "LessonVersion" lv
    WHERE lv."lessonId" = "Lesson"."id" AND lv."status" = 'PUBLISHED'
  )
);

CREATE POLICY "published lesson versions are readable" ON "LessonVersion"
FOR SELECT TO anon, authenticated USING ("status" = 'PUBLISHED');

CREATE POLICY "published objectives are readable" ON "LearningObjective"
FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM "LessonVersion" lv
    WHERE lv."id" = "LearningObjective"."lessonVersionId" AND lv."status" = 'PUBLISHED'
  )
);

CREATE POLICY "published blocks are readable" ON "LessonBlock"
FOR SELECT TO anon, authenticated USING (
  EXISTS (
    SELECT 1 FROM "LessonVersion" lv
    WHERE lv."id" = "LessonBlock"."lessonVersionId" AND lv."status" = 'PUBLISHED'
  )
);

CREATE POLICY "levels are readable" ON "LevelDefinition"
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "active badges are readable" ON "BadgeDefinition"
FOR SELECT TO anon, authenticated USING ("active" = true);

-- A learner can read their own records. Mutations stay server-authoritative and
-- are performed with the service-role key, which bypasses RLS.
CREATE POLICY "students read own profile" ON "Student"
FOR SELECT TO authenticated USING ("id" = auth.uid()::text);

CREATE POLICY "students read own progress" ON "StudentLessonProgress"
FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);

CREATE POLICY "students read own sessions" ON "LessonSession"
FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);

CREATE POLICY "students read own attempts" ON "LessonAttempt"
FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);

CREATE POLICY "students read own block attempts" ON "BlockAttempt"
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM "LessonAttempt" a
    WHERE a."id" = "BlockAttempt"."lessonAttemptId" AND a."studentId" = auth.uid()::text
  )
);

CREATE POLICY "students read own responses" ON "StudentResponse"
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM "BlockAttempt" ba
    JOIN "LessonAttempt" a ON a."id" = ba."lessonAttemptId"
    WHERE ba."id" = "StudentResponse"."blockAttemptId" AND a."studentId" = auth.uid()::text
  )
);

CREATE POLICY "students read own mastery" ON "MasteryRecord"
FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);

CREATE POLICY "students read own events" ON "LearningEvent"
FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);

CREATE POLICY "students read own rewards" ON "RewardTransaction"
FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);

CREATE POLICY "students read own badges" ON "BadgeAward"
FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);

CREATE POLICY "students read own streak" ON "StreakRecord"
FOR SELECT TO authenticated USING ("studentId" = auth.uid()::text);

-- Administrators can manage every application table. Admin status comes from
-- auth.users.raw_app_meta_data and must only be assigned with a service key.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'Subject', 'CurriculumImport', 'Unit', 'Topic', 'Lesson', 'LessonVersion',
    'LearningObjective', 'LessonBlock', 'Student', 'StudentLessonProgress',
    'LessonSession', 'LessonAttempt', 'BlockAttempt', 'StudentResponse',
    'MasteryRecord', 'LearningEvent', 'RewardTransaction', 'LevelDefinition',
    'BadgeDefinition', 'BadgeAward', 'StreakRecord'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "admins manage %1$s" ON public.%2$I FOR ALL TO authenticated USING (public.is_skulkid_admin()) WITH CHECK (public.is_skulkid_admin())',
      lower(table_name),
      table_name
    );
  END LOOP;
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON
  "Subject", "Unit", "Topic", "Lesson", "LessonVersion",
  "LearningObjective", "LessonBlock", "LevelDefinition", "BadgeDefinition"
TO anon, authenticated;
GRANT SELECT ON
  "Student", "StudentLessonProgress", "LessonSession", "LessonAttempt",
  "BlockAttempt", "StudentResponse", "MasteryRecord", "LearningEvent",
  "RewardTransaction", "BadgeAward", "StreakRecord"
TO authenticated;
GRANT ALL ON
  "Subject", "CurriculumImport", "Unit", "Topic", "Lesson", "LessonVersion",
  "LearningObjective", "LessonBlock", "Student", "StudentLessonProgress",
  "LessonSession", "LessonAttempt", "BlockAttempt", "StudentResponse",
  "MasteryRecord", "LearningEvent", "RewardTransaction", "LevelDefinition",
  "BadgeDefinition", "BadgeAward", "StreakRecord"
TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Ensure accounts created before this migration also receive a Student row.
INSERT INTO public."Student" ("id", "displayName", "age", "createdAt", "updatedAt")
SELECT
  u.id::text,
  COALESCE(NULLIF(BTRIM(u.raw_user_meta_data ->> 'display_name'), ''), 'Learner'),
  LEAST(18, GREATEST(5, COALESCE((u.raw_user_meta_data ->> 'age')::integer, 9))),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM auth.users u
WHERE COALESCE(u.raw_app_meta_data ->> 'role', 'student') = 'student'
ON CONFLICT ("id") DO NOTHING;

import {
  BadgeCategory,
  CurriculumStatus,
  LessonDifficulty,
  LessonPublicationStatus,
  PrismaClient
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sampleCurriculum } from "@/domains/curriculum/fixtures/sample-curriculum";
import { badgeDefinitions, levelDefinitions } from "@/domains/gamification/config/reward-rules";
import type {
  CurriculumStatus as DomainCurriculumStatus,
  LessonBlock,
  LessonDifficulty as DomainLessonDifficulty,
  LessonPublicationStatus as DomainLessonPublicationStatus
} from "@/domains/curriculum/types";
import type { BadgeCategory as DomainBadgeCategory } from "@/domains/gamification/types";
import type { Prisma } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed SkulKid data.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function curriculumStatus(value: DomainCurriculumStatus): CurriculumStatus {
  return value === "active" ? CurriculumStatus.ACTIVE : CurriculumStatus.ARCHIVED;
}

function lessonStatus(value: DomainLessonPublicationStatus): LessonPublicationStatus {
  const map: Record<DomainLessonPublicationStatus, LessonPublicationStatus> = {
    draft: LessonPublicationStatus.DRAFT,
    in_review: LessonPublicationStatus.IN_REVIEW,
    published: LessonPublicationStatus.PUBLISHED,
    archived: LessonPublicationStatus.ARCHIVED
  };
  return map[value];
}

function lessonDifficulty(value: DomainLessonDifficulty): LessonDifficulty {
  const map: Record<DomainLessonDifficulty, LessonDifficulty> = {
    foundation: LessonDifficulty.FOUNDATION,
    beginner: LessonDifficulty.BEGINNER,
    developing: LessonDifficulty.DEVELOPING,
    proficient: LessonDifficulty.PROFICIENT,
    challenge: LessonDifficulty.CHALLENGE
  };
  return map[value];
}

function badgeCategory(value: DomainBadgeCategory): BadgeCategory {
  const map: Record<DomainBadgeCategory, BadgeCategory> = {
    learning: BadgeCategory.LEARNING,
    mastery: BadgeCategory.MASTERY,
    improvement: BadgeCategory.IMPROVEMENT,
    consistency: BadgeCategory.CONSISTENCY,
    exploration: BadgeCategory.EXPLORATION
  };
  return map[value];
}

function blockContent(block: LessonBlock): Prisma.InputJsonObject {
  const content: Record<string, unknown> = { ...block };
  delete content.id;
  delete content.type;
  delete content.order;
  delete content.required;
  delete content.estimatedSeconds;
  return content as Prisma.InputJsonObject;
}

async function main() {
  for (const subject of sampleCurriculum.subjects) {
    await prisma.subject.upsert({
      where: { id: subject.id },
      update: {
        name: subject.name,
        slug: subject.slug,
        description: subject.description,
        icon: subject.icon,
        colourToken: subject.colourToken,
        gradeLevels: subject.gradeLevels,
        order: subject.order,
        status: curriculumStatus(subject.status)
      },
      create: {
        id: subject.id,
        name: subject.name,
        slug: subject.slug,
        description: subject.description,
        icon: subject.icon,
        colourToken: subject.colourToken,
        gradeLevels: subject.gradeLevels,
        order: subject.order,
        status: curriculumStatus(subject.status)
      }
    });
  }

  for (const unit of sampleCurriculum.units) {
    await prisma.unit.upsert({
      where: { id: unit.id },
      update: {
        name: unit.name,
        slug: unit.slug,
        description: unit.description,
        order: unit.order
      },
      create: {
        id: unit.id,
        subjectId: unit.subjectId,
        name: unit.name,
        slug: unit.slug,
        description: unit.description,
        order: unit.order
      }
    });
  }

  for (const topic of sampleCurriculum.topics) {
    await prisma.topic.upsert({
      where: { id: topic.id },
      update: {
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        order: topic.order
      },
      create: {
        id: topic.id,
        unitId: topic.unitId,
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        order: topic.order
      }
    });
  }

  for (const lesson of sampleCurriculum.lessons) {
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {
        title: lesson.title,
        slug: lesson.slug,
        shortDescription: lesson.shortDescription,
        order: lesson.order,
        prerequisiteLessonId: lesson.prerequisiteLessonId
      },
      create: {
        id: lesson.id,
        topicId: lesson.topicId,
        title: lesson.title,
        slug: lesson.slug,
        shortDescription: lesson.shortDescription,
        order: lesson.order,
        prerequisiteLessonId: lesson.prerequisiteLessonId
      }
    });
  }

  for (const version of sampleCurriculum.lessonVersions) {
    await prisma.lessonVersion.upsert({
      where: {
        lessonId_versionNumber: {
          lessonId: version.lessonId,
          versionNumber: version.versionNumber
        }
      },
      update: {
        status: lessonStatus(version.status),
        title: version.title,
        description: version.description,
        objectiveSummary: version.objectiveSummary,
        difficulty: lessonDifficulty(version.difficulty),
        estimatedMinutes: version.estimatedMinutes,
        baseXpReward: version.baseXpReward,
        passingScore: version.passingScore,
        masteryScore: version.masteryScore,
        maximumLessonRedos: version.maximumLessonRedos ?? 2,
        publishedAt: version.publishedAt ? new Date(version.publishedAt) : null
      },
      create: {
        id: version.id,
        lessonId: version.lessonId,
        versionNumber: version.versionNumber,
        status: lessonStatus(version.status),
        title: version.title,
        description: version.description,
        objectiveSummary: version.objectiveSummary,
        difficulty: lessonDifficulty(version.difficulty),
        estimatedMinutes: version.estimatedMinutes,
        baseXpReward: version.baseXpReward,
        passingScore: version.passingScore,
        masteryScore: version.masteryScore,
        maximumLessonRedos: version.maximumLessonRedos ?? 2,
        publishedAt: version.publishedAt ? new Date(version.publishedAt) : null
      }
    });

    await prisma.learningObjective.deleteMany({ where: { lessonVersionId: version.id } });
    await prisma.learningObjective.createMany({
      data: version.learningObjectives.map((objective) => ({
        id: objective.id,
        lessonVersionId: objective.lessonVersionId,
        code: objective.code,
        description: objective.description,
        order: objective.order
      }))
    });

    await prisma.lessonBlock.deleteMany({ where: { lessonVersionId: version.id } });
    await prisma.lessonBlock.createMany({
      data: version.blocks.map((block) => ({
        id: block.id,
        lessonVersionId: version.id,
        type: block.type,
        order: block.order,
        required: block.required,
        estimatedSeconds: block.estimatedSeconds ?? null,
        content: blockContent(block)
      }))
    });
  }

  for (const level of levelDefinitions) {
    await prisma.levelDefinition.upsert({
      where: { level: level.level },
      update: { minimumXp: level.minimumXp, title: level.title },
      create: {
        id: `level-${level.level}`,
        level: level.level,
        minimumXp: level.minimumXp,
        title: level.title
      }
    });
  }

  for (const badge of badgeDefinitions) {
    await prisma.badgeDefinition.upsert({
      where: { key: badge.key },
      update: {
        name: badge.name,
        description: badge.description,
        iconKey: badge.iconKey,
        category: badgeCategory(badge.category),
        rarity: badge.rarity,
        criteriaType: badge.criteriaType,
        criteriaJson: badge.criteriaJson as Prisma.InputJsonObject,
        active: badge.active
      },
      create: {
        id: badge.id,
        key: badge.key,
        name: badge.name,
        description: badge.description,
        iconKey: badge.iconKey,
        category: badgeCategory(badge.category),
        rarity: badge.rarity,
        criteriaType: badge.criteriaType,
        criteriaJson: badge.criteriaJson as Prisma.InputJsonObject,
        active: badge.active
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

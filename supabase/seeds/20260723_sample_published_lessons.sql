-- SkulKid sample published lessons
-- Creates:
--   1. Mathematics: Place Value up to 10,000 (text)
--   2. Mathematics: Adding Four-Digit Numbers (text)
--   3. English Language: Common and Proper Nouns (YouTube video)
--   4. Science: The Water Cycle (text + YouTube video)
--
-- Prerequisite: run all Supabase migrations through
-- 20260723170000_course_management.sql first.
--
-- This script is safe to run again: stable IDs are upserted.

BEGIN;

-- Ensure the three courses exist and remain visible.
INSERT INTO public."Subject"
  ("id", "name", "slug", "description", "icon", "colourToken", "gradeLevels", "order", "status", "createdAt", "updatedAt")
VALUES
  ('subject-mathematics', 'Mathematics', 'mathematics', 'Build number confidence through clear examples, practice and feedback.', 'calculator', '#2563EB', ARRAY[1,2,3,4,5,6], 0, 'ACTIVE', now(), now()),
  ('subject-english-language', 'English Language', 'english-language', 'Grow reading, writing and communication confidence.', 'book-open', '#7C3AED', ARRAY[1,2,3,4,5,6], 1, 'ACTIVE', now(), now()),
  ('subject-science', 'Science', 'science', 'Explore living things, materials, energy and everyday discovery.', 'flask-conical', '#16A34A', ARRAY[1,2,3,4,5,6], 2, 'ACTIVE', now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "status" = 'ACTIVE',
  "updatedAt" = now();

INSERT INTO public."Unit"
  ("id", "subjectId", "name", "slug", "description", "order", "createdAt", "updatedAt")
VALUES
  ('unit-math-number-sense-b3', 'subject-mathematics', 'Number Sense', 'number-sense-basic-3', 'Read, understand and calculate with whole numbers.', 1, now(), now()),
  ('unit-english-grammar-b3', 'subject-english-language', 'Grammar', 'grammar-basic-3', 'Use words and sentences clearly and correctly.', 1, now(), now()),
  ('unit-science-earth-b3', 'subject-science', 'Earth and Our Environment', 'earth-and-environment-basic-3', 'Explore natural processes in our environment.', 1, now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = now();

INSERT INTO public."Topic"
  ("id", "unitId", "name", "slug", "description", "order", "createdAt", "updatedAt")
VALUES
  ('topic-math-whole-numbers-b3', 'unit-math-number-sense-b3', 'Whole Numbers', 'whole-numbers-basic-3', 'Understand place value and addition with whole numbers.', 1, now(), now()),
  ('topic-english-nouns-b3', 'unit-english-grammar-b3', 'Nouns', 'nouns-basic-3', 'Recognise and use common and proper nouns.', 1, now(), now()),
  ('topic-science-water-cycle-b3', 'unit-science-earth-b3', 'The Water Cycle', 'water-cycle-basic-3', 'Understand how water moves through the environment.', 1, now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = now();

WITH
admin_user AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = 'gh-233507410361@phone.skulkid.app'
     OR raw_app_meta_data ->> 'role' = 'admin'
  ORDER BY
    CASE
      WHEN lower(email) = 'gh-233507410361@phone.skulkid.app' THEN 0
      ELSE 1
    END,
    created_at
  LIMIT 1
),
seed (
  id, subject_slug, course_id, course_name, course_description, course_icon,
  course_colour, course_order, unit_id, unit_name, unit_slug, unit_description,
  topic_id, topic_name, topic_slug, topic_description, lesson_order,
  title, lesson_slug, short_description, objective, minutes, xp, format,
  prerequisite_lesson_id, blocks
) AS (
  VALUES
  (
    'lesson-math-place-value-b3',
    'mathematics',
    'subject-mathematics',
    'Mathematics',
    'Build number confidence through clear examples, practice and feedback.',
    'calculator',
    '#2563EB',
    1,
    'unit-math-number-sense-b3',
    'Number Sense',
    'number-sense-basic-3',
    'Read, understand and calculate with whole numbers.',
    'topic-math-whole-numbers-b3',
    'Whole Numbers',
    'whole-numbers-basic-3',
    'Understand place value and addition with whole numbers.',
    1,
    'Place Value up to 10,000',
    'place-value-up-to-10000',
    'Learn how each digit changes value according to its position.',
    'Identify the value of digits in numbers up to 10,000.',
    12,
    80,
    'text',
    NULL,
    $blocks$
    [
      {
        "id":"math-place-intro","type":"lesson_intro","order":1,"required":true,"estimatedSeconds":45,
        "title":"Digit Detectives","shortDescription":"Discover what every digit is worth.",
        "objectives":["Identify ones, tens, hundreds and thousands.","Write numbers in expanded form."],
        "estimatedMinutes":12,"rewardPreview":{"xp":80,"starsAvailable":3}
      },
      {
        "id":"math-place-text","type":"text","order":2,"required":true,"estimatedSeconds":240,
        "heading":"A digit's position gives it value",
        "body":"In **4,582**, the digit 4 means 4 thousands, 5 means 5 hundreds, 8 means 8 tens, and 2 means 2 ones.\n\nWe can expand the number as:\n\n**4,000 + 500 + 80 + 2**\n\n[tip]Start at the right: ones, tens, hundreds, then thousands.[/tip]",
        "emphasisTerms":["place value","expanded form","thousands"]
      },
      {
        "id":"math-place-example","type":"worked_example","order":3,"required":true,"estimatedSeconds":180,
        "title":"Expand 7,306","problem":"Write 7,306 in expanded form.",
        "orderedSteps":["7 is in the thousands place: 7,000.","3 is in the hundreds place: 300.","0 tens add no value.","6 is in the ones place: 6."],
        "finalAnswer":"7,000 + 300 + 6","explanation":"Each digit contributes its place value."
      },
      {
        "id":"math-place-summary","type":"summary","order":4,"required":true,"estimatedSeconds":45,
        "heading":"Mission recap",
        "keyPoints":["Position gives a digit its value.","Move from ones to thousands from right to left.","Expanded form shows the value of every digit."],
        "nextStepText":"Next, use place value to add large numbers."
      }
    ]
    $blocks$::jsonb
  ),
  (
    'lesson-math-addition-b3',
    'mathematics',
    'subject-mathematics',
    'Mathematics',
    'Build number confidence through clear examples, practice and feedback.',
    'calculator',
    '#2563EB',
    1,
    'unit-math-number-sense-b3',
    'Number Sense',
    'number-sense-basic-3',
    'Read, understand and calculate with whole numbers.',
    'topic-math-whole-numbers-b3',
    'Whole Numbers',
    'whole-numbers-basic-3',
    'Understand place value and addition with whole numbers.',
    2,
    'Adding Four-Digit Numbers',
    'adding-four-digit-numbers',
    'Add large numbers accurately by lining up their place values.',
    'Add two four-digit numbers using column addition and regrouping.',
    15,
    100,
    'text',
    'lesson-math-place-value-b3',
    $blocks$
    [
      {
        "id":"math-add-intro","type":"lesson_intro","order":1,"required":true,"estimatedSeconds":45,
        "title":"Power-Up Addition","shortDescription":"Stack the digits and add one column at a time.",
        "objectives":["Line up equal place values.","Regroup when a column totals ten or more."],
        "estimatedMinutes":15,"rewardPreview":{"xp":100,"starsAvailable":3}
      },
      {
        "id":"math-add-text","type":"text","order":2,"required":true,"estimatedSeconds":240,
        "heading":"Keep every place in its lane",
        "body":"Write the numbers one above the other. Ones go under ones, tens under tens, hundreds under hundreds, and thousands under thousands.\n\nAlways begin with the **ones column**. If a column makes 10 or more, regroup one ten into the next column.\n\n[tip]Use the comma or draw place-value columns to keep the digits aligned.[/tip]",
        "emphasisTerms":["column addition","regroup","place value"]
      },
      {
        "id":"math-add-example","type":"worked_example","order":3,"required":true,"estimatedSeconds":240,
        "title":"Add 2,478 + 1,356","problem":"Find the total of 2,478 and 1,356.",
        "orderedSteps":["Ones: 8 + 6 = 14. Write 4 and carry 1 ten.","Tens: 7 + 5 + 1 = 13. Write 3 and carry 1 hundred.","Hundreds: 4 + 3 + 1 = 8.","Thousands: 2 + 1 = 3."],
        "finalAnswer":"3,834","explanation":"Regrouping carries value into the next place without changing the total."
      },
      {
        "id":"math-add-summary","type":"summary","order":4,"required":true,"estimatedSeconds":45,
        "heading":"Addition achievement unlocked",
        "keyPoints":["Align equal place values.","Start from the ones column.","Regroup carefully when a column reaches ten."],
        "nextStepText":"You are ready to practise four-digit addition."
      }
    ]
    $blocks$::jsonb
  ),
  (
    'lesson-english-common-proper-nouns-b3',
    'english-language',
    'subject-english-language',
    'English Language',
    'Grow reading, writing and communication confidence.',
    'book-open',
    '#7C3AED',
    2,
    'unit-english-grammar-b3',
    'Grammar',
    'grammar-basic-3',
    'Use words and sentences clearly and correctly.',
    'topic-english-nouns-b3',
    'Nouns',
    'nouns-basic-3',
    'Recognise and use common and proper nouns.',
    1,
    'Common and Proper Nouns',
    'common-and-proper-nouns',
    'Watch, listen and learn how general names differ from special names.',
    'Distinguish common nouns from proper nouns and capitalise proper nouns.',
    11,
    90,
    'video',
    NULL,
    $blocks$
    [
      {
        "id":"english-nouns-intro","type":"lesson_intro","order":1,"required":true,"estimatedSeconds":45,
        "title":"Name That Noun","shortDescription":"Meet ordinary names and special names.",
        "objectives":["Tell common and proper nouns apart.","Use capital letters for proper nouns."],
        "estimatedMinutes":11,"rewardPreview":{"xp":90,"starsAvailable":3}
      },
      {
        "id":"english-nouns-video","type":"video","order":2,"required":true,"estimatedSeconds":420,
        "source":"https://www.youtube.com/watch?v=ZHwBhVsaqK8","provider":"youtube",
        "title":"What Are Common and Proper Nouns?",
        "caption":"Pause when you hear an example and decide which kind of noun it is.",
        "participationPrompt":"Say one common noun and one proper noun aloud after the video.",
        "participationXp":10
      },
      {
        "id":"english-nouns-summary","type":"summary","order":3,"required":true,"estimatedSeconds":60,
        "heading":"Grammar power-up",
        "keyPoints":["A common noun is a general name.","A proper noun names a particular person, place or thing.","Proper nouns begin with capital letters."],
        "nextStepText":"Look around you and collect three examples of each noun type."
      }
    ]
    $blocks$::jsonb
  ),
  (
    'lesson-science-water-cycle-b3',
    'science',
    'subject-science',
    'Science',
    'Explore living things, materials, energy and everyday discovery.',
    'flask-conical',
    '#16A34A',
    3,
    'unit-science-earth-b3',
    'Earth and Our Environment',
    'earth-and-environment-basic-3',
    'Explore natural processes in our environment.',
    'topic-science-water-cycle-b3',
    'The Water Cycle',
    'water-cycle-basic-3',
    'Understand how water moves through the environment.',
    1,
    'The Water Cycle',
    'the-water-cycle',
    'Read and watch how water travels between Earth and the sky.',
    'Describe evaporation, condensation, precipitation and collection.',
    14,
    100,
    'text',
    NULL,
    $blocks$
    [
      {
        "id":"science-water-intro","type":"lesson_intro","order":1,"required":true,"estimatedSeconds":45,
        "title":"Water Never Stops Moving","shortDescription":"Follow one drop of water on an amazing journey.",
        "objectives":["Name the main stages of the water cycle.","Explain how heat from the Sun moves water."],
        "estimatedMinutes":14,"rewardPreview":{"xp":100,"starsAvailable":3}
      },
      {
        "id":"science-water-text-one","type":"text","order":2,"required":true,"estimatedSeconds":180,
        "heading":"From liquid water to water vapour",
        "body":"The Sun warms water in rivers, lakes and oceans. Some liquid water changes into an invisible gas called **water vapour**. This change is called **evaporation**.\n\nThe vapour rises and cools high in the sky.",
        "emphasisTerms":["evaporation","water vapour","Sun"]
      },
      {
        "id":"science-water-video","type":"video","order":3,"required":true,"estimatedSeconds":240,
        "source":"https://www.youtube.com/watch?v=ncORPosDrjI","provider":"youtube",
        "title":"The Water Cycle — Dr. Binocs",
        "caption":"Watch for evaporation, condensation, precipitation and collection.",
        "participationPrompt":"Use your finger to trace the journey of a water drop as you watch.",
        "participationXp":10
      },
      {
        "id":"science-water-text-two","type":"text","order":4,"required":true,"estimatedSeconds":180,
        "heading":"Clouds, rain and collection",
        "body":"Cooling water vapour changes into tiny liquid droplets. This is **condensation**, and the droplets form clouds.\n\nWhen the droplets become heavy, water falls as **precipitation** such as rain. It collects in the ground, rivers, lakes and oceans, ready for the cycle to begin again.\n\n[tip]The water cycle has no true beginning or end—it keeps repeating.[/tip]",
        "emphasisTerms":["condensation","precipitation","collection"]
      },
      {
        "id":"science-water-summary","type":"summary","order":5,"required":true,"estimatedSeconds":60,
        "heading":"Science mission complete",
        "keyPoints":["Sunlight powers evaporation.","Cooling causes condensation and clouds.","Precipitation returns water to Earth.","Collected water enters the cycle again."],
        "nextStepText":"Explain the whole journey to a friend using the four key words."
      }
    ]
    $blocks$::jsonb
  )
),
prepared AS (
  SELECT
    seed.*,
    to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS iso_now,
    seed.id || '-v1' AS version_id,
    seed.id || '-objective-1' AS objective_id
  FROM seed
),
records AS (
  SELECT
    p.*,
    jsonb_build_object(
      'subjects', jsonb_build_array(jsonb_build_object(
        'id', p.course_id,
        'name', p.course_name,
        'slug', p.subject_slug,
        'description', p.course_description,
        'icon', p.course_icon,
        'colourToken', p.course_colour,
        'gradeLevels', jsonb_build_array(1,2,3,4,5,6),
        'order', p.course_order,
        'status', 'active',
        'createdAt', p.iso_now,
        'updatedAt', p.iso_now
      )),
      'units', jsonb_build_array(jsonb_build_object(
        'id', p.unit_id,
        'subjectId', p.course_id,
        'name', p.unit_name,
        'slug', p.unit_slug,
        'description', p.unit_description,
        'order', 1,
        'createdAt', p.iso_now,
        'updatedAt', p.iso_now
      )),
      'topics', jsonb_build_array(jsonb_build_object(
        'id', p.topic_id,
        'unitId', p.unit_id,
        'name', p.topic_name,
        'slug', p.topic_slug,
        'description', p.topic_description,
        'order', 1,
        'createdAt', p.iso_now,
        'updatedAt', p.iso_now
      )),
      'lessons', jsonb_build_array(jsonb_build_object(
        'id', p.id,
        'topicId', p.topic_id,
        'title', p.title,
        'slug', p.lesson_slug,
        'shortDescription', p.short_description,
        'order', p.lesson_order,
        'prerequisiteLessonId', p.prerequisite_lesson_id,
        'createdAt', p.iso_now,
        'updatedAt', p.iso_now
      )),
      'lessonVersions', jsonb_build_array(jsonb_build_object(
        'id', p.version_id,
        'lessonId', p.id,
        'versionNumber', 1,
        'status', 'published',
        'title', p.title,
        'description', p.short_description,
        'objectiveSummary', p.objective,
        'difficulty', 'beginner',
        'estimatedMinutes', p.minutes,
        'baseXpReward', p.xp,
        'passingScore', 60,
        'masteryScore', 80,
        'maximumLessonRedos', 2,
        'publishedAt', p.iso_now,
        'learningObjectives', jsonb_build_array(jsonb_build_object(
          'id', p.objective_id,
          'lessonVersionId', p.version_id,
          'code', upper(replace(p.subject_slug, '-', '_')) || '-' || p.lesson_order::text,
          'description', p.objective,
          'order', 1
        )),
        'blocks', p.blocks,
        'createdAt', p.iso_now,
        'updatedAt', p.iso_now
      ))
    ) AS fixture
  FROM prepared p
)
INSERT INTO public."AdminLessonRecord"
  ("id", "subject", "courseId", "unitId", "topicId", "status", "position", "record", "createdBy", "createdAt", "updatedAt")
SELECT
  r.id,
  r.subject_slug,
  r.course_id,
  r.unit_id,
  r.topic_id,
  'published',
  r.lesson_order - 1,
  jsonb_build_object(
    'id', r.id,
    'subject', r.subject_slug,
    'courseId', r.course_id,
    'unitId', r.unit_id,
    'topicId', r.topic_id,
    'grade', 3,
    'unit', r.unit_name,
    'chapter', r.topic_name,
    'topic', r.topic_name,
    'title', r.title,
    'description', r.short_description,
    'estimatedMinutes', r.minutes,
    'xp', r.xp,
    'questionCount', 0,
    'format', r.format,
    'prerequisiteLessonId', r.prerequisite_lesson_id,
    'gamification', jsonb_build_object(
      'passingScore', 60,
      'masteryScore', 80,
      'maximumAttempts', 2,
      'lessonRetries', 2,
      'maximumXp', r.xp,
      'badge', ''
    ),
    'status', 'published',
    'createdAt', r.iso_now,
    'updatedAt', r.iso_now,
    'fixture', r.fixture
  ),
  (SELECT id FROM admin_user),
  now(),
  now()
FROM records r
ON CONFLICT ("id") DO UPDATE SET
  "subject" = EXCLUDED."subject",
  "courseId" = EXCLUDED."courseId",
  "unitId" = EXCLUDED."unitId",
  "topicId" = EXCLUDED."topicId",
  "status" = 'published',
  "position" = EXCLUDED."position",
  "record" = EXCLUDED."record",
  "updatedAt" = now();

COMMIT;

-- Verification: this should return four published rows.
SELECT
  "subject",
  "record" ->> 'title' AS "lesson",
  "record" ->> 'format' AS "format",
  "status"
FROM public."AdminLessonRecord"
WHERE "id" IN (
  'lesson-math-place-value-b3',
  'lesson-math-addition-b3',
  'lesson-english-common-proper-nouns-b3',
  'lesson-science-water-cycle-b3'
)
ORDER BY "subject", "position";

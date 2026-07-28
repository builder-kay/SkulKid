-- Jake Paul comprehensive teacher demo
-- ------------------------------------------------------------
-- Run this after the normal SkulKid migrations in Supabase SQL Editor.
-- The script is rerunnable. It verifies the exact teacher account, creates
-- no learner memberships or attempts, and calls no SMS/reward functions.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $verify$
DECLARE
  teacher_name text;
  teacher_role text;
  trust_status text;
BEGIN
  SELECT
    lower(regexp_replace(trim(COALESCE(
      raw_user_meta_data ->> 'display_name',
      raw_user_meta_data ->> 'displayName',
      raw_user_meta_data ->> 'full_name',
      raw_user_meta_data ->> 'name',
      ''
    )), '\s+', ' ', 'g')),
    raw_app_meta_data ->> 'role'
  INTO teacher_name, teacher_role
  FROM auth.users
  WHERE id = '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'::uuid;

  IF teacher_name IS NULL THEN
    RAISE EXCEPTION 'Protected Jake Paul teacher account was not found.';
  END IF;
  IF teacher_name <> 'jake paul' OR teacher_role <> 'teacher' THEN
    RAISE EXCEPTION 'Protected user is %, role %, not Jake Paul / teacher.', teacher_name, teacher_role;
  END IF;

  SELECT "status" INTO trust_status
  FROM public."TeacherTrustProfile"
  WHERE "teacherId" = '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'::uuid;

  IF trust_status IS NULL OR trust_status = 'banned' THEN
    RAISE EXCEPTION 'Jake Paul needs a non-banned TeacherTrustProfile before seeding.';
  END IF;
END
$verify$;

-- Make Computing a first-class lesson and reusable-quiz subject. This
-- reconciles databases whose older constraints still list only 3 subjects.
DO $constraints$
DECLARE
  item text;
BEGIN
  FOR item IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public."AdminLessonRecord"'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%subject%'
  LOOP
    EXECUTE format('ALTER TABLE public."AdminLessonRecord" DROP CONSTRAINT %I', item);
  END LOOP;
  ALTER TABLE public."AdminLessonRecord"
    ADD CONSTRAINT "AdminLessonRecord_subject_check"
    CHECK ("subject" IN ('mathematics', 'english-language', 'science', 'computing'));

  FOR item IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public."TeacherQuiz"'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%subject%'
  LOOP
    EXECUTE format('ALTER TABLE public."TeacherQuiz" DROP CONSTRAINT %I', item);
  END LOOP;
  ALTER TABLE public."TeacherQuiz"
    ADD CONSTRAINT "TeacherQuiz_subject_check"
    CHECK ("subject" IN ('mathematics', 'english-language', 'science', 'computing', 'general'));
END
$constraints$;

-- Preserve the three existing rows that this seed intentionally improves.
INSERT INTO public."AdminDashboardSetting" ("key", "settings", "updatedBy", "updatedAt")
SELECT
  'jake-demo-backup-v1',
  jsonb_build_object(
    'marker', 'jake-demo-v1',
    'createdAt', now(),
    'mountOlive', (SELECT to_jsonb(c) FROM public."TeacherClass" c WHERE c."id" = '26cbc762-da35-496c-9568-9b7a5645bf80'::uuid),
    'computingCourse', (SELECT to_jsonb(s) FROM public."Subject" s WHERE s."id" = 'course-68dd054b-e788-4756-aa43-20d436d82aec'),
    'forcesQuiz', (SELECT to_jsonb(q) FROM public."TeacherQuiz" q WHERE q."id" = 'ed76588d-cab3-4f7d-997b-dda816b2268b'::uuid),
    'protectedLessonHash', encode(digest(convert_to(COALESCE((
      SELECT to_jsonb(l)::text FROM public."AdminLessonRecord" l
      WHERE l."id" = '40276101-b5ec-48d8-af86-f28a63d3db93'
    ), '{}'), 'UTF8'), 'sha256'), 'hex'),
    'protectedQuizHash', encode(digest(convert_to(COALESCE((
      SELECT to_jsonb(q)::text FROM public."ClassQuiz" q
      WHERE q."id" = '0577cbf1-44af-41ad-9b67-6db7b71d9bef'::uuid
    ), '{}'), 'UTF8'), 'sha256'), 'hex'),
    'attemptCount', (SELECT count(*) FROM public."ClassQuizAttempt")
  ),
  '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'::uuid,
  now()
ON CONFLICT ("key") DO NOTHING;

UPDATE public."TeacherClass"
SET
  "description" = 'A lively Basic 6 learning community for Mathematics, English, Science and Digital Skills. [jake-demo-v1]',
  "updatedAt" = now()
WHERE "id" = '26cbc762-da35-496c-9568-9b7a5645bf80'::uuid
  AND "teacherId" = '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'::uuid;

INSERT INTO public."TeacherClass"
  ("id", "teacherId", "name", "description", "joinCode", "gradeLevel", "status", "createdAt", "updatedAt")
VALUES
  ('15c71664-8e5e-4b2d-bd15-31e759e4b003', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
   'Demo • Basic 3 Explorers', 'An empty demonstration class for early-primary workflows. [jake-demo-v1]',
   'JKB3DE', 3, 'active', now(), now()),
  ('a08fdc42-f91f-4b09-8bc4-889fdc1d0b05', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
   'Demo • Basic 5 Innovators', 'An empty demonstration class for upper-primary workflows. [jake-demo-v1]',
   'JKB5DI', 5, 'active', now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "gradeLevel" = EXCLUDED."gradeLevel",
  "status" = EXCLUDED."status",
  "updatedAt" = now();



INSERT INTO public."Subject"
  ("id", "name", "slug", "description", "icon", "colourToken", "coverUrl",
   "gradeLevels", "order", "status", "visibility", "ownerClassId", "createdBy", "createdAt", "updatedAt")
VALUES
  ('jake-demo-course-mathematics', 'Mathematics Mastery', 'jake-mathematics-mastery',
   'Practical Basic 5–6 work with fractions, percentages, geometry, measurement and data. [jake-demo-v1]',
   'calculator', '#2563EB', NULL, ARRAY[5,6], 80, 'ACTIVE', 'platform', NULL,
   '210e7c4c-ef4c-4ffe-86f1-bed954130c2c', now(), now()),
  ('jake-demo-course-english', 'English Communication Lab', 'jake-english-communication-lab',
   'Read closely, explain ideas and write organised, accurate English. [jake-demo-v1]',
   'book-open', '#7C3AED', NULL, ARRAY[3,5,6], 81, 'ACTIVE', 'platform', NULL,
   '210e7c4c-ef4c-4ffe-86f1-bed954130c2c', now(), now()),
  ('jake-demo-course-science', 'Science Discovery', 'jake-science-discovery',
   'Investigate Earth, living systems, electricity and energy using evidence. [jake-demo-v1]',
   'flask-conical', '#16A34A', NULL, ARRAY[3,5,6], 82, 'ACTIVE', 'platform', NULL,
   '210e7c4c-ef4c-4ffe-86f1-bed954130c2c', now(), now()),
  ('course-68dd054b-e788-4756-aa43-20d436d82aec', 'Digital Skills & Online Safety', 'intro-to-computing',
   'Use devices confidently, organise digital work and make safe online decisions. [jake-demo-v1]',
   'monitor-smartphone', '#0891B2', NULL, ARRAY[3,5,6], 83, 'ACTIVE', 'platform', NULL,
   '210e7c4c-ef4c-4ffe-86f1-bed954130c2c', now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon",
  "colourToken" = EXCLUDED."colourToken",
  "gradeLevels" = EXCLUDED."gradeLevels",
  "order" = EXCLUDED."order",
  "status" = EXCLUDED."status",
  "visibility" = EXCLUDED."visibility",
  "ownerClassId" = EXCLUDED."ownerClassId",
  "createdBy" = EXCLUDED."createdBy",
  "updatedAt" = now();

INSERT INTO public."Unit" ("id", "subjectId", "name", "slug", "description", "order", "createdAt", "updatedAt")
VALUES
  ('jake-demo-unit-mathematics-1', 'jake-demo-course-mathematics', 'Fractions, Decimals & Percentages', 'math-fractions-decimals-percentages', 'Connect equivalent forms and calculate accurately.', 1, now(), now()),
  ('jake-demo-unit-mathematics-2', 'jake-demo-course-mathematics', 'Geometry, Measurement & Data', 'math-geometry-measurement-data', 'Measure spaces and interpret information.', 2, now(), now()),
  ('jake-demo-unit-english-1', 'jake-demo-course-english', 'Reading Detectives', 'english-reading-detectives', 'Find central ideas, evidence, inference and summaries.', 1, now(), now()),
  ('jake-demo-unit-english-2', 'jake-demo-course-english', 'Writing & Grammar', 'english-writing-grammar', 'Build connected paragraphs and accurate speech.', 2, now(), now()),
  ('jake-demo-unit-science-1', 'jake-demo-course-science', 'Earth & Living Things', 'science-earth-living-things', 'Trace cycles and relationships in environments.', 1, now(), now()),
  ('jake-demo-unit-science-2', 'jake-demo-course-science', 'Energy & Electricity', 'science-energy-electricity', 'Build circuit reasoning and classify materials.', 2, now(), now()),
  ('jake-demo-unit-computing-1', 'course-68dd054b-e788-4756-aa43-20d436d82aec', 'Device Confidence', 'computing-device-confidence', 'Understand systems and organise files.', 1, now(), now()),
  ('jake-demo-unit-computing-2', 'course-68dd054b-e788-4756-aa43-20d436d82aec', 'Digital Citizenship', 'computing-digital-citizenship', 'Protect accounts and participate responsibly.', 2, now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name", "description" = EXCLUDED."description",
  "order" = EXCLUDED."order", "updatedAt" = now();

INSERT INTO public."Topic" ("id", "unitId", "name", "slug", "description", "order", "createdAt", "updatedAt")
VALUES
  ('jake-demo-topic-mathematics-1', 'jake-demo-unit-mathematics-1', 'Number Relationships', 'number-relationships', 'Equivalent forms and fraction operations.', 1, now(), now()),
  ('jake-demo-topic-mathematics-2', 'jake-demo-unit-mathematics-2', 'Shape and Information', 'shape-and-information', 'Area, volume, tables and averages.', 1, now(), now()),
  ('jake-demo-topic-english-1', 'jake-demo-unit-english-1', 'Meaning from Texts', 'meaning-from-texts', 'Central ideas, inference and summaries.', 1, now(), now()),
  ('jake-demo-topic-english-2', 'jake-demo-unit-english-2', 'Clear Communication', 'clear-communication', 'Paragraphs, grammar and punctuation.', 1, now(), now()),
  ('jake-demo-topic-science-1', 'jake-demo-unit-science-1', 'Connected Natural Systems', 'connected-natural-systems', 'Water cycles and ecosystems.', 1, now(), now()),
  ('jake-demo-topic-science-2', 'jake-demo-unit-science-2', 'Electric Systems', 'electric-systems', 'Circuits, conductors and energy.', 1, now(), now()),
  ('jake-demo-topic-computing-1', 'jake-demo-unit-computing-1', 'Using Digital Tools', 'using-digital-tools', 'Hardware, software, files and folders.', 1, now(), now()),
  ('jake-demo-topic-computing-2', 'jake-demo-unit-computing-2', 'Safe Online Choices', 'safe-online-choices', 'Privacy, misinformation and reporting.', 1, now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name", "description" = EXCLUDED."description",
  "order" = EXCLUDED."order", "updatedAt" = now();

-- Each lesson row below is transformed into a complete curriculum fixture
-- with four teaching blocks, a worked example, two MCQs, one true/false
-- checkpoint, a recap, and an optional embedded-video checkpoint.
CREATE TEMP TABLE jake_demo_lesson_source (
  id text PRIMARY KEY,
  subject text NOT NULL,
  course_id text NOT NULL,
  unit_id text NOT NULL,
  topic_id text NOT NULL,
  grade integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  concepts text NOT NULL,
  local_context text NOT NULL,
  method text NOT NULL,
  misconception text NOT NULL,
  example_problem text NOT NULL,
  example_steps jsonb NOT NULL,
  example_answer text NOT NULL,
  q1 jsonb NOT NULL,
  q2 jsonb NOT NULL,
  tf_statement text NOT NULL,
  tf_answer boolean NOT NULL,
  summary_points jsonb NOT NULL,
  video_url text,
  video_title text,
  video_caption text,
  status text NOT NULL DEFAULT 'published'
) ON COMMIT DROP;

CREATE OR REPLACE FUNCTION pg_temp.demo_question(
  prompt text, options jsonb, correct_index integer, explanation text, hint text DEFAULT 'Use the lesson method and worked example.'
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $fn$
  SELECT jsonb_build_object(
    'prompt', prompt, 'options', options, 'correctIndex', correct_index,
    'explanation', explanation, 'hint', hint
  )
$fn$;

INSERT INTO jake_demo_lesson_source VALUES
(
  'jake-demo-lesson-math-equivalent-forms', 'mathematics', 'jake-demo-course-mathematics',
  'jake-demo-unit-mathematics-1', 'jake-demo-topic-mathematics-1', 5,
  'Fractions, Decimals and Percentages Tell the Same Story',
  'Represent one quantity in three equivalent forms and choose the most useful form.',
  $$A fraction, decimal and percentage can name the same part of a whole. The fraction 3/4 means three of four equal parts. Dividing 3 by 4 gives 0.75, and multiplying that decimal by 100 gives 75%. Equivalent forms change the notation, not the quantity. Benchmarks such as 1/2 = 0.5 = 50% help us estimate before calculating.$$,
  $$At a reading challenge in Kumasi, 18 of 24 learners finish a book. The fraction 18/24 simplifies to 3/4, which is 0.75 or 75%. The fraction shows the exact relationship; the percentage helps compare this class with another. The whole is all 24 learners, not only those who finished.$$,
  $$Divide numerator by denominator to obtain a decimal. Multiply the decimal by 100 to obtain a percentage. To reverse a percentage, write it over 100 and simplify. Check the result against 25%, 50%, 75% and 100%, then label the form clearly.$$,
  $$Do not write 3/4 as 0.34. The numerator and denominator are not decimal digits; the fraction bar means division.$$,
  'Ama sold 15 of 20 baskets. Express the part sold as a fraction, decimal and percentage.',
  '["Simplify 15/20 to 3/4.","Divide 3 by 4 to get 0.75.","Multiply by 100 to get 75%."]',
  '3/4 = 0.75 = 75%',
  pg_temp.demo_question('Which percentage equals 2/5?', '["20%","40%","50%"]', 1, '2 ÷ 5 = 0.4 = 40%.'),
  pg_temp.demo_question('Which fraction in simplest form equals 0.6?', '["3/5","6/100","2/3"]', 0, '0.6 = 6/10 = 3/5.'),
  '0.25 and 25% represent the same quantity.', true,
  '["Equivalent forms preserve quantity.","Use division for fraction to decimal.","Use ×100 for decimal to percentage."]',
  'https://www.youtube.com/watch?v=5juto2ze8Lg', 'Math Antics: Adding and Subtracting Fractions',
  'Notice why equal-sized parts are required before fractions can be combined.', 'published'
),
(
  'jake-demo-lesson-math-unlike-fractions', 'mathematics', 'jake-demo-course-mathematics',
  'jake-demo-unit-mathematics-1', 'jake-demo-topic-mathematics-1', 6,
  'Add and Subtract Unlike Fractions',
  'Use common denominators to combine fractions and mixed numbers accurately.',
  $$Fractions can be combined only when their parts are the same size. Thirds and fourths cannot be added directly. A common denominator renames both fractions without changing their values. The least common multiple is efficient, but any common multiple works if the final answer is simplified.$$,
  $$A carpenter in Cape Coast uses 2/3 metre of wood for one frame and 3/4 metre for another. Twelfths work because 12 is divisible by 3 and 4. The total is 8/12 + 9/12 = 17/12 = 1 5/12 metres.$$,
  $$Choose a common denominator, multiply each numerator and denominator by the same scale factor, combine the numerators, keep the common denominator, simplify, and convert an improper fraction when a mixed number makes the context clearer. Estimate first to detect impossible results.$$,
  $$Never add both denominators. The expression 1/3 + 1/4 is not 2/7 because sevenths are a different part size.$$,
  'A group uses 1 1/2 m of red ribbon and 2 2/3 m of gold ribbon. Find the total.',
  '["Add the whole numbers to get 3.","Rename 1/2 and 2/3 as 3/6 and 4/6.","Add 7/6 = 1 1/6 and combine the extra whole."]',
  '4 1/6 metres',
  pg_temp.demo_question('What is 1/3 + 1/6?', '["1/2","2/9","2/6"]', 0, '1/3 is 2/6; the sum is 3/6 = 1/2.'),
  pg_temp.demo_question('Which is the best estimate for 5/6 + 7/8?', '["Less than 1","About 1 3/4","More than 3"]', 1, 'Both fractions are close to one.'),
  'Multiplying numerator and denominator by the same non-zero value creates an equivalent fraction.', true,
  '["Match part sizes with a common denominator.","Combine numerators only after renaming.","Estimate and simplify."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-math-area-volume', 'mathematics', 'jake-demo-course-mathematics',
  'jake-demo-unit-mathematics-2', 'jake-demo-topic-mathematics-2', 5,
  'Area and Volume in Everyday Spaces',
  'Choose dimensions, formulas and units for surface area and cuboid volume.',
  $$Length measures one direction, area measures a flat surface, and volume measures space inside a solid. Rectangle area is length × width and uses square units. Cuboid volume is length × width × height and uses cubic units. Units are part of the answer, not decoration.$$,
  $$A 6 m by 4 m classroom floor covers 24 m². A storage box measuring 50 cm by 30 cm by 20 cm contains 30,000 cm³. Real projects also consider cutting, waste and whether all measurements use the same unit.$$,
  $$Sketch and label the shape, decide whether the question asks for distance, surface or capacity, convert units, choose the formula, substitute values, calculate and attach the correct unit. Estimate the expected size before accepting the answer.$$,
  $$Adding all sides finds perimeter, not area. Square and cubic units cannot be exchanged.$$,
  'A rectangular school garden is 8 m long and 3 m wide. What area can be planted?',
  '["Identify a flat rectangular surface.","Use area = length × width.","Calculate 8 × 3 and attach m²."]',
  '24 m²',
  pg_temp.demo_question('Which unit suits classroom floor area?', '["metres","square metres","cubic metres"]', 1, 'Area uses square units.'),
  pg_temp.demo_question('What is the volume of a 4 cm × 3 cm × 2 cm box?', '["9 cm²","24 cm³","18 cm"]', 1, '4 × 3 × 2 = 24 cm³.'),
  'A 7 m by 2 m rectangle has area 18 m².', false,
  '["Area covers a surface.","Volume measures capacity.","Sketch, calculate and check units."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-math-data-mean', 'mathematics', 'jake-demo-course-mathematics',
  'jake-demo-unit-mathematics-2', 'jake-demo-topic-mathematics-2', 6,
  'Read Tables, Charts and Find the Mean',
  'Interpret data displays and calculate an average that answers a real question.',
  $$A chart becomes meaningful only after reading its title, labels, units, categories and scale. The arithmetic mean shares a total equally: add the values, then divide by the number of values. The mean may not appear among the original observations.$$,
  $$A class collects 12, 18, 15, 20 and 10 plastic bottles over five days. The total is 75, so the mean is 15 bottles per day. This does not claim that exactly 15 were collected every day; it provides an equal-share summary.$$,
  $$Read the display structure before extracting values. For a mean, count observations, add carefully, divide by the count and interpret the answer in a sentence with units. Check by multiplying mean × count to recover the total.$$,
  $$Do not divide by the largest value or by the total. Divide by the number of observations.$$,
  'Kojo reads for 20, 30, 25 and 35 minutes. Find the mean.',
  '["Add the four values to get 110.","Count four observations.","Divide 110 by 4 and interpret the result."]',
  '27.5 minutes per day',
  pg_temp.demo_question('What is the mean of 6, 8 and 10?', '["8","9","24"]', 0, '24 ÷ 3 = 8.'),
  pg_temp.demo_question('A scale rises by 5. Halfway between 20 and 30 is:', '["22","25","35"]', 1, 'The midpoint is 25.'),
  'The mean must always be one of the original values.', false,
  '["Read labels and scale first.","Mean = total ÷ count.","Interpret the average in context."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-english-main-idea', 'english-language', 'jake-demo-course-english',
  'jake-demo-unit-english-1', 'jake-demo-topic-english-1', 3,
  'Find the Main Idea and Supporting Details',
  'Identify what a paragraph is mostly saying and select the details that develop it.',
  $$The topic names the general subject. The main idea states the writer’s most important point about that subject. Supporting details explain, prove or illustrate the point. A strong main idea is broad enough to cover the paragraph but specific enough to communicate meaning.$$,
  $$A paragraph about a Tamale school garden describes learners preparing beds, planting vegetables and using compost. The topic is the garden. The main idea is that learners work together to grow healthy food. Each action supports teamwork and food production.$$,
  $$Preview the title, read the whole paragraph, notice repeated or related ideas, ask what the writer wants you to understand, state the answer in a complete sentence and test every important detail against it.$$,
  $$The first sentence is not automatically the main idea. Writers may state it later or expect readers to infer it.$$,
  'A passage says the library is quiet, has useful books and gives learners space to study. State the main idea.',
  '["Name the topic: the library.","Group the details as learning benefits.","Write one sentence that covers all details."]',
  'The school library is a helpful place for learning.',
  pg_temp.demo_question('Which sentence can work as a main idea?', '["Kofi borrowed a blue book.","Reading regularly builds knowledge and vocabulary.","The library opens at eight."]', 1, 'It is broad enough for several details.'),
  pg_temp.demo_question('Which detail supports “Trees keep the school cool”?', '["Shade lowers playground heat.","Some seeds are small.","A learner drew a tree."]', 0, 'Shade directly explains the cooling effect.'),
  'A supporting detail should connect to the main idea.', true,
  '["Topic and main idea are not identical.","Details explain or prove.","Test the idea against the whole paragraph."]',
  'https://www.youtube.com/watch?v=mkZo2zVKJR4', 'Main Idea and Supporting Details',
  'Pause after each example and name the detail that best supports the point.', 'published'
),
(
  'jake-demo-lesson-english-inference-summary', 'english-language', 'jake-demo-course-english',
  'jake-demo-unit-english-1', 'jake-demo-topic-english-1', 6,
  'Infer Meaning and Write a Concise Summary',
  'Combine textual clues with prior knowledge, then summarise without unsupported ideas.',
  $$An inference is a reasonable conclusion built from textual clues and relevant prior knowledge. It is not a guess because readers can point to evidence. A summary compresses a text by preserving central ideas and essential events while removing repetition, examples and personal opinion.$$,
  $$If clouds darken, traders cover their goods and pedestrians quicken their steps, a reader can infer that rain is expected. A summary reports that people prepared for approaching rain; it does not list every trader or invent a storm.$$,
  $$For inference, identify a clue, connect it to relevant knowledge, state a cautious conclusion and explain the link. For summary, identify purpose, select essential ideas, combine related points, use your own words and remove anything unsupported.$$,
  $$Prior experience can help interpret a clue, but it cannot replace evidence from the text.$$,
  'Esi checks the clock repeatedly and packs her books before the bell. What can you infer?',
  '["Identify both clues.","Connect them to preparation for leaving.","State a cautious conclusion supported by the clues."]',
  'Esi is eager or anxious to leave when the lesson ends.',
  pg_temp.demo_question('Which response is the strongest inference?', '["Yaw seems upset because his shoulders droop after the result.","Yaw is always rude.","The result must be wrong."]', 0, 'It is cautious and cites a clue.'),
  pg_temp.demo_question('Which belongs in a concise summary?', '["The central problem and outcome","Every adjective","The reader’s favourite character"]', 0, 'Summaries preserve essential ideas.'),
  'A valid inference should be supported by a clue.', true,
  '["Inference combines clues and knowledge.","Summary keeps essential ideas.","Do not add unsupported opinion."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-english-paragraphs', 'english-language', 'jake-demo-course-english',
  'jake-demo-unit-english-2', 'jake-demo-topic-english-2', 5,
  'Build Strong Paragraphs with Linking Words',
  'Develop one central idea with evidence, explanation and accurate transitions.',
  $$A paragraph develops one controlling idea. A topic sentence introduces it, supporting sentences provide evidence or explanation, and a concluding sentence closes or links forward. Linking words reveal addition, contrast, cause, sequence and result.$$,
  $$A paragraph arguing for a clean school compound can explain how bins reduce litter and how litter attracts pests. “Therefore” signals a result. “However” signals contrast and should appear only when the ideas genuinely differ.$$,
  $$Plan the central point, choose relevant details, order them logically, draft a topic sentence, connect the support with precise transitions and remove every sentence that wanders. Read aloud to test flow.$$,
  $$Many linking words cannot rescue weak content. Each transition must express the real relationship between ideas.$$,
  'Write a PEEL paragraph explaining why reading clubs are useful.',
  '["Point: clubs motivate regular reading.","Evidence: members discuss and recommend books.","Explain how discussion builds understanding, then link to purpose."]',
  'Reading clubs make regular reading social, purposeful and easier to understand.',
  pg_temp.demo_question('Which linker introduces a result?', '["Therefore","Meanwhile","Although"]', 0, 'Therefore signals a result.'),
  pg_temp.demo_question('Which is the strongest topic sentence?', '["Football.","Our class benefits from weekly exercise.","Yesterday was Tuesday."]', 1, 'It presents a focused, developable idea.'),
  'Every sentence in a focused paragraph should relate to its central idea.', true,
  '["One central idea per paragraph.","Support with evidence and explanation.","Choose exact linking relationships."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-english-speech', 'english-language', 'jake-demo-course-english',
  'jake-demo-unit-english-2', 'jake-demo-topic-english-2', 6,
  'Direct and Reported Speech',
  'Punctuate exact words and report speech accurately when viewpoint changes.',
  $$Direct speech records exact words in quotation marks and identifies the speaker. Reported speech communicates the message without quotation marks. Pronouns, tense and time expressions may change because the reporting viewpoint changes.$$,
  $$Direct: Akosua said, “I will finish the poster today.” Reported later: Akosua said that she would finish the poster that day. The message stays the same while grammar adjusts consistently.$$,
  $$For direct speech, capitalise the first spoken word, use quotation marks and place punctuation correctly. For reported speech, remove quotation marks, select a reporting verb, adjust pronouns and change tense or time expressions only when context requires it.$$,
  $$Do not change every verb mechanically. Permanent truths may remain in present tense.$$,
  'Change: Kofi said, “Please close the window.”',
  '["Recognise a request.","Remove quotation marks.","Use an appropriate reporting verb and infinitive."]',
  'Kofi asked us to close the window.',
  pg_temp.demo_question('Which sentence uses direct speech correctly?', '["Ama said, “We are ready.”","Ama said We are ready.","“Ama said we are ready."]', 0, 'The exact words are enclosed and punctuated.'),
  pg_temp.demo_question('Reported later, “I am leaving now” becomes:', '["He said that he was leaving then.","He says I leaving now.","He said, leaving."]', 0, 'Pronoun, tense and time shift consistently.'),
  'Reported speech always uses quotation marks.', false,
  '["Direct speech presents exact words.","Reported speech preserves the message.","Adjust viewpoint consistently."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-science-water-cycle', 'science', 'jake-demo-course-science',
  'jake-demo-unit-science-1', 'jake-demo-topic-science-1', 3,
  'Follow Water Through Its Cycle',
  'Explain evaporation, condensation, precipitation and collection as a repeating cycle.',
  $$Sunlight causes liquid water to evaporate into invisible vapour. Cooling higher in the atmosphere makes vapour condense into tiny droplets that form clouds. When droplets become heavy, precipitation falls. Water collects in rivers, soil, lakes and oceans before moving again.$$,
  $$After rain in Accra, a puddle shrinks because some water soaks into soil and some evaporates. Clouds may carry the water elsewhere before precipitation returns it to Earth. Local weather is part of a much larger movement.$$,
  $$Trace collection → evaporation → condensation → precipitation → collection. At each arrow, name the process, state whether water gains or loses heat and identify the state of water.$$,
  $$Evaporation is not the same as boiling. It can happen slowly at a water surface below boiling temperature.$$,
  'Warm water is covered by a cool metal tray. Why do droplets form beneath it?',
  '["Warm water produces vapour.","Vapour touches the cooler tray.","Cooling changes vapour into liquid droplets."]',
  'Condensation forms the droplets.',
  pg_temp.demo_question('Which process changes liquid water into vapour?', '["Condensation","Evaporation","Collection"]', 1, 'Evaporation changes liquid to vapour.'),
  pg_temp.demo_question('Rain is an example of:', '["Precipitation","Evaporation","Melting"]', 0, 'Precipitation falls from clouds.'),
  'The Sun supplies much of the energy for the water cycle.', true,
  '["Water changes state and location.","Heating supports evaporation.","Cooling supports condensation."]',
  'https://www.youtube.com/watch?v=ncORPosDrjI', 'The Water Cycle',
  'Draw arrows and label every change of state while watching.', 'published'
),
(
  'jake-demo-lesson-science-ecosystems', 'science', 'jake-demo-course-science',
  'jake-demo-unit-science-1', 'jake-demo-topic-science-1', 5,
  'Ecosystems and Food Chains',
  'Explain interactions and trace energy through producers, consumers and decomposers.',
  $$An ecosystem includes living organisms and non-living conditions interacting in one place. Producers capture energy, consumers feed, and decomposers return nutrients. Food-chain arrows point from the food to the organism receiving energy.$$,
  $$On a Ghanaian farm, maize uses sunlight, a grasshopper eats maize leaves, a lizard eats the grasshopper and a hawk may eat the lizard. Soil, rainfall and temperature influence every population. A food web reflects multiple relationships.$$,
  $$Name the habitat, list biotic and abiotic parts, identify producers, order consumers, draw arrows toward energy receivers and predict how one change might affect the system. Use cautious language because ecosystems have several causes.$$,
  $$An arrow does not mean “chases”; it means energy transfers from food to eater.$$,
  'Arrange algae, small fish and kingfisher into a food chain.',
  '["Identify algae as producer.","Place the small fish next.","Point the final arrow toward the kingfisher."]',
  'algae → small fish → kingfisher',
  pg_temp.demo_question('Which is abiotic?', '["Rainfall","Grass","Termite"]', 0, 'Rainfall is non-living.'),
  pg_temp.demo_question('In grass → goat, the arrow means:', '["Energy moves to the goat","The goat gives energy to grass","Grass chases the goat"]', 0, 'Arrows show energy transfer.'),
  'Decomposers recycle nutrients.', true,
  '["Ecosystems combine living and non-living parts.","Producers capture energy.","Arrows point toward energy receivers."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-science-circuits', 'science', 'jake-demo-course-science',
  'jake-demo-unit-science-2', 'jake-demo-topic-science-2', 5,
  'Build and Explain a Simple Circuit',
  'Identify circuit components and diagnose whether a conducting path is complete.',
  $$A circuit needs an energy source, conducting path and load such as a lamp. Current flows only around a complete closed path. A switch controls the path: closed completes it and open creates a gap. Circuit symbols communicate arrangements clearly.$$,
  $$A torch contains cells, metal contacts, a switch and lamp. Pressing the switch closes the path. A loose contact, reversed cell or broken filament can stop the system even when most components are present.$$,
  $$Use low-voltage cells only. Identify each component, trace the path from one cell terminal through the load and back, check contacts, close the switch, observe and change one factor at a time. Never use mains electricity.$$,
  $$Current is not “used up” before returning to the cell. Energy transfers at components while the path remains continuous.$$,
  'A wire touches the glass of a bulb instead of its metal contact. Why does the lamp stay off?',
  '["Trace the intended path.","Identify glass as the wrong contact.","Move the wire to the metal terminal and retest."]',
  'Both wires must touch conducting metal contacts.',
  pg_temp.demo_question('What does an open switch create?', '["A broken path","A new cell","More wire"]', 0, 'The gap stops current.'),
  pg_temp.demo_question('Which is safe for a classroom circuit?', '["A low-voltage cell","A wall socket","An exposed mains cable"]', 0, 'Use supervised low-voltage cells.'),
  'A complete circuit has a continuous conducting path.', true,
  '["A circuit needs source, path and load.","Closed paths conduct.","Diagnose by tracing every connection."]',
  'https://www.youtube.com/watch?v=x4pdzG-DHnY', 'Setting Up a Simple Circuit',
  'Identify the source, path, load and switch during assembly.', 'published'
),
(
  'jake-demo-lesson-science-conductors', 'science', 'jake-demo-course-science',
  'jake-demo-unit-science-2', 'jake-demo-topic-science-2', 6,
  'Conductors, Insulators and Energy Changes',
  'Use controlled evidence to classify materials and explain energy transformations.',
  $$Conductors allow current to pass readily; many metals conduct. Insulators resist current and protect users. Classification must come from a controlled test. Devices transform electrical energy into light, sound, movement or heat, often with several outputs.$$,
  $$A plug’s metal pins conduct while its plastic casing insulates. In a low-voltage test circuit, a coin may light the lamp while dry wood does not. The conclusion is valid only when the cell, lamp, contacts and procedure remain consistent.$$,
  $$Test a working circuit, create one gap, insert one material at a time, keep contacts consistent, record the lamp result, repeat uncertain tests and classify from evidence. Explain energy output separately from conductivity.$$,
  $$Shiny appearance alone does not prove conductivity. Never test unknown objects with mains electricity.$$,
  'A coin lights the test lamp but a plastic ruler does not. What conclusion is supported?',
  '["Confirm the circuit before each test.","Change only the test material.","Repeat and record the lamp result."]',
  'The coin conducted in this test; the ruler acted as an insulator.',
  pg_temp.demo_question('Why is plastic placed around wires?', '["It insulates","It creates electricity","It is a battery"]', 0, 'Plastic resists current.'),
  pg_temp.demo_question('A fan changes electrical energy mainly into:', '["Movement and some sound","Chemical energy only","No other form"]', 0, 'Its motor creates motion.'),
  'A fair test should change several variables at once.', false,
  '["Classify with controlled evidence.","Insulation protects users.","Devices transform energy."]',
  'https://www.youtube.com/watch?v=iZ6IQ51u6T8', 'Conductors and Insulators',
  'Make a table of every tested conductor and insulator.', 'published'
),
(
  'jake-demo-lesson-computing-systems', 'computing', 'course-68dd054b-e788-4756-aa43-20d436d82aec',
  'jake-demo-unit-computing-1', 'jake-demo-topic-computing-1', 3,
  'Hardware, Software, Input and Output',
  'Explain how physical devices and programs work together in a digital system.',
  $$Hardware is physical equipment such as a keyboard, screen or system unit. Software is the set of programs and instructions that tell hardware what to do. Input enters data, processing follows instructions, storage keeps data and output presents a result. One device may perform more than one role.$$,
  $$When a learner types a story, the keyboard provides input, word-processing software handles text, storage keeps the file and the screen displays output. A touchscreen both displays information and accepts touch input.$$,
  $$Describe the task, identify the information entering, name input hardware, explain the program’s role, identify storage and state the output. Use cause-and-effect sentences, not a loose list of devices.$$,
  $$The monitor is not the whole computer. It is one output device within a system.$$,
  'A learner takes and views a photo on a tablet. Identify input and output.',
  '["The camera sensor captures input.","Software processes and storage keeps the file.","The screen presents output."]',
  'Camera = input; screen = output.',
  pg_temp.demo_question('Which item is software?', '["A drawing application","A keyboard","A printer cable"]', 0, 'An application contains instructions.'),
  pg_temp.demo_question('Which device mainly gives typing input?', '["Keyboard","Monitor","Speaker"]', 0, 'Key presses enter data.'),
  'A touchscreen can provide both input and output.', true,
  '["Hardware is physical.","Software contains instructions.","Classify devices by task role."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-computing-files', 'computing', 'course-68dd054b-e788-4756-aa43-20d436d82aec',
  'jake-demo-unit-computing-1', 'jake-demo-topic-computing-1', 5,
  'Organise Files, Folders and Productive Keyboard Work',
  'Use meaningful names, folders and shortcuts to save, find and protect school work.',
  $$A file stores work; a folder groups related files. Clear names include subject and topic without exposing private information. A file extension often indicates format. Saving regularly and knowing the location prevents loss. Common shortcuts include Ctrl/Cmd+S for save, C for copy and V for paste.$$,
  $$Instead of “New Document”, use School Work / Science / Water Cycle / water-cycle-notes.docx. The learner and teacher can recognise it later. On a shared device, sign out and never put passwords into file names.$$,
  $$Create subject folders, name files consistently, save to the intended location, verify by reopening and back up important work. Before moving or deleting, read the name and location. Do not assume deleted work is always recoverable.$$,
  $$Copy and paste does not save a document. Saving writes current work to storage.$$,
  'Four assignments are named document1, document2, new and finalfinal. Reorganise them.',
  '["Open each file to identify it.","Rename with subject and topic.","Move into subject folders and reopen one."]',
  'Meaningful names inside subject folders.',
  pg_temp.demo_question('Which is the clearest file name?', '["work.docx","Science_WaterCycle_Notes.docx","password123.docx"]', 1, 'It identifies content without exposing a password.'),
  pg_temp.demo_question('Ctrl/Cmd+S usually means:', '["Save","Print","Close every program"]', 0, 'It saves current work.'),
  'A logical folder structure makes work easier to find.', true,
  '["Use privacy-safe names.","Organise predictably.","Save, verify and back up."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-computing-passwords', 'computing', 'course-68dd054b-e788-4756-aa43-20d436d82aec',
  'jake-demo-unit-computing-2', 'jake-demo-topic-computing-2', 5,
  'Strong Passwords, Privacy and Digital Footprints',
  'Protect accounts and make thoughtful decisions about personal information.',
  $$A strong password is long, difficult to guess and unique to one account. A passphrase can combine unrelated words with numbers or symbols. Passwords and OTPs are secrets. A digital footprint includes information created by posts, searches, comments and account activity.$$,
  $$A message may claim to be from a learning platform and urgently request an OTP. Stop, avoid suspicious links and verify through an official route with a trusted adult. Urgency and prize promises are pressure tactics, not proof.$$,
  $$Pause before sharing, identify what is requested, verify the sender independently, keep passwords and OTPs private, use unique passphrases, sign out on shared devices and review posts before sending.$$,
  $$Adding one number to a first name does not create a strong password. Predictable details are easy to guess.$$,
  'A message says: “Send your login code in five minutes to win free data.”',
  '["Recognise urgency and a prize promise.","Do not send the code or click links.","Verify officially and tell a trusted adult."]',
  'Keep the code secret and report the suspicious request.',
  pg_temp.demo_question('Which must never be shared in a chat?', '["A one-time login code","A public lesson title","A favourite subject"]', 0, 'An OTP can grant account access.'),
  pg_temp.demo_question('Which password approach is strongest?', '["One long unique passphrase","A first name","The same short password everywhere"]', 0, 'Length and uniqueness improve safety.'),
  'Deleting a post guarantees nobody kept a screenshot.', false,
  '["Protect passphrases and OTPs.","Verify unexpected requests.","Think before creating a digital footprint."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-computing-information', 'computing', 'course-68dd054b-e788-4756-aa43-20d436d82aec',
  'jake-demo-unit-computing-2', 'jake-demo-topic-computing-2', 6,
  'Spot Misinformation and Participate Respectfully',
  'Evaluate online claims and communicate without harassment.',
  $$Information is not reliable merely because it is popular or professionally designed. Credibility improves when the source is identifiable, evidence is provided, dates and context are clear and independent trustworthy sources agree. Images and headlines can be edited or removed from context.$$,
  $$A viral post may claim schools are closing without naming an authority or date. Before forwarding it, check an official school or education channel, compare reliable reports, inspect the date and ask a trusted adult.$$,
  $$Stop before sharing, identify the original source, inspect evidence and date, read beyond the headline, compare reliable sources, distinguish fact from opinion and avoid amplifying uncertain material. Challenge claims, not people.$$,
  $$Many likes measure attention, not truth. Popularity does not replace evidence.$$,
  'A screenshot recommends an unsafe experiment but gives no source. What should you do?',
  '["Search for the original statement.","Check recognised science and safety sources.","Do not try or forward it while uncertain."]',
  'Treat the screenshot as unverified.',
  pg_temp.demo_question('Best first response to a surprising claim?', '["Share immediately","Check source and evidence","Insult the poster"]', 1, 'Verify before amplifying.'),
  pg_temp.demo_question('Which is a respectful disagreement?', '["Your evidence does not support that conclusion; here is another source.","Only a fool believes that.","I will post your details."]', 0, 'It challenges the claim, not the person.'),
  'A large number of likes proves an online claim is true.', false,
  '["Check source, date and evidence.","Cross-check before sharing.","Disagree respectfully."]',
  NULL, NULL, NULL, 'published'
),
(
  'jake-demo-lesson-computing-tiktok-reporting', 'computing', 'course-68dd054b-e788-4756-aa43-20d436d82aec',
  'jake-demo-unit-computing-2', 'jake-demo-topic-computing-2', 5,
  'Use Reporting Tools When Content Is Inappropriate',
  'Moderation sample explaining how learners can stop, report and seek trusted help.',
  $$Reporting tools alert a platform to possible safety or rule violations. Reporting is not a way to silence ordinary disagreement. Learners should leave disturbing content, avoid replying or forwarding it and use the official report option.$$,
  $$For harassment, threats or age-inappropriate content, follow stop, leave, report and tell a trusted adult. Immediate danger needs urgent real-world help. Never redistribute harmful material as “proof”.$$,
  $$Pause, do not engage, use the official report menu, select the most accurate reason, block when appropriate and tell a trusted adult. Keep a report reference instead of making unnecessary copies.$$,
  $$Reporting is not the same as winning an argument. It is for possible safety or rule violations.$$,
  'A stranger repeatedly sends insulting messages after being asked to stop.',
  '["Do not continue the argument.","Use block and report controls.","Tell a trusted adult and keep the report confirmation."]',
  'Block, report and seek adult support.',
  pg_temp.demo_question('Safest response to disturbing content?', '["Forward it","Leave, report and tell an adult","Reply with insults"]', 1, 'This limits exposure and gets help.'),
  pg_temp.demo_question('When is reporting appropriate?', '["Possible safety violations","A different football opinion","To gain followers"]', 0, 'Reports are for possible violations.'),
  'A learner should investigate a suspicious stranger alone.', false,
  '["Do not engage.","Use official block and report tools.","Tell a trusted adult."]',
  'https://www.tiktok.com/@tiktoktips/video/6751042775589948678', 'TikTok Tips: Reporting Inappropriate Content',
  'This external-video sample is intentionally held for administrator review.', 'draft'
);

CREATE OR REPLACE FUNCTION pg_temp.make_demo_lesson_record(s jake_demo_lesson_source)
RETURNS jsonb
LANGUAGE plpgsql
AS $builder$
DECLARE
  xp integer := CASE WHEN s.grade <= 3 THEN 90 WHEN s.grade <= 5 THEN 110 ELSE 125 END;
  difficulty text := CASE WHEN s.grade <= 3 THEN 'beginner' WHEN s.grade <= 5 THEN 'developing' ELSE 'proficient' END;
  fixture_lesson_id text := s.id || '-fixture';
  version_id text := s.id || '-v1';
  objective_one text := version_id || '-objective-1';
  objective_two text := version_id || '-objective-2';
  blocks jsonb;
  provider text;
BEGIN
  provider := CASE WHEN s.video_url LIKE '%tiktok.com%' THEN 'tiktok' ELSE 'youtube' END;

  blocks := jsonb_build_array(
    jsonb_build_object(
      'id', version_id || '-intro', 'type', 'lesson_intro', 'order', 1, 'required', true,
      'estimatedSeconds', 60, 'title', s.title, 'shortDescription', s.description,
      'objectives', jsonb_build_array('Explain the key ideas in ' || s.title, 'Apply the learning in a practical situation'),
      'estimatedMinutes', 18, 'rewardPreview', jsonb_build_object('xp', xp, 'starsAvailable', 3)
    ),
    jsonb_build_object(
      'id', version_id || '-concepts', 'type', 'text', 'order', 2, 'required', true,
      'estimatedSeconds', 240, 'heading', 'Build the idea', 'body', s.concepts
    ),
    jsonb_build_object(
      'id', version_id || '-context', 'type', 'text', 'order', 3, 'required', true,
      'estimatedSeconds', 210, 'heading', 'Use it in a Ghanaian context', 'body', s.local_context
    )
  );

  IF s.video_url IS NOT NULL THEN
    blocks := blocks || jsonb_build_array(jsonb_build_object(
      'id', version_id || '-video', 'type', 'video', 'order', 4, 'required', false,
      'estimatedSeconds', 300, 'source', s.video_url, 'provider', provider,
      'title', s.video_title, 'caption', s.video_caption,
      'participationPrompt', 'Which action best shows careful learning from this video?',
      'participationOptions', jsonb_build_array(
        jsonb_build_object('id', 'video-a', 'label', 'A', 'text', 'Notice the evidence and connect it to the lesson'),
        jsonb_build_object('id', 'video-b', 'label', 'B', 'text', 'Ignore the lesson and guess'),
        jsonb_build_object('id', 'video-c', 'label', 'C', 'text', 'Share an account password')
      ),
      'participationCorrectOptionId', 'video-a',
      'participationExplanation', 'Careful viewing connects evidence from the video to the lesson idea.',
      'participationXp', 5
    ));
  END IF;

  blocks := blocks || jsonb_build_array(
    jsonb_build_object(
      'id', version_id || '-method', 'type', 'text', 'order', 5, 'required', true,
      'estimatedSeconds', 210, 'heading', 'A dependable method', 'body', s.method
    ),
    jsonb_build_object(
      'id', version_id || '-misconception', 'type', 'tip', 'order', 6, 'required', true,
      'estimatedSeconds', 75, 'title', 'Common mistake to avoid', 'body', s.misconception, 'tone', 'warning'
    ),
    jsonb_build_object(
      'id', version_id || '-example', 'type', 'worked_example', 'order', 7, 'required', true,
      'estimatedSeconds', 180, 'title', 'Worked example', 'problem', s.example_problem,
      'orderedSteps', s.example_steps, 'finalAnswer', s.example_answer,
      'explanation', 'The steps make the reasoning visible so the method can be reused.'
    ),
    jsonb_build_object(
      'id', version_id || '-q1', 'type', 'multiple_choice', 'order', 8, 'required', true,
      'estimatedSeconds', 75, 'prompt', s.q1 ->> 'prompt',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'q1-a', 'label', 'A', 'text', s.q1 #>> '{options,0}'),
        jsonb_build_object('id', 'q1-b', 'label', 'B', 'text', s.q1 #>> '{options,1}'),
        jsonb_build_object('id', 'q1-c', 'label', 'C', 'text', s.q1 #>> '{options,2}')
      ),
      'correctOptionId', ('q1-' || chr(97 + (s.q1 ->> 'correctIndex')::integer)),
      'learningObjectiveIds', jsonb_build_array(objective_one), 'difficulty', difficulty,
      'xpWeight', 1, 'maximumAttempts', 3, 'hint', s.q1 ->> 'hint',
      'explanation', s.q1 ->> 'explanation',
      'feedbackCorrect', 'Great work. You used the lesson idea accurately.',
      'feedbackIncorrect', 'Not yet. Revisit the method and example.',
      'feedbackRetry', 'Use the hint and try once more.', 'shuffleOptions', false
    ),
    jsonb_build_object(
      'id', version_id || '-q2', 'type', 'multiple_choice', 'order', 9, 'required', true,
      'estimatedSeconds', 75, 'prompt', s.q2 ->> 'prompt',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'q2-a', 'label', 'A', 'text', s.q2 #>> '{options,0}'),
        jsonb_build_object('id', 'q2-b', 'label', 'B', 'text', s.q2 #>> '{options,1}'),
        jsonb_build_object('id', 'q2-c', 'label', 'C', 'text', s.q2 #>> '{options,2}')
      ),
      'correctOptionId', ('q2-' || chr(97 + (s.q2 ->> 'correctIndex')::integer)),
      'learningObjectiveIds', jsonb_build_array(objective_two), 'difficulty', difficulty,
      'xpWeight', 1, 'maximumAttempts', 3, 'hint', s.q2 ->> 'hint',
      'explanation', s.q2 ->> 'explanation',
      'feedbackCorrect', 'Excellent reasoning.', 'feedbackIncorrect', 'Check the relevant detail.',
      'feedbackRetry', 'Use the explanation and try again.', 'shuffleOptions', false
    ),
    jsonb_build_object(
      'id', version_id || '-tf', 'type', 'true_false', 'order', 10, 'required', true,
      'estimatedSeconds', 60, 'prompt', 'Final checkpoint', 'statement', s.tf_statement,
      'correctAnswer', s.tf_answer, 'learningObjectiveIds', jsonb_build_array(objective_one, objective_two),
      'difficulty', difficulty, 'xpWeight', 1, 'maximumAttempts', 3,
      'hint', 'Compare the statement with the key idea.',
      'explanation', CASE WHEN s.tf_answer THEN 'The statement matches the lesson evidence.' ELSE 'The statement conflicts with the lesson evidence.' END,
      'feedbackCorrect', 'Correct. You checked the claim carefully.',
      'feedbackIncorrect', 'Review the key idea before deciding.',
      'feedbackRetry', 'Look for the exact evidence.', 'shuffleOptions', false
    ),
    jsonb_build_object(
      'id', version_id || '-summary', 'type', 'summary', 'order', 11, 'required', true,
      'estimatedSeconds', 60, 'heading', 'Mission complete', 'keyPoints', s.summary_points,
      'nextStepText', 'Use the recap, then continue to the next lesson when ready.'
    )
  );

  RETURN jsonb_build_object(
    'id', s.id,
    'subject', s.subject,
    'courseId', s.course_id,
    'classId', NULL,
    'unitId', s.unit_id,
    'topicId', s.topic_id,
    'grade', s.grade,
    'unit', (SELECT "name" FROM public."Unit" WHERE "id" = s.unit_id),
    'chapter', (SELECT "name" FROM public."Unit" WHERE "id" = s.unit_id),
    'topic', (SELECT "name" FROM public."Topic" WHERE "id" = s.topic_id),
    'title', s.title,
    'description', s.description,
    'estimatedMinutes', 18,
    'xp', xp,
    'questionCount', 3,
    'format', 'text',
    'prerequisiteLessonId', NULL,
    'gamification', jsonb_build_object(
      'passingScore', 70, 'masteryScore', 85, 'maximumAttempts', 3,
      'lessonRetries', 3, 'maximumXp', xp + 35, 'badge',
      CASE s.subject WHEN 'english-language' THEN 'English Language Explorer'
        ELSE initcap(s.subject) || ' Explorer' END
    ),
    'status', s.status,
    'createdAt', now(),
    'updatedAt', now(),
    'builderState', jsonb_build_object(
      'demoMarker', 'jake-demo-v1', 'curated', true, 'videoSource', s.video_url
    ),
    'fixture', jsonb_build_object(
      'subjects', jsonb_build_array(jsonb_build_object(
        'id', s.course_id, 'name', CASE s.subject WHEN 'english-language' THEN 'English Language' ELSE initcap(s.subject) END,
        'slug', s.subject, 'description', s.description, 'icon',
        CASE s.subject WHEN 'mathematics' THEN 'calculator' WHEN 'science' THEN 'flask-conical'
          WHEN 'computing' THEN 'monitor-smartphone' ELSE 'book-open' END,
        'colourToken', CASE s.subject WHEN 'mathematics' THEN '#2563EB' WHEN 'science' THEN '#16A34A'
          WHEN 'computing' THEN '#0891B2' ELSE '#7C3AED' END,
        'gradeLevels', jsonb_build_array(s.grade), 'order', 1, 'status', 'active',
        'createdAt', now(), 'updatedAt', now()
      )),
      'units', jsonb_build_array(jsonb_build_object(
        'id', s.unit_id, 'subjectId', s.course_id,
        'name', (SELECT "name" FROM public."Unit" WHERE "id" = s.unit_id),
        'slug', s.unit_id, 'description', s.description, 'order', 1,
        'createdAt', now(), 'updatedAt', now()
      )),
      'topics', jsonb_build_array(jsonb_build_object(
        'id', s.topic_id, 'unitId', s.unit_id,
        'name', (SELECT "name" FROM public."Topic" WHERE "id" = s.topic_id),
        'slug', s.topic_id, 'description', s.description, 'order', 1,
        'createdAt', now(), 'updatedAt', now()
      )),
      'lessons', jsonb_build_array(jsonb_build_object(
        'id', fixture_lesson_id, 'topicId', s.topic_id, 'title', s.title,
        'slug', s.id, 'shortDescription', s.description, 'order', 1,
        'prerequisiteLessonId', NULL, 'createdAt', now(), 'updatedAt', now()
      )),
      'lessonVersions', jsonb_build_array(jsonb_build_object(
        'id', version_id, 'lessonId', fixture_lesson_id, 'versionNumber', 1,
        'status', s.status, 'title', s.title, 'description', s.description,
        'objectiveSummary', 'Explain the idea and apply it accurately in context.',
        'difficulty', difficulty, 'estimatedMinutes', 18, 'baseXpReward', xp,
        'passingScore', 70, 'masteryScore', 85, 'maximumLessonRedos', 3,
        'publishedAt', CASE WHEN s.status = 'published' THEN to_jsonb(now()) ELSE 'null'::jsonb END,
        'learningObjectives', jsonb_build_array(
          jsonb_build_object('id', objective_one, 'lessonVersionId', version_id,
            'code', 'DEMO.' || upper(replace(s.subject, '-', '_')) || '.' || s.grade || '.1',
            'description', 'Explain the key ideas in ' || s.title, 'order', 1),
          jsonb_build_object('id', objective_two, 'lessonVersionId', version_id,
            'code', 'DEMO.' || upper(replace(s.subject, '-', '_')) || '.' || s.grade || '.2',
            'description', 'Apply the learning accurately in a practical situation', 'order', 2)
        ),
        'blocks', blocks, 'createdAt', now(), 'updatedAt', now()
      ))
    )
  );
END
$builder$;

INSERT INTO public."AdminLessonRecord"
  ("id", "subject", "status", "position", "record", "classId", "courseId", "unitId", "topicId",
   "createdBy", "createdAt", "updatedAt")
SELECT
  source.id,
  source.subject,
  source.status,
  row_number() OVER (PARTITION BY source.course_id ORDER BY source.unit_id, source.id) - 1,
  pg_temp.make_demo_lesson_record(source),
  NULL,
  source.course_id,
  source.unit_id,
  source.topic_id,
  '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'::uuid,
  now(),
  now()
FROM jake_demo_lesson_source source
ON CONFLICT ("id") DO UPDATE SET
  "subject" = EXCLUDED."subject",
  "status" = EXCLUDED."status",
  "position" = EXCLUDED."position",
  "record" = EXCLUDED."record",
  "classId" = EXCLUDED."classId",
  "courseId" = EXCLUDED."courseId",
  "unitId" = EXCLUDED."unitId",
  "topicId" = EXCLUDED."topicId",
  "updatedAt" = now();

-- Combined class + Public Learning assignments. Direct table writes avoid the
-- notification endpoint and therefore send no SMS.
INSERT INTO public."ClassCourseAssignment" ("classId", "courseId", "note", "assignedAt")
VALUES
  ('a08fdc42-f91f-4b09-8bc4-889fdc1d0b05', 'jake-demo-course-mathematics', 'Combined demo assignment [jake-demo-v1]', now()),
  ('26cbc762-da35-496c-9568-9b7a5645bf80', 'jake-demo-course-mathematics', 'Combined demo assignment [jake-demo-v1]', now()),
  ('15c71664-8e5e-4b2d-bd15-31e759e4b003', 'jake-demo-course-english', 'Combined demo assignment [jake-demo-v1]', now()),
  ('a08fdc42-f91f-4b09-8bc4-889fdc1d0b05', 'jake-demo-course-english', 'Combined demo assignment [jake-demo-v1]', now()),
  ('26cbc762-da35-496c-9568-9b7a5645bf80', 'jake-demo-course-english', 'Combined demo assignment [jake-demo-v1]', now()),
  ('15c71664-8e5e-4b2d-bd15-31e759e4b003', 'jake-demo-course-science', 'Combined demo assignment [jake-demo-v1]', now()),
  ('a08fdc42-f91f-4b09-8bc4-889fdc1d0b05', 'jake-demo-course-science', 'Combined demo assignment [jake-demo-v1]', now()),
  ('26cbc762-da35-496c-9568-9b7a5645bf80', 'jake-demo-course-science', 'Combined demo assignment [jake-demo-v1]', now()),
  ('15c71664-8e5e-4b2d-bd15-31e759e4b003', 'course-68dd054b-e788-4756-aa43-20d436d82aec', 'Combined demo assignment [jake-demo-v1]', now()),
  ('a08fdc42-f91f-4b09-8bc4-889fdc1d0b05', 'course-68dd054b-e788-4756-aa43-20d436d82aec', 'Combined demo assignment [jake-demo-v1]', now()),
  ('26cbc762-da35-496c-9568-9b7a5645bf80', 'course-68dd054b-e788-4756-aa43-20d436d82aec', 'Combined demo assignment [jake-demo-v1]', now())
ON CONFLICT ("classId", "courseId") DO UPDATE SET
  "note" = EXCLUDED."note";

-- Curated lesson moderation records keep the AI/trust history coherent.
-- The official TikTok lesson is deliberately held for administrator review.
INSERT INTO public."ContentModerationCase"
  ("teacherId", "contentType", "contentId", "contentHash", "snapshot", "status",
   "academicRelevance", "severity", "confidence", "categories", "reasons",
   "mediaWarnings", "model", "promptVersion", "reviewNote", "reviewedAt",
   "publishedAt", "createdAt", "updatedAt")
SELECT
  '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'::uuid,
  'lesson',
  lesson."id",
  encode(digest(convert_to(lesson."record"::text, 'UTF8'), 'sha256'), 'hex'),
  lesson."record",
  CASE WHEN lesson."status" = 'draft' THEN 'held' ELSE 'approved' END,
  CASE WHEN lesson."status" = 'draft' THEN 'unclear' ELSE 'genuine' END,
  CASE WHEN lesson."status" = 'draft' THEN 'low' ELSE 'none' END,
  CASE WHEN lesson."status" = 'draft' THEN 0.7500 ELSE 0.9900 END,
  CASE WHEN lesson."status" = 'draft' THEN '["unsupported_external_video"]'::jsonb ELSE '[]'::jsonb END,
  CASE WHEN lesson."status" = 'draft'
    THEN '["TikTok media requires administrator review before learner access."]'::jsonb
    ELSE '["Curated academic demo fixture approved for deterministic workflow testing."]'::jsonb END,
  CASE WHEN lesson."status" = 'draft'
    THEN '["TikTok is outside the automatic YouTube/Vimeo media allow-list."]'::jsonb
    ELSE '[]'::jsonb END,
  'curated-demo-fixture',
  'jake-demo-curated-v1',
  CASE WHEN lesson."status" = 'draft'
    THEN 'Review the official TikTok Tips embed and its learner-safety context.' ELSE NULL END,
  CASE WHEN lesson."status" = 'published' THEN now() ELSE NULL END,
  CASE WHEN lesson."status" = 'published' THEN now() ELSE NULL END,
  now(),
  now()
FROM public."AdminLessonRecord" lesson
JOIN jake_demo_lesson_source source ON source.id = lesson."id"
ON CONFLICT ("teacherId", "contentType", "contentId", "contentHash") DO UPDATE SET
  "status" = EXCLUDED."status",
  "academicRelevance" = EXCLUDED."academicRelevance",
  "severity" = EXCLUDED."severity",
  "confidence" = EXCLUDED."confidence",
  "categories" = EXCLUDED."categories",
  "reasons" = EXCLUDED."reasons",
  "mediaWarnings" = EXCLUDED."mediaWarnings",
  "reviewNote" = EXCLUDED."reviewNote",
  "reviewedAt" = EXCLUDED."reviewedAt",
  "publishedAt" = EXCLUDED."publishedAt",
  "updatedAt" = now();

-- Build four immutable pending Public Learning revisions. Pending or rejected
-- revisions do not become learner-visible until an administrator approves.
CREATE TEMP TABLE jake_demo_public_revision (
  id uuid PRIMARY KEY,
  course_id text NOT NULL,
  version integer NOT NULL
) ON COMMIT DROP;

INSERT INTO jake_demo_public_revision
SELECT id, course_id, COALESCE((
  SELECT max(existing."version")
  FROM public."PublicLearningRevision" existing
  WHERE existing."courseId" = seed.course_id
), 0) + 1
FROM (VALUES
  ('33333333-3333-4333-8333-333333333301'::uuid, 'jake-demo-course-mathematics'),
  ('33333333-3333-4333-8333-333333333302'::uuid, 'jake-demo-course-english'),
  ('33333333-3333-4333-8333-333333333303'::uuid, 'jake-demo-course-science'),
  ('33333333-3333-4333-8333-333333333304'::uuid, 'course-68dd054b-e788-4756-aa43-20d436d82aec')
) seed(id, course_id);

WITH snapshots AS (
  SELECT
    revision.id,
    revision.course_id,
    revision.version,
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
                      AND EXISTS (
                        SELECT 1
                        FROM jake_demo_lesson_source source
                        WHERE source.id = lesson."id"
                      )
                  ), '[]'::jsonb)
                ) ORDER BY topic."order"
              )
              FROM public."Topic" topic
              WHERE topic."unitId" = unit."id"
            ), '[]'::jsonb)
          ) ORDER BY unit."order"
        )
        FROM public."Unit" unit
        WHERE unit."subjectId" = subject."id"
          AND unit."id" LIKE 'jake-demo-unit-%'
      ), '[]'::jsonb),
      'lessons', COALESCE((
        SELECT jsonb_agg(
          lesson."record" || jsonb_build_object(
            'courseId', lesson."courseId",
            'unitId', lesson."unitId",
            'topicId', lesson."topicId",
            'classId', lesson."classId"
          ) ORDER BY lesson."position"
        )
        FROM public."AdminLessonRecord" lesson
        WHERE lesson."courseId" = subject."id"
          AND lesson."status" = 'published'
          AND EXISTS (
            SELECT 1
            FROM jake_demo_lesson_source source
            WHERE source.id = lesson."id"
          )
      ), '[]'::jsonb)
    ) AS snapshot
  FROM jake_demo_public_revision revision
  JOIN public."Subject" subject ON subject."id" = revision.course_id
)
INSERT INTO public."PublicLearningRevision"
  ("id", "courseId", "version", "status", "snapshot", "contentHash",
   "submittedBy", "submittedAt")
SELECT
  id,
  course_id,
  version,
  'pending_review',
  snapshot,
  encode(digest(convert_to(snapshot::text, 'UTF8'), 'sha256'), 'hex'),
  '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'::uuid,
  now()
FROM snapshots
ON CONFLICT ("id") DO UPDATE SET
  "snapshot" = EXCLUDED."snapshot",
  "contentHash" = EXCLUDED."contentHash",
  "submittedAt" = now()
WHERE public."PublicLearningRevision"."status" = 'pending_review';

CREATE OR REPLACE FUNCTION pg_temp.quiz_question(
  id text, prompt text, options jsonb, correct_index integer, explanation text
) RETURNS jsonb LANGUAGE sql IMMUTABLE AS $q$
  SELECT jsonb_build_object(
    'id', id, 'prompt', prompt, 'type', 'multiple_choice',
    'options', options, 'correctIndex', correct_index, 'explanation', explanation
  )
$q$;

INSERT INTO public."TeacherQuiz"
  ("id", "createdBy", "title", "description", "subject", "gradeLevels", "questions",
   "baseXpReward", "passingScore", "maxAttempts", "version", "status", "createdAt", "updatedAt")
VALUES
(
  '11111111-1111-4111-8111-111111111101', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'Fraction & Percentage Quest', 'Equivalent forms and unlike fractions. [jake-demo-v1]',
  'mathematics', ARRAY[5,6],
  jsonb_build_array(
    pg_temp.quiz_question('m1','Which decimal equals 3/4?','["0.34","0.75","0.43","1.25"]',1,'3 ÷ 4 = 0.75.'),
    pg_temp.quiz_question('m2','What percentage equals 2/5?','["20%","40%","50%","80%"]',1,'2 ÷ 5 = 0.4 = 40%.'),
    pg_temp.quiz_question('m3','What is 1/3 + 1/6?','["1/2","2/9","2/6","1/9"]',0,'1/3 = 2/6, so the total is 1/2.'),
    pg_temp.quiz_question('m4','Which fraction equals 0.25?','["1/2","1/4","2/5","3/4"]',1,'0.25 = 25/100 = 1/4.'),
    pg_temp.quiz_question('m5','What is 3/4 - 1/8?','["2/4","5/8","2/8","7/8"]',1,'6/8 - 1/8 = 5/8.'),
    pg_temp.quiz_question('m6','15 out of 20 is:','["15%","20%","60%","75%"]',3,'15/20 = 3/4 = 75%.'),
    pg_temp.quiz_question('m7','Which is greatest?','["0.6","55%","1/2","0.45"]',0,'0.6 is 60%.'),
    pg_temp.quiz_question('m8','A common denominator for 1/3 and 1/4 is:','["7","10","12","13"]',2,'12 is divisible by 3 and 4.')
  ), 90, 70, 3, 1, 'ready', now(), now()
),
(
  '11111111-1111-4111-8111-111111111102', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'Measurement & Data Mission', 'Area, volume, charts and averages. [jake-demo-v1]',
  'mathematics', ARRAY[5,6],
  jsonb_build_array(
    pg_temp.quiz_question('md1','Area of a 6 m by 4 m floor?','["10 m","20 m²","24 m²","24 m³"]',2,'6 × 4 = 24 m².'),
    pg_temp.quiz_question('md2','Volume of 5 cm × 3 cm × 2 cm?','["10 cm²","30 cm³","15 cm","25 cm³"]',1,'5 × 3 × 2 = 30 cm³.'),
    pg_temp.quiz_question('md3','Mean of 4, 6 and 8?','["6","8","18","4"]',0,'18 ÷ 3 = 6.'),
    pg_temp.quiz_question('md4','Which unit measures a wall surface?','["m","m²","m³","litres"]',1,'Area uses square units.'),
    pg_temp.quiz_question('md5','Halfway between 30 and 40 is:','["32","35","45","70"]',1,'The midpoint is 35.'),
    pg_temp.quiz_question('md6','Perimeter of a 5 m by 2 m rectangle?','["7 m","10 m²","14 m","20 m"]',2,'2 × (5 + 2) = 14 m.'),
    pg_temp.quiz_question('md7','Mean × number of values gives the:','["Range","Total","Mode","Scale"]',1,'Mean × count recovers the total.'),
    pg_temp.quiz_question('md8','A sensible estimate for 49 × 21 is:','["100","1,000","10,000","20"]',1,'50 × 20 = 1,000.')
  ), 95, 70, 3, 1, 'ready', now(), now()
),
(
  '11111111-1111-4111-8111-111111111103', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'Reading Detective Challenge', 'Main ideas, evidence, inference and summaries. [jake-demo-v1]',
  'english-language', ARRAY[3,5,6],
  jsonb_build_array(
    pg_temp.quiz_question('e1','A main idea expresses:','["A spelling detail","The central point","Only the final word","A page number"]',1,'It is the writer’s most important point.'),
    pg_temp.quiz_question('e2','A supporting detail should:','["Develop the main idea","Change the topic","Be unrelated","Replace the title"]',0,'Relevant details explain or prove.'),
    pg_temp.quiz_question('e3','A strong inference combines:','["A clue and reasoning","A rumour and guess","Only a title","Two opinions"]',0,'Inference needs evidence.'),
    pg_temp.quiz_question('e4','A summary should contain:','["Every adjective","Central ideas","Personal gossip","Unrelated examples"]',1,'Keep essential ideas.'),
    pg_temp.quiz_question('e5','Which is textual evidence?','["The road is described as wet","I dislike rain","Maybe everything happened","No clue is needed"]',0,'It cites the text.'),
    pg_temp.quiz_question('e6','The topic is usually:','["The general subject","The whole summary","A punctuation mark","The reader"]',0,'Topic names the general subject.'),
    pg_temp.quiz_question('e7','Remove this from a concise summary:','["The outcome","Repeated minor examples","The central problem","The main cause"]',1,'Minor repetition is unnecessary.'),
    pg_temp.quiz_question('e8','An inference is strongest when:','["Supported and cautious","Certain without evidence","Unrelated","Copied elsewhere"]',0,'Evidence makes it defensible.')
  ), 100, 70, 3, 1, 'ready', now(), now()
),
(
  '11111111-1111-4111-8111-111111111104', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'Writing & Grammar Sprint', 'Paragraphs, linking words and speech. [jake-demo-v1]',
  'english-language', ARRAY[3,5,6],
  jsonb_build_array(
    pg_temp.quiz_question('w1','A focused paragraph develops:','["One central idea","Every topic","No idea","Only a title"]',0,'Unity comes from one idea.'),
    pg_temp.quiz_question('w2','Which linker signals a result?','["Therefore","However","Meanwhile","Before"]',0,'Therefore introduces a result.'),
    pg_temp.quiz_question('w3','Which uses direct speech?','["Ama said, “We are ready.”","Ama said they were ready.","Ama readiness.","Ready Ama."]',0,'Quotation marks enclose exact words.'),
    pg_temp.quiz_question('w4','Reported speech normally:','["Removes quotation marks","Adds random capitals","Changes the message","Has no verb"]',0,'It reports rather than directly quotes.'),
    pg_temp.quiz_question('w5','A topic sentence should be:','["Focused and developable","Random","Always one word","Unrelated"]',0,'It introduces the central idea.'),
    pg_temp.quiz_question('w6','Which linker shows contrast?','["However","Therefore","First","Also"]',0,'However contrasts ideas.'),
    pg_temp.quiz_question('w7','Report “I am leaving now” later:','["He said he was leaving then.","He says I leaving now.","He said, leaving.","No words"]',0,'Viewpoint changes consistently.'),
    pg_temp.quiz_question('w8','What follows evidence in PEEL?','["Explanation","An unrelated topic","A password","Only a heading"]',0,'Explanation connects evidence to point.')
  ), 105, 70, 3, 1, 'ready', now(), now()
),
(
  'ed76588d-cab3-4f7d-997b-dda816b2268b', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'Forces of Nature', 'Version 2: water cycle, ecosystems and evidence. [jake-demo-v1]',
  'science', ARRAY[3,5,6],
  jsonb_build_array(
    pg_temp.quiz_question('s1','Which process forms clouds from cooled vapour?','["Evaporation","Condensation","Collection","Melting"]',1,'Cooling causes condensation.'),
    pg_temp.quiz_question('s2','What drives much of the water cycle?','["Sunlight","Plastic","Moonlight only","Sand"]',0,'Solar energy drives evaporation.'),
    pg_temp.quiz_question('s3','Which is abiotic?','["Rainfall","Maize","Goat","Fungus"]',0,'Rainfall is non-living.'),
    pg_temp.quiz_question('s4','Food-chain arrows show:','["Energy transfer","Animal size","North","Only movement"]',0,'Arrows point to energy receivers.'),
    pg_temp.quiz_question('s5','Which is usually a producer?','["Green plant","Hawk","Goat","Mushroom"]',0,'Green plants capture light energy.'),
    pg_temp.quiz_question('s6','Evaporation can happen:','["Only at boiling","Below boiling at a surface","Only in clouds","Only at night"]',1,'Surface evaporation occurs below boiling.'),
    pg_temp.quiz_question('s7','Decomposers help:','["Recycle nutrients","Stop all growth","Create sunlight","Remove soil"]',0,'They return nutrients.'),
    pg_temp.quiz_question('s8','Which statement gives evidence?','["The lamp lit in three tests.","I guessed it.","It looks magical.","No test is needed."]',0,'Repeated observations are evidence.')
  ), 110, 70, 3, 2, 'ready', now(), now()
),
(
  '11111111-1111-4111-8111-111111111106', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'Electricity & Energy Lab', 'Circuits, conductors, insulators and energy. [jake-demo-v1]',
  'science', ARRAY[5,6],
  jsonb_build_array(
    pg_temp.quiz_question('el1','An open switch creates:','["A gap","A new cell","More wire","A magnet"]',0,'The gap breaks the circuit.'),
    pg_temp.quiz_question('el2','Safest classroom power source?','["Low-voltage cell","Wall socket","Mains wire","Lightning"]',0,'Use low-voltage cells.'),
    pg_temp.quiz_question('el3','Which often conducts?','["Metal coin","Plastic ruler","Rubber eraser","Glass cup"]',0,'Many metals conduct.'),
    pg_temp.quiz_question('el4','Plastic around wire acts as:','["Insulation","Battery","Switch","Lamp"]',0,'It resists current.'),
    pg_temp.quiz_question('el5','A fan transforms electricity mainly into:','["Movement","Chemical storage","Nothing","Food"]',0,'Its motor creates motion.'),
    pg_temp.quiz_question('el6','A fair material test changes:','["Only the material","Every part","Cell and lamp","The question"]',0,'Control other variables.'),
    pg_temp.quiz_question('el7','A lamp lights when the path is:','["Complete and conducting","Open","Only glass","Disconnected"]',0,'Current needs a complete path.'),
    pg_temp.quiz_question('el8','An electric bell outputs:','["Sound","Food","Rain","Sunlight"]',0,'Electricity becomes sound.')
  ), 115, 70, 3, 1, 'ready', now(), now()
),
(
  '11111111-1111-4111-8111-111111111107', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'Device & File Skills Quest', 'Systems, files, folders and shortcuts. [jake-demo-v1]',
  'computing', ARRAY[3,5,6],
  jsonb_build_array(
    pg_temp.quiz_question('c1','Which is hardware?','["Keyboard","Drawing app","Password rule","Website instructions"]',0,'A keyboard is physical.'),
    pg_temp.quiz_question('c2','Which is software?','["Word processor","Mouse mat","Screen glass","USB cable"]',0,'A word processor is a program.'),
    pg_temp.quiz_question('c3','A keyboard mainly gives:','["Input","Output","Rainfall","Fuel"]',0,'Key presses enter data.'),
    pg_temp.quiz_question('c4','A screen mainly gives:','["Output","Food","A password","Paper storage"]',0,'It displays results.'),
    pg_temp.quiz_question('c5','Which file name is clearest?','["Science_WaterCycle_Notes.docx","new.docx","stuff.docx","password.docx"]',0,'It identifies content safely.'),
    pg_temp.quiz_question('c6','Ctrl/Cmd+S usually means:','["Save","Delete all","Print","Sign out"]',0,'It saves work.'),
    pg_temp.quiz_question('c7','Folders help users:','["Group related files","Publish passwords","Break hardware","Remove software"]',0,'Folders organise work.'),
    pg_temp.quiz_question('c8','A touchscreen can be:','["Input and output","Only storage","Only software","Neither"]',0,'It displays and detects touch.')
  ), 120, 70, 3, 1, 'ready', now(), now()
),
(
  '11111111-1111-4111-8111-111111111108', '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'Digital Safety Champion', 'Passwords, misinformation and respectful participation. [jake-demo-v1]',
  'computing', ARRAY[3,5,6],
  jsonb_build_array(
    pg_temp.quiz_question('ds1','Which must stay secret?','["OTP code","Public title","Favourite subject","Lesson heading"]',0,'An OTP can grant access.'),
    pg_temp.quiz_question('ds2','A strong password is:','["Long and unique","A first name","Same everywhere","1234"]',0,'Length and uniqueness improve safety.'),
    pg_temp.quiz_question('ds3','Before sharing a surprising claim:','["Check source and evidence","Forward immediately","Add an insult","Hide the date"]',0,'Verify first.'),
    pg_temp.quiz_question('ds4','Many likes prove truth:','["False","True","Always in science","Only at school"]',0,'Popularity is not evidence.'),
    pg_temp.quiz_question('ds5','A prize message asks for an OTP. You should:','["Stop and tell an adult","Send it","Post it","Reuse it"]',0,'Keep it secret and verify.'),
    pg_temp.quiz_question('ds6','Respectful disagreement:','["Challenges the idea with evidence","Attacks the person","Shares details","Uses threats"]',0,'Discuss claims without harassment.'),
    pg_temp.quiz_question('ds7','A digital footprint includes:','["Online posts and activity","Only shoe size","Only paper books","Nothing saved"]',0,'Online actions create information.'),
    pg_temp.quiz_question('ds8','On a shared device, finish by:','["Signing out","Leaving it open","Sharing password","Disabling safety"]',0,'Signing out protects the account.')
  ), 125, 70, 3, 1, 'ready', now(), now()
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "subject" = EXCLUDED."subject",
  "gradeLevels" = EXCLUDED."gradeLevels",
  "questions" = EXCLUDED."questions",
  "baseXpReward" = EXCLUDED."baseXpReward",
  "passingScore" = EXCLUDED."passingScore",
  "maxAttempts" = EXCLUDED."maxAttempts",
  "version" = EXCLUDED."version",
  "status" = EXCLUDED."status",
  "updatedAt" = now();

-- Moderation snapshots for the reusable library. Quizzes do not increase
-- Jake's clean-lesson trust count.
INSERT INTO public."ContentModerationCase"
  ("teacherId", "contentType", "contentId", "contentHash", "snapshot", "status",
   "academicRelevance", "severity", "confidence", "categories", "reasons",
   "mediaWarnings", "model", "promptVersion", "reviewedAt", "publishedAt",
   "createdAt", "updatedAt")
SELECT
  '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'teacher_quiz',
  quiz."id"::text,
  encode(digest(convert_to(to_jsonb(quiz)::text, 'UTF8'), 'sha256'), 'hex'),
  to_jsonb(quiz),
  'approved', 'genuine', 'none', 0.9900, '[]'::jsonb,
  '["Curated academic demo quiz approved for workflow testing."]'::jsonb,
  '[]'::jsonb, 'curated-demo-fixture', 'jake-demo-curated-v1',
  now(), now(), now(), now()
FROM public."TeacherQuiz" quiz
WHERE quiz."createdBy" = '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'
  AND (
    quiz."id"::text LIKE '11111111-1111-4111-8111-1111111111%'
    OR quiz."id" = 'ed76588d-cab3-4f7d-997b-dda816b2268b'
  )
ON CONFLICT ("teacherId", "contentType", "contentId", "contentHash") DO UPDATE SET
  "status" = 'approved', "reviewedAt" = now(), "publishedAt" = now(), "updatedAt" = now();

-- Create frozen class copies directly. No assignment endpoint is called, so
-- no learner SMS is emitted. Ended rows dynamically appear in PASCO.
WITH deployments (
  id, class_id, source_quiz_id, status, start_at, deadline, reward
) AS (
  VALUES
    ('22222222-2222-4222-8222-222222222201'::uuid, '26cbc762-da35-496c-9568-9b7a5645bf80'::uuid,
     '11111111-1111-4111-8111-111111111101'::uuid, 'closed', now() - interval '13 days', now() - interval '12 days',
     'Choose the next class warm-up activity.'),
    ('22222222-2222-4222-8222-222222222202'::uuid, '26cbc762-da35-496c-9568-9b7a5645bf80'::uuid,
     '11111111-1111-4111-8111-111111111103'::uuid, 'published', now() - interval '10 days', now() - interval '9 days',
     'Receive a class recognition card.'),
    ('22222222-2222-4222-8222-222222222203'::uuid, '26cbc762-da35-496c-9568-9b7a5645bf80'::uuid,
     '11111111-1111-4111-8111-111111111106'::uuid, 'closed', now() - interval '7 days', NULL,
     'Lead the next safe science recap.'),
    ('22222222-2222-4222-8222-222222222204'::uuid, '26cbc762-da35-496c-9568-9b7a5645bf80'::uuid,
     '11111111-1111-4111-8111-111111111107'::uuid, 'published', now() - interval '5 days', now() - interval '4 days',
     'Choose the next keyboard-practice challenge.'),
    ('22222222-2222-4222-8222-222222222205'::uuid, '26cbc762-da35-496c-9568-9b7a5645bf80'::uuid,
     '11111111-1111-4111-8111-111111111102'::uuid, 'published', NULL, NULL,
     'Earn a standing class clap.'),
    ('22222222-2222-4222-8222-222222222206'::uuid, '26cbc762-da35-496c-9568-9b7a5645bf80'::uuid,
     '11111111-1111-4111-8111-111111111108'::uuid, 'published', now() + interval '7 days', now() + interval '10 days',
     'Help choose the next digital-safety poster theme.'),
    ('22222222-2222-4222-8222-222222222207'::uuid, '15c71664-8e5e-4b2d-bd15-31e759e4b003'::uuid,
     'ed76588d-cab3-4f7d-997b-dda816b2268b'::uuid, 'draft', NULL, NULL, ''),
    ('22222222-2222-4222-8222-222222222208'::uuid, '15c71664-8e5e-4b2d-bd15-31e759e4b003'::uuid,
     '11111111-1111-4111-8111-111111111103'::uuid, 'published', now() + interval '3 days', now() + interval '5 days',
     'Choose a read-aloud story.'),
    ('22222222-2222-4222-8222-222222222209'::uuid, 'a08fdc42-f91f-4b09-8bc4-889fdc1d0b05'::uuid,
     '11111111-1111-4111-8111-111111111104'::uuid, 'published', NULL, NULL,
     'Display your paragraph on the class achievement wall.')
)
INSERT INTO public."ClassQuiz"
  ("id", "classId", "createdBy", "sourceQuizId", "sourceVersion", "title",
   "description", "questions", "startAt", "deadline", "offPlatformReward",
   "baseXpReward", "passingScore", "maxAttempts", "status", "createdAt", "updatedAt")
SELECT
  deployment.id,
  deployment.class_id,
  '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  quiz."id",
  quiz."version",
  quiz."title",
  quiz."description" || ' Frozen class assignment.',
  quiz."questions",
  deployment.start_at,
  deployment.deadline,
  deployment.reward,
  quiz."baseXpReward",
  quiz."passingScore",
  quiz."maxAttempts",
  deployment.status,
  now(),
  now()
FROM deployments deployment
JOIN public."TeacherQuiz" quiz ON quiz."id" = deployment.source_quiz_id
ON CONFLICT ("id") DO UPDATE SET
  "sourceQuizId" = EXCLUDED."sourceQuizId",
  "sourceVersion" = EXCLUDED."sourceVersion",
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "questions" = EXCLUDED."questions",
  "startAt" = EXCLUDED."startAt",
  "deadline" = EXCLUDED."deadline",
  "offPlatformReward" = EXCLUDED."offPlatformReward",
  "baseXpReward" = EXCLUDED."baseXpReward",
  "passingScore" = EXCLUDED."passingScore",
  "maxAttempts" = EXCLUDED."maxAttempts",
  "status" = EXCLUDED."status",
  "updatedAt" = now();

INSERT INTO public."ContentModerationCase"
  ("teacherId", "contentType", "contentId", "contentHash", "snapshot", "status",
   "academicRelevance", "severity", "confidence", "categories", "reasons",
   "mediaWarnings", "model", "promptVersion", "reviewedAt", "publishedAt",
   "createdAt", "updatedAt")
SELECT
  '210e7c4c-ef4c-4ffe-86f1-bed954130c2c',
  'class_quiz',
  quiz."id"::text,
  encode(digest(convert_to(to_jsonb(quiz)::text, 'UTF8'), 'sha256'), 'hex'),
  to_jsonb(quiz),
  'approved', 'genuine', 'none', 0.9900, '[]'::jsonb,
  '["Curated frozen class quiz approved for workflow testing."]'::jsonb,
  '[]'::jsonb, 'curated-demo-fixture', 'jake-demo-curated-v1',
  now(), now(), now(), now()
FROM public."ClassQuiz" quiz
WHERE quiz."id"::text LIKE '22222222-2222-4222-8222-2222222222%'
ON CONFLICT ("teacherId", "contentType", "contentId", "contentHash") DO UPDATE SET
  "status" = 'approved', "reviewedAt" = now(), "publishedAt" = now(), "updatedAt" = now();

-- Explicitly verify the protected records and sample counts before commit.
DO $checks$
DECLARE
  backup jsonb;
  current_lesson_hash text;
  current_quiz_hash text;
  expected_demo_lessons integer;
  expected_published_lessons integer;
  actual_demo_lessons integer;
  actual_published_lessons integer;
BEGIN
  SELECT "settings" INTO backup
  FROM public."AdminDashboardSetting"
  WHERE "key" = 'jake-demo-backup-v1';

  SELECT encode(digest(convert_to(to_jsonb(lesson)::text, 'UTF8'), 'sha256'), 'hex')
  INTO current_lesson_hash
  FROM public."AdminLessonRecord" lesson
  WHERE lesson."id" = '40276101-b5ec-48d8-af86-f28a63d3db93';

  SELECT encode(digest(convert_to(to_jsonb(quiz)::text, 'UTF8'), 'sha256'), 'hex')
  INTO current_quiz_hash
  FROM public."ClassQuiz" quiz
  WHERE quiz."id" = '0577cbf1-44af-41ad-9b67-6db7b71d9bef';

  IF current_lesson_hash IS DISTINCT FROM backup ->> 'protectedLessonHash' THEN
    RAISE EXCEPTION 'Protected numerical analysis lesson changed; rolling back.';
  END IF;
  IF current_quiz_hash IS DISTINCT FROM backup ->> 'protectedQuizHash' THEN
    RAISE EXCEPTION 'Protected historical Forces of Nature class quiz changed; rolling back.';
  END IF;
  SELECT count(*), count(*) FILTER (WHERE status = 'published')
  INTO expected_demo_lessons, expected_published_lessons
  FROM jake_demo_lesson_source;

  SELECT count(*), count(*) FILTER (WHERE lesson."status" = 'published')
  INTO actual_demo_lessons, actual_published_lessons
  FROM public."AdminLessonRecord" lesson
  JOIN jake_demo_lesson_source source ON source.id = lesson."id";

  IF actual_demo_lessons <> expected_demo_lessons THEN
    RAISE EXCEPTION
      'Demo lesson upsert incomplete: expected %, found %.',
      expected_demo_lessons,
      actual_demo_lessons;
  END IF;
  IF actual_published_lessons <> expected_published_lessons THEN
    RAISE EXCEPTION
      'Published demo lesson upsert incomplete: expected %, found %.',
      expected_published_lessons,
      actual_published_lessons;
  END IF;
  IF (SELECT count(*) FROM public."TeacherQuiz"
      WHERE "createdBy" = '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'
        AND ("id"::text LIKE '11111111-1111-4111-8111-1111111111%'
          OR "id" = 'ed76588d-cab3-4f7d-997b-dda816b2268b')) <> 8 THEN
    RAISE EXCEPTION 'Expected 8 reusable quizzes.';
  END IF;
  IF (SELECT count(*) FROM public."ClassQuiz"
      WHERE "id"::text LIKE '22222222-2222-4222-8222-2222222222%') <> 9 THEN
    RAISE EXCEPTION 'Expected 9 class quiz snapshots.';
  END IF;
  IF (SELECT count(*) FROM public."ClassMembership"
      WHERE "classId" IN (
        '15c71664-8e5e-4b2d-bd15-31e759e4b003',
        'a08fdc42-f91f-4b09-8bc4-889fdc1d0b05'
      )) <> 0 THEN
    RAISE EXCEPTION 'Demo-only classes unexpectedly contain learners.';
  END IF;
  IF (SELECT count(*) FROM public."ClassQuizAttempt") <> (backup ->> 'attemptCount')::integer THEN
    RAISE EXCEPTION 'A class quiz attempt was unexpectedly created.';
  END IF;
END
$checks$;

COMMIT;

-- Success report returned by Supabase SQL Editor.
SELECT *
FROM (
  SELECT 'classes' AS item, count(*)::integer AS total
  FROM public."TeacherClass"
  WHERE "id" IN (
    '26cbc762-da35-496c-9568-9b7a5645bf80',
    '15c71664-8e5e-4b2d-bd15-31e759e4b003',
    'a08fdc42-f91f-4b09-8bc4-889fdc1d0b05'
  )
  UNION ALL
  SELECT 'published lessons', count(*)::integer
  FROM public."AdminLessonRecord"
  WHERE "id" LIKE 'jake-demo-lesson-%' AND "status" = 'published'
  UNION ALL
  SELECT 'AI-held TikTok lessons', count(*)::integer
  FROM public."ContentModerationCase"
  WHERE "teacherId" = '210e7c4c-ef4c-4ffe-86f1-bed954130c2c'
    AND "contentId" = 'jake-demo-lesson-computing-tiktok-reporting'
    AND "status" = 'held'
  UNION ALL
  SELECT 'pending Public Learning revisions', count(*)::integer
  FROM public."PublicLearningRevision"
  WHERE "id" IN (
    '33333333-3333-4333-8333-333333333301',
    '33333333-3333-4333-8333-333333333302',
    '33333333-3333-4333-8333-333333333303',
    '33333333-3333-4333-8333-333333333304'
  ) AND "status" = 'pending_review'
  UNION ALL
  SELECT 'PASCO quizzes', count(*)::integer
  FROM public."ClassQuiz"
  WHERE "id" IN (
    '22222222-2222-4222-8222-222222222201',
    '22222222-2222-4222-8222-222222222202',
    '22222222-2222-4222-8222-222222222203',
    '22222222-2222-4222-8222-222222222204'
  )
) report
ORDER BY item;

-- Course-by-course module and lesson report. Expected output:
-- Mathematics 2/4, English 2/4, Science 2/4, Computing 2/4 (+1 held draft).
SELECT
  subject."name" AS "course",
  subject."slug",
  (
    SELECT count(*)::integer
    FROM public."Unit" unit
    WHERE unit."subjectId" = subject."id"
      AND unit."id" LIKE 'jake-demo-unit-%'
  ) AS "modules",
  (
    SELECT count(*)::integer
    FROM public."Topic" topic
    JOIN public."Unit" unit ON unit."id" = topic."unitId"
    WHERE unit."subjectId" = subject."id"
      AND topic."id" LIKE 'jake-demo-topic-%'
  ) AS "topics",
  (
    SELECT count(*)::integer
    FROM public."AdminLessonRecord" lesson
    WHERE lesson."courseId" = subject."id"
      AND lesson."id" LIKE 'jake-demo-lesson-%'
      AND lesson."status" = 'published'
  ) AS "publishedLessons",
  (
    SELECT count(*)::integer
    FROM public."AdminLessonRecord" lesson
    WHERE lesson."courseId" = subject."id"
      AND lesson."id" LIKE 'jake-demo-lesson-%'
      AND lesson."status" = 'draft'
  ) AS "privateDrafts"
FROM public."Subject" subject
WHERE subject."slug" IN (
  'jake-mathematics-mastery',
  'jake-english-communication-lab',
  'jake-science-discovery',
  'intro-to-computing'
)
ORDER BY subject."order";

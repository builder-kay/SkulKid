-- Teacher Kay Basic 6 demonstration curriculum.
--
-- Sources:
--   NaCCA Mathematics Upper Primary B4-B6 (2019)
--   NaCCA English Upper Primary B4-B6 (2019)
--   NaCCA Science Upper Primary B4-B6 (2019)
--   NaCCA Computing B4-B6 (2019)
--
-- This is deliberately a rerunnable, teacher-owned demo seed. It creates:
--   4 subjects x 5 platform strands x 2 sub-strands x 2 lessons = 80 lessons
--   10 assessment blocks and one linked 10-question quiz per lesson
--   one additional 10-question review quiz after every strand
--
-- NaCCA does not use exactly five strands in every one of these subjects.
-- For a consistent platform demonstration, Mathematics separates Geometry
-- from Measurement, while English combines closely related grammar and
-- writing-convention content. The sub-strand content remains NaCCA-aligned.
--
-- WARNING: this removes Teacher Kay's existing subjects, lesson records and
-- quiz library before inserting the fresh demonstration curriculum.

ALTER TABLE public."AdminLessonRecord"
  DROP CONSTRAINT IF EXISTS "AdminLessonRecord_subject_check";

ALTER TABLE public."AdminLessonRecord"
  ADD CONSTRAINT "AdminLessonRecord_subject_check"
  CHECK ("subject" IN ('mathematics', 'english-language', 'science', 'computing'));

ALTER TABLE public."TeacherQuiz"
  DROP CONSTRAINT IF EXISTS "TeacherQuiz_subject_check";

ALTER TABLE public."TeacherQuiz"
  ADD CONSTRAINT "TeacherQuiz_subject_check"
  CHECK ("subject" IN ('mathematics', 'english-language', 'science', 'computing', 'general'));

ALTER TABLE public."TeacherQuiz"
  ADD COLUMN IF NOT EXISTS "courseId" text REFERENCES public."Subject"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "unitId" text REFERENCES public."Unit"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "topicId" text REFERENCES public."Topic"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "lessonId" text;

CREATE INDEX IF NOT EXISTS "TeacherQuiz_lessonId_idx"
ON public."TeacherQuiz" ("lessonId");

DO $seed$
DECLARE
  teacher_id uuid;
  teacher_count integer;
  curriculum jsonb := $curriculum$
  [
    {
      "key":"mathematics",
      "name":"Mathematics",
      "description":"Build confidence with numbers, algebra, geometry, measurement and data through practical Basic 6 missions.",
      "icon":"calculator",
      "colour":"#2563EB",
      "cover":"https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
      "youtube":"https://www.youtube.com/watch?v=RQ2nYUBVvqI",
      "strands":[
        {"name":"Number","topics":[
          {"name":"Counting, Representation, Cardinality and Ordinality","standard":"B6.1.1.1","indicator":"Represent, compare and order whole numbers and use place value.","focus":"Place value, Roman numerals, factors, multiples and prime numbers"},
          {"name":"Number Operations and Fractions","standard":"B6.1.2.1 / B6.1.3.1","indicator":"Apply number operations and strategies with common, decimal and percent fractions.","focus":"Mental strategies, integers, fraction operations, ratios and proportion"}
        ]},
        {"name":"Algebra","topics":[
          {"name":"Patterns and Relationships","standard":"B6.2.1.1","indicator":"Determine pattern rules and use them to make predictions.","focus":"Growing patterns, number sequences and rules"},
          {"name":"Expressions, Variables and Equations","standard":"B6.2.2.1 / B6.2.3.1","indicator":"Interpret expressions and solve one-step equations with a single variable.","focus":"Unknowns, expressions, coefficients and equations"}
        ]},
        {"name":"Geometry","topics":[
          {"name":"2D and 3D Shapes","standard":"B6.3.1.1","indicator":"Identify and describe prisms and their properties.","focus":"Rectangular prisms, triangular prisms, faces, edges and vertices"},
          {"name":"Geometric Reasoning and Transformation","standard":"B6.3.3.1","indicator":"Describe positions and perform transformations on 2D shapes.","focus":"Cardinal points, translations, reflections and rotations"}
        ]},
        {"name":"Measurement","topics":[
          {"name":"Perimeter, Area and Volume","standard":"B6.3.2.1","indicator":"Solve practical measurement problems and construct prisms from nets.","focus":"Perimeter, area, capacity, volume and prism nets"},
          {"name":"Time and Angles","standard":"B6.3.2.2","indicator":"Measure time and angles accurately and solve related problems.","focus":"Timetables, elapsed time, angle measurement and estimation"}
        ]},
        {"name":"Data and Probability","topics":[
          {"name":"Data Collection and Line Graphs","standard":"B6.4.1.1","indicator":"Collect data and create, label and interpret line graphs.","focus":"Data questions, tables, scales, line graphs and interpretation"},
          {"name":"Chance and Probability","standard":"B6.4.2.1","indicator":"Describe and compare the likelihood of everyday events.","focus":"Possible outcomes, probability language and simple experiments"}
        ]}
      ]
    },
    {
      "key":"english-language",
      "name":"English Language",
      "description":"Develop confident listening, speaking, reading and writing using the NaCCA Basic 6 language curriculum.",
      "icon":"book-open",
      "colour":"#7C3AED",
      "cover":"https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
      "youtube":"https://www.youtube.com/watch?v=cetrtFDN2Zg",
      "strands":[
        {"name":"Oral Language","topics":[
          {"name":"Storytelling, Drama and Conversation","standard":"B6.1.4.1 - B6.1.6.1","indicator":"Tell, dramatise and discuss stories clearly for different audiences.","focus":"Story structure, dramatisation, role play and purposeful conversation"},
          {"name":"Listening, Questions and Presentation","standard":"B6.1.7.1 - B6.1.10.1","indicator":"Listen for meaning, ask relevant questions and present ideas clearly.","focus":"Listening comprehension, questioning, directions and oral presentation"}
        ]},
        {"name":"Reading","topics":[
          {"name":"Word Study and Vocabulary","standard":"B6.2.2.1 - B6.2.6.1","indicator":"Use sound, word-family and context knowledge to read unfamiliar words.","focus":"Phonics, minimal pairs, digraphs, diphthongs, blends and vocabulary"},
          {"name":"Comprehension and Fluency","standard":"B6.2.7.1 - B6.2.10.1","indicator":"Read fluently, infer meaning and summarise age-appropriate texts.","focus":"Comprehension, silent reading, fluency and summarising"}
        ]},
        {"name":"Grammar and Usage","topics":[
          {"name":"Word Classes","standard":"B6.3.1.1 - B6.3.10.1","indicator":"Use nouns, determiners, pronouns, adjectives, verbs, adverbs and connectors accurately.","focus":"Word classes and their functions in meaningful sentences"},
          {"name":"Phrases and Reported Speech","standard":"B6.3.11.1 - B6.3.13.1","indicator":"Use adjective and adverb phrases and change direct speech to reported speech.","focus":"Phrase structure, direct speech and reported speech"}
        ]},
        {"name":"Writing","topics":[
          {"name":"Planning and Paragraph Development","standard":"B6.4.6.1 / B6.4.9.1","indicator":"Plan, draft, revise and organise coherent paragraphs.","focus":"Topic sentences, supporting detail, cohesion and the writing process"},
          {"name":"Creative and Functional Writing","standard":"B6.4.10.1 - B6.4.15.1","indicator":"Compose narrative, descriptive, persuasive, informative and letter texts.","focus":"Audience, purpose, genre features and editing"}
        ]},
        {"name":"Conventions and Extensive Reading","topics":[
          {"name":"Capitalisation, Punctuation and Spelling","standard":"B6.5.1.1 - B6.5.10.1","indicator":"Apply writing conventions accurately in sentences and longer texts.","focus":"Capital letters, punctuation, sentence structure and spelling strategies"},
          {"name":"Independent and Critical Reading","standard":"B6.6.1.1","indicator":"Read widely and present a critical response using agreed criteria.","focus":"Reading choice, response journals, recommendations and book critique"}
        ]}
      ]
    },
    {
      "key":"science",
      "name":"Science",
      "description":"Investigate matter, cycles, systems, energy and environmental responsibility through practical Basic 6 science.",
      "icon":"flask-conical",
      "colour":"#16A34A",
      "cover":"https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
      "youtube":"https://www.youtube.com/watch?v=PLBK1ux5b7U",
      "strands":[
        {"name":"Diversity of Matter","topics":[
          {"name":"Living and Non-Living Things","standard":"B6.1.1.1","indicator":"Classify plants using observable structures and life processes.","focus":"Plant root systems, classification and characteristics of living things"},
          {"name":"Materials","standard":"B6.1.2.1","indicator":"Investigate mixtures, solutions and useful properties of materials.","focus":"Mixtures, separation methods, solutions and material properties"}
        ]},
        {"name":"Cycles","topics":[
          {"name":"Earth Science","standard":"B6.2.1.1","indicator":"Explain selected Earth processes using observations and models.","focus":"Rocks, soil, water movement, weather and the changing Earth"},
          {"name":"Life Cycles of Organisms","standard":"B6.2.2.1","indicator":"Compare life cycles and explain how organisms reproduce and develop.","focus":"Flowering plants, animals, growth, reproduction and life-cycle comparison"}
        ]},
        {"name":"Systems","topics":[
          {"name":"Human Body Systems","standard":"B6.3.1.1","indicator":"Explain the organs and functions of the human excretory system.","focus":"Kidneys, skin, lungs, waste removal and healthy body systems"},
          {"name":"Solar Systems and Ecosystems","standard":"B6.3.2.1 / B6.3.3.1","indicator":"Model relationships in the solar system and local ecosystems.","focus":"Planets, space relationships, food chains and interdependence"}
        ]},
        {"name":"Forces and Energy","topics":[
          {"name":"Sources and Forms of Energy","standard":"B6.4.1.1","indicator":"Compare renewable and non-renewable energy sources.","focus":"Energy sources, transformations, conservation and Ghanaian examples"},
          {"name":"Electricity, Electronics and Movement","standard":"B6.4.2.1 / B6.4.3.1","indicator":"Build simple circuits and investigate forces that affect movement.","focus":"Circuits, conductors, magnets, friction and balanced forces"}
        ]},
        {"name":"Humans and the Environment","topics":[
          {"name":"Hygiene and Diseases","standard":"B6.5.1.1 / B6.5.2.1","indicator":"Practise hygiene and explain prevention of common communicable diseases.","focus":"Sanitation, pathogens, disease prevention and community health"},
          {"name":"Science, Industry and Climate Change","standard":"B6.5.3.1 / B6.5.4.1","indicator":"Relate science to industry and propose responses to climate change.","focus":"Local industry, sustainable technology, climate evidence and action"}
        ]}
      ]
    },
    {
      "key":"computing",
      "name":"Computing",
      "description":"Build practical digital literacy with computers, productivity tools, programming concepts and safe internet use.",
      "icon":"monitor-cog",
      "colour":"#0891B2",
      "cover":"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      "youtube":"https://www.youtube.com/watch?v=O5nskjZ_GoI",
      "strands":[
        {"name":"Introduction to Computing","topics":[
          {"name":"Computer Generations and Components","standard":"B6.1.1.1","indicator":"Describe computer generations and identify the functions of major components and gadgets.","focus":"Computer history, input, processing, output, storage and modern gadgets"},
          {"name":"Windows, Data and Community Technology","standard":"B6.1.2.1 - B6.1.4.1","indicator":"Manage the Windows interface and explain how data and technology serve communities.","focus":"Desktop tools, files, data sources and communication technology"}
        ]},
        {"name":"Presentation","topics":[
          {"name":"PowerPoint Interface","standard":"B6.2.1.1","indicator":"Identify and use presentation tabs, ribbons and slide controls.","focus":"PowerPoint workspace, layouts, themes and slide organisation"},
          {"name":"Designing Effective Slides","standard":"B6.2.1.2","indicator":"Create a clear multimedia presentation for a defined audience.","focus":"Readable text, images, transitions, speaker notes and presenting"}
        ]},
        {"name":"Word Processing","topics":[
          {"name":"Word-Processing Interface","standard":"B6.3.1.1","indicator":"Use common tabs, ribbons and editing tools in a word processor.","focus":"Document navigation, selection, formatting and page setup"},
          {"name":"Creating School Documents","standard":"B6.3.1.2","indicator":"Create, edit, save and print a well-formatted document.","focus":"Reports, tables, images, proofreading, saving and printing"}
        ]},
        {"name":"Programming and Data","topics":[
          {"name":"Databases, Algorithms and Programming","standard":"B6.5.1.1","indicator":"Explain databases and represent a simple solution as an ordered algorithm.","focus":"Records, fields, algorithms, flow steps and introductory programming"},
          {"name":"Electronic Spreadsheets","standard":"B6.5.2.1","indicator":"Enter, format and calculate data in an electronic spreadsheet.","focus":"Cells, rows, columns, formulas, simple functions and charts"}
        ]},
        {"name":"Internet, Digital Citizenship and Safety","topics":[
          {"name":"Networks, Browsers and Online Communication","standard":"B6.6.1.1 - B6.6.7.1","indicator":"Use networks, browsers, search, forms and email purposefully.","focus":"Networks, web pages, searching, online forms and email"},
          {"name":"IoT, Digital Literacy and Safe Use","standard":"B6.6.8.1 - B6.7.1.1","indicator":"Explain IoT and practise safe, healthy and respectful technology use.","focus":"Connected devices, digital footprints, netiquette, privacy and ergonomics"}
        ]}
      ]
    }
  ]
  $curriculum$::jsonb;
  subject_data jsonb;
  strand_data jsonb;
  topic_data jsonb;
  subject_index integer;
  strand_index integer;
  topic_index integer;
  lesson_variant integer;
  lesson_position integer;
  subject_id text;
  unit_id text;
  topic_id text;
  lesson_id text;
  version_id text;
  previous_lesson_id text;
  lesson_title text;
  lesson_description text;
  lesson_objective text;
  lesson_xp integer;
  media_blocks jsonb;
  assessment_blocks jsonb;
  quiz_questions jsonb;
  fixture jsonb;
  record_data jsonb;
  video_source text;
  video_provider text;
BEGIN
  SELECT count(*)
  INTO teacher_count
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND lower(coalesce(raw_app_meta_data ->> 'role', raw_user_meta_data ->> 'role', '')) IN ('teacher', 'admin');

  IF teacher_count = 0 THEN
    RAISE EXCEPTION 'Teacher Kay was not found. Set auth.users.raw_user_meta_data.display_name to "Teacher Kay" and ensure the account role is teacher.';
  ELSIF teacher_count > 1 THEN
    RAISE EXCEPTION 'More than one Teacher Kay account was found. Use a unique account name before running this seed.';
  END IF;

  SELECT id
  INTO teacher_id
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND lower(coalesce(raw_app_meta_data ->> 'role', raw_user_meta_data ->> 'role', '')) IN ('teacher', 'admin')
  LIMIT 1;

  -- Remove dependent teacher content first so no lesson rows become orphaned.
  DELETE FROM public."TeacherQuiz" WHERE "createdBy" = teacher_id;
  DELETE FROM public."AdminLessonRecord" WHERE "createdBy" = teacher_id;
  DELETE FROM public."Subject" WHERE "createdBy" = teacher_id;

  FOR subject_data, subject_index IN
    SELECT value, ordinality::integer
    FROM jsonb_array_elements(curriculum) WITH ORDINALITY
  LOOP
    subject_id := 'teacher-kay-b6-' || (subject_data ->> 'key');
    previous_lesson_id := NULL;

    INSERT INTO public."Subject"
      ("id","name","slug","description","icon","colourToken","coverUrl","gradeLevels","order","status","createdBy","createdAt","updatedAt")
    VALUES
      (subject_id, subject_data ->> 'name', 'teacher-kay-b6-' || (subject_data ->> 'key'),
       subject_data ->> 'description', subject_data ->> 'icon', subject_data ->> 'colour',
       subject_data ->> 'cover', ARRAY[6], subject_index, 'ACTIVE', teacher_id, now(), now());

    FOR strand_data, strand_index IN
      SELECT value, ordinality::integer
      FROM jsonb_array_elements(subject_data -> 'strands') WITH ORDINALITY
    LOOP
      unit_id := subject_id || '-strand-' || lpad(strand_index::text, 2, '0');

      INSERT INTO public."Unit"
        ("id","subjectId","name","slug","description","order","createdAt","updatedAt")
      VALUES
        (unit_id, subject_id, strand_data ->> 'name',
         'strand-' || strand_index || '-' || regexp_replace(lower(strand_data ->> 'name'), '[^a-z0-9]+', '-', 'g'),
         'NaCCA-aligned Basic 6 strand: ' || (strand_data ->> 'name') || '.',
         strand_index, now(), now());

      FOR topic_data, topic_index IN
        SELECT value, ordinality::integer
        FROM jsonb_array_elements(strand_data -> 'topics') WITH ORDINALITY
      LOOP
        topic_id := unit_id || '-substrand-' || lpad(topic_index::text, 2, '0');

        INSERT INTO public."Topic"
          ("id","unitId","name","slug","description","order","createdAt","updatedAt")
        VALUES
          (topic_id, unit_id, topic_data ->> 'name',
           'substrand-' || topic_index || '-' || regexp_replace(lower(topic_data ->> 'name'), '[^a-z0-9]+', '-', 'g'),
           (topic_data ->> 'focus') || '. Curriculum reference: ' || (topic_data ->> 'standard') || '.',
           topic_index, now(), now());

        FOR lesson_variant IN 1..2 LOOP
          lesson_position := ((strand_index - 1) * 4) + ((topic_index - 1) * 2) + lesson_variant;
          lesson_id := subject_id || '-lesson-' || lpad(lesson_position::text, 2, '0');
          version_id := lesson_id || '-v1';
          lesson_title := CASE lesson_variant
            WHEN 1 THEN (topic_data ->> 'name') || ': Explore the Ideas'
            ELSE (topic_data ->> 'name') || ': Apply It in Ghana'
          END;
          lesson_description := CASE lesson_variant
            WHEN 1 THEN 'Learn the essential ideas behind ' || lower(topic_data ->> 'focus') || ' through clear explanations and guided examples.'
            ELSE 'Apply ' || lower(topic_data ->> 'focus') || ' to practical school, home and community situations in Ghana.'
          END;
          lesson_objective := CASE lesson_variant
            WHEN 1 THEN 'Explain and identify the central ideas in ' || lower(topic_data ->> 'name') || '.'
            ELSE 'Use knowledge of ' || lower(topic_data ->> 'name') || ' to solve or explain a practical situation.'
          END;
          lesson_xp := CASE WHEN lesson_variant = 1 THEN 100 ELSE 120 END;

          SELECT coalesce(jsonb_agg(jsonb_build_object(
            'id', lesson_id || '-q' || q,
            'type', 'multiple_choice',
            'order', 10 + q,
            'required', true,
            'estimatedSeconds', 60,
            'prompt', CASE q
              WHEN 1 THEN 'Which statement best introduces ' || lower(topic_data ->> 'name') || '?'
              WHEN 2 THEN 'Which example best matches today''s focus?'
              WHEN 3 THEN 'What should a learner do first when applying this idea?'
              WHEN 4 THEN 'Which choice shows accurate use of the key vocabulary?'
              WHEN 5 THEN 'Which observation would provide the strongest evidence?'
              WHEN 6 THEN 'Which mistake should be avoided in this topic?'
              WHEN 7 THEN 'How can this learning be used in a Ghanaian community?'
              WHEN 8 THEN 'Which explanation connects the example to the main idea?'
              WHEN 9 THEN 'Which action demonstrates successful application?'
              ELSE 'Which summary best captures this lesson?'
            END,
            'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective-1'),
            'difficulty', CASE WHEN lesson_variant = 1 THEN 'beginner' ELSE 'developing' END,
            'xpWeight', 1,
            'maximumAttempts', 3,
            'hint', 'Return to the explanation and look for the key idea before choosing.',
            'explanation', 'The correct option directly reflects the lesson objective: ' || lesson_objective,
            'feedbackCorrect', 'Excellent reasoning. You connected the answer to the lesson objective.',
            'feedbackIncorrect', 'Not yet. Review the example and compare each option with the lesson objective.',
            'feedbackRetry', 'Try once more and eliminate choices that do not fit the lesson focus.',
            'shuffleOptions', true,
            'options', jsonb_build_array(
              jsonb_build_object('id','a','label','A','text',
                CASE q
                  WHEN 1 THEN 'It explains ' || lower(topic_data ->> 'focus') || ' using relevant ideas.'
                  WHEN 2 THEN 'A real situation that clearly demonstrates ' || lower(topic_data ->> 'name') || '.'
                  WHEN 3 THEN 'Identify what is known, the goal and the relevant rule or evidence.'
                  WHEN 4 THEN 'Use each term with its correct meaning in context.'
                  WHEN 5 THEN 'A careful observation or result that can be checked.'
                  WHEN 6 THEN 'Check assumptions, units, evidence and the meaning of each term.'
                  WHEN 7 THEN 'Use the idea to make an informed, safe and responsible decision.'
                  WHEN 8 THEN 'It states how the evidence supports the main idea.'
                  WHEN 9 THEN 'Explain the method, carry it out and check the result.'
                  ELSE 'Explain the idea, show an example and apply it responsibly.'
                END),
              jsonb_build_object('id','b','label','B','text','Ignore the lesson evidence and choose an unrelated answer.'),
              jsonb_build_object('id','c','label','C','text','Memorise one word without understanding or applying it.'),
              jsonb_build_object('id','d','label','D','text','Skip the method and assume every situation has the same answer.')
            ),
            'correctOptionId', 'a'
          ) ORDER BY q), '[]'::jsonb)
          INTO assessment_blocks
          FROM generate_series(1, 10) q;

          media_blocks := '[]'::jsonb;
          IF lesson_position % 3 = 0 THEN
            media_blocks := media_blocks || jsonb_build_array(jsonb_build_object(
              'id', lesson_id || '-image',
              'type', 'image',
              'order', 3,
              'required', false,
              'estimatedSeconds', 45,
              'source', subject_data ->> 'cover',
              'altText', 'A learning illustration supporting ' || lesson_title,
              'caption', 'Observe the visual and connect it to the lesson focus.',
              'attribution', 'Unsplash educational image',
              'decorative', false
            ));
          END IF;

          IF lesson_position % 4 = 0 OR lesson_position % 5 = 0 THEN
            IF lesson_position % 5 = 0 THEN
              video_source := 'https://www.tiktok.com/@tiktok/video/7462464810555346219';
              video_provider := 'tiktok';
            ELSE
              video_source := subject_data ->> 'youtube';
              video_provider := 'youtube';
            END IF;
            media_blocks := media_blocks || jsonb_build_array(jsonb_build_object(
              'id', lesson_id || '-video',
              'type', 'video',
              'order', 4,
              'required', false,
              'estimatedSeconds', 180,
              'source', video_source,
              'provider', video_provider,
              'title', 'Watch and connect: ' || (topic_data ->> 'name'),
              'caption', 'Pause when needed and identify one idea that supports the lesson objective.'
            ));
          END IF;

          fixture := jsonb_build_object(
            'subjects', jsonb_build_array(jsonb_build_object(
              'id',subject_id,'name',subject_data ->> 'name','slug','teacher-kay-b6-' || (subject_data ->> 'key'),
              'description',subject_data ->> 'description','icon',subject_data ->> 'icon','colourToken',subject_data ->> 'colour',
              'gradeLevels',jsonb_build_array(6),'order',subject_index,'status','active',
              'createdAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
              'updatedAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )),
            'units', jsonb_build_array(jsonb_build_object(
              'id',unit_id,'subjectId',subject_id,'name',strand_data ->> 'name',
              'slug','strand-' || strand_index,'description','Basic 6 strand: ' || (strand_data ->> 'name'),
              'order',strand_index,'createdAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
              'updatedAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )),
            'topics', jsonb_build_array(jsonb_build_object(
              'id',topic_id,'unitId',unit_id,'name',topic_data ->> 'name',
              'slug','substrand-' || topic_index,'description',topic_data ->> 'focus',
              'order',topic_index,'createdAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
              'updatedAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )),
            'lessons', jsonb_build_array(jsonb_build_object(
              'id',lesson_id,'topicId',topic_id,'title',lesson_title,
              'slug',regexp_replace(lower(lesson_title), '[^a-z0-9]+', '-', 'g'),
              'shortDescription',lesson_description,'order',lesson_position,
              'prerequisiteLessonId',previous_lesson_id,
              'createdAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
              'updatedAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )),
            'lessonVersions', jsonb_build_array(jsonb_build_object(
              'id',version_id,'lessonId',lesson_id,'versionNumber',1,'status','published',
              'title',lesson_title,'description',lesson_description,'objectiveSummary',lesson_objective,
              'difficulty',CASE WHEN lesson_variant = 1 THEN 'beginner' ELSE 'developing' END,
              'estimatedMinutes',15,'baseXpReward',lesson_xp,'passingScore',70,'masteryScore',90,
              'maximumLessonRedos',3,
              'publishedAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
              'learningObjectives',jsonb_build_array(jsonb_build_object(
                'id',lesson_id || '-objective-1','lessonVersionId',version_id,
                'code',topic_data ->> 'indicator','description',lesson_objective,'order',1
              )),
              'blocks',
                jsonb_build_array(
                  jsonb_build_object(
                    'id',lesson_id || '-intro','type','lesson_intro','order',1,'required',true,'estimatedSeconds',60,
                    'title',lesson_title,'shortDescription',lesson_description,
                    'objectives',jsonb_build_array(lesson_objective),'estimatedMinutes',15,
                    'rewardPreview',jsonb_build_object('xp',lesson_xp,'starsAvailable',3)
                  ),
                  jsonb_build_object(
                    'id',lesson_id || '-text','type','text','order',2,'required',true,'estimatedSeconds',300,
                    'heading','Learn the big idea',
                    'body',lesson_description || ' The key curriculum focus is ' || (topic_data ->> 'focus') ||
                      '. Start by connecting what you already know to a familiar example from school, home or the local community. ' ||
                      'Describe the evidence or method clearly, use the correct vocabulary, and check that your conclusion answers the question.',
                    'emphasisTerms',jsonb_build_array(topic_data ->> 'name', strand_data ->> 'name')
                  )
                ) || media_blocks || assessment_blocks ||
                jsonb_build_array(jsonb_build_object(
                  'id',lesson_id || '-summary','type','summary','order',25,'required',true,'estimatedSeconds',60,
                  'heading','Mission complete',
                  'keyPoints',jsonb_build_array(
                    'I can explain ' || lower(topic_data ->> 'name') || '.',
                    'I can apply the idea to a practical Ghanaian situation.',
                    'I can support my answer with a method, example or evidence.'
                  ),
                  'nextStepText','Review any missed quiz question, then continue to the next lesson.'
                )),
              'createdAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
              'updatedAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            ))
          );

          record_data := jsonb_build_object(
            'id',lesson_id,'subject',subject_data ->> 'key','courseId',subject_id,'unitId',unit_id,'topicId',topic_id,
            'grade',6,'unit',strand_data ->> 'name','chapter',strand_data ->> 'name','topic',topic_data ->> 'name',
            'contentStandard',topic_data ->> 'standard','indicator',topic_data ->> 'indicator',
            'lessonNumber',lesson_position,'title',lesson_title,'description',lesson_description,
            'estimatedMinutes',15,'xp',lesson_xp,'questionCount',10,
            'format',CASE WHEN lesson_position % 4 = 0 OR lesson_position % 5 = 0 THEN 'video' ELSE 'text' END,
            'prerequisiteLessonId',previous_lesson_id,
            'gamification',jsonb_build_object(
              'passingScore',70,'masteryScore',90,'maximumAttempts',3,'lessonRetries',3,
              'maximumXp',lesson_xp + 100,'badge',CASE WHEN lesson_variant = 1 THEN 'Explorer' ELSE 'Problem Solver' END
            ),
            'status','published','createdAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'updatedAt',to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'fixture',fixture,'createdBy',teacher_id
          );

          INSERT INTO public."AdminLessonRecord"
            ("id","subject","status","position","record","createdBy","courseId","unitId","topicId","createdAt","updatedAt")
          VALUES
            (lesson_id,subject_data ->> 'key','published',lesson_position,record_data,teacher_id,
             subject_id,unit_id,topic_id,now(),now());

          SELECT jsonb_agg(jsonb_build_object(
            'id','q-' || q,
            'prompt',(assessment_blocks -> (q - 1) ->> 'prompt'),
            'type','multiple_choice',
            'options',jsonb_build_array(
              assessment_blocks -> (q - 1) -> 'options' -> 0 ->> 'text',
              assessment_blocks -> (q - 1) -> 'options' -> 1 ->> 'text',
              assessment_blocks -> (q - 1) -> 'options' -> 2 ->> 'text',
              assessment_blocks -> (q - 1) -> 'options' -> 3 ->> 'text'
            ),
            'correctIndex',0,
            'explanation','The correct option directly supports the objective: ' || lesson_objective
          ) ORDER BY q)
          INTO quiz_questions
          FROM generate_series(1,10) q;

          INSERT INTO public."TeacherQuiz"
            ("createdBy","title","description","subject","gradeLevels","questions","baseXpReward",
             "passingScore","maxAttempts","version","status","courseId","unitId","topicId","lessonId","createdAt","updatedAt")
          VALUES
            (teacher_id,lesson_title || ' - 10 Question Quiz',
             '[SKULKID-B6-SEED] Lesson quiz for ' || lesson_title,
             subject_data ->> 'key',ARRAY[6],quiz_questions,100,70,3,1,'ready',
             subject_id,unit_id,topic_id,lesson_id,now(),now());

          previous_lesson_id := lesson_id;
        END LOOP;
      END LOOP;

      SELECT jsonb_agg(jsonb_build_object(
        'id','strand-q-' || q,
        'prompt',CASE q
          WHEN 1 THEN 'What is the main purpose of the ' || (strand_data ->> 'name') || ' strand?'
          WHEN 2 THEN 'Which idea belongs in this strand?'
          WHEN 3 THEN 'Which vocabulary should be used accurately?'
          WHEN 4 THEN 'Which example best connects the strand to everyday life?'
          WHEN 5 THEN 'Which method helps check an answer in this strand?'
          WHEN 6 THEN 'Which evidence would support a strong explanation?'
          WHEN 7 THEN 'Which misconception should a learner avoid?'
          WHEN 8 THEN 'How are the two sub-strands connected?'
          WHEN 9 THEN 'Which action shows practical application?'
          ELSE 'Which reflection best summarises learning across this strand?'
        END,
        'type','multiple_choice',
        'options',jsonb_build_array(
          'Use the strand ideas, vocabulary and evidence together.',
          'Choose an unrelated idea without checking it.',
          'Memorise a heading but ignore all examples.',
          'Skip the method and guess.'
        ),
        'correctIndex',0,
        'explanation','The correct answer connects the strand concepts with clear reasoning and practical application.'
      ) ORDER BY q)
      INTO quiz_questions
      FROM generate_series(1,10) q;

      INSERT INTO public."TeacherQuiz"
        ("createdBy","title","description","subject","gradeLevels","questions","baseXpReward",
         "passingScore","maxAttempts","version","status","courseId","unitId","topicId","lessonId","createdAt","updatedAt")
      VALUES
        (teacher_id,(strand_data ->> 'name') || ' - Strand Challenge',
         '[SKULKID-B6-SEED] Ten-question review after the ' || (strand_data ->> 'name') || ' strand.',
         subject_data ->> 'key',ARRAY[6],quiz_questions,150,70,3,1,'ready',
         subject_id,unit_id,NULL,NULL,now(),now());
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Teacher Kay seed complete: 4 subjects, 20 strands, 40 sub-strands, 80 lessons and 100 quizzes.';
END
$seed$;

-- Verification summary returned by the SQL editor.
SELECT
  u.raw_user_meta_data ->> 'display_name' AS teacher,
  (SELECT count(*) FROM public."Subject" s WHERE s."createdBy" = u.id) AS subjects,
  (SELECT count(*) FROM public."Unit" st JOIN public."Subject" s ON s.id = st."subjectId" WHERE s."createdBy" = u.id) AS strands,
  (SELECT count(*) FROM public."Topic" ss JOIN public."Unit" st ON st.id = ss."unitId" JOIN public."Subject" s ON s.id = st."subjectId" WHERE s."createdBy" = u.id) AS sub_strands,
  (SELECT count(*) FROM public."AdminLessonRecord" l WHERE l."createdBy" = u.id) AS lessons,
  (SELECT count(*) FROM public."TeacherQuiz" q WHERE q."createdBy" = u.id) AS quizzes,
  (SELECT coalesce(sum(l."questionCount"), 0) FROM public."AdminLessonRecord" l WHERE l."createdBy" = u.id) AS in_lesson_questions
FROM auth.users u
WHERE lower(btrim(coalesce(u.raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
  AND lower(coalesce(u.raw_app_meta_data ->> 'role', u.raw_user_meta_data ->> 'role', '')) IN ('teacher', 'admin');

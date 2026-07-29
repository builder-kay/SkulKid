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
  topic_content text;
  lesson_teaching_text text;
  lesson_application_text text;
  example_problem text;
  example_steps jsonb;
  example_answer text;
  misconception_text text;
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
          topic_content := CASE topic_data ->> 'name'
            WHEN 'Counting, Representation, Cardinality and Ordinality' THEN
              'Place value tells the value of a digit from its position in a number. In 584,206, the 5 represents 500,000 while the 5 in 5,842 represents 5,000. Large numbers can be written in standard, expanded and word forms. Factors divide a number exactly; multiples result from multiplying it; prime numbers greater than one have exactly two factors. Roman numerals use symbols such as I, V, X, L and C, and their order determines whether values are added or subtracted.'
            WHEN 'Number Operations and Fractions' THEN
              'Whole-number operations are connected: addition reverses subtraction and multiplication reverses division. Fractions describe equal parts of a whole or set, decimals use place value after the decimal point, and percentages compare a quantity with one hundred. Unlike fractions need a common denominator before addition or subtraction. A ratio compares quantities in the same order, while a proportion states that two ratios are equivalent.'
            WHEN 'Patterns and Relationships' THEN
              'A pattern rule describes how one term changes to the next or how a term relates to its position. A sequence may grow by a constant difference, repeated multiplication or a combination of operations. Tables help compare term numbers with term values. A valid rule must work for every shown term and can then be used to predict later terms or identify a missing value.'
            WHEN 'Expressions, Variables and Equations' THEN
              'A variable is a symbol representing a number that may be unknown or may change. An expression combines numbers, variables and operations but has no equality sign. An equation states that two expressions have the same value. Solving an equation means finding the value that makes it true, using inverse operations while keeping both sides balanced.'
            WHEN '2D and 3D Shapes' THEN
              'Two-dimensional shapes have length and width, while three-dimensional objects also have depth. A prism has two congruent, parallel faces joined by rectangular or parallelogram faces. A rectangular prism has six rectangular faces; a triangular prism has two triangular and three rectangular faces. Nets show the flat faces arranged so they can fold into a solid.'
            WHEN 'Geometric Reasoning and Transformation' THEN
              'Position can be described using cardinal directions, coordinates and movement language. A translation slides every point the same distance and direction, a reflection flips a shape across a mirror line, and a rotation turns it around a fixed centre. These transformations preserve side lengths and angles even when position or orientation changes.'
            WHEN 'Perimeter, Area and Volume' THEN
              'Perimeter is the distance around a flat shape and is measured in linear units. Area is the surface covered and uses square units. Volume measures the space inside a solid in cubic units, while capacity describes how much a container can hold. A formula is a shortened statement of a measurement relationship, but learners should first understand why it works through grids, layers or nets.'
            WHEN 'Time and Angles' THEN
              'Elapsed time is the duration between a starting and finishing time and may cross an hour, noon or midnight. Timelines and 24-hour time help prevent errors. An angle measures turn and is measured in degrees: acute angles are below 90 degrees, right angles equal 90 degrees, obtuse angles lie between 90 and 180 degrees, and straight angles equal 180 degrees.'
            WHEN 'Data Collection and Line Graphs' THEN
              'Data answer a clearly stated question. A line graph displays change, often over time, using labelled axes, an appropriate equal scale, plotted points and joined segments. The graph can reveal increases, decreases, peaks and periods of no change. Conclusions must match the displayed evidence and should acknowledge when the data are insufficient.'
            WHEN 'Chance and Probability' THEN
              'Probability describes how likely an event is, from impossible through unlikely, equally likely and likely to certain. A fair experiment gives each expected outcome an appropriate chance. Theoretical probability compares favourable outcomes with all equally likely outcomes, while experimental probability is based on repeated trials and may vary in small samples.'
            WHEN 'Storytelling, Drama and Conversation' THEN
              'A well-shaped story has characters, setting, a sequence of events, a problem or tension and a satisfying resolution. Drama turns a story into action using dialogue, stage directions, gesture, movement and expression. Conversation requires listening, taking turns, responding to what was said and adjusting language to the relationship, setting and purpose.'
            WHEN 'Listening, Questions and Presentation' THEN
              'Active listeners identify the main idea, supporting details, sequence, speaker attitude and implied meaning. Useful questions can clarify facts, explore reasons or challenge ideas respectfully. A presentation needs a clear opening, logically grouped points, examples or evidence, transitions and a conclusion, supported by audible speech, eye contact and purposeful visuals.'
            WHEN 'Word Study and Vocabulary' THEN
              'Word-reading knowledge includes letter-sound relationships, syllables, digraphs, consonant clusters, diphthongs and meaningful word parts. Minimal pairs differ by one sound and help sharpen pronunciation. Vocabulary grows when learners use context, roots, prefixes, suffixes, synonyms and dictionaries, then test the chosen meaning in the original sentence.'
            WHEN 'Comprehension and Fluency' THEN
              'Comprehension includes retrieving stated facts, making inferences, identifying purpose, comparing viewpoints and evaluating evidence. Fluent reading is accurate, appropriately paced and expressive. Summarising means selecting the central idea and essential supporting points, then restating them briefly in one’s own words without adding unrelated detail.'
            WHEN 'Word Classes' THEN
              'Nouns name people, places, things and ideas; pronouns replace nouns; determiners introduce and limit nouns; adjectives describe; verbs express actions, events or states; adverbs modify verbs and other words. Conjunctions connect ideas, modals express possibility or obligation, and prepositions show relationships. A word’s class depends on how it functions in its sentence.'
            WHEN 'Phrases and Reported Speech' THEN
              'A phrase is a meaningful group of words without a complete subject-predicate structure. Adjective phrases add information about nouns, while adverb phrases explain how, when, where or why. Direct speech records exact words in quotation marks. Reported speech retells the message and may require changes to pronouns, tense, time words and punctuation.'
            WHEN 'Planning and Paragraph Development' THEN
              'A unified paragraph develops one controlling idea. Its topic sentence signals that idea, supporting sentences explain or prove it with examples and details, and a concluding sentence closes or links the discussion. Effective writing moves through planning, drafting, revising meaning and organisation, editing conventions, and publishing for the intended audience.'
            WHEN 'Creative and Functional Writing' THEN
              'Narrative writing develops events and characters; description uses precise sensory details; persuasion presents a position supported by reasons and evidence; exposition explains information clearly; and letters follow conventions suited to formal or informal purposes. Writers select structure, tone, vocabulary and evidence according to audience and purpose.'
            WHEN 'Capitalisation, Punctuation and Spelling' THEN
              'Capital letters mark sentence beginnings, proper nouns and selected titles. Full stops, question marks and exclamation marks close sentences; commas organise items and clauses; apostrophes mark possession or omitted letters; quotation marks enclose direct speech. Spelling strategies include sound patterns, syllables, word families, morphology, mnemonics and careful proofreading.'
            WHEN 'Independent and Critical Reading' THEN
              'Independent readers choose suitable texts, sustain attention and keep track of characters, information and questions. Critical readers distinguish fact from opinion, consider the author’s purpose, examine evidence and notice perspective or bias. A useful book response identifies the text, summarises it briefly, evaluates it using stated criteria and supports recommendations with examples.'
            WHEN 'Living and Non-Living Things' THEN
              'Living things carry out life processes such as nutrition, respiration, growth, response, excretion and reproduction. Plants can be classified using observable features. Taproot systems have one main root with smaller branches, while fibrous systems contain many similarly sized roots. Roots anchor plants, absorb water and mineral salts, and may store food.'
            WHEN 'Materials' THEN
              'A mixture contains substances physically combined, so each keeps many of its properties. Solutions form when a solute dissolves in a solvent. Separation depends on differences in properties: sieving uses particle size, filtration separates an insoluble solid from a liquid, evaporation recovers a dissolved solid, decanting uses settling, and magnets attract magnetic materials.'
            WHEN 'Earth Science' THEN
              'Earth materials and processes interact. Rocks break down through weathering to contribute to soil; soil contains mineral particles, organic matter, water and air. Water moves through evaporation, condensation, precipitation, infiltration and runoff. Weather observations include temperature, cloud, rainfall and wind, while longer patterns help describe climate.'
            WHEN 'Life Cycles of Organisms' THEN
              'A life cycle shows the stages through which an organism grows and reproduces. Flowering plants move from seed germination to mature plant, flowering, pollination, fertilisation, fruit and seed formation. Animals may develop directly or through metamorphosis. Although stages differ, reproduction ensures continuity of the species.'
            WHEN 'Human Body Systems' THEN
              'Excretion removes metabolic waste produced by cells. The kidneys filter blood, remove urea and excess water and salts, and form urine that travels through ureters to the bladder and exits through the urethra. The lungs remove carbon dioxide and water vapour, while skin releases sweat. Healthy hydration and hygiene support these organs.'
            WHEN 'Solar Systems and Ecosystems' THEN
              'The solar system contains the Sun, eight planets, moons and smaller bodies held by gravity. Earth rotates to create day and night and revolves around the Sun. In ecosystems, producers capture energy, consumers obtain it by feeding, and decomposers recycle materials. Food chains and webs show energy transfer and interdependence.'
            WHEN 'Sources and Forms of Energy' THEN
              'Energy enables change and occurs in forms including light, heat, sound, electrical, chemical and movement energy. Renewable sources such as sunlight, wind and flowing water are naturally replenished; fossil fuels are non-renewable on a human timescale. Energy changes form in devices, but some spreads to the surroundings, often as heat.'
            WHEN 'Electricity, Electronics and Movement' THEN
              'A simple circuit needs a source, conducting path and component in a closed loop. Conductors allow electric current more easily than insulators. Forces are pushes or pulls that can change motion or shape. Friction opposes movement, gravity attracts masses, and balanced forces cause no change in motion while unbalanced forces cause acceleration.'
            WHEN 'Hygiene and Diseases' THEN
              'Personal and community hygiene reduce the spread of pathogens. Handwashing with soap, safe water, food hygiene, sanitation, respiratory etiquette and clean surroundings interrupt transmission routes. Communicable diseases may spread through air, water, food, vectors or contact. Prevention works best when individuals and communities act consistently.'
            WHEN 'Science, Industry and Climate Change' THEN
              'Science supports industries through measurement, material selection, preservation, quality control and safer production. Climate change is a long-term shift influenced today by increased greenhouse gases from human activity. Evidence includes changing temperature and rainfall patterns. Responses include reducing emissions, conserving energy, protecting ecosystems and adapting farms and settlements.'
            WHEN 'Computer Generations and Components' THEN
              'Computer generations describe major changes from vacuum tubes to transistors, integrated circuits, microprocessors and increasingly intelligent connected systems. Input devices capture data, the processor follows instructions, memory holds active work, storage retains files, and output devices present results. Gadgets combine these functions for particular users and tasks.'
            WHEN 'Windows, Data and Community Technology' THEN
              'An operating system manages hardware, applications, files and user interaction. Windows provides a desktop, taskbar, Start menu, windows and folders. Data may be text, numbers, images, sound or video collected from primary or secondary sources. Community technologies support communication, health, banking, transport, learning and public services.'
            WHEN 'PowerPoint Interface' THEN
              'Presentation software organises information into slides. The ribbon groups commands into tabs; the thumbnail pane manages slide order; layouts provide placeholders; and themes coordinate fonts and colours. Slide Show view presents to an audience, while speaker notes support the presenter without overcrowding the visible slide.'
            WHEN 'Designing Effective Slides' THEN
              'Effective slides communicate one main idea at a time with readable type, strong contrast and relevant visuals. Images should teach rather than decorate, and sources should be credited. Transitions and animations should be restrained. A presenter explains the idea instead of reading every word, tests media beforehand and invites appropriate questions.'
            WHEN 'Word-Processing Interface' THEN
              'A word processor creates and edits text documents. Common tools select, cut, copy, paste, undo, find, align and format text. Page setup controls margins, size and orientation. Styles create consistent headings, while tables and images organise information. Formatting marks and spellcheck help find issues but do not replace careful proofreading.'
            WHEN 'Creating School Documents' THEN
              'A good school document begins with a purpose and audience. Use a meaningful title, clear headings, readable paragraphs and consistent formatting. Tables should have labels and images need captions where useful. Save versions with meaningful names, proofread content and layout, preview before printing and export to an appropriate format when sharing.'
            WHEN 'Databases, Algorithms and Programming' THEN
              'A database stores organised data: fields describe attributes, records contain related field values and tables group similar records. An algorithm is a finite, ordered and unambiguous set of steps. Programs express algorithms in a language a computer can execute, using sequence, decisions and repetition to transform input into output.'
            WHEN 'Electronic Spreadsheets' THEN
              'A spreadsheet arranges data in rows and columns; their intersection is a cell identified by a reference such as B4. Formulas begin with an equals sign and may use operators or functions such as SUM and AVERAGE. Relative references change when copied. Clear labels, suitable number formats and charts help people interpret the data.'
            WHEN 'Networks, Browsers and Online Communication' THEN
              'A network connects devices so they can communicate and share resources. The internet links many networks, while the World Wide Web is a service of linked pages accessed with browsers and URLs. Search queries use specific keywords. Online forms collect structured data, and email uses addresses, subjects, messages and attachments.'
            WHEN 'IoT, Digital Literacy and Safe Use' THEN
              'Internet of Things devices use sensors, software and networks to collect data and respond, as in smart meters or trackers. Digital literacy includes finding, evaluating, creating and communicating information responsibly. Strong passwords, privacy controls, respectful netiquette, source checking, limited personal-data sharing and healthy posture reduce risk.'
            ELSE topic_data ->> 'focus'
          END;
          lesson_teaching_text := CASE subject_data ->> 'key'
            WHEN 'mathematics' THEN
              topic_content || ' Begin with a familiar quantity or shape and represent it in three ways: with objects or a sketch, with mathematical symbols, and in words. ' ||
              'The focus for this lesson is ' || lower(topic_data ->> 'focus') || '. Define every important term before using it. ' ||
              'Model one example slowly, naming the operation or property used at each stage. Estimate the likely answer first, complete the calculation or construction, and then check whether the result is reasonable. ' ||
              'When two methods are possible, compare them and explain why both work. Learners should write units where needed, label diagrams clearly and use complete mathematical sentences to justify conclusions.'
            WHEN 'english-language' THEN
              topic_content || ' The focus for this lesson is ' || lower(topic_data ->> 'focus') || '. Start by listening to or reading a short model and identify its audience, purpose and most noticeable language feature. ' ||
              'Read the model again, this time noticing how words, phrases, sentences and punctuation work together to create meaning. Discuss unfamiliar vocabulary in context and test possible meanings by replacing the word in the sentence. ' ||
              'The teacher models the skill aloud, learners practise it together, and each learner then applies it independently. Answers should quote or point to evidence from the text. Spoken responses should be clear and respectful, while written responses should be organised, edited and suitable for their intended reader.'
            WHEN 'science' THEN
              topic_content || ' The focus for this lesson is ' || lower(topic_data ->> 'focus') || '. Science begins with a question that can be explored through careful observation, a model, reliable information or a simple investigation. ' ||
              'State what you already know, make a prediction and identify the evidence that would support or challenge it. During an investigation, change only one relevant factor at a time, observe safely and record results accurately in words, labelled drawings or a table. ' ||
              'Explain the result using scientific vocabulary rather than merely repeating the observation. Distinguish evidence from opinion, identify possible sources of error and suggest how the investigation could be improved or repeated.'
            ELSE
              topic_content || ' The focus for this lesson is ' || lower(topic_data ->> 'focus') || '. First identify the user''s goal, the digital tool or system involved and the information needed to complete the task. ' ||
              'Follow the process one step at a time, naming the interface element, command, data item or safety decision used at each stage. Before clicking, saving, sharing or submitting, predict what the action will do and check the result afterwards. ' ||
              'Use meaningful file names, organise work carefully and protect private information. If the result is unexpected, retrace the steps, inspect the input and correct one issue at a time instead of repeating random actions.'
          END;
          lesson_application_text := CASE subject_data ->> 'key'
            WHEN 'mathematics' THEN
              'Apply the idea to a Ghanaian context such as comparing market prices, sharing items fairly, reading a timetable, measuring a classroom, interpreting rainfall data or planning materials for a community activity. Show all working and explain how the final answer helps someone make a decision.'
            WHEN 'english-language' THEN
              'Apply the skill by preparing a message, presentation, story, report or response for a Ghanaian school or community audience. Choose respectful language, organise the ideas logically and revise the work so that another person can understand it without additional explanation.'
            WHEN 'science' THEN
              'Connect the concept to health, farming, water, energy, weather, materials or environmental decisions in Ghana. Describe what can be observed locally, explain the science behind it and propose one safe, realistic action that a learner or community could take.'
            ELSE
              'Apply the skill to a school task such as organising class data, preparing a presentation, writing a report, finding reliable information or communicating online. Complete the task efficiently, protect personal information and explain why each digital-safety choice matters.'
          END;
          example_problem := CASE subject_data ->> 'key'
            WHEN 'mathematics' THEN 'A Basic 6 learner meets a practical problem involving ' || lower(topic_data ->> 'name') || '. How should the learner represent the information, choose a method, solve it and verify the answer?'
            WHEN 'english-language' THEN 'A learner must communicate clearly using ' || lower(topic_data ->> 'name') || '. How can the learner plan, produce and improve a response that suits the audience and purpose?'
            WHEN 'science' THEN 'A class observes an everyday situation related to ' || lower(topic_data ->> 'name') || '. How can they investigate or explain it using evidence and safe scientific practice?'
            ELSE 'A learner must complete a digital task involving ' || lower(topic_data ->> 'name') || '. What ordered process will produce the correct result while keeping information safe?'
          END;
          example_steps := CASE subject_data ->> 'key'
            WHEN 'mathematics' THEN jsonb_build_array(
              'Underline what is known, circle what must be found and write any required unit.',
              'Draw a model, table, number line, graph or labelled shape that represents the information.',
              'Choose the relevant operation, property or measurement rule and show each stage of the working.',
              'Estimate or use an inverse method to check the result, then explain the answer in context.'
            )
            WHEN 'english-language' THEN jsonb_build_array(
              'Identify the audience, purpose and text or speaking form required.',
              'Gather relevant ideas and arrange them in a logical beginning, middle and ending.',
              'Draft using accurate vocabulary, sentence structure and evidence from the model or source.',
              'Read aloud, revise meaning and organisation, then edit spelling and punctuation.'
            )
            WHEN 'science' THEN jsonb_build_array(
              'Turn the observation into a clear question and state a reasonable prediction.',
              'Choose safe materials or reliable sources and decide what evidence must be recorded.',
              'Observe or investigate systematically and record results without changing them.',
              'Use the evidence to explain the result, note limitations and suggest an improvement.'
            )
            ELSE jsonb_build_array(
              'State the intended digital result and identify the correct application, device or online service.',
              'Break the task into ordered steps and prepare the required information or data.',
              'Carry out each step carefully, checking the screen response before continuing.',
              'Review accuracy, save with a meaningful name and confirm privacy and safety settings.'
            )
          END;
          example_answer := 'A strong response follows the ordered method, uses the correct vocabulary for ' ||
            lower(topic_data ->> 'name') || ', checks the result and explains how the evidence or outcome meets the lesson objective.';
          misconception_text := CASE subject_data ->> 'key'
            WHEN 'mathematics' THEN 'Do not select an operation from a keyword alone. Read the full situation, identify the relationship between the quantities and check units before calculating.'
            WHEN 'english-language' THEN 'Longer writing is not automatically better writing. Relevance, organisation, accurate language and evidence are more important than repeating the same idea.'
            WHEN 'science' THEN 'A prediction is not a proven result. Conclusions must be based on observations, measurements or reliable evidence gathered during the investigation.'
            ELSE 'Being able to click through a task is not enough. A skilled digital learner understands the result of each action and protects files, accounts and personal information.'
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
              'order', 5,
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
              'order', 6,
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
              'estimatedMinutes',CASE WHEN lesson_variant = 1 THEN 25 ELSE 30 END,
              'baseXpReward',lesson_xp,'passingScore',70,'masteryScore',90,
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
                    'objectives',jsonb_build_array(lesson_objective),
                    'estimatedMinutes',CASE WHEN lesson_variant = 1 THEN 25 ELSE 30 END,
                    'rewardPreview',jsonb_build_object('xp',lesson_xp,'starsAvailable',3)
                  ),
                  jsonb_build_object(
                    'id',lesson_id || '-text','type','text','order',2,'required',true,'estimatedSeconds',300,
                    'heading','Connect to what you know',
                    'body',lesson_description || ' Before learning the new skill, list two things you already know about ' ||
                      lower(topic_data ->> 'name') || ' and one question you want the lesson to answer. ' ||
                      'The curriculum focus is ' || (topic_data ->> 'focus') || '. Look for connections between these ideas and experiences from school, home or the community.',
                    'emphasisTerms',jsonb_build_array(topic_data ->> 'name', strand_data ->> 'name')
                  ),
                  jsonb_build_object(
                    'id',lesson_id || '-explanation','type','text','order',3,'required',true,'estimatedSeconds',480,
                    'heading','Detailed explanation',
                    'body',lesson_teaching_text,
                    'emphasisTerms',jsonb_build_array(topic_data ->> 'standard', topic_data ->> 'name')
                  ),
                  jsonb_build_object(
                    'id',lesson_id || '-application','type','text','order',4,'required',true,'estimatedSeconds',240,
                    'heading','Use it in Ghana',
                    'body',lesson_application_text,
                    'emphasisTerms',jsonb_build_array('evidence','method','application')
                  )
                ) || media_blocks ||
                jsonb_build_array(
                  jsonb_build_object(
                    'id',lesson_id || '-worked-example','type','worked_example','order',7,'required',true,'estimatedSeconds',360,
                    'title','Guided practice',
                    'problem',example_problem,
                    'orderedSteps',example_steps,
                    'finalAnswer',example_answer,
                    'explanation','The method is useful because it separates planning, action, checking and explanation. Use the same structure when solving a new problem independently.'
                  ),
                  jsonb_build_object(
                    'id',lesson_id || '-misconception','type','tip','order',8,'required',true,'estimatedSeconds',90,
                    'title','Common mistake to avoid',
                    'body',misconception_text,
                    'tone','warning'
                  )
                ) || assessment_blocks ||
                jsonb_build_array(
                  jsonb_build_object(
                    'id',lesson_id || '-reflection','type','reflection','order',22,'required',false,'estimatedSeconds',90,
                    'prompt','Explain one idea you understand well, one question you would still ask, and one Ghanaian situation where you could use this learning.',
                    'responseType','short_text',
                    'optional',true
                  )
                ) ||
                jsonb_build_array(jsonb_build_object(
                  'id',lesson_id || '-summary','type','summary','order',25,'required',true,'estimatedSeconds',60,
                  'heading','Mission complete',
                  'keyPoints',jsonb_build_array(
                    'I can explain ' || lower(topic_data ->> 'name') || '.',
                    'I can apply the idea to a practical Ghanaian situation.',
                    'I can follow an ordered method and check my result.',
                    'I can support my answer with an example, method or evidence.',
                    'I can recognise and correct a common misconception.'
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
            'estimatedMinutes',CASE WHEN lesson_variant = 1 THEN 25 ELSE 30 END,
            'xp',lesson_xp,'questionCount',10,
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
  (
    SELECT coalesce(sum(coalesce((l."record" ->> 'questionCount')::integer, 0)), 0)
    FROM public."AdminLessonRecord" l
    WHERE l."createdBy" = u.id
  ) AS in_lesson_questions
FROM auth.users u
WHERE lower(btrim(coalesce(u.raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
  AND lower(coalesce(u.raw_app_meta_data ->> 'role', u.raw_user_meta_data ->> 'role', '')) IN ('teacher', 'admin');

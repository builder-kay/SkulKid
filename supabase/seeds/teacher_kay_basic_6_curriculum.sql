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
--   VIDEO-RICH lessons (≈90% watch time, ≈10% short tip text)
--   Real 10-question quizzes (MC + T/F) with distinct options per topic
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
  media_quiz_bank jsonb := $media_quiz_bank$
{"Counting, Representation, Cardinality and Ordinality":{"videos":[{"url":"https://www.youtube.com/watch?v=T5Qf0qSSJFI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=a4FXl4zb3E4","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=_BgblvF90UE","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"In 584,206, what is the value of the digit 5?","type":"multiple_choice","options":["500,000","5,000","50,000","5"],"correctIndex":0,"explanation":"The 5 is in the hundred-thousands place."},{"prompt":"Which number is a prime number?","type":"multiple_choice","options":["7","9","15","21"],"correctIndex":0,"explanation":"7 has exactly two factors: 1 and 7."},{"prompt":"What is a factor of 12?","type":"multiple_choice","options":["3","5","7","11"],"correctIndex":0,"explanation":"3 divides 12 exactly (12 ÷ 3 = 4)."},{"prompt":"Roman numeral X represents ten.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"X = 10 in Roman numerals."},{"prompt":"Which shows 4,205 in expanded form?","type":"multiple_choice","options":["4,000 + 200 + 5","4,000 + 20 + 5","400 + 200 + 5","4,000 + 205"],"correctIndex":0,"explanation":"Place values: thousands, hundreds, ones."},{"prompt":"A multiple of 6 is:","type":"multiple_choice","options":["18","16","14","20"],"correctIndex":0,"explanation":"6 × 3 = 18."},{"prompt":"The digit 0 in 305 means there are no tens.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"0 in the tens place means zero tens."},{"prompt":"Which number is greater?","type":"multiple_choice","options":["9,876","9,786","9,687","9,678"],"correctIndex":0,"explanation":"Compare thousands, then hundreds, then tens."},{"prompt":"Cardinality means:","type":"multiple_choice","options":["How many items are in a set","The colour of items","The shape of items","The weight of items"],"correctIndex":0,"explanation":"Cardinality is the count of a set."},{"prompt":"Which is the best way to compare two large numbers?","type":"multiple_choice","options":["Compare place values from left to right","Look only at the last digit","Add them together","Ignore zeros"],"correctIndex":0,"explanation":"Start with the highest place value."}]},"Number Operations and Fractions":{"videos":[{"url":"https://www.youtube.com/watch?v=CA9XLJpQp3c","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=RQ2nYUBVvqI","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=_BgblvF90UE","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"What is 3/4 + 1/4?","type":"multiple_choice","options":["1","1/2","2/4","4/8"],"correctIndex":0,"explanation":"Same denominators: 3/4 + 1/4 = 4/4 = 1."},{"prompt":"Which fraction equals 0.5?","type":"multiple_choice","options":["1/2","1/5","5/1","2/5"],"correctIndex":0,"explanation":"1 ÷ 2 = 0.5."},{"prompt":"25% as a fraction in simplest form is:","type":"multiple_choice","options":["1/4","25/10","2/5","1/25"],"correctIndex":0,"explanation":"25/100 = 1/4."},{"prompt":"Unlike fractions need a common denominator before adding.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Common denominators are required for addition/subtraction."},{"prompt":"A ratio of 2:3 means:","type":"multiple_choice","options":["2 parts to 3 parts","2 plus 3","2 times 3 only","3 minus 2"],"correctIndex":0,"explanation":"A ratio compares quantities in order."},{"prompt":"What is 1/2 of 10?","type":"multiple_choice","options":["5","2","8","12"],"correctIndex":0,"explanation":"Half of 10 is 5."},{"prompt":"Which is a decimal greater than 0.6?","type":"multiple_choice","options":["0.75","0.06","0.5","0.2"],"correctIndex":0,"explanation":"0.75 > 0.6."},{"prompt":"Multiplication reverses division.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"They are inverse operations."},{"prompt":"Simplify 6/8:","type":"multiple_choice","options":["3/4","6/4","2/8","8/6"],"correctIndex":0,"explanation":"Divide numerator and denominator by 2."},{"prompt":"If 2 pencils cost 4 cedis, how much for 6 pencils at the same rate?","type":"multiple_choice","options":["12 cedis","8 cedis","6 cedis","10 cedis"],"correctIndex":0,"explanation":"Unit rate 2 cedis each; 6 × 2 = 12."}]},"Patterns and Relationships":{"videos":[{"url":"https://www.youtube.com/watch?v=l3XzepN03KQ","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=RQ2nYUBVvqI","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=T5Qf0qSSJFI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"In 2, 5, 8, 11… what is the rule?","type":"multiple_choice","options":["Add 3 each time","Add 2","Multiply by 2","Subtract 3"],"correctIndex":0,"explanation":"Each term increases by 3."},{"prompt":"Next term after 3, 6, 12, 24 is:","type":"multiple_choice","options":["48","36","30","18"],"correctIndex":0,"explanation":"Each term doubles."},{"prompt":"A valid pattern rule must work for every shown term.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"The rule must fit the whole sequence."},{"prompt":"Term number 4 in 1, 4, 7, 10… is:","type":"multiple_choice","options":["10","13","7","4"],"correctIndex":0,"explanation":"Positions: 1→1, 2→4, 3→7, 4→10."},{"prompt":"A growing pattern:","type":"multiple_choice","options":["Increases following a rule","Never changes","Only uses colours","Has no order"],"correctIndex":0,"explanation":"Growing patterns change by a rule."},{"prompt":"Which sequence adds 5 each time?","type":"multiple_choice","options":["4, 9, 14, 19","5, 10, 20, 40","2, 4, 8, 16","9, 8, 7, 6"],"correctIndex":0,"explanation":"Differences of 5."},{"prompt":"Tables can help compare term numbers with term values.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Tables make pattern rules clearer."},{"prompt":"Missing number: 7, __, 15, 19 (add 4)","type":"multiple_choice","options":["11","12","10","14"],"correctIndex":0,"explanation":"7 + 4 = 11."},{"prompt":"Which describes a pattern rule best?","type":"multiple_choice","options":["How one term changes to the next","The colour of the page","The teacher’s name","The date only"],"correctIndex":0,"explanation":"Rules describe how terms change."},{"prompt":"Predict the 5th term of 10, 20, 30, 40…","type":"multiple_choice","options":["50","45","60","35"],"correctIndex":0,"explanation":"Add 10: next is 50."}]},"Expressions, Variables and Equations":{"videos":[{"url":"https://www.youtube.com/watch?v=l3XzepN03KQ","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=_BgblvF90UE","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=RQ2nYUBVvqI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"In 3x + 2, what is the variable?","type":"multiple_choice","options":["x","3","2","+"],"correctIndex":0,"explanation":"A variable is a letter representing a number."},{"prompt":"Solve: x + 5 = 12","type":"multiple_choice","options":["x = 7","x = 17","x = 5","x = 12"],"correctIndex":0,"explanation":"Subtract 5 from both sides."},{"prompt":"An expression has no equality sign.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Equations have = ; expressions do not."},{"prompt":"What is the coefficient of y in 4y?","type":"multiple_choice","options":["4","y","1","0"],"correctIndex":0,"explanation":"The coefficient multiplies the variable."},{"prompt":"Which is an equation?","type":"multiple_choice","options":["2n = 10","2n + 3","n + 1","5n"],"correctIndex":0,"explanation":"An equation states two sides are equal."},{"prompt":"If 2a = 8, then a =","type":"multiple_choice","options":["4","6","10","2"],"correctIndex":0,"explanation":"Divide both sides by 2."},{"prompt":"Solving keeps both sides of an equation balanced.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Use inverse operations equally on both sides."},{"prompt":"Which expression means '5 more than k'?","type":"multiple_choice","options":["k + 5","5k","k − 5","5 − k"],"correctIndex":0,"explanation":"More than means add."},{"prompt":"Evaluate 2x when x = 3","type":"multiple_choice","options":["6","5","23","9"],"correctIndex":0,"explanation":"2 × 3 = 6."},{"prompt":"Inverse of adding 9 is:","type":"multiple_choice","options":["Subtracting 9","Adding 9 again","Multiplying by 9","Dividing by 0"],"correctIndex":0,"explanation":"Addition and subtraction are inverses."}]},"2D and 3D Shapes":{"videos":[{"url":"https://www.youtube.com/watch?v=AAY1bsazcgM","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=xCdxURXMdFY","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=qJwecTgce6c","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"How many faces does a rectangular prism have?","type":"multiple_choice","options":["6","4","8","12"],"correctIndex":0,"explanation":"A rectangular prism has 6 rectangular faces."},{"prompt":"A triangular prism has how many triangular faces?","type":"multiple_choice","options":["2","3","1","6"],"correctIndex":0,"explanation":"Two congruent triangular bases."},{"prompt":"A prism has two congruent parallel faces.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Those faces are joined by rectangles/parallelograms."},{"prompt":"Edges are where:","type":"multiple_choice","options":["Two faces meet","Three solids melt","Colours mix","Numbers add"],"correctIndex":0,"explanation":"An edge is a line where faces meet."},{"prompt":"A net of a cube has how many squares?","type":"multiple_choice","options":["6","4","8","3"],"correctIndex":0,"explanation":"A cube has 6 square faces."},{"prompt":"2D shapes have:","type":"multiple_choice","options":["Length and width","Length, width and depth only as solids","No sides","Only volume"],"correctIndex":0,"explanation":"2D figures are flat."},{"prompt":"Vertices are the corners of a shape.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"A vertex is a corner point."},{"prompt":"Which solid is a prism?","type":"multiple_choice","options":["Triangular prism","Sphere","Cone only","Circle"],"correctIndex":0,"explanation":"Prisms have two parallel congruent bases."},{"prompt":"A cube is a special:","type":"multiple_choice","options":["Rectangular prism","Cylinder","Pyramid","Circle"],"correctIndex":0,"explanation":"All faces are equal squares."},{"prompt":"Count vertices of a rectangular prism:","type":"multiple_choice","options":["8","6","12","4"],"correctIndex":0,"explanation":"A box has 8 corners."}]},"Geometric Reasoning and Transformation":{"videos":[{"url":"https://www.youtube.com/watch?v=DGKwdHMiqCg","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=_n3KZR1DSEo","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=AAY1bsazcgM","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A translation:","type":"multiple_choice","options":["Slides a shape without turning it","Flips a shape","Shrinks a shape","Cuts a shape"],"correctIndex":0,"explanation":"Translation = slide."},{"prompt":"A reflection:","type":"multiple_choice","options":["Flips across a mirror line","Slides only","Changes side lengths","Adds a side"],"correctIndex":0,"explanation":"Reflection flips the figure."},{"prompt":"A rotation:","type":"multiple_choice","options":["Turns around a fixed centre","Only slides","Deletes vertices","Changes colour meaning"],"correctIndex":0,"explanation":"Rotation turns about a point."},{"prompt":"Translations, reflections and rotations keep side lengths and angles.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"These are rigid motions."},{"prompt":"North, south, east and west are:","type":"multiple_choice","options":["Cardinal directions","Fractions","Angles only","Volumes"],"correctIndex":0,"explanation":"Cardinal points describe position."},{"prompt":"If a shape moves 3 right and 2 up, that is a:","type":"multiple_choice","options":["Translation","Reflection","Rotation of 180 only","Resize"],"correctIndex":0,"explanation":"Same slide for every point."},{"prompt":"A mirror line is used in reflections.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"The mirror line is the line of reflection."},{"prompt":"Turning a shape 90° about a point is a:","type":"multiple_choice","options":["Rotation","Translation","Colour change","Perimeter"],"correctIndex":0,"explanation":"Turn = rotation."},{"prompt":"Which stays the same after a reflection?","type":"multiple_choice","options":["Side lengths","Facing direction always","Position always","Nothing"],"correctIndex":0,"explanation":"Size and shape are preserved."},{"prompt":"Coordinates help us:","type":"multiple_choice","options":["Describe exact positions","Measure temperature only","Name colours","Count money only"],"correctIndex":0,"explanation":"Coordinates locate points."}]},"Perimeter, Area and Volume":{"videos":[{"url":"https://www.youtube.com/watch?v=AAY1bsazcgM","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=xCdxURXMdFY","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=qJwecTgce6c","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Perimeter of a 5 cm by 3 cm rectangle is:","type":"multiple_choice","options":["16 cm","15 cm²","8 cm","15 cm"],"correctIndex":0,"explanation":"2(5+3)=16 cm."},{"prompt":"Area of a 4 cm by 6 cm rectangle is:","type":"multiple_choice","options":["24 cm²","20 cm","10 cm²","24 cm"],"correctIndex":0,"explanation":"4×6=24 square centimetres."},{"prompt":"Volume is measured in:","type":"multiple_choice","options":["Cubic units","Only litres always","Degrees","Seconds"],"correctIndex":0,"explanation":"Volume uses cubic units."},{"prompt":"Capacity describes how much a container can hold.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Capacity is related to volume of liquid."},{"prompt":"Perimeter is the:","type":"multiple_choice","options":["Distance around a shape","Space inside a solid","Weight of a shape","Colour outline"],"correctIndex":0,"explanation":"Perimeter = around."},{"prompt":"A cube with edge 2 cm has volume:","type":"multiple_choice","options":["8 cm³","6 cm³","4 cm²","12 cm"],"correctIndex":0,"explanation":"2×2×2=8."},{"prompt":"Area uses square units.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Area covers a surface."},{"prompt":"Which unit fits perimeter best?","type":"multiple_choice","options":["metres","square metres","cubic metres","kilograms"],"correctIndex":0,"explanation":"Perimeter is a length."},{"prompt":"A net helps you:","type":"multiple_choice","options":["See faces before folding a solid","Measure time","Find averages","Spell words"],"correctIndex":0,"explanation":"Nets flatten 3D faces."},{"prompt":"If area is 12 cm² and length is 4 cm, width is:","type":"multiple_choice","options":["3 cm","8 cm","16 cm","2 cm²"],"correctIndex":0,"explanation":"12÷4=3."}]},"Time and Angles":{"videos":[{"url":"https://www.youtube.com/watch?v=DGKwdHMiqCg","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=_n3KZR1DSEo","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=AAY1bsazcgM","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A right angle measures:","type":"multiple_choice","options":["90°","45°","180°","360°"],"correctIndex":0,"explanation":"Right angle = 90 degrees."},{"prompt":"An acute angle is:","type":"multiple_choice","options":["Less than 90°","Exactly 90°","More than 90° but less than 180°","Exactly 180°"],"correctIndex":0,"explanation":"Acute < 90°."},{"prompt":"A straight angle is:","type":"multiple_choice","options":["180°","90°","45°","270°"],"correctIndex":0,"explanation":"A straight line forms 180°."},{"prompt":"Elapsed time is the duration between start and finish.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"It is how long something lasts."},{"prompt":"From 2:15 to 3:00 is:","type":"multiple_choice","options":["45 minutes","15 minutes","1 hour 15 minutes","30 minutes"],"correctIndex":0,"explanation":"From :15 to :00 next hour is 45 minutes."},{"prompt":"An obtuse angle is:","type":"multiple_choice","options":["Between 90° and 180°","Less than 45°","Exactly 90°","More than 360°"],"correctIndex":0,"explanation":"Obtuse is greater than right but less than straight."},{"prompt":"24-hour time can help avoid am/pm mistakes.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"It labels hours from 00 to 23."},{"prompt":"Which tool measures angles?","type":"multiple_choice","options":["Protractor","Ruler only","Scale balance","Thermometer"],"correctIndex":0,"explanation":"Protractors measure degrees."},{"prompt":"Turning a full circle is:","type":"multiple_choice","options":["360°","180°","90°","100°"],"correctIndex":0,"explanation":"A full turn = 360°."},{"prompt":"If a film starts at 16:20 and lasts 40 minutes, it ends at:","type":"multiple_choice","options":["17:00","16:40","15:40","18:00"],"correctIndex":0,"explanation":"16:20 + 40 min = 17:00."}]},"Data Collection and Line Graphs":{"videos":[{"url":"https://www.youtube.com/watch?v=KzfWUEJjG18","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=RQ2nYUBVvqI","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=l3XzepN03KQ","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A line graph is best for showing:","type":"multiple_choice","options":["Change over time","Only favourite colours once","A single number","Random letters"],"correctIndex":0,"explanation":"Line graphs show trends over time."},{"prompt":"Axes on a graph should be:","type":"multiple_choice","options":["Clearly labelled","Blank","Different lengths randomly","Unscaled"],"correctIndex":0,"explanation":"Labels and scales make graphs readable."},{"prompt":"Conclusions should match the data shown.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Do not claim more than the graph supports."},{"prompt":"Equal spacing on a scale helps:","type":"multiple_choice","options":["Fair comparison","Hide data","Remove titles","Change colours only"],"correctIndex":0,"explanation":"Equal intervals keep the graph honest."},{"prompt":"Plotted points on a line graph are often:","type":"multiple_choice","options":["Joined by segments","Deleted","Multiplied","Turned into poems"],"correctIndex":0,"explanation":"Segments connect ordered points."},{"prompt":"Before collecting data, first:","type":"multiple_choice","options":["Ask a clear question","Draw a random graph","Guess a title only","Erase the scale"],"correctIndex":0,"explanation":"Data answers a stated question."},{"prompt":"A peak on a line graph shows a high value.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Peaks are local maxima."},{"prompt":"Which belongs on a rainfall line graph?","type":"multiple_choice","options":["Months and millimetres","Only student names","Shoe colours","Song lyrics"],"correctIndex":0,"explanation":"Choose related variables."},{"prompt":"If a graph is flat for several points, values:","type":"multiple_choice","options":["Stayed about the same","Doubled each time","Became negative only","Disappeared"],"correctIndex":0,"explanation":"Flat means little change."},{"prompt":"Tables help you:","type":"multiple_choice","options":["Organise data before graphing","Replace all numbers with guesses","Avoid labels","Skip the question"],"correctIndex":0,"explanation":"Tables prepare data for graphs."}]},"Chance and Probability":{"videos":[{"url":"https://www.youtube.com/watch?v=KzfWUEJjG18","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=RQ2nYUBVvqI","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=_BgblvF90UE","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Probability of a certain event is:","type":"multiple_choice","options":["1 (or 100%)","0","1/2 always","2"],"correctIndex":0,"explanation":"Certain means it must happen."},{"prompt":"An impossible event has probability:","type":"multiple_choice","options":["0","1","1/2","100%"],"correctIndex":0,"explanation":"Impossible cannot happen."},{"prompt":"A fair coin P(heads) is:","type":"multiple_choice","options":["1/2","1","0","2/3"],"correctIndex":0,"explanation":"Two equally likely outcomes."},{"prompt":"Experimental probability comes from trials.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"It is based on results of experiments."},{"prompt":"Likely means:","type":"multiple_choice","options":["More chance of happening than not","Impossible","Certain always","Never"],"correctIndex":0,"explanation":"Likely is probable but not certain."},{"prompt":"Outcomes of a fair six-sided die are:","type":"multiple_choice","options":["1 to 6","Only even numbers","0 to 10","A and B"],"correctIndex":0,"explanation":"Standard die faces 1–6."},{"prompt":"Theoretical probability compares favourable outcomes to all equally likely outcomes.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"That is the classic definition."},{"prompt":"P(rolling a 4 on a fair die) is:","type":"multiple_choice","options":["1/6","1/4","4/6","1"],"correctIndex":0,"explanation":"One favourable face out of six."},{"prompt":"Equally likely means:","type":"multiple_choice","options":["Same chance","Different chance","Zero chance","Guaranteed"],"correctIndex":0,"explanation":"Each outcome has the same probability."},{"prompt":"In a bag with 3 red and 1 blue marble, P(red) is:","type":"multiple_choice","options":["3/4","1/4","1/3","3/1"],"correctIndex":0,"explanation":"3 red out of 4 marbles."}]},"Storytelling, Drama and Conversation":{"videos":[{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=saF3-f0XWAY","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=ENIB2H3S_oQ","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A story’s resolution is:","type":"multiple_choice","options":["How the problem is settled","Only the first sentence","The cover colour","A list of nouns"],"correctIndex":0,"explanation":"Resolution closes the conflict."},{"prompt":"Drama uses:","type":"multiple_choice","options":["Dialogue, gesture and movement","Only silent reading","Math formulas","Spreadsheets"],"correctIndex":0,"explanation":"Drama performs the story."},{"prompt":"Good conversation includes listening and taking turns.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Turn-taking keeps talk fair."},{"prompt":"Setting means:","type":"multiple_choice","options":["Where and when the story happens","Only the hero’s name","The quiz score","The font size"],"correctIndex":0,"explanation":"Setting is time and place."},{"prompt":"Characters are:","type":"multiple_choice","options":["People or beings in the story","Only punctuation marks","Page numbers","Chapter titles only"],"correctIndex":0,"explanation":"Characters act in the plot."},{"prompt":"Role play helps learners:","type":"multiple_choice","options":["Practise speaking in a situation","Avoid all speaking","Skip listening","Delete dialogue"],"correctIndex":0,"explanation":"Role play builds oral skills."},{"prompt":"A clear beginning, middle and end help a story.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Structure supports understanding."},{"prompt":"Stage directions tell actors:","type":"multiple_choice","options":["How to move or speak","Math answers","Weather only","Prices"],"correctIndex":0,"explanation":"They guide performance."},{"prompt":"Adjusting language to audience means:","type":"multiple_choice","options":["Choosing words that fit the listener","Shouting always","Using only slang","Ignoring the listener"],"correctIndex":0,"explanation":"Purpose and relationship matter."},{"prompt":"Tension in a story is:","type":"multiple_choice","options":["The problem or conflict","The blank page","The dictionary","The margin"],"correctIndex":0,"explanation":"Conflict creates interest."}]},"Listening, Questions and Presentation":{"videos":[{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=8jPQjjsBbIc","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=ENIB2H3S_oQ","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Active listening includes:","type":"multiple_choice","options":["Finding the main idea and details","Ignoring the speaker","Only watching the clock","Interrupting often"],"correctIndex":0,"explanation":"Listeners track meaning."},{"prompt":"A clarifying question:","type":"multiple_choice","options":["Asks for clearer information","Insults the speaker","Changes the topic randomly","Ends the talk always"],"correctIndex":0,"explanation":"Clarifying reduces confusion."},{"prompt":"A presentation needs a clear opening and ending.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Structure helps the audience."},{"prompt":"Supporting details:","type":"multiple_choice","options":["Explain or prove the main idea","Replace the main idea with noise","Are always jokes","Must be unrelated"],"correctIndex":0,"explanation":"Details back up the point."},{"prompt":"Eye contact in a talk helps:","type":"multiple_choice","options":["Connect with the audience","Hide the message","Skip preparation","Remove examples"],"correctIndex":0,"explanation":"It shows engagement."},{"prompt":"Sequence means:","type":"multiple_choice","options":["The order of events or ideas","A random mix","Only volume","Only speed"],"correctIndex":0,"explanation":"Order matters in listening."},{"prompt":"Useful questions can explore reasons respectfully.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Questioning can deepen talk."},{"prompt":"Transitions in a speech:","type":"multiple_choice","options":["Link one idea to the next","Delete all ideas","Confuse on purpose","Remove evidence"],"correctIndex":0,"explanation":"Transitions guide listeners."},{"prompt":"Implied meaning is:","type":"multiple_choice","options":["Suggested but not stated directly","Printed in bold always","Impossible to notice","Only numbers"],"correctIndex":0,"explanation":"Listeners infer."},{"prompt":"A good visual in a presentation should:","type":"multiple_choice","options":["Support the spoken point","Distract with tiny text","Replace all speaking","Be unrelated"],"correctIndex":0,"explanation":"Visuals teach, not decorate."}]},"Word Study and Vocabulary":{"videos":[{"url":"https://www.youtube.com/watch?v=saF3-f0XWAY","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=cetrtFDN2Zg","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A digraph is:","type":"multiple_choice","options":["Two letters that make one sound","Three paragraphs","A full stop","A novel"],"correctIndex":0,"explanation":"e.g. sh, ch, th."},{"prompt":"Minimal pairs differ by:","type":"multiple_choice","options":["One sound","Every letter","Only meaning never sound","Page count"],"correctIndex":0,"explanation":"e.g. ship/sheep."},{"prompt":"Context clues help guess a word’s meaning.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Nearby words give hints."},{"prompt":"A prefix is added:","type":"multiple_choice","options":["At the beginning of a word","Only at the end","In the middle only","Never"],"correctIndex":0,"explanation":"un- in unhappy."},{"prompt":"A suffix is added:","type":"multiple_choice","options":["At the end of a word","Only at the start","Before every sentence","To numbers only"],"correctIndex":0,"explanation":"-ful in helpful."},{"prompt":"Syllables are:","type":"multiple_choice","options":["Beats or parts in a word","Full stops","Chapters","Fonts"],"correctIndex":0,"explanation":"ta-ble has two syllables."},{"prompt":"Synonyms are words with similar meanings.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"e.g. happy/glad."},{"prompt":"Blends are:","type":"multiple_choice","options":["Letter groups where each sound is heard","Silent paragraphs","Only vowels","Book titles"],"correctIndex":0,"explanation":"e.g. bl, st, cr."},{"prompt":"A root/base helps you:","type":"multiple_choice","options":["Build related word meanings","Ignore spelling","Skip reading","Delete vowels"],"correctIndex":0,"explanation":"Morphology unlocks vocabulary."},{"prompt":"Best check for a new word meaning:","type":"multiple_choice","options":["Try it in the sentence and use a dictionary if needed","Guess wildly forever","Skip the word always","Change the story"],"correctIndex":0,"explanation":"Verify in context."}]},"Comprehension and Fluency":{"videos":[{"url":"https://www.youtube.com/watch?v=saF3-f0XWAY","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=cetrtFDN2Zg","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Inference means:","type":"multiple_choice","options":["Using clues to understand unstated ideas","Copying every word","Skipping the text","Counting pages only"],"correctIndex":0,"explanation":"Read between the lines."},{"prompt":"A summary should:","type":"multiple_choice","options":["Restate main ideas briefly in your own words","Copy the whole text","Add unrelated facts","List every adjective"],"correctIndex":0,"explanation":"Brief and central."},{"prompt":"Fluent reading is accurate, paced and expressive.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Fluency supports comprehension."},{"prompt":"Author’s purpose might be:","type":"multiple_choice","options":["To inform, persuade or entertain","Only to confuse","Only to number pages","Only to hide meaning"],"correctIndex":0,"explanation":"Purpose shapes the text."},{"prompt":"Retrieving a stated fact is:","type":"multiple_choice","options":["Finding information written in the text","Inventing a new ending","Ignoring evidence","Guessing with no text"],"correctIndex":0,"explanation":"Literal comprehension."},{"prompt":"Comparing viewpoints means:","type":"multiple_choice","options":["Noticing how ideas differ","Reading only titles","Skipping dialogue","Counting commas"],"correctIndex":0,"explanation":"Multiple perspectives."},{"prompt":"Silent reading can still be thoughtful and careful.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Comprehension does not require reading aloud."},{"prompt":"Evidence in a text is:","type":"multiple_choice","options":["Details that support an idea","Random drawings only","The margin colour","The book price"],"correctIndex":0,"explanation":"Support claims with text."},{"prompt":"Evaluating a text includes:","type":"multiple_choice","options":["Judging how well ideas are supported","Ignoring all reasons","Reading only the last word","Closing the book early always"],"correctIndex":0,"explanation":"Critical reading."},{"prompt":"Pace that is too fast can:","type":"multiple_choice","options":["Hurt understanding","Always improve meaning","Create more evidence","Fix spelling"],"correctIndex":0,"explanation":"Balance speed and sense."}]},"Word Classes":{"videos":[{"url":"https://www.youtube.com/watch?v=saF3-f0XWAY","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=cetrtFDN2Zg","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A noun names:","type":"multiple_choice","options":["A person, place, thing or idea","Only an action","Only how something is done","Only a joining word"],"correctIndex":0,"explanation":"Nouns name."},{"prompt":"A verb often shows:","type":"multiple_choice","options":["An action or state","Only a colour","Only a comma","Only a title"],"correctIndex":0,"explanation":"Verbs are doing/being words."},{"prompt":"An adjective:","type":"multiple_choice","options":["Describes a noun","Joins sentences only","Names a person only","Shows time only"],"correctIndex":0,"explanation":"e.g. bright sun."},{"prompt":"An adverb can tell how, when or where.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Adverbs modify verbs and more."},{"prompt":"A pronoun replaces:","type":"multiple_choice","options":["A noun","A full stop","A paragraph","A book"],"correctIndex":0,"explanation":"he, she, it, they…"},{"prompt":"A conjunction:","type":"multiple_choice","options":["Connects words or ideas","Describes nouns only","Names places only","Shows possession only"],"correctIndex":0,"explanation":"and, but, because…"},{"prompt":"A word’s class depends on how it is used in a sentence.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Function matters."},{"prompt":"Determiners like 'the' and 'a':","type":"multiple_choice","options":["Introduce or limit nouns","Are always verbs","Are always adverbs","Replace full stops"],"correctIndex":0,"explanation":"Articles are determiners."},{"prompt":"Prepositions show:","type":"multiple_choice","options":["Relationships (in, on, under)","Only shouting","Only plurals","Only tense"],"correctIndex":0,"explanation":"Place/time relations."},{"prompt":"Which sentence uses an adjective?","type":"multiple_choice","options":["The tall tree swayed.","She ran.","And then.","Under."],"correctIndex":0,"explanation":"tall describes tree."}]},"Phrases and Reported Speech":{"videos":[{"url":"https://www.youtube.com/watch?v=cetrtFDN2Zg","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=saF3-f0XWAY","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A phrase is:","type":"multiple_choice","options":["A group of words without a full subject-predicate","Always a complete sentence","Only one letter","A chapter"],"correctIndex":0,"explanation":"Phrases are not full clauses."},{"prompt":"An adjective phrase adds information about:","type":"multiple_choice","options":["A noun","Only a verb tense","Only a number","Only a title page"],"correctIndex":0,"explanation":"It modifies a noun."},{"prompt":"Direct speech uses:","type":"multiple_choice","options":["Quotation marks for exact words","No punctuation ever","Only brackets","Only commas forever"],"correctIndex":0,"explanation":"Quote the exact words."},{"prompt":"Reported speech retells a message and may change pronouns and tense.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"It is indirect speech."},{"prompt":"Change to reported: Ama said, \"I am tired.\"","type":"multiple_choice","options":["Ama said that she was tired.","Ama said that I am tired always.","Ama said tired.","Ama shouted numbers."],"correctIndex":0,"explanation":"Pronoun and tense shift."},{"prompt":"An adverb phrase may tell:","type":"multiple_choice","options":["How, when, where or why","Only a person’s name","Only a book title","Only a fraction"],"correctIndex":0,"explanation":"It modifies like an adverb."},{"prompt":"Reported speech usually drops quotation marks.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"It paraphrases."},{"prompt":"Which is a phrase, not a full sentence?","type":"multiple_choice","options":["under the big table","She sat.","They ran home.","I agree."],"correctIndex":0,"explanation":"No finite verb clause."},{"prompt":"Time words may change in reported speech, e.g. today →","type":"multiple_choice","options":["that day","tomorrow always","never","page two"],"correctIndex":0,"explanation":"Deictic words shift."},{"prompt":"Best reason to use reported speech:","type":"multiple_choice","options":["To retell what someone said","To draw a graph","To measure volume","To code a game"],"correctIndex":0,"explanation":"Retelling messages."}]},"Planning and Paragraph Development":{"videos":[{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=saF3-f0XWAY","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A topic sentence usually:","type":"multiple_choice","options":["States the paragraph’s main idea","Lists random words","Ends the book","Shows only punctuation"],"correctIndex":0,"explanation":"It controls the paragraph."},{"prompt":"Supporting sentences should:","type":"multiple_choice","options":["Explain or prove the main idea","Change the topic completely","Ignore examples","Repeat only the title"],"correctIndex":0,"explanation":"They develop the idea."},{"prompt":"Revising improves meaning and organisation before final editing.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Revise then edit."},{"prompt":"Cohesion means:","type":"multiple_choice","options":["Ideas connect smoothly","Words are randomly spaced","Margins are colourful","Fonts change every line"],"correctIndex":0,"explanation":"Linked ideas."},{"prompt":"Publishing means:","type":"multiple_choice","options":["Sharing the finished writing with readers","Deleting the draft","Skipping planning","Writing only one word"],"correctIndex":0,"explanation":"Audience receives it."},{"prompt":"Planning helps writers:","type":"multiple_choice","options":["Organise ideas before drafting","Avoid all thinking","Skip evidence","Remove purpose"],"correctIndex":0,"explanation":"Plan → draft → revise."},{"prompt":"A paragraph should develop one controlling idea.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Unity matters."},{"prompt":"A concluding sentence can:","type":"multiple_choice","options":["Close or link the idea","Introduce a new unrelated topic always","Delete evidence","Hide the main idea"],"correctIndex":0,"explanation":"It wraps up."},{"prompt":"Audience means:","type":"multiple_choice","options":["Who will read or hear the text","Only the dictionary","Only the stapler","Only the desk"],"correctIndex":0,"explanation":"Write for readers."},{"prompt":"Editing focuses on:","type":"multiple_choice","options":["Conventions like spelling and punctuation","Only inventing a new plot always","Deleting the purpose","Ignoring sentences"],"correctIndex":0,"explanation":"Surface accuracy."}]},"Creative and Functional Writing":{"videos":[{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=cetrtFDN2Zg","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Narrative writing mainly:","type":"multiple_choice","options":["Tells a story with events and characters","Only lists prices","Only draws graphs","Only codes apps"],"correctIndex":0,"explanation":"Narratives tell stories."},{"prompt":"Persuasive writing:","type":"multiple_choice","options":["Argues a position with reasons","Never gives reasons","Only describes weather silently","Only copies poems"],"correctIndex":0,"explanation":"Persuade with evidence."},{"prompt":"Descriptive writing uses:","type":"multiple_choice","options":["Precise sensory details","No details","Only numbers","Only commands"],"correctIndex":0,"explanation":"Show with senses."},{"prompt":"Letters should match formal or informal purpose.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Tone fits audience."},{"prompt":"Expository writing:","type":"multiple_choice","options":["Explains information clearly","Hides all facts","Only entertains with jokes","Only lists emojis"],"correctIndex":0,"explanation":"Explain to inform."},{"prompt":"Before writing, choose:","type":"multiple_choice","options":["Audience, purpose and genre","Only a random font","Only the longest words","Only the title colour"],"correctIndex":0,"explanation":"Purpose guides form."},{"prompt":"Editing improves accuracy after ideas are clear.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Meaning first, then conventions."},{"prompt":"A formal letter is more likely to use:","type":"multiple_choice","options":["Polite and clear language","Only slang","No greeting ever","Only drawings"],"correctIndex":0,"explanation":"Formal tone."},{"prompt":"Genre features help readers:","type":"multiple_choice","options":["Recognise the type of text","Forget the purpose","Skip structure","Remove evidence"],"correctIndex":0,"explanation":"Conventions signal genre."},{"prompt":"A strong persuasive reason is:","type":"multiple_choice","options":["Supported with evidence","Always an insult","Unrelated to the claim","Hidden completely"],"correctIndex":0,"explanation":"Reasons need support."}]},"Capitalisation, Punctuation and Spelling":{"videos":[{"url":"https://www.youtube.com/watch?v=saF3-f0XWAY","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=cetrtFDN2Zg","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Sentences should begin with:","type":"multiple_choice","options":["A capital letter","A comma","A question mark only","A lowercase letter always"],"correctIndex":0,"explanation":"Capitals start sentences."},{"prompt":"A question ends with:","type":"multiple_choice","options":["A question mark","A full stop only","An apostrophe","A colon only"],"correctIndex":0,"explanation":"? closes questions."},{"prompt":"Apostrophes can show:","type":"multiple_choice","options":["Possession or missing letters","Only plurals always","Only volume","Only colour"],"correctIndex":0,"explanation":"e.g. Ama’s / can’t."},{"prompt":"Proper nouns need capital letters.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Names of people/places."},{"prompt":"Commas can:","type":"multiple_choice","options":["Separate items in a list","End every sentence","Replace all verbs","Delete nouns"],"correctIndex":0,"explanation":"List separation."},{"prompt":"Quotation marks enclose:","type":"multiple_choice","options":["Direct speech","Only silent letters","Only page numbers","Only titles of graphs"],"correctIndex":0,"explanation":"Exact spoken words."},{"prompt":"Proofreading helps catch spelling mistakes.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Check carefully."},{"prompt":"A full stop (period) usually:","type":"multiple_choice","options":["Ends a statement","Starts a question","Shows possession","Joins clauses like and"],"correctIndex":0,"explanation":"Declarative end."},{"prompt":"A spelling strategy is:","type":"multiple_choice","options":["Break words into syllables","Guess forever without checking","Ignore patterns","Skip reading"],"correctIndex":0,"explanation":"Syllables and patterns help."},{"prompt":"Which is capitalised correctly?","type":"multiple_choice","options":["Accra is in Ghana.","accra is in ghana.","Accra Is In ghana.","accra Is In Ghana."],"correctIndex":0,"explanation":"Sentence start + proper nouns."}]},"Independent and Critical Reading":{"videos":[{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=saF3-f0XWAY","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Critical readers:","type":"multiple_choice","options":["Check evidence and purpose","Believe every sentence blindly","Skip all details","Only count pages"],"correctIndex":0,"explanation":"Evaluate claims."},{"prompt":"Fact differs from opinion because:","type":"multiple_choice","options":["Facts can be checked; opinions are judgments","Opinions are always true","Facts are feelings","Neither can be discussed"],"correctIndex":0,"explanation":"Verifiability."},{"prompt":"A book response can include a recommendation with reasons.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Support your advice."},{"prompt":"Author’s bias means:","type":"multiple_choice","options":["A leaning that may shape the message","A page number","A font choice only","A library stamp"],"correctIndex":0,"explanation":"Perspective influences writing."},{"prompt":"Choosing a suitable text means:","type":"multiple_choice","options":["Matching level and interest","Picking the thickest book always","Avoiding all new words","Reading only titles forever"],"correctIndex":0,"explanation":"Fit matters."},{"prompt":"A response journal helps you:","type":"multiple_choice","options":["Track thoughts while reading","Delete the story","Skip characters","Ignore criteria"],"correctIndex":0,"explanation":"Reflect in writing."},{"prompt":"Summaries should stay brief and accurate.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"No extra unrelated detail."},{"prompt":"Criteria for a critique should be:","type":"multiple_choice","options":["Agreed and clear","Secret and random","Only about cover colour","Impossible to use"],"correctIndex":0,"explanation":"Fair standards."},{"prompt":"Wide reading helps:","type":"multiple_choice","options":["Build knowledge and stamina","Reduce vocabulary always","Remove curiosity","Avoid ideas"],"correctIndex":0,"explanation":"More reading, more growth."},{"prompt":"When evidence is weak, a critical reader:","type":"multiple_choice","options":["Notices and questions it","Ignores the problem","Stops thinking","Changes fonts"],"correctIndex":0,"explanation":"Question weak support."}]},"Living and Non-Living Things":{"videos":[{"url":"https://www.youtube.com/watch?v=TD60-3rqPXg","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=mRidGna-V4E","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=4IsX86zjCKo","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Living things typically:","type":"multiple_choice","options":["Grow, need energy and reproduce","Never change","Have no needs","Are only rocks"],"correctIndex":0,"explanation":"Life processes."},{"prompt":"A taproot system has:","type":"multiple_choice","options":["One main root with branches","Only leaves","No roots","Only flowers"],"correctIndex":0,"explanation":"e.g. carrot-like root."},{"prompt":"Fibrous roots are:","type":"multiple_choice","options":["Many similar-sized roots","One huge wooden stem","Only petals","Only seeds"],"correctIndex":0,"explanation":"Grass-like roots."},{"prompt":"Roots help anchor plants and absorb water.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Anchorage + absorption."},{"prompt":"Plants can be classified using:","type":"multiple_choice","options":["Observable features","Invisible magic only","Page numbers","Random colours of books"],"correctIndex":0,"explanation":"Use evidence you can see."},{"prompt":"Which is non-living?","type":"multiple_choice","options":["Rock","Tree","Fish","Bird"],"correctIndex":0,"explanation":"Rocks do not carry out life processes."},{"prompt":"Leaves help many plants capture light for food-making.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Photosynthesis needs light."},{"prompt":"Reproduction helps a species:","type":"multiple_choice","options":["Continue over time","Stop existing","Become non-living","Lose all roots"],"correctIndex":0,"explanation":"Continuity of life."},{"prompt":"Which is a life process?","type":"multiple_choice","options":["Respiration","Rusting of iron only","Melting ice only","Erosion only"],"correctIndex":0,"explanation":"Living organisms respire."},{"prompt":"Observable plant structures include:","type":"multiple_choice","options":["Roots, stems, leaves, flowers","Only Wi-Fi signals","Only passwords","Only apps"],"correctIndex":0,"explanation":"Visible plant parts."}]},"Materials":{"videos":[{"url":"https://www.youtube.com/watch?v=R-Iak3Wvh9c","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=4IsX86zjCKo","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=TD60-3rqPXg","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A mixture:","type":"multiple_choice","options":["Combines substances that keep many of their properties","Always creates a new element","Destroys all properties","Is only a gas"],"correctIndex":0,"explanation":"Physical combination."},{"prompt":"A solution forms when:","type":"multiple_choice","options":["A solute dissolves in a solvent","Two solids never meet","Ice is carved","Paper is folded"],"correctIndex":0,"explanation":"Dissolving."},{"prompt":"Filtration separates:","type":"multiple_choice","options":["An insoluble solid from a liquid","Two dissolved gases only by colour","Only magnets","Only light"],"correctIndex":0,"explanation":"Filter traps solid."},{"prompt":"Evaporation can recover a dissolved solid.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Water leaves; solid remains."},{"prompt":"Sieving uses differences in:","type":"multiple_choice","options":["Particle size","Smell only","Sound only","Price only"],"correctIndex":0,"explanation":"Mesh size matters."},{"prompt":"A magnet can separate:","type":"multiple_choice","options":["Magnetic materials from non-magnetic ones","All liquids forever","Only colours","Only temperatures"],"correctIndex":0,"explanation":"Magnetic attraction."},{"prompt":"Decanting uses settling then pouring.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Careful pouring after sediment settles."},{"prompt":"Salt water is an example of a:","type":"multiple_choice","options":["Solution","Plant","Animal","Rock cycle stage only"],"correctIndex":0,"explanation":"Salt dissolved in water."},{"prompt":"Which property helps choose a separation method?","type":"multiple_choice","options":["Solubility, size or magnetism","Favourite song","Font size","Shoe size"],"correctIndex":0,"explanation":"Match method to property."},{"prompt":"Sand and water can be separated by:","type":"multiple_choice","options":["Filtration","Only photosynthesis","Only voting","Only coding"],"correctIndex":0,"explanation":"Sand is insoluble."}]},"Earth Science":{"videos":[{"url":"https://www.youtube.com/watch?v=ncORPosDrjI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=IO9tT186mZw","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=R-Iak3Wvh9c","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Weathering helps turn rock into:","type":"multiple_choice","options":["Smaller pieces that can form soil","Instant animals","Only clouds","Only metal apps"],"correctIndex":0,"explanation":"Rocks break down."},{"prompt":"Soil can contain:","type":"multiple_choice","options":["Minerals, organic matter, water and air","Only plastic toys","Only Wi-Fi","Only glass"],"correctIndex":0,"explanation":"Soil is a mixture."},{"prompt":"Evaporation is when water:","type":"multiple_choice","options":["Changes to vapour","Freezes solid only","Becomes rock","Turns into soil"],"correctIndex":0,"explanation":"Liquid → gas."},{"prompt":"Condensation forms tiny droplets that can make clouds.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Vapour cools to liquid."},{"prompt":"Precipitation includes:","type":"multiple_choice","options":["Rain, hail or snow","Only sunlight","Only wind direction names","Only soil colour"],"correctIndex":0,"explanation":"Water falling from clouds."},{"prompt":"Weather observations may include:","type":"multiple_choice","options":["Temperature, wind, cloud and rain","Only book titles","Only quiz scores","Only app icons"],"correctIndex":0,"explanation":"Measurable weather data."},{"prompt":"Climate describes longer-term patterns than daily weather.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Climate is longer-term."},{"prompt":"Runoff is water that:","type":"multiple_choice","options":["Flows over land","Stays only underground forever","Never moves","Becomes a planet"],"correctIndex":0,"explanation":"Surface flow."},{"prompt":"Infiltration is water:","type":"multiple_choice","options":["Soaking into the ground","Flying to the moon","Turning into metal","Becoming a root"],"correctIndex":0,"explanation":"Into soil."},{"prompt":"Earth processes are best studied with:","type":"multiple_choice","options":["Observations and models","Guesses only","Ignoring evidence","Closed eyes only"],"correctIndex":0,"explanation":"Science uses evidence."}]},"Life Cycles of Organisms":{"videos":[{"url":"https://www.youtube.com/watch?v=TD60-3rqPXg","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=mRidGna-V4E","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=MuKs9o1s8h8","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A life cycle shows:","type":"multiple_choice","options":["Stages of growth and reproduction","Only one frozen moment","Only weather","Only rocks"],"correctIndex":0,"explanation":"Life stages over time."},{"prompt":"Flowering plant sequence includes:","type":"multiple_choice","options":["Seed → plant → flower → fruit/seed","Rock → metal → plastic","Cloud → star → phone","Quiz → badge → app"],"correctIndex":0,"explanation":"Plant reproduction cycle."},{"prompt":"Pollination helps:","type":"multiple_choice","options":["Transfer pollen for fertilisation","Make soil magnetic","Stop growth forever","Create electricity"],"correctIndex":0,"explanation":"Needed for seeds in many plants."},{"prompt":"Some animals develop through metamorphosis.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"e.g. butterfly stages."},{"prompt":"Metamorphosis means:","type":"multiple_choice","options":["A big change in body form during development","Staying identical forever","Only learning math","Only hibernating rocks"],"correctIndex":0,"explanation":"Form changes."},{"prompt":"Reproduction’s main role is:","type":"multiple_choice","options":["Continuing the species","Stopping all life","Creating weather only","Making graphs"],"correctIndex":0,"explanation":"Species continuity."},{"prompt":"Not all animals have the same life-cycle stages.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Stages differ by organism."},{"prompt":"Germination is when a seed:","type":"multiple_choice","options":["Begins to grow into a seedling","Turns into a cloud","Becomes a fossil instantly","Melts into glass"],"correctIndex":0,"explanation":"Seed growth starts."},{"prompt":"Comparing life cycles helps us:","type":"multiple_choice","options":["See similarities and differences","Erase science","Avoid observation","Skip diagrams"],"correctIndex":0,"explanation":"Compare evidence."},{"prompt":"A frog’s young stage is often called a:","type":"multiple_choice","options":["Tadpole","Cub","Chick only","Calf only"],"correctIndex":0,"explanation":"Tadpoles are larval frogs."}]},"Human Body Systems":{"videos":[{"url":"https://www.youtube.com/watch?v=4IsX86zjCKo","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=mRidGna-V4E","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=ENIB2H3S_oQ","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Excretion removes:","type":"multiple_choice","options":["Metabolic wastes","Only undigested fun facts","Only happiness","Only sunlight"],"correctIndex":0,"explanation":"Waste from cells."},{"prompt":"Kidneys mainly:","type":"multiple_choice","options":["Filter blood and help form urine","Pump oxygen like lungs only","Digest food only","Store memories"],"correctIndex":0,"explanation":"Urinary filtration."},{"prompt":"Urine travels from kidneys to the bladder through:","type":"multiple_choice","options":["Ureters","Windpipes only","Bones","Hair"],"correctIndex":0,"explanation":"Ureters connect."},{"prompt":"Lungs remove carbon dioxide and some water vapour.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Gas exchange waste removal."},{"prompt":"Skin can release:","type":"multiple_choice","options":["Sweat","Only bone marrow","Only bile into air","Only urine into lungs"],"correctIndex":0,"explanation":"Sweating."},{"prompt":"Healthy habits for these organs include:","type":"multiple_choice","options":["Hydration and hygiene","Never drinking water","Ignoring cleanliness","Holding breath forever"],"correctIndex":0,"explanation":"Support body systems."},{"prompt":"The bladder stores urine before it leaves the body.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Temporary storage."},{"prompt":"Which organ pair is most linked to excretion of urea?","type":"multiple_choice","options":["Kidneys","Ears","Eyebrows","Toenails only"],"correctIndex":0,"explanation":"Kidneys filter urea."},{"prompt":"The urethra is the tube that:","type":"multiple_choice","options":["Lets urine exit the body","Carries food to the stomach","Sends signals to the brain only","Pumps blood"],"correctIndex":0,"explanation":"Exit pathway."},{"prompt":"Why is excretion important?","type":"multiple_choice","options":["Waste can harm the body if it builds up","It makes more waste on purpose","It stops breathing","It deletes bones"],"correctIndex":0,"explanation":"Balance and health."}]},"Solar Systems and Ecosystems":{"videos":[{"url":"https://www.youtube.com/watch?v=libKVRa01L8","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=w36yxLgwUOc","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=Vtb3I8Vzlfg","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"The centre of our solar system is the:","type":"multiple_choice","options":["Sun","Moon","Earth only","Mars only"],"correctIndex":0,"explanation":"Planets orbit the Sun."},{"prompt":"Earth’s rotation mainly causes:","type":"multiple_choice","options":["Day and night","Only seasons alone","Ocean salt","Mountain names"],"correctIndex":0,"explanation":"Spin → day/night."},{"prompt":"Producers in an ecosystem:","type":"multiple_choice","options":["Make food using energy (often sunlight)","Only eat animals","Only decompose plastic","Only create wind"],"correctIndex":0,"explanation":"Plants/algae produce."},{"prompt":"Food chains show how energy moves between organisms.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Feeding relationships."},{"prompt":"Decomposers help by:","type":"multiple_choice","options":["Recycling materials from dead matter","Stopping all decay","Eating only sunlight","Removing gravity"],"correctIndex":0,"explanation":"Nutrient recycling."},{"prompt":"Interdependence means organisms:","type":"multiple_choice","options":["Rely on one another","Never interact","Live without needs","Avoid ecosystems"],"correctIndex":0,"explanation":"Connected living systems."},{"prompt":"Gravity helps hold planets in orbit around the Sun.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Orbital force."},{"prompt":"A consumer gets energy by:","type":"multiple_choice","options":["Eating other organisms","Only creating sunlight","Only making rocks","Only coding"],"correctIndex":0,"explanation":"Feeding."},{"prompt":"Moons orbit:","type":"multiple_choice","options":["Planets","Only comets forever","Only clouds","Only apps"],"correctIndex":0,"explanation":"Natural satellites."},{"prompt":"A food web is:","type":"multiple_choice","options":["Many linked food chains","A single meal recipe only","A weather map","A spelling list"],"correctIndex":0,"explanation":"Complex feeding links."}]},"Sources and Forms of Energy":{"videos":[{"url":"https://www.youtube.com/watch?v=7K4V0NvUxRg","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=PLBK1ux5b7U","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=oB1v-wh7EGU","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Energy enables:","type":"multiple_choice","options":["Change to happen","Objects to ignore forces forever","Time to stop","Mass to vanish always"],"correctIndex":0,"explanation":"Energy related to change."},{"prompt":"A renewable source is:","type":"multiple_choice","options":["Sunlight","Coal formed over millions of years used up quickly","Petrol only","Diesel only"],"correctIndex":0,"explanation":"Naturally replenished."},{"prompt":"Fossil fuels are generally:","type":"multiple_choice","options":["Non-renewable on human timescales","Made daily by rain","Infinite instantly","Only made by windmills"],"correctIndex":0,"explanation":"They take geologic time."},{"prompt":"Energy can change form, such as chemical to electrical.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Energy transformations."},{"prompt":"Which is a form of energy?","type":"multiple_choice","options":["Light","A desk","A pencil case","A shoe"],"correctIndex":0,"explanation":"Light is an energy form."},{"prompt":"Heat spreading to surroundings is:","type":"multiple_choice","options":["Energy transfer to the environment","Creating new mass","Deleting energy laws","Stopping motion forever always"],"correctIndex":0,"explanation":"Often during transformations."},{"prompt":"Wind energy can be used to generate electricity.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Turbines convert motion."},{"prompt":"Conserving energy at home can mean:","type":"multiple_choice","options":["Switching off unused lights","Leaving all lights on always","Opening the fridge all day","Wasting fuel on purpose"],"correctIndex":0,"explanation":"Reduce waste."},{"prompt":"Sound is a form of:","type":"multiple_choice","options":["Energy","Matter only","A solid object","A planet"],"correctIndex":0,"explanation":"Sound energy."},{"prompt":"Ghanaian examples of renewable energy include:","type":"multiple_choice","options":["Sunlight and hydro power","Only coal forever","Only kerosene","Only candles as fuel sources never renew"],"correctIndex":0,"explanation":"Local renewables."}]},"Electricity, Electronics and Movement":{"videos":[{"url":"https://www.youtube.com/watch?v=x4pdzG-DHnY","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=oB1v-wh7EGU","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=7K4V0NvUxRg","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A closed circuit:","type":"multiple_choice","options":["Has a complete path for current","Has a permanent gap","Never needs a source","Works without conductors"],"correctIndex":0,"explanation":"Complete loop."},{"prompt":"Conductors:","type":"multiple_choice","options":["Allow electric current more easily","Block all current always","Are only wood","Are only rubber"],"correctIndex":0,"explanation":"e.g. metals."},{"prompt":"Insulators:","type":"multiple_choice","options":["Resist current flow more","Are the best wires","Always melt circuits","Create free electrons only"],"correctIndex":0,"explanation":"e.g. plastic coating."},{"prompt":"A force is a push or a pull.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Forces affect motion/shape."},{"prompt":"Friction:","type":"multiple_choice","options":["Opposes movement between surfaces","Creates free electricity always","Removes gravity","Stops all mass"],"correctIndex":0,"explanation":"Resistance to sliding."},{"prompt":"Balanced forces mean:","type":"multiple_choice","options":["No change in motion","Instant acceleration always","Object must explode","Mass doubles"],"correctIndex":0,"explanation":"Net force zero."},{"prompt":"Unbalanced forces can change an object’s motion.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Acceleration/deceleration."},{"prompt":"A simple circuit needs:","type":"multiple_choice","options":["Source, path and component","Only a switch with no source","Only an insulator loop","Only a magnet floating"],"correctIndex":0,"explanation":"Basic requirements."},{"prompt":"Magnets can:","type":"multiple_choice","options":["Attract some materials and affect motion","Create food","Write essays","Measure time alone"],"correctIndex":0,"explanation":"Magnetic forces."},{"prompt":"Gravity:","type":"multiple_choice","options":["Pulls masses toward each other","Pushes light away only","Deletes friction","Creates circuits alone"],"correctIndex":0,"explanation":"Attractive force."}]},"Hygiene and Diseases":{"videos":[{"url":"https://www.youtube.com/watch?v=ENIB2H3S_oQ","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=4IsX86zjCKo","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=mRidGna-V4E","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Handwashing with soap helps:","type":"multiple_choice","options":["Reduce pathogen spread","Create viruses","Remove all gravity","Stop rain"],"correctIndex":0,"explanation":"Breaks transmission."},{"prompt":"Communicable diseases can spread through:","type":"multiple_choice","options":["Air, water, food, contact or vectors","Only homework","Only colours","Only fonts"],"correctIndex":0,"explanation":"Multiple routes."},{"prompt":"A pathogen is:","type":"multiple_choice","options":["A disease-causing organism","A healthy vitamin","A sports trophy","A textbook"],"correctIndex":0,"explanation":"Germs that cause disease."},{"prompt":"Community sanitation protects many people at once.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Shared health measures."},{"prompt":"Respiratory etiquette includes:","type":"multiple_choice","options":["Covering coughs and sneezes","Coughing toward faces","Sharing used tissues freely","Ignoring illness"],"correctIndex":0,"explanation":"Protect others."},{"prompt":"Safe water and food hygiene:","type":"multiple_choice","options":["Lower infection risk","Increase germs on purpose","Replace sleep","Stop all exercise needs"],"correctIndex":0,"explanation":"Prevent ingestion of germs."},{"prompt":"Prevention works best when people act consistently.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Habits matter."},{"prompt":"A vector example is:","type":"multiple_choice","options":["A mosquito that spreads disease","A clean cup","A washed hand","A sealed water bottle"],"correctIndex":0,"explanation":"Vectors carry pathogens."},{"prompt":"Personal hygiene includes:","type":"multiple_choice","options":["Bathing and clean clothes","Never cleaning","Sharing toothbrushes","Ignoring toilets"],"correctIndex":0,"explanation":"Daily cleanliness."},{"prompt":"Why clean surroundings matter:","type":"multiple_choice","options":["They reduce breeding places for germs and vectors","They create more waste automatically","They remove all oxygen","They stop learning"],"correctIndex":0,"explanation":"Environment and health."}]},"Science, Industry and Climate Change":{"videos":[{"url":"https://www.youtube.com/watch?v=oJAbATJCugs","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=PLBK1ux5b7U","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=Vtb3I8Vzlfg","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Science helps industry by:","type":"multiple_choice","options":["Measurement, materials and safer methods","Removing all tools","Banning observation","Ignoring quality"],"correctIndex":0,"explanation":"Applied science."},{"prompt":"Climate change refers to:","type":"multiple_choice","options":["Long-term shifts in climate patterns","One afternoon of rain","A single cloudy hour","Only one cold night"],"correctIndex":0,"explanation":"Long-term change."},{"prompt":"Greenhouse gases can:","type":"multiple_choice","options":["Trap heat in the atmosphere","Create instant winter everywhere forever","Delete the Sun","Stop all farming instantly without effects"],"correctIndex":0,"explanation":"Enhanced greenhouse effect."},{"prompt":"Protecting ecosystems can support climate responses.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Nature-based help."},{"prompt":"A practical learner action is:","type":"multiple_choice","options":["Saving energy and reducing waste","Burning more fuel for fun","Littering rivers","Ignoring leaks"],"correctIndex":0,"explanation":"Local action."},{"prompt":"Evidence of climate change can include:","type":"multiple_choice","options":["Changing temperature and rainfall patterns","One missed football match","A torn notebook","A broken pencil"],"correctIndex":0,"explanation":"Long-term data."},{"prompt":"Adaptation means adjusting to climate impacts.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"e.g. farming changes."},{"prompt":"Reducing emissions means:","type":"multiple_choice","options":["Releasing less greenhouse gas","Making more smoke on purpose","Cutting all trees for fun","Wasting electricity"],"correctIndex":0,"explanation":"Mitigation."},{"prompt":"Quality control in industry checks:","type":"multiple_choice","options":["Products meet standards","Nothing ever","Only colours of walls","Only lunch menus"],"correctIndex":0,"explanation":"Consistent quality."},{"prompt":"Sustainable technology aims to:","type":"multiple_choice","options":["Meet needs with less long-term harm","Maximise pollution","Ignore safety","Hide all data"],"correctIndex":0,"explanation":"Care for future needs."}]},"Computer Generations and Components":{"videos":[{"url":"https://www.youtube.com/watch?v=O5nskjZ_GoI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=rwbho0CgEAE","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Input devices:","type":"multiple_choice","options":["Capture data for the computer","Only print paper","Only cool the room","Only store clouds"],"correctIndex":0,"explanation":"Keyboard, mouse, mic…"},{"prompt":"The processor:","type":"multiple_choice","options":["Follows instructions to process data","Only displays pictures","Only stores forever","Only prints"],"correctIndex":0,"explanation":"CPU role."},{"prompt":"Storage is for:","type":"multiple_choice","options":["Keeping files for later","Only temporary thoughts in RAM forever without saving","Only screen light","Only cables"],"correctIndex":0,"explanation":"Longer-term retention."},{"prompt":"Output devices present results to users.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Monitor, speaker, printer."},{"prompt":"Early computers used:","type":"multiple_choice","options":["Vacuum tubes in the first generation","Only smartphones","Only tablets","Only cloud apps"],"correctIndex":0,"explanation":"Generation history."},{"prompt":"A gadget often:","type":"multiple_choice","options":["Combines computing functions for a task","Is never electronic","Has no purpose","Cannot process data"],"correctIndex":0,"explanation":"Purpose-built devices."},{"prompt":"Memory (RAM) holds active work temporarily.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Working memory."},{"prompt":"Transistors improved computers by:","type":"multiple_choice","options":["Making them smaller and more reliable than tubes","Making them larger forever","Removing electricity needs","Deleting storage"],"correctIndex":0,"explanation":"2nd generation shift."},{"prompt":"Which is an input example?","type":"multiple_choice","options":["Microphone","Speaker","Monitor","Printer"],"correctIndex":0,"explanation":"Mic captures sound."},{"prompt":"Microprocessors helped:","type":"multiple_choice","options":["Put powerful computing on chips","Stop all apps","Remove keyboards forever","Ban storage"],"correctIndex":0,"explanation":"Modern computing."}]},"Windows, Data and Community Technology":{"videos":[{"url":"https://www.youtube.com/watch?v=O5nskjZ_GoI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=rwbho0CgEAE","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"An operating system:","type":"multiple_choice","options":["Manages hardware, apps and files","Only draws pictures by hand","Only waters plants","Only cooks food"],"correctIndex":0,"explanation":"OS role."},{"prompt":"The Windows desktop commonly shows:","type":"multiple_choice","options":["Icons, taskbar and Start access","Only a printed book","Only a chalkboard","Only a football field"],"correctIndex":0,"explanation":"GUI elements."},{"prompt":"Data can be:","type":"multiple_choice","options":["Text, numbers, images, sound or video","Only smell","Only gravity","Only temperature forever without sensors"],"correctIndex":0,"explanation":"Multiple forms."},{"prompt":"Folders help organise files.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Structure reduces clutter."},{"prompt":"Community technology can support:","type":"multiple_choice","options":["Health, banking, learning and communication","Only hiding information forever","Only breaking networks","Only deleting schools"],"correctIndex":0,"explanation":"Public services."},{"prompt":"Primary data is:","type":"multiple_choice","options":["Collected first-hand","Always copied from a novel","Never observed","Only imagined without records"],"correctIndex":0,"explanation":"Direct collection."},{"prompt":"Saving work with clear names helps you find it later.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Good file habits."},{"prompt":"The taskbar is useful for:","type":"multiple_choice","options":["Switching between open apps","Cooking stew","Measuring rainfall alone","Planting maize"],"correctIndex":0,"explanation":"App switching."},{"prompt":"Secondary data comes from:","type":"multiple_choice","options":["Existing sources","Only your brand-new experiment always","Only dreams","Only silence"],"correctIndex":0,"explanation":"Already collected."},{"prompt":"Responsible tech use in a community means:","type":"multiple_choice","options":["Helping people while protecting privacy","Sharing all private data","Spreading rumours","Ignoring safety"],"correctIndex":0,"explanation":"Ethics + usefulness."}]},"PowerPoint Interface":{"videos":[{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=O5nskjZ_GoI","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Slides organise a presentation into:","type":"multiple_choice","options":["Separate screens of content","Only one endless paragraph always","Only audio with no visuals","Only code files"],"correctIndex":0,"explanation":"Slide structure."},{"prompt":"The ribbon:","type":"multiple_choice","options":["Groups commands in tabs","Prints the room","Deletes Windows","Measures angles"],"correctIndex":0,"explanation":"Command UI."},{"prompt":"Layouts provide:","type":"multiple_choice","options":["Placeholders for content","Random viruses","Only music","Only printer ink"],"correctIndex":0,"explanation":"Slide layouts."},{"prompt":"Themes coordinate fonts and colours.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Visual consistency."},{"prompt":"Slide Show view is for:","type":"multiple_choice","options":["Presenting to an audience","Editing cell formulas only","Coding Python only","Drawing nets only"],"correctIndex":0,"explanation":"Presentation mode."},{"prompt":"Speaker notes help the presenter:","type":"multiple_choice","options":["Remember talking points privately","Show huge walls of text to viewers","Hide the topic","Remove images forever"],"correctIndex":0,"explanation":"Presenter support."},{"prompt":"Thumbnails help reorder slides.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Slide sorter/pane."},{"prompt":"A good slide title should:","type":"multiple_choice","options":["State the main idea clearly","Be a full essay","Be invisible","Be unrelated"],"correctIndex":0,"explanation":"Clarity."},{"prompt":"Placeholders are:","type":"multiple_choice","options":["Boxes waiting for text or media","Broken cables","Printer errors","Folder passwords"],"correctIndex":0,"explanation":"Content holders."},{"prompt":"Before presenting, you should:","type":"multiple_choice","options":["Check slides and media","Never rehearse","Delete all titles","Hide the topic"],"correctIndex":0,"explanation":"Prepare."}]},"Designing Effective Slides":{"videos":[{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=O5nskjZ_GoI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Each slide should usually focus on:","type":"multiple_choice","options":["One main idea","Twenty unrelated ideas","Tiny unreadable text only","No message"],"correctIndex":0,"explanation":"Focus."},{"prompt":"Images should:","type":"multiple_choice","options":["Teach or support the point","Only decorate randomly","Replace all evidence with memes always","Hide the topic"],"correctIndex":0,"explanation":"Purposeful visuals."},{"prompt":"Strong contrast helps:","type":"multiple_choice","options":["Readability","Eye strain on purpose","Hiding words","Removing meaning"],"correctIndex":0,"explanation":"See text clearly."},{"prompt":"Restrained animations are better than distracting ones.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Less noise."},{"prompt":"Presenters should:","type":"multiple_choice","options":["Explain ideas, not read every word","Read giant paragraphs aloud only","Face away forever","Ignore the audience"],"correctIndex":0,"explanation":"Talk to people."},{"prompt":"Crediting image sources is:","type":"multiple_choice","options":["Responsible and honest","Unnecessary always","A math formula","A virus"],"correctIndex":0,"explanation":"Attribution."},{"prompt":"Testing media beforehand prevents surprises.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Tech check."},{"prompt":"Readable type means:","type":"multiple_choice","options":["Large enough clear fonts","Tiny decorative scripts always","All caps paragraphs forever","No spacing"],"correctIndex":0,"explanation":"Legibility."},{"prompt":"Inviting questions can:","type":"multiple_choice","options":["Check understanding","End learning forever","Delete slides","Remove evidence"],"correctIndex":0,"explanation":"Interaction."},{"prompt":"A cluttered slide often:","type":"multiple_choice","options":["Confuses the audience","Improves focus always","Creates more evidence","Fixes spelling"],"correctIndex":0,"explanation":"Simplify."}]},"Word-Processing Interface":{"videos":[{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=O5nskjZ_GoI","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A word processor is used to:","type":"multiple_choice","options":["Create and edit text documents","Only edit videos","Only browse offline maps","Only draw 3D games"],"correctIndex":0,"explanation":"Documents."},{"prompt":"Cut, copy and paste help you:","type":"multiple_choice","options":["Move or duplicate text","Print the moon","Charge batteries","Measure force"],"correctIndex":0,"explanation":"Editing tools."},{"prompt":"Page setup controls:","type":"multiple_choice","options":["Margins, size and orientation","Only Wi-Fi passwords","Only CPU speed","Only volume of speakers"],"correctIndex":0,"explanation":"Page layout."},{"prompt":"Spellcheck helps but does not replace proofreading.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Homophones can be missed."},{"prompt":"Styles help create:","type":"multiple_choice","options":["Consistent headings","Random fonts every word","Broken files","Hidden viruses"],"correctIndex":0,"explanation":"Consistent structure."},{"prompt":"Undo is useful when you:","type":"multiple_choice","options":["Make a mistake","Want more mistakes","Delete the OS","Unplug safely forever without saving needed work intentionally wrong"],"correctIndex":0,"explanation":"Reverse last actions."},{"prompt":"Tables can organise information in rows and columns.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Structured layout."},{"prompt":"Find tool helps you:","type":"multiple_choice","options":["Locate words quickly","Grow plants","Bake bread","Kick a ball"],"correctIndex":0,"explanation":"Search in document."},{"prompt":"Alignment options include:","type":"multiple_choice","options":["Left, centre, right, justify","Only diagonal forever","Only curved text mandatory","Only invisible text"],"correctIndex":0,"explanation":"Text alignment."},{"prompt":"Images in a document should be:","type":"multiple_choice","options":["Relevant and sized sensibly","Covering all text always","Unrelated decorations only","Corrupted on purpose"],"correctIndex":0,"explanation":"Helpful media."}]},"Creating School Documents":{"videos":[{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=rwbho0CgEAE","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"Start a school document by knowing:","type":"multiple_choice","options":["Purpose and audience","Only the printer brand","Only the desk colour","Only the file size forever"],"correctIndex":0,"explanation":"Writing purpose."},{"prompt":"Clear headings help readers:","type":"multiple_choice","options":["Find information quickly","Get lost","Ignore structure","Delete meaning"],"correctIndex":0,"explanation":"Navigation."},{"prompt":"Proofreading checks:","type":"multiple_choice","options":["Content and layout accuracy","Nothing","Only the cover photo of another book","Only the weather"],"correctIndex":0,"explanation":"Final check."},{"prompt":"Meaningful file names make documents easier to find.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"e.g. Science_Report_Ama.docx"},{"prompt":"Before printing, you should:","type":"multiple_choice","options":["Preview the page","Print 100 copies blindly","Unplug the computer","Delete the file"],"correctIndex":0,"explanation":"Print preview."},{"prompt":"Tables in reports should have:","type":"multiple_choice","options":["Clear labels","No headers ever","Random empty chaos only","Invisible numbers"],"correctIndex":0,"explanation":"Readable tables."},{"prompt":"Exporting to a suitable format helps sharing.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"PDF etc."},{"prompt":"Consistent formatting looks:","type":"multiple_choice","options":["Professional and easier to read","Messy on purpose","Unfinished always","Like a virus"],"correctIndex":0,"explanation":"Consistency."},{"prompt":"Captions on images:","type":"multiple_choice","options":["Explain what the image shows","Hide the image","Delete evidence","Replace the whole report"],"correctIndex":0,"explanation":"Clarify visuals."},{"prompt":"Saving versions helps you:","type":"multiple_choice","options":["Recover earlier work if needed","Lose everything faster","Avoid backups","Forget the topic"],"correctIndex":0,"explanation":"Version safety."}]},"Databases, Algorithms and Programming":{"videos":[{"url":"https://www.youtube.com/watch?v=O5nskjZ_GoI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=rwbho0CgEAE","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=l3XzepN03KQ","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A database stores:","type":"multiple_choice","options":["Organised data","Only wet paint","Only wind","Only soil"],"correctIndex":0,"explanation":"Structured storage."},{"prompt":"A field describes:","type":"multiple_choice","options":["An attribute of a record","A whole unrelated novel","A random song","A sports score only without structure"],"correctIndex":0,"explanation":"Column/attribute."},{"prompt":"A record is:","type":"multiple_choice","options":["A set of related field values","A single letter always","A broken cable","A blank wall"],"correctIndex":0,"explanation":"One entry/row."},{"prompt":"An algorithm is an ordered, clear set of steps.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Finite and unambiguous."},{"prompt":"Programs express algorithms so that:","type":"multiple_choice","options":["A computer can execute them","Humans forget steps","Electricity stops","Data deletes itself always"],"correctIndex":0,"explanation":"Executable instructions."},{"prompt":"Sequence in programming means:","type":"multiple_choice","options":["Steps run in order","Steps run randomly only","No steps exist","Only colours change"],"correctIndex":0,"explanation":"Ordered flow."},{"prompt":"Decisions in programs choose different paths.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"If/else style logic."},{"prompt":"Repetition means:","type":"multiple_choice","options":["Repeating steps","Deleting loops forever","Never running code","Printing once only always without reason"],"correctIndex":0,"explanation":"Loops."},{"prompt":"Input in a program is:","type":"multiple_choice","options":["Data given to the program","Only the final printout","Only the wallpaper","Only the chair"],"correctIndex":0,"explanation":"Provided data."},{"prompt":"Output is:","type":"multiple_choice","options":["The result the program produces","The power cable","The desk","The silent room"],"correctIndex":0,"explanation":"Results shown/stored."}]},"Electronic Spreadsheets":{"videos":[{"url":"https://www.youtube.com/watch?v=rwbho0CgEAE","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=O5nskjZ_GoI","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=RQ2nYUBVvqI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A cell is where a:","type":"multiple_choice","options":["Row and column meet","Only a printer sits","Only a book ends","Only a song plays"],"correctIndex":0,"explanation":"Intersection."},{"prompt":"Formulas usually begin with:","type":"multiple_choice","options":["=","+","#","?"],"correctIndex":0,"explanation":"Equals sign starts formulas."},{"prompt":"SUM is used to:","type":"multiple_choice","options":["Add a range of numbers","Multiply images","Delete sheets","Sort colours only"],"correctIndex":0,"explanation":"Addition function."},{"prompt":"Charts help people interpret spreadsheet data.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Visual summary."},{"prompt":"AVERAGE finds:","type":"multiple_choice","options":["The mean of values","Only the largest value always","Only text length","Only file size"],"correctIndex":0,"explanation":"Mean."},{"prompt":"A cell reference like B4 means:","type":"multiple_choice","options":["Column B, row 4","Row B, column 4","A filename","A password"],"correctIndex":0,"explanation":"Grid address."},{"prompt":"Relative references change when copied across cells.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"They adjust."},{"prompt":"Clear labels help:","type":"multiple_choice","options":["Readers understand columns","Hide meaning","Break formulas always","Remove numbers"],"correctIndex":0,"explanation":"Labelling."},{"prompt":"Number formats can show:","type":"multiple_choice","options":["Currency, percent or decimals","Only emojis","Only videos","Only folders"],"correctIndex":0,"explanation":"Display formats."},{"prompt":"Rows go:","type":"multiple_choice","options":["Across horizontally","Only up in 3D space","Only through cables","Only in circles"],"correctIndex":0,"explanation":"Horizontal records."}]},"Networks, Browsers and Online Communication":{"videos":[{"url":"https://www.youtube.com/watch?v=O5nskjZ_GoI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=eIho2S0ZahI","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"A network connects:","type":"multiple_choice","options":["Devices to share resources and communicate","Only pencils","Only shoes","Only trees"],"correctIndex":0,"explanation":"Linked devices."},{"prompt":"The World Wide Web is:","type":"multiple_choice","options":["Linked pages accessed with browsers","The same as all electricity","Only email servers with no pages","Only USB cables"],"correctIndex":0,"explanation":"Web ≠ whole internet, but related."},{"prompt":"A URL is:","type":"multiple_choice","options":["A web address","A keyboard key only","A printer ink type","A desk size"],"correctIndex":0,"explanation":"Locate pages."},{"prompt":"Search works better with clear keywords.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Specific queries."},{"prompt":"Email needs:","type":"multiple_choice","options":["Address, subject and message","Only a stamp","Only a bell","Only a ruler"],"correctIndex":0,"explanation":"Digital mail parts."},{"prompt":"Online forms collect:","type":"multiple_choice","options":["Structured information","Only rainfall","Only soil samples","Only magnets"],"correctIndex":0,"explanation":"Fields/responses."},{"prompt":"Attachments can travel with email messages.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Files attached."},{"prompt":"A browser is used to:","type":"multiple_choice","options":["View web pages","Cook food","Water plants","Kick balls"],"correctIndex":0,"explanation":"Web client."},{"prompt":"The internet is best described as:","type":"multiple_choice","options":["Many connected networks","One single computer only","A single book","A closed drawer"],"correctIndex":0,"explanation":"Network of networks."},{"prompt":"Safe searching means:","type":"multiple_choice","options":["Using reliable sources and care with personal data","Clicking every pop-up","Sharing passwords in forms","Ignoring HTTPS warnings always"],"correctIndex":0,"explanation":"Digital caution."}]},"IoT, Digital Literacy and Safe Use":{"videos":[{"url":"https://www.youtube.com/watch?v=O5nskjZ_GoI","provider":"youtube","title":"Watch lesson video 1"},{"url":"https://www.youtube.com/watch?v=ENIB2H3S_oQ","provider":"youtube","title":"Watch lesson video 2"},{"url":"https://www.youtube.com/watch?v=IlU-zDU6aQ0","provider":"youtube","title":"Bonus watch"}],"quiz":[{"prompt":"IoT devices often use:","type":"multiple_choice","options":["Sensors, software and networks","Only paper","Only chalk","Only wood without electronics"],"correctIndex":0,"explanation":"Connected sensing devices."},{"prompt":"A digital footprint is:","type":"multiple_choice","options":["Traces of your online activity","A shoe print in mud only","A library stamp only","A pencil mark only"],"correctIndex":0,"explanation":"Online traces."},{"prompt":"A strong password should be:","type":"multiple_choice","options":["Long and hard to guess","Your name only","1234","password"],"correctIndex":0,"explanation":"Strength matters."},{"prompt":"Netiquette means respectful online behaviour.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Online manners."},{"prompt":"Privacy settings help you:","type":"multiple_choice","options":["Control who sees your information","Share everything automatically","Delete the internet","Stop all learning"],"correctIndex":0,"explanation":"Control sharing."},{"prompt":"Ergonomics for computer use includes:","type":"multiple_choice","options":["Healthy posture and breaks","Sitting awkwardly forever","No lighting ever","No water ever"],"correctIndex":0,"explanation":"Body-friendly use."},{"prompt":"Checking sources helps spot unreliable information.","type":"true_false","options":["True","False"],"correctIndex":0,"explanation":"Evaluate credibility."},{"prompt":"Limiting personal-data sharing:","type":"multiple_choice","options":["Reduces risk","Increases scams success","Removes all friends forever necessarily","Breaks keyboards"],"correctIndex":0,"explanation":"Less data, less risk."},{"prompt":"A smart meter is an example of:","type":"multiple_choice","options":["An IoT-related device","A pencil","A football","A novel"],"correctIndex":0,"explanation":"Connected utility device."},{"prompt":"Digital literacy includes:","type":"multiple_choice","options":["Finding, evaluating and creating information responsibly","Believing every post","Ignoring privacy","Sharing secrets widely"],"correctIndex":0,"explanation":"Responsible skills."}]}}
$media_quiz_bank$::jsonb;
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
  topic_media jsonb;
  topic_quiz jsonb;
  video_item jsonb;
  video_ord integer;
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
  -- Break Subject ↔ PublicLearningRevision references before deleting subjects.
  UPDATE public."Subject"
  SET "currentPublicRevisionId" = NULL
  WHERE "createdBy" = teacher_id;

  DELETE FROM public."PublicLearningRevision"
  WHERE "courseId" IN (
    SELECT "id" FROM public."Subject" WHERE "createdBy" = teacher_id
  );

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


          topic_media := media_quiz_bank -> (topic_data ->> 'name');
          IF topic_media IS NULL THEN
            RAISE EXCEPTION 'Missing media/quiz bank for topic %', topic_data ->> 'name';
          END IF;
          topic_quiz := topic_media -> 'quiz';

          SELECT coalesce(jsonb_agg(qblock ORDER BY ord), '[]'::jsonb)
          INTO assessment_blocks
          FROM (
            SELECT
              ordinality AS ord,
              CASE
                WHEN q ->> 'type' = 'true_false' THEN
                  jsonb_build_object(
                    'id', lesson_id || '-q' || ordinality,
                    'type', 'true_false',
                    'order', 10 + ordinality,
                    'required', true,
                    'estimatedSeconds', 45,
                    'statement', q ->> 'prompt',
                    'prompt', q ->> 'prompt',
                    'shuffleOptions', false,
                    'correctAnswer', ((q ->> 'correctIndex')::int = 0),
                    'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective-1'),
                    'difficulty', CASE WHEN lesson_variant = 1 THEN 'beginner' ELSE 'developing' END,
                    'xpWeight', 1,
                    'maximumAttempts', 3,
                    'hint', 'Think about what the lesson videos showed.',
                    'explanation', coalesce(q ->> 'explanation', ''),
                    'feedbackCorrect', 'Awesome! You used the video evidence.',
                    'feedbackIncorrect', 'Rewatch the key clip and try again.',
                    'feedbackRetry', 'Eliminate answers that do not match the videos.'
                  )
                ELSE
                  jsonb_build_object(
                    'id', lesson_id || '-q' || ordinality,
                    'type', 'multiple_choice',
                    'order', 10 + ordinality,
                    'required', true,
                    'estimatedSeconds', 50,
                    'prompt', q ->> 'prompt',
                    'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective-1'),
                    'difficulty', CASE WHEN lesson_variant = 1 THEN 'beginner' ELSE 'developing' END,
                    'xpWeight', 1,
                    'maximumAttempts', 3,
                    'hint', 'Use clues from the videos before choosing.',
                    'explanation', coalesce(q ->> 'explanation', ''),
                    'feedbackCorrect', 'Yes! That matches the lesson videos.',
                    'feedbackIncorrect', 'Not yet — rewatch and compare each option.',
                    'feedbackRetry', 'Try again after eliminating one wrong option.',
                    'shuffleOptions', true,
                    'options', (
                      SELECT jsonb_agg(
                        jsonb_build_object(
                          'id', chr(96 + opt_ord::int),
                          'label', chr(64 + opt_ord::int),
                          'text', opt #>> '{}'
                        ) ORDER BY opt_ord
                      )
                      FROM jsonb_array_elements(q -> 'options') WITH ORDINALITY AS opts(opt, opt_ord)
                    ),
                    'correctOptionId', chr(96 + ((q ->> 'correctIndex')::int + 1))
                  )
              END AS qblock
            FROM jsonb_array_elements(topic_quiz) WITH ORDINALITY AS quiz_rows(q, ordinality)
          ) built;

          -- Video-heavy media: 2–3 videos per lesson (≈90% of learning time).
          media_blocks := '[]'::jsonb;
          FOR video_item, video_ord IN
            SELECT value, ordinality::integer
            FROM jsonb_array_elements(topic_media -> 'videos') WITH ORDINALITY
          LOOP
            media_blocks := media_blocks || jsonb_build_array(jsonb_build_object(
              'id', lesson_id || '-video-' || video_ord,
              'type', 'video',
              'order', 1 + video_ord,
              'required', true,
              'estimatedSeconds', CASE WHEN video_ord = 1 THEN 360 WHEN video_ord = 2 THEN 300 ELSE 180 END,
              'source', video_item ->> 'url',
              'provider', coalesce(video_item ->> 'provider', 'youtube'),
              'title', coalesce(video_item ->> 'title', 'Watch and learn'),
              'caption', 'Kids watch first! Pause, rewind and spot one key idea.'
            ));
          END LOOP;

          -- Tiny text support (~10%): one short tip only.
          media_blocks := media_blocks || jsonb_build_array(jsonb_build_object(
            'id', lesson_id || '-kid-tip',
            'type', 'tip',
            'order', 5,
            'required', true,
            'estimatedSeconds', 60,
            'title', 'Quick reminder',
            'tone', 'remember',
            'body', 'After the videos: ' || left(topic_content, 220) || CASE WHEN length(topic_content) > 220 THEN '…' ELSE '' END
          ));

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
              'estimatedMinutes',CASE WHEN lesson_variant = 1 THEN 20 ELSE 22 END,
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
                    'id',lesson_id || '-intro','type','lesson_intro','order',1,'required',true,'estimatedSeconds',40,
                    'title',lesson_title,'shortDescription',lesson_description,
                    'objectives',jsonb_build_array(lesson_objective,'Learn mainly by watching kid-friendly videos'),
                    'estimatedMinutes',CASE WHEN lesson_variant = 1 THEN 20 ELSE 22 END,
                    'rewardPreview',jsonb_build_object('xp',lesson_xp,'starsAvailable',3)
                  )
                ) || media_blocks || assessment_blocks ||
                jsonb_build_array(jsonb_build_object(
                  'id',lesson_id || '-summary','type','summary','order',25,'required',true,'estimatedSeconds',45,
                  'heading','Mission complete',
                  'keyPoints',jsonb_build_array(
                    'I watched the lesson videos carefully.',
                    'I can explain ' || lower(topic_data ->> 'name') || ' in my own words.',
                    'I checked my understanding with a real 10-question quiz.'
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
            'estimatedMinutes',CASE WHEN lesson_variant = 1 THEN 20 ELSE 22 END,
            'xp',lesson_xp,'questionCount',10,
            'format','video',
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
            'prompt',CASE
              WHEN assessment_blocks -> (q - 1) ->> 'type' = 'true_false'
                THEN assessment_blocks -> (q - 1) ->> 'statement'
              ELSE assessment_blocks -> (q - 1) ->> 'prompt'
            END,
            'type',coalesce(assessment_blocks -> (q - 1) ->> 'type','multiple_choice'),
            'options',CASE
              WHEN assessment_blocks -> (q - 1) ->> 'type' = 'true_false' THEN jsonb_build_array('True','False')
              ELSE jsonb_build_array(
                assessment_blocks -> (q - 1) -> 'options' -> 0 ->> 'text',
                assessment_blocks -> (q - 1) -> 'options' -> 1 ->> 'text',
                assessment_blocks -> (q - 1) -> 'options' -> 2 ->> 'text',
                assessment_blocks -> (q - 1) -> 'options' -> 3 ->> 'text'
              )
            END,
            'correctIndex',CASE
              WHEN assessment_blocks -> (q - 1) ->> 'type' = 'true_false'
                THEN CASE WHEN (assessment_blocks -> (q - 1) ->> 'correctAnswer')::boolean THEN 0 ELSE 1 END
              ELSE (
                SELECT ord - 1
                FROM jsonb_array_elements(assessment_blocks -> (q - 1) -> 'options') WITH ORDINALITY AS o(opt, ord)
                WHERE opt ->> 'id' = assessment_blocks -> (q - 1) ->> 'correctOptionId'
                LIMIT 1
              )
            END,
            'explanation',coalesce(assessment_blocks -> (q - 1) ->> 'explanation', lesson_objective)
          ) ORDER BY q)
          INTO quiz_questions
          FROM generate_series(1, 10) q;

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
          WHEN 2 THEN 'Which idea belongs in the ' || (strand_data ->> 'name') || ' strand?'
          WHEN 3 THEN 'Which vocabulary fits ' || (strand_data ->> 'name') || ' best?'
          WHEN 4 THEN 'Which Ghana example connects to ' || (strand_data ->> 'name') || '?'
          WHEN 5 THEN 'How can you check an answer in ' || (strand_data ->> 'name') || '?'
          WHEN 6 THEN 'Which evidence supports a strong ' || (strand_data ->> 'name') || ' explanation?'
          WHEN 7 THEN 'Which misconception should you avoid in ' || (strand_data ->> 'name') || '?'
          WHEN 8 THEN 'How do the two sub-strands in ' || (strand_data ->> 'name') || ' connect?'
          WHEN 9 THEN 'Which action shows real application of ' || (strand_data ->> 'name') || '?'
          ELSE 'Which summary best captures learning in ' || (strand_data ->> 'name') || '?'
        END,
        'type',CASE WHEN q IN (3,7) THEN 'true_false' ELSE 'multiple_choice' END,
        'options',CASE q
          WHEN 1 THEN jsonb_build_array(
            'Build understanding and skills in ' || (strand_data ->> 'name') || ' through practice and evidence.',
            'Avoid ' || (strand_data ->> 'name') || ' completely.',
            'Memorise only one word from another subject.',
            'Skip all examples and guess forever.'
          )
          WHEN 2 THEN jsonb_build_array(
            'A concept taught in the ' || (strand_data ->> 'name') || ' lessons and videos.',
            'A random idea from an unrelated game only.',
            'A password for a website.',
            'A lunch menu with no learning link.'
          )
          WHEN 3 THEN jsonb_build_array('True','False')
          WHEN 4 THEN jsonb_build_array(
            'A school, market, home or community situation that uses ' || (strand_data ->> 'name') || ' ideas.',
            'An example that ignores the strand completely.',
            'A joke with no facts.',
            'A silent blank page.'
          )
          WHEN 5 THEN jsonb_build_array(
            'Replay the videos, revisit the method, and test if the result makes sense.',
            'Never check and hope.',
            'Change the question secretly.',
            'Copy a friend without thinking.'
          )
          WHEN 6 THEN jsonb_build_array(
            'Clear examples, correct vocabulary and checked working from the videos.',
            'Unrelated guesses.',
            'Deleted evidence.',
            'Only decorative images with no meaning.'
          )
          WHEN 7 THEN jsonb_build_array('True','False')
          WHEN 8 THEN jsonb_build_array(
            'Both sub-strands develop related ideas inside ' || (strand_data ->> 'name') || '.',
            'They are from different subjects with no link.',
            'They replace mathematics with silence.',
            'They delete all learning goals.'
          )
          WHEN 9 THEN jsonb_build_array(
            'Explain the idea, use a method from the videos, and apply it to a real task.',
            'Skip the method and invent nonsense.',
            'Avoid all practice.',
            'Hide your working forever.'
          )
          ELSE jsonb_build_array(
            'I watched, practised and can use ' || (strand_data ->> 'name') || ' ideas with evidence.',
            'I learned nothing and prefer guessing.',
            'I ignored every video.',
            'I only memorised a heading.'
          )
        END,
        'correctIndex',CASE WHEN q = 7 THEN 1 WHEN q = 3 THEN 0 ELSE 0 END,
        'explanation',CASE
          WHEN q = 3 THEN 'Accurate vocabulary from the strand videos matters.'
          WHEN q = 7 THEN 'False — learners should avoid misconceptions, not keep them.'
          ELSE 'The best answer uses strand ideas, video evidence and careful checking.'
        END
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

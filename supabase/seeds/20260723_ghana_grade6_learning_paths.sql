-- SkulKid Grade 6 curriculum seed
-- Aligned to the official NaCCA/Ghana standards-based upper-primary curricula:
-- Mathematics: B6.1.3.1.1 and B6.1.3.1.2
-- English:     B6.2.7.1 and B6.2.10.1
-- Science:     B6.4.2.1.1, B6.4.2.1.2 and B6.4.2.1.3
--
-- Creates one in-depth, mixed-media learning mission for each subject.
-- Every lesson contains exactly 10 multiple-choice quiz questions.
-- Safe to run repeatedly: all permanent records use stable IDs and upserts.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.grade6_quiz_blocks(
  questions jsonb,
  objective_id text,
  id_prefix text,
  first_order integer
) RETURNS jsonb
LANGUAGE sql
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', id_prefix || '-quiz-' || q.ordinality,
        'type', 'multiple_choice',
        'order', first_order + q.ordinality::integer - 1,
        'required', true,
        'estimatedSeconds', 75,
        'prompt', q.item ->> 'question',
        'options', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', chr(96 + option_value.ordinality::integer),
              'label', upper(chr(96 + option_value.ordinality::integer)),
              'text', option_value.value,
              'feedback',
                CASE
                  WHEN option_value.ordinality::integer = (q.item ->> 'correct')::integer
                    THEN 'Correct. ' || (q.item ->> 'explanation')
                  ELSE 'Review the lesson and try this idea again.'
                END
            )
            ORDER BY option_value.ordinality
          )
          FROM jsonb_array_elements_text(q.item -> 'options')
            WITH ORDINALITY AS option_value(value, ordinality)
        ),
        'correctOptionId', chr(96 + (q.item ->> 'correct')::integer),
        'learningObjectiveIds', jsonb_build_array(objective_id),
        'difficulty', 'developing',
        'xpWeight', 1,
        'maximumAttempts', 2,
        'hint', q.item ->> 'hint',
        'explanation', q.item ->> 'explanation',
        'feedbackCorrect', 'Excellent reasoning!',
        'feedbackIncorrect', 'Not yet. Revisit the matching learning stage.',
        'feedbackRetry', 'Use the hint, then make your best choice.',
        'shuffleOptions', false
      )
      ORDER BY q.ordinality
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(questions) WITH ORDINALITY AS q(item, ordinality);
$$;

INSERT INTO public."Subject"
  ("id", "name", "slug", "description", "icon", "colourToken", "gradeLevels", "order", "status", "createdAt", "updatedAt")
VALUES
  ('subject-mathematics', 'Mathematics', 'mathematics', 'Build number confidence through clear examples, practice and feedback.', 'calculator', '#2563EB', ARRAY[6], 0, 'ACTIVE', now(), now()),
  ('subject-english-language', 'English Language', 'english-language', 'Grow reading, writing and communication confidence.', 'book-open', '#7C3AED', ARRAY[6], 1, 'ACTIVE', now(), now()),
  ('subject-science', 'Science', 'science', 'Explore matter, systems, energy and the environment through inquiry.', 'flask-conical', '#16A34A', ARRAY[6], 2, 'ACTIVE', now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "gradeLevels" = ARRAY[6],
  "status" = 'ACTIVE',
  "updatedAt" = now();

INSERT INTO public."Unit"
  ("id", "subjectId", "name", "slug", "description", "order", "createdAt", "updatedAt")
VALUES
  ('unit-math-fractions-b6', 'subject-mathematics', 'Number: Fractions', 'fractions-basic-6', 'Compare and operate with common fractions, decimals and percentages.', 1, now(), now()),
  ('unit-english-reading-b6', 'subject-english-language', 'Reading and Comprehension', 'reading-comprehension-basic-6', 'Construct meaning, identify key ideas and summarise texts.', 1, now(), now()),
  ('unit-science-electricity-b6', 'subject-science', 'Forces and Energy', 'forces-and-energy-basic-6', 'Investigate electricity, circuits and the behaviour of materials.', 1, now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = now();

INSERT INTO public."Topic"
  ("id", "unitId", "name", "slug", "description", "order", "createdAt", "updatedAt")
VALUES
  ('topic-math-fraction-operations-b6', 'unit-math-fractions-b6', 'Fractions, Decimals and Percentages', 'fraction-operations-basic-6', 'Compare, order, add and subtract unlike and mixed fractions.', 1, now(), now()),
  ('topic-english-main-idea-b6', 'unit-english-reading-b6', 'Main Ideas and Summaries', 'main-ideas-summaries-basic-6', 'Find important ideas, supporting details and write concise summaries.', 1, now(), now()),
  ('topic-science-circuits-b6', 'unit-science-electricity-b6', 'Simple Electric Circuits', 'simple-electric-circuits-basic-6', 'Build circuits and classify conductors and insulators.', 1, now(), now())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = now();

CREATE TEMP TABLE grade6_lesson_seed (
  id text PRIMARY KEY,
  subject_slug text NOT NULL,
  course_id text NOT NULL,
  course_name text NOT NULL,
  course_description text NOT NULL,
  course_icon text NOT NULL,
  course_colour text NOT NULL,
  unit_id text NOT NULL,
  unit_name text NOT NULL,
  unit_slug text NOT NULL,
  unit_description text NOT NULL,
  topic_id text NOT NULL,
  topic_name text NOT NULL,
  topic_slug text NOT NULL,
  topic_description text NOT NULL,
  title text NOT NULL,
  lesson_slug text NOT NULL,
  short_description text NOT NULL,
  objective text NOT NULL,
  curriculum_codes text NOT NULL,
  minutes integer NOT NULL,
  xp integer NOT NULL,
  instructional_blocks jsonb NOT NULL,
  questions jsonb NOT NULL
) ON COMMIT DROP;

INSERT INTO grade6_lesson_seed VALUES
(
  'lesson-math-fractions-decimals-percent-b6',
  'mathematics',
  'subject-mathematics',
  'Mathematics',
  'Build number confidence through clear examples, practice and feedback.',
  'calculator',
  '#2563EB',
  'unit-math-fractions-b6',
  'Number: Fractions',
  'fractions-basic-6',
  'Compare and operate with common fractions, decimals and percentages.',
  'topic-math-fraction-operations-b6',
  'Fractions, Decimals and Percentages',
  'fraction-operations-basic-6',
  'Compare, order, add and subtract unlike and mixed fractions.',
  'Fraction Quest: Compare, Add and Subtract',
  'fraction-quest-compare-add-subtract',
  'Connect fractions, decimals and percentages, then solve operations with unlike and mixed fractions.',
  'Compare and order equivalent forms and accurately add or subtract unlike and mixed fractions.',
  'B6.1.3.1.1; B6.1.3.1.2',
  28,
  160,
  $json$
  [
    {
      "id":"math-b6-intro","type":"lesson_intro","order":1,"required":true,"estimatedSeconds":60,
      "title":"The Fraction Market Challenge",
      "shortDescription":"Use fair shares, decimal prices and percentages to solve everyday Ghanaian problems.",
      "objectives":["Convert between common fractions, decimals and percentages.","Compare and order equivalent quantities.","Add and subtract unlike and mixed fractions."],
      "estimatedMinutes":28,"rewardPreview":{"xp":160,"starsAvailable":3}
    },
    {
      "id":"math-b6-section-1","type":"section_break","order":2,"required":true,
      "heading":"Stage 1: One quantity, three forms",
      "description":"Build equivalence before comparing or calculating."
    },
    {
      "id":"math-b6-text-1","type":"text","order":3,"required":true,"estimatedSeconds":300,
      "heading":"Fractions, decimals and percentages are connected",
      "body":"A fraction describes part of a whole. A decimal uses place value, and a percentage describes a number of parts out of 100.\n\nTo convert a fraction to a decimal, divide the numerator by the denominator. To convert a decimal to a percentage, multiply by 100%.\n\nExample: **3/4 = 3 ÷ 4 = 0.75 = 75%**.\n\nTo compare different forms, first express them in one common form. For 2/5, 0.35 and 45%, use decimals: 0.40, 0.35 and 0.45. Therefore **0.35 < 2/5 < 45%**.\n\n[tip]Choose the form that makes comparison easiest. Hundredths are especially useful for percentages.[/tip]",
      "emphasisTerms":["equivalent","numerator","denominator","percentage"]
    },
    {
      "id":"math-b6-section-2","type":"section_break","order":4,"required":true,
      "heading":"Stage 2: Unlike denominators",
      "description":"Create equal-sized parts before adding or subtracting."
    },
    {
      "id":"math-b6-video","type":"video","order":5,"required":true,"estimatedSeconds":480,
      "source":"https://www.youtube.com/watch?v=5juto2ze8Lg","provider":"youtube",
      "title":"Adding and Subtracting Fractions",
      "caption":"Watch how common denominators make the pieces equal in size.",
      "participationPrompt":"What must you do before adding fractions with unlike denominators?",
      "participationOptions":[{"id":"a","label":"A","text":"Add the denominators immediately"},{"id":"b","label":"B","text":"Rename the fractions using a common denominator"},{"id":"c","label":"C","text":"Change every fraction into a whole number"}],
      "participationCorrectOptionId":"b",
      "participationExplanation":"Fractions need equal-sized parts, so unlike denominators must first be renamed using a common denominator.",
      "participationXp":10
    },
    {
      "id":"math-b6-example","type":"worked_example","order":6,"required":true,"estimatedSeconds":300,
      "title":"Sharing grain at a community store",
      "problem":"A shop sold 2 1/3 bags of maize in the morning and 1 3/4 bags in the afternoon. How many bags were sold altogether?",
      "orderedSteps":["Find a common denominator for thirds and fourths: LCM(3,4) = 12.","Convert 1/3 to 4/12 and 3/4 to 9/12.","Add the fractional parts: 4/12 + 9/12 = 13/12 = 1 1/12.","Add the whole numbers and the regrouped whole: 2 + 1 + 1 = 4."],
      "finalAnswer":"4 1/12 bags",
      "explanation":"Unlike fractions can only be combined after their parts have been renamed with a common denominator."
    },
    {
      "id":"math-b6-summary","type":"summary","order":7,"required":true,"estimatedSeconds":75,
      "heading":"Fraction mission recap",
      "keyPoints":["Equivalent fractions, decimals and percentages name the same quantity.","Convert to one form before comparing.","Use the LCM to find a common denominator.","Regroup improper fractional answers into mixed numbers.","Simplify the final fraction when possible."],
      "nextStepText":"Complete the 10-question challenge to clear this mission."
    }
  ]
  $json$::jsonb,
  $json$
  [
    {"question":"Which set contains three equivalent values?","options":["1/2, 0.5, 50%","1/2, 0.2, 50%","1/4, 0.4, 25%","3/4, 0.3, 75%"],"correct":1,"hint":"Divide the numerator by the denominator.","explanation":"1/2 equals 0.5, and 0.5 multiplied by 100 equals 50%."},
    {"question":"What is 3/5 as a percentage?","options":["30%","35%","60%","80%"],"correct":3,"hint":"Convert 3/5 to tenths or divide 3 by 5.","explanation":"3/5 = 0.6 = 60%."},
    {"question":"Order 0.45, 1/2 and 40% from least to greatest.","options":["40%, 0.45, 1/2","0.45, 40%, 1/2","1/2, 0.45, 40%","40%, 1/2, 0.45"],"correct":1,"hint":"Write all three as decimals.","explanation":"40% = 0.40, 0.45 = 0.45 and 1/2 = 0.50."},
    {"question":"What is the least common denominator of 1/3 and 1/4?","options":["7","12","16","24"],"correct":2,"hint":"Find the least common multiple of 3 and 4.","explanation":"The smallest number divisible by both 3 and 4 is 12."},
    {"question":"Calculate 2/3 + 1/4.","options":["3/7","8/12","11/12","1 1/12"],"correct":3,"hint":"Rename both fractions in twelfths.","explanation":"2/3 = 8/12 and 1/4 = 3/12, so the sum is 11/12."},
    {"question":"Calculate 5/6 - 1/4.","options":["7/12","4/2","1/2","3/10"],"correct":1,"hint":"Use denominator 12.","explanation":"5/6 = 10/12 and 1/4 = 3/12, leaving 7/12."},
    {"question":"What is 1 1/2 + 2 2/3?","options":["3 3/5","4 1/6","4 2/5","3 1/6"],"correct":2,"hint":"Add the whole numbers and express halves and thirds in sixths.","explanation":"1/2 + 2/3 = 3/6 + 4/6 = 7/6 = 1 1/6; the total is 4 1/6."},
    {"question":"A pupil completed 75% of a book. What fraction is this in simplest form?","options":["3/4","7/5","1/4","75/10"],"correct":1,"hint":"Write 75% as 75/100 and simplify.","explanation":"75/100 simplifies by 25 to 3/4."},
    {"question":"Which is greater: 5/8 or 60%?","options":["5/8","60%","They are equal","There is not enough information"],"correct":1,"hint":"Convert 5/8 to a decimal.","explanation":"5/8 = 0.625 = 62.5%, which is greater than 60%."},
    {"question":"Ama used 3/4 m of cloth and later used 2/5 m. How much cloth did she use?","options":["1 3/20 m","5/9 m","1 1/20 m","23/10 m"],"correct":1,"hint":"Use denominator 20.","explanation":"3/4 = 15/20 and 2/5 = 8/20; 23/20 = 1 3/20 m."}
  ]
  $json$::jsonb
),
(
  'lesson-english-main-idea-summary-b6',
  'english-language',
  'subject-english-language',
  'English Language',
  'Grow reading, writing and communication confidence.',
  'book-open',
  '#7C3AED',
  'unit-english-reading-b6',
  'Reading and Comprehension',
  'reading-comprehension-basic-6',
  'Construct meaning, identify key ideas and summarise texts.',
  'topic-english-main-idea-b6',
  'Main Ideas and Summaries',
  'main-ideas-summaries-basic-6',
  'Find important ideas, supporting details and write concise summaries.',
  'Reading Detective: Main Ideas and Summaries',
  'reading-detective-main-ideas-summaries',
  'Read a Ghana-focused informational passage closely, identify its structure and produce an accurate summary.',
  'Construct meaning from a text, sequence key ideas, identify supporting details and write a concise summary.',
  'B6.2.7.1.1-B6.2.7.1.4; B6.2.10.1.1-B6.2.10.1.2',
  30,
  160,
  $json$
  [
    {
      "id":"english-b6-intro","type":"lesson_intro","order":1,"required":true,"estimatedSeconds":60,
      "title":"Become a Reading Detective",
      "shortDescription":"Separate the big idea from the clues that explain it.",
      "objectives":["Identify a text's topic and main idea.","Select relevant supporting details.","Sequence important events or ideas.","Write a concise summary in your own words."],
      "estimatedMinutes":30,"rewardPreview":{"xp":160,"starsAvailable":3}
    },
    {
      "id":"english-b6-section-1","type":"section_break","order":2,"required":true,
      "heading":"Stage 1: Topic, main idea and details",
      "description":"Learn the job performed by each part of a paragraph."
    },
    {
      "id":"english-b6-text-1","type":"text","order":3,"required":true,"estimatedSeconds":300,
      "heading":"Find what the whole text is saying",
      "body":"The **topic** is the general subject, often expressed in a word or short phrase. The **main idea** is the most important point the writer communicates about that topic. **Supporting details** are facts, examples and explanations that prove or develop the main idea.\n\nUse this detective routine:\n\n1. Preview the title and headings.\n2. Read the whole paragraph or section.\n3. Ask, “What is repeated or emphasised?”\n4. State the main idea as a complete sentence.\n5. Check that the important details support it.\n\nA detail may be true but still unimportant to the main idea. Strong readers distinguish key evidence from interesting extras.",
      "emphasisTerms":["topic","main idea","supporting details","evidence"]
    },
    {
      "id":"english-b6-video","type":"video","order":4,"required":true,"estimatedSeconds":360,
      "source":"https://www.youtube.com/watch?v=mkZo2zVKJR4","provider":"youtube",
      "title":"Main Idea and Supporting Details",
      "caption":"Notice how the reader tests every detail against the main idea.",
      "participationPrompt":"According to the video, what is the main idea?",
      "participationOptions":[{"id":"a","label":"A","text":"The main idea is the text's most important point"},{"id":"b","label":"B","text":"The main idea is always the longest sentence"},{"id":"c","label":"C","text":"Every small detail is a separate main idea"}],
      "participationCorrectOptionId":"a",
      "participationExplanation":"The main idea expresses the most important point the writer communicates about the topic.",
      "participationXp":10
    },
    {
      "id":"english-b6-section-2","type":"section_break","order":5,"required":true,
      "heading":"Stage 2: Read, organise and summarise",
      "description":"Apply the before, during and after reading process."
    },
    {
      "id":"english-b6-text-2","type":"text","order":6,"required":true,"estimatedSeconds":360,
      "heading":"Passage: Protecting Ghana's Forests",
      "body":"Ghana's forests support people, wildlife and the climate. Trees provide timber, fruits and ingredients used in medicine. Their roots hold soil together, while their leaves release water vapour and help cool the air. Forests also provide habitats for many organisms.\n\nHowever, uncontrolled tree cutting, bush fires and some farming practices reduce forest cover. When too many trees disappear, soil can be washed away, animals lose their homes and less carbon dioxide is removed from the atmosphere.\n\nCommunities can protect forests by preventing bush fires, planting native trees and harvesting resources responsibly. Schools can nurture seedlings, organise clean-up campaigns and teach families why forests matter. Government agencies and traditional leaders also help by enforcing rules and protecting forest reserves.\n\nProtecting forests therefore requires shared responsibility. When citizens use forest resources wisely and replace what they remove, forests can continue supporting future generations.",
      "emphasisTerms":["forest cover","habitat","responsibly","shared responsibility"]
    },
    {
      "id":"english-b6-example","type":"worked_example","order":7,"required":true,"estimatedSeconds":300,
      "title":"Build a strong summary",
      "problem":"Summarise the passage “Protecting Ghana's Forests” without copying unnecessary details.",
      "orderedSteps":["Name the topic: protecting Ghana's forests.","State the central idea: forests are valuable but threatened and need collective protection.","Select one key point from each section: benefits, threats and solutions.","Remove examples that are not essential to the overall meaning.","Connect the ideas in your own words."],
      "finalAnswer":"Ghana's forests benefit people, wildlife and the climate, but harmful human activities are reducing them. Communities, schools and leaders must prevent damage, plant trees and use resources responsibly so forests remain for future generations.",
      "explanation":"The summary preserves the central message and major supporting ideas without repeating every example."
    },
    {
      "id":"english-b6-summary","type":"summary","order":8,"required":true,"estimatedSeconds":75,
      "heading":"Reading detective recap",
      "keyPoints":["The topic is broad; the main idea is the writer's central point.","Key details explain or prove the main idea.","Skimming previews a text; scanning locates a specific detail.","A summary uses your own words and includes only essential ideas.","A good summary preserves the original meaning."],
      "nextStepText":"Use the passage and your reading strategy in the 10-question challenge."
    }
  ]
  $json$::jsonb,
  $json$
  [
    {"question":"What is the topic of the passage?","options":["How to grow fruit","Protecting Ghana's forests","The history of timber","Animals in classrooms"],"correct":2,"hint":"The topic is the broad subject repeated throughout.","explanation":"Every paragraph discusses Ghana's forests, their value, threats or protection."},
    {"question":"Which sentence best states the passage's main idea?","options":["Trees produce only timber.","Forest protection needs responsible action because forests are valuable and threatened.","Schools should replace government agencies.","Bush fires are the only threat to forests."],"correct":2,"hint":"Choose the statement that covers the entire passage.","explanation":"The passage combines forest value, threats and shared protection."},
    {"question":"Which detail best supports the claim that forests protect the environment?","options":["Trees can provide fruits.","Leaves help cool the air and roots hold soil.","Schools have classrooms.","Traditional leaders hold meetings."],"correct":2,"hint":"Look for an environmental function.","explanation":"Cooling air and preventing soil loss directly support environmental protection."},
    {"question":"According to the passage, what is one result of losing too many trees?","options":["Animals gain more habitats.","Soil may be washed away.","More carbon dioxide is removed.","Forest cover increases."],"correct":2,"hint":"Review the second paragraph.","explanation":"The passage states that tree loss can lead to soil erosion."},
    {"question":"Why does the writer mention schools nurturing seedlings?","options":["To give an example of how schools can protect forests","To prove seedlings are expensive","To change the topic to school uniforms","To show only children are responsible"],"correct":1,"hint":"Decide which main point the example supports.","explanation":"It is one practical example of shared forest protection."},
    {"question":"Which action should happen first when summarising?","options":["Copy every sentence","Identify the topic and main idea","Add a new personal opinion","List minor examples"],"correct":2,"hint":"A summary needs a clear central message.","explanation":"Identifying the topic and main idea guides the selection of key details."},
    {"question":"Which sentence is least important in a short summary of the passage?","options":["Forests support people, wildlife and climate.","Harmful activities reduce forest cover.","Trees provide ingredients used in medicine.","People must protect forests responsibly."],"correct":3,"hint":"Choose the narrow example rather than a major idea.","explanation":"Medicine is a useful detail, but it is less essential than the passage's major ideas."},
    {"question":"What does “shared responsibility” mean in the final paragraph?","options":["Only government should act.","Different people and groups must work together.","No one is responsible.","Forests should be privately owned."],"correct":2,"hint":"Use the examples of communities, schools and leaders.","explanation":"The phrase means protection requires contributions from many groups."},
    {"question":"Which is the best summary sentence for paragraph two?","options":["Some human activities reduce forests and cause environmental harm.","Animals live in many places.","Farmers always destroy forests.","Carbon dioxide is a type of gas."],"correct":1,"hint":"Include both the cause and main effect.","explanation":"The sentence captures the paragraph's threat-and-effect structure accurately."},
    {"question":"What must a good summary avoid?","options":["The central idea","Important supporting points","Unnecessary details and personal opinions","The writer's original meaning"],"correct":3,"hint":"A summary is concise and faithful to the text.","explanation":"Unnecessary details and personal opinions make a summary less accurate and concise."}
  ]
  $json$::jsonb
),
(
  'lesson-science-simple-circuits-b6',
  'science',
  'subject-science',
  'Science',
  'Explore matter, systems, energy and the environment through inquiry.',
  'flask-conical',
  '#16A34A',
  'unit-science-electricity-b6',
  'Forces and Energy',
  'forces-and-energy-basic-6',
  'Investigate electricity, circuits and the behaviour of materials.',
  'topic-science-circuits-b6',
  'Simple Electric Circuits',
  'simple-electric-circuits-basic-6',
  'Build circuits and classify conductors and insulators.',
  'Circuit Lab: Make Electricity Flow',
  'circuit-lab-make-electricity-flow',
  'Build and represent a simple circuit, then investigate conductors and insulators safely.',
  'Identify circuit components and symbols, explain open and closed circuits, and classify materials through fair testing.',
  'B6.4.2.1.1; B6.4.2.1.2; B6.4.2.1.3',
  30,
  170,
  $json$
  [
    {
      "id":"science-b6-intro","type":"lesson_intro","order":1,"required":true,"estimatedSeconds":60,
      "title":"Power the Circuit Lab",
      "shortDescription":"Create a complete path for current and test which materials allow it through.",
      "objectives":["Name the components of a simple electric circuit.","Explain open and closed circuits.","Use standard ideas to represent a circuit diagram.","Classify conductors and insulators through a fair test."],
      "estimatedMinutes":30,"rewardPreview":{"xp":170,"starsAvailable":3}
    },
    {
      "id":"science-b6-section-1","type":"section_break","order":2,"required":true,
      "heading":"Stage 1: Build a complete circuit",
      "description":"Follow energy from the cell through a closed path."
    },
    {
      "id":"science-b6-text-1","type":"text","order":3,"required":true,"estimatedSeconds":330,
      "heading":"Every component has a job",
      "body":"A simple circuit needs a **cell or battery**, **connecting wires**, a **load** such as a bulb, and often a **switch**.\n\nThe cell supplies electrical energy. Wires provide a conducting path. The bulb transforms electrical energy into light and heat. The switch controls the path.\n\nA **closed circuit** has an unbroken path, so current can flow and the bulb lights. An **open circuit** has a gap, so current cannot complete the journey.\n\nCircuit diagrams use agreed symbols instead of realistic drawings. Symbols make circuits quicker to draw and easier for scientists everywhere to understand.\n\n[warning]Use only low-voltage cells in supervised classroom investigations. Never experiment with wall sockets or mains electricity.[/warning]",
      "emphasisTerms":["cell","load","closed circuit","open circuit","symbol"]
    },
    {
      "id":"science-b6-video-1","type":"video","order":4,"required":true,"estimatedSeconds":300,
      "source":"https://www.youtube.com/watch?v=x4pdzG-DHnY","provider":"youtube",
      "title":"Setting Up a Simple Circuit",
      "caption":"Observe how each connection completes the path from one terminal to the other.",
      "participationPrompt":"Which connection is required before the bulb can light?",
      "participationOptions":[{"id":"a","label":"A","text":"A complete connection back to the other battery terminal"},{"id":"b","label":"B","text":"A cup of water beside the bulb"},{"id":"c","label":"C","text":"A second table under the circuit"}],
      "participationCorrectOptionId":"a",
      "participationExplanation":"The bulb lights only when the wires create a complete path between both battery terminals.",
      "participationXp":10
    },
    {
      "id":"science-b6-section-2","type":"section_break","order":5,"required":true,
      "heading":"Stage 2: Test materials",
      "description":"Use evidence to distinguish conductors from insulators."
    },
    {
      "id":"science-b6-text-2","type":"text","order":6,"required":true,"estimatedSeconds":300,
      "heading":"Conductors and insulators",
      "body":"A **conductor** allows electric current to pass through it easily. Many metals, including copper, aluminium and iron, are good conductors.\n\nAn **insulator** strongly resists current. Plastic, dry wood, rubber and glass are common insulators. Electrical wires combine both properties: a conducting metal core carries current, while an insulating plastic coating helps protect users.\n\nTo test a material, create a small gap in a working circuit and place the sample in that gap. If the bulb lights, the sample conducts. Change only the sample each time so the investigation is fair.",
      "emphasisTerms":["conductor","insulator","fair test","evidence"]
    },
    {
      "id":"science-b6-video-2","type":"video","order":7,"required":true,"estimatedSeconds":300,
      "source":"https://www.youtube.com/watch?v=iZ6IQ51u6T8","provider":"youtube",
      "title":"Conductors and Insulators",
      "caption":"Compare the material examples with objects found safely around your classroom.",
      "participationPrompt":"Which prediction about the metal spoon and plastic ruler is correct?",
      "participationOptions":[{"id":"a","label":"A","text":"Both will complete it equally well"},{"id":"b","label":"B","text":"The plastic ruler will complete it, but the spoon will not"},{"id":"c","label":"C","text":"The metal spoon should complete it, but the plastic ruler should not"}],
      "participationCorrectOptionId":"c",
      "participationExplanation":"Metal is normally a conductor, while plastic is an insulator.",
      "participationXp":10
    },
    {
      "id":"science-b6-example","type":"worked_example","order":8,"required":true,"estimatedSeconds":240,
      "title":"Plan a fair conductivity test",
      "problem":"Kojo wants to test a coin, plastic ruler, wooden stick and aluminium foil. How should he make the results trustworthy?",
      "orderedSteps":["First confirm that the cell, wires and bulb form a working circuit.","Create one test gap in the circuit.","Place one sample across the same gap each time.","Keep the cell, bulb, wires and contact positions unchanged.","Record whether the bulb lights, then classify the sample."],
      "finalAnswer":"Change only the test material and keep every other circuit condition the same.",
      "explanation":"Controlling variables makes the material the only likely cause of any change in the bulb."
    },
    {
      "id":"science-b6-summary","type":"summary","order":9,"required":true,"estimatedSeconds":75,
      "heading":"Circuit lab recap",
      "keyPoints":["Current needs a complete conducting path.","Cells supply energy; loads transform it.","A switch opens or closes the circuit.","Standard symbols communicate circuit designs.","Conductors pass current; insulators resist it.","A fair test changes one variable at a time."],
      "nextStepText":"Complete the 10-question lab check to earn your circuit badge."
    }
  ]
  $json$::jsonb,
  $json$
  [
    {"question":"Which component supplies energy to a simple circuit?","options":["Cell","Switch","Wire","Bulb holder"],"correct":1,"hint":"It has positive and negative terminals.","explanation":"A cell or battery supplies electrical energy to the circuit."},
    {"question":"What happens in a closed circuit?","options":["There is a gap and no current flows.","Current has a complete path.","The cell is removed.","All materials become insulators."],"correct":2,"hint":"Think of the word complete.","explanation":"A closed circuit provides an unbroken conducting path."},
    {"question":"What is the main job of a switch?","options":["Produce electricity","Open or close the circuit","Make wires longer","Change metal into plastic"],"correct":2,"hint":"A switch controls the path.","explanation":"The switch controls current by breaking or completing the circuit."},
    {"question":"Why are standard circuit symbols useful?","options":["They make cells stronger.","They make diagrams clear and widely understood.","They prevent every electric shock.","They replace all real components."],"correct":2,"hint":"Scientists need a common visual language.","explanation":"Standard symbols communicate circuit arrangements clearly and efficiently."},
    {"question":"Which material is most likely a good electrical conductor?","options":["Rubber band","Plastic ruler","Aluminium foil","Dry wooden stick"],"correct":3,"hint":"Many metals conduct electricity.","explanation":"Aluminium is a metal and is a good conductor."},
    {"question":"Why is electrical wire covered with plastic?","options":["Plastic conducts better than copper.","Plastic is an insulator that helps protect users.","Plastic produces energy.","Plastic makes the circuit open."],"correct":2,"hint":"The coating should resist current.","explanation":"The conducting metal carries current while the plastic insulation reduces unsafe contact."},
    {"question":"A bulb does not light in a newly built circuit. What should be checked first?","options":["Whether the path is complete and contacts are secure","The colour of the table","The pupil's handwriting","The room temperature only"],"correct":1,"hint":"Current needs an unbroken path.","explanation":"Loose contacts or gaps are common reasons a simple circuit fails."},
    {"question":"In a fair conductivity test, what should be changed each time?","options":["The cell and bulb","Only the material being tested","Every wire position","The full circuit design"],"correct":2,"hint":"A fair test changes one variable.","explanation":"Keeping all other conditions constant links the result to the test material."},
    {"question":"If a bulb lights when a coin bridges the test gap, what is the best conclusion?","options":["The coin is an insulator.","The coin conducts electricity under the test conditions.","The bulb has no energy.","Every coin must be plastic."],"correct":2,"hint":"The sample completed the current path.","explanation":"The lit bulb provides evidence that current passed through the coin."},
    {"question":"Which classroom action is safe?","options":["Opening a wall socket","Testing with mains electricity","Using a low-voltage cell under supervision","Touching bare wires connected to the mains"],"correct":3,"hint":"Choose the low-voltage supervised investigation.","explanation":"Simple classroom circuits should use low-voltage cells with appropriate supervision."}
  ]
  $json$::jsonb
);

WITH admin_user AS (
  SELECT id
  FROM auth.users
  WHERE lower(email) = 'gh-233507410361@phone.skulkid.app'
     OR raw_app_meta_data ->> 'role' = 'admin'
  ORDER BY
    CASE WHEN lower(email) = 'gh-233507410361@phone.skulkid.app' THEN 0 ELSE 1 END,
    created_at
  LIMIT 1
),
prepared AS (
  SELECT
    seed.*,
    to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS iso_now,
    seed.id || '-v1' AS version_id,
    seed.id || '-objective-1' AS objective_id,
    seed.instructional_blocks
      || pg_temp.grade6_quiz_blocks(
           seed.questions,
           seed.id || '-objective-1',
           seed.id,
           jsonb_array_length(seed.instructional_blocks) + 1
         ) AS all_blocks
  FROM grade6_lesson_seed seed
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
        'gradeLevels', jsonb_build_array(6),
        'order', CASE p.subject_slug WHEN 'mathematics' THEN 1 WHEN 'english-language' THEN 2 ELSE 3 END,
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
        'order', 1,
        'prerequisiteLessonId', NULL,
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
        'objectiveSummary', p.objective || ' Curriculum indicators: ' || p.curriculum_codes || '.',
        'difficulty', 'developing',
        'estimatedMinutes', p.minutes,
        'baseXpReward', p.xp,
        'passingScore', 60,
        'masteryScore', 80,
        'maximumLessonRedos', 2,
        'publishedAt', p.iso_now,
        'learningObjectives', jsonb_build_array(jsonb_build_object(
          'id', p.objective_id,
          'lessonVersionId', p.version_id,
          'code', split_part(p.curriculum_codes, ';', 1),
          'description', p.objective,
          'order', 1
        )),
        'blocks', p.all_blocks,
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
  0,
  jsonb_build_object(
    'id', r.id,
    'subject', r.subject_slug,
    'courseId', r.course_id,
    'unitId', r.unit_id,
    'topicId', r.topic_id,
    'grade', 6,
    'unit', r.unit_name,
    'chapter', r.topic_name,
    'topic', r.topic_name,
    'title', r.title,
    'description', r.short_description,
    'estimatedMinutes', r.minutes,
    'xp', r.xp,
    'questionCount', 10,
    'format', 'text',
    'prerequisiteLessonId', NULL,
    'gamification', jsonb_build_object(
      'passingScore', 60,
      'masteryScore', 80,
      'maximumAttempts', 2,
      'lessonRetries', 2,
      'maximumXp', r.xp,
      'badge', CASE r.subject_slug
        WHEN 'mathematics' THEN 'Fraction Pathfinder'
        WHEN 'english-language' THEN 'Reading Detective'
        ELSE 'Circuit Scientist'
      END
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

-- Verification: exactly 3 published Grade 6 lessons and 10 quiz questions each.
SELECT
  "record" ->> 'subject' AS subject,
  "record" ->> 'title' AS lesson,
  ("record" ->> 'grade')::integer AS grade,
  ("record" ->> 'questionCount')::integer AS quiz_questions,
  "status"
FROM public."AdminLessonRecord"
WHERE "id" IN (
  'lesson-math-fractions-decimals-percent-b6',
  'lesson-english-main-idea-summary-b6',
  'lesson-science-simple-circuits-b6'
)
ORDER BY subject;

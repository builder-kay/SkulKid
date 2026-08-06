/**
 * Patches Teacher Kay seed SQL files to be video-rich (≈90% video / 10% text)
 * with real 10-question quizzes (distinct MC / T/F options).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { basic6Quiz, basic6Videos, V, YT, TT } from "./teacher-kay-video-quiz-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedsDir = path.join(__dirname, "..", "supabase", "seeds");

const BASIC_TOPICS = [
  "Counting, Representation, Cardinality and Ordinality",
  "Number Operations and Fractions",
  "Patterns and Relationships",
  "Expressions, Variables and Equations",
  "2D and 3D Shapes",
  "Geometric Reasoning and Transformation",
  "Perimeter, Area and Volume",
  "Time and Angles",
  "Data Collection and Line Graphs",
  "Chance and Probability",
  "Storytelling, Drama and Conversation",
  "Listening, Questions and Presentation",
  "Word Study and Vocabulary",
  "Comprehension and Fluency",
  "Word Classes",
  "Phrases and Reported Speech",
  "Planning and Paragraph Development",
  "Creative and Functional Writing",
  "Capitalisation, Punctuation and Spelling",
  "Independent and Critical Reading",
  "Living and Non-Living Things",
  "Materials",
  "Earth Science",
  "Life Cycles of Organisms",
  "Human Body Systems",
  "Solar Systems and Ecosystems",
  "Sources and Forms of Energy",
  "Electricity, Electronics and Movement",
  "Hygiene and Diseases",
  "Science, Industry and Climate Change",
  "Computer Generations and Components",
  "Windows, Data and Community Technology",
  "PowerPoint Interface",
  "Designing Effective Slides",
  "Word-Processing Interface",
  "Creating School Documents",
  "Databases, Algorithms and Programming",
  "Electronic Spreadsheets",
  "Networks, Browsers and Online Communication",
  "IoT, Digital Literacy and Safe Use",
];

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function quizToSqlJson(quiz) {
  return JSON.stringify(quiz);
}

function buildBasic6MediaBank() {
  const obj = {};
  for (const topic of BASIC_TOPICS) {
    obj[topic] = {
      videos: basic6Videos(topic).map((url, i) => ({
        url,
        provider: url.includes("tiktok.com") ? "tiktok" : "youtube",
        title: i === 0 ? "Watch lesson video 1" : i === 1 ? "Watch lesson video 2" : "Bonus watch",
      })),
      quiz: basic6Quiz(topic),
    };
  }
  return obj;
}

function lifeSkillsQuiz(lessonTitle, subjectKey, strandName) {
  const t = lessonTitle;
  const s = subjectKey;
  // Unique, lesson-tied options (not identical distractors across questions).
  return [
    {
      prompt: `What is the main idea of “${t}”?`,
      type: "multiple_choice",
      options: [
        `Practise the skill of ${t.toLowerCase()} with care for others and yourself`,
        `Ignore ${t.toLowerCase()} because feelings never matter`,
        `Use ${t.toLowerCase()} only to win arguments unfairly`,
        `Avoid learning anything related to ${strandName.toLowerCase()}`,
      ],
      correctIndex: 0,
      explanation: `${t} is a skill to understand and practise thoughtfully.`,
    },
    {
      prompt: `In a Grade 6 situation about “${t}”, what is the healthiest first step?`,
      type: "multiple_choice",
      options: [
        "Pause, notice facts and feelings, then choose a safe respectful action",
        "Shout first so everyone listens to you",
        "Post the problem publicly to embarrass someone",
        "Pretend nothing happened and never reflect",
      ],
      correctIndex: 0,
      explanation: "A pause creates space for a better choice.",
    },
    {
      prompt: `Which response best shows respect while practising “${t}”?`,
      type: "multiple_choice",
      options: [
        "Speak calmly, listen, and keep dignity for everyone involved",
        "Insult the other person so you feel powerful",
        "Force your idea and refuse to hear other views",
        "Share private details to get attention",
      ],
      correctIndex: 0,
      explanation: "Respect pairs honesty with care.",
    },
    {
      prompt: `True or false: “${t}” can improve with practice and reflection.`,
      type: "true_false",
      options: ["True", "False"],
      correctIndex: 0,
      explanation: "Life skills grow with deliberate practice.",
    },
    {
      prompt: `Before deciding in a “${t}” moment, you should consider:`,
      type: "multiple_choice",
      options: [
        "Safety, facts, feelings, choices, consequences and support",
        "Only what makes you look popular online",
        "Only the fastest way to end the conversation",
        "Only what your loudest classmate demands",
      ],
      correctIndex: 0,
      explanation: "Good decisions weigh several factors.",
    },
    {
      prompt: `Which choice is an unhelpful reaction to a challenge about “${t}”?`,
      type: "multiple_choice",
      options: [
        "Blaming everyone else and refusing to learn",
        "Asking a clarifying question",
        "Trying one small respectful action",
        "Reviewing what worked last time",
      ],
      correctIndex: 0,
      explanation: "Blame without learning blocks growth.",
    },
    {
      prompt: `How can you communicate a decision related to “${t}” clearly?`,
      type: "multiple_choice",
      options: [
        "Use specific words, a calm tone, and a clear request",
        "Use insults so the message feels stronger",
        "Stay silent forever even when safety is at risk",
        "Send anonymous mean notes",
      ],
      correctIndex: 0,
      explanation: "Clarity + calm improves understanding.",
    },
    {
      prompt: `When should a trusted adult help with a “${t}” situation?`,
      type: "multiple_choice",
      options: [
        "When someone may be harmed, boundaries are ignored, or it feels unsafe",
        "Never, even in dangerous situations",
        "Only to get someone punished unfairly",
        "Only if you want gossip spread",
      ],
      correctIndex: 0,
      explanation: "Adults help protect safety and wellbeing.",
    },
    {
      prompt: `True or false: In “${t}”, popularity is more important than safety and respect.`,
      type: "true_false",
      options: ["True", "False"],
      correctIndex: 1,
      explanation: "Safety and respect come first.",
    },
    {
      prompt: `Which personal action plan fits “${t}” in ${s.replace(/-/g, " ")}?`,
      type: "multiple_choice",
      options: [
        `I will practise one specific action from “${t}” this week and review how it went`,
        "I will promise everything and practise nothing",
        "I will copy unsafe behaviour because friends did it",
        "I will avoid all reflection forever",
      ],
      correctIndex: 0,
      explanation: "Specific practice beats empty promises.",
    },
  ];
}

function lifeSkillsVideos(subjectKey, lessonIndex) {
  const pools = {
    friendship: [V.empathy, V.growthMindset, V.speaking, V.calmTalk, V.phonics],
    "growth-confidence": [V.growthMindset, V.studySkills, V.calmTalk, V.empathy, V.speaking],
    "emotional-wellbeing": [V.empathy, V.calmTalk, V.growthMindset, V.speaking, V.studySkills],
    "communication-leadership": [V.speaking, V.empathy, V.growthMindset, V.calmTalk, V.studySkills],
    "study-digital-balance": [V.studySkills, V.computing, V.spreadsheets, V.growthMindset, V.speaking],
  };
  const pool = pools[subjectKey] || [V.empathy, V.growthMindset, V.studySkills];
  const a = pool[lessonIndex % pool.length];
  const b = pool[(lessonIndex + 2) % pool.length];
  const c = pool[(lessonIndex + 4) % pool.length];
  if (lessonIndex % 5 === 0) {
    return [a, b, V.tiktokScience];
  }
  return [a, b, c];
}

const VISUAL_LESSONS = [
  {
    title: "The Water Cycle From Above",
    videos: [V.waterCycle, V.waterCycle2, V.waterCycle3],
    quiz: [
      { prompt: "What is evaporation?", type: "multiple_choice", options: ["Water turning into vapour", "Water freezing only", "Rocks melting", "Soil vanishing"], correctIndex: 0, explanation: "Heat turns liquid water into vapour." },
      { prompt: "Condensation helps form:", type: "multiple_choice", options: ["Clouds from tiny droplets", "Only mountains", "Only magnets", "Only plastic"], correctIndex: 0, explanation: "Cooling vapour forms droplets." },
      { prompt: "Precipitation can be:", type: "multiple_choice", options: ["Rain, hail or snow", "Only sunlight", "Only wind names", "Only soil colour"], correctIndex: 0, explanation: "Water falling from clouds." },
      { prompt: "True or false: The water cycle is continuous.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "It repeats." },
      { prompt: "Collection means water gathers in:", type: "multiple_choice", options: ["Rivers, lakes, oceans and ground", "Only books", "Only apps", "Only desks"], correctIndex: 0, explanation: "Water collects on Earth." },
      { prompt: "Which energy source drives much of the cycle?", type: "multiple_choice", options: ["The Sun", "A classroom bell", "A pencil", "A ruler"], correctIndex: 0, explanation: "Solar heating." },
      { prompt: "True or false: Plants can release water vapour (transpiration).", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Transpiration adds vapour." },
      { prompt: "A good observation question is:", type: "multiple_choice", options: ["Where do I see water moving?", "What is my favourite font?", "How loud is silence?", "What colour is Tuesday?"], correctIndex: 0, explanation: "Link seeing to the cycle." },
      { prompt: "Clouds form mainly after:", type: "multiple_choice", options: ["Condensation", "Printing a document", "Solving an equation only", "Kicking a ball only"], correctIndex: 0, explanation: "Condensation builds clouds." },
      { prompt: "Why watch videos of the cycle?", type: "multiple_choice", options: ["To see processes that are hard to notice all at once", "To avoid learning", "To skip science", "To ignore evidence"], correctIndex: 0, explanation: "Media makes processes visible." },
    ],
  },
  {
    title: "Clouds Tell a Weather Story",
    videos: [V.clouds, V.waterCycle4, V.waterCycle],
    quiz: [
      { prompt: "Clouds are made of:", type: "multiple_choice", options: ["Tiny water droplets or ice crystals", "Solid metal sheets", "Only plastic bags", "Only dust with no water"], correctIndex: 0, explanation: "Condensed water." },
      { prompt: "Cloud shape and colour can give clues about:", type: "multiple_choice", options: ["Changing weather", "Maths scores only", "Shoe sizes", "App passwords"], correctIndex: 0, explanation: "Visual weather clues." },
      { prompt: "True or false: All clouds look exactly the same.", type: "true_false", options: ["True", "False"], correctIndex: 1, explanation: "Clouds vary." },
      { prompt: "Careful observation means:", type: "multiple_choice", options: ["Noticing height, colour and shape", "Guessing with eyes closed", "Ignoring the sky", "Only reading the title"], correctIndex: 0, explanation: "Use visible evidence." },
      { prompt: "Water vapour cools and becomes:", type: "multiple_choice", options: ["Droplets or crystals", "Instant rock", "Pure electricity", "A computer file"], correctIndex: 0, explanation: "Condensation products." },
      { prompt: "True or false: Photos can help compare cloud types.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Images support comparison." },
      { prompt: "Weather is different from climate because weather is:", type: "multiple_choice", options: ["Shorter-term conditions", "Always a 100-year average only", "Only the colour of soil", "Only ocean salt"], correctIndex: 0, explanation: "Weather is day-to-day." },
      { prompt: "A dark heavy cloud may suggest:", type: "multiple_choice", options: ["Possible rain soon", "Guaranteed sunshine forever", "No water in the sky", "Instant summer"], correctIndex: 0, explanation: "Possible precipitation." },
      { prompt: "Why pause a weather video?", type: "multiple_choice", options: ["To name details you see", "To skip learning", "To avoid evidence", "To close your eyes"], correctIndex: 0, explanation: "Pause to observe." },
      { prompt: "Best scientist habit here:", type: "multiple_choice", options: ["Observe, describe, then explain", "Invent facts with no look", "Ignore the sky", "Copy random answers"], correctIndex: 0, explanation: "Evidence first." },
    ],
  },
  {
    title: "Landscapes Shaped by Water",
    videos: [V.rocksSoil, V.waterCycle3, V.foodWebs],
    quiz: [
      { prompt: "Moving water can:", type: "multiple_choice", options: ["Weather rock and carry sediment", "Create Wi-Fi", "Write essays", "Stop gravity"], correctIndex: 0, explanation: "Erosion and transport." },
      { prompt: "Sediment is:", type: "multiple_choice", options: ["Bits of rock and soil carried and dropped", "A type of cloud only", "A computer virus", "A punctuation mark"], correctIndex: 0, explanation: "Moved particles." },
      { prompt: "True or false: River bends can change over time.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Water reshapes land." },
      { prompt: "Smooth stones in a river often show:", type: "multiple_choice", options: ["Long tumbling and wearing", "They were never moved", "They are clouds", "They are plants"], correctIndex: 0, explanation: "Abrasion rounds edges." },
      { prompt: "Coastlines can change because of:", type: "multiple_choice", options: ["Waves and currents", "Only spelling tests", "Only silent reading", "Only folder names"], correctIndex: 0, explanation: "Coastal processes." },
      { prompt: "True or false: Deposition is dropping sediment somewhere else.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Dropping carried material." },
      { prompt: "Valleys can be shaped by:", type: "multiple_choice", options: ["Flowing water over time", "One second of wind only always", "A single pencil mark", "A ringtone"], correctIndex: 0, explanation: "Long-term erosion." },
      { prompt: "Compare images to find:", type: "multiple_choice", options: ["Differences in land shapes", "Hidden passwords", "Favourite fonts", "App icons only"], correctIndex: 0, explanation: "Visual comparison." },
      { prompt: "Weathering means rocks:", type: "multiple_choice", options: ["Break down into smaller pieces", "Become animals", "Turn into apps", "Gain Wi-Fi"], correctIndex: 0, explanation: "Breakdown of rock." },
      { prompt: "Why use video for landscapes?", type: "multiple_choice", options: ["Motion shows how water changes places", "Videos remove evidence", "Videos stop observation", "Videos hide science"], correctIndex: 0, explanation: "Process becomes visible." },
    ],
  },
  {
    title: "Plant Parts in Close-up",
    videos: [V.plants, V.scienceMix, V.foodChains],
    quiz: [
      { prompt: "Roots mainly:", type: "multiple_choice", options: ["Absorb water and anchor the plant", "Take photos", "Make thunder", "Write code"], correctIndex: 0, explanation: "Root jobs." },
      { prompt: "Leaves help many plants:", type: "multiple_choice", options: ["Capture light for food-making", "Swim oceans", "Orbit planets", "Print documents"], correctIndex: 0, explanation: "Photosynthesis support." },
      { prompt: "Stems mainly:", type: "multiple_choice", options: ["Support and transport", "Only scare insects with sound", "Only melt ice", "Only store Wi-Fi"], correctIndex: 0, explanation: "Support + transport." },
      { prompt: "True or false: Flowers help many plants reproduce.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Reproductive structures." },
      { prompt: "Form supports function means:", type: "multiple_choice", options: ["A part’s shape matches its job", "Parts have no jobs", "Plants dislike water", "Leaves avoid light always"], correctIndex: 0, explanation: "Structure–function." },
      { prompt: "Close-up images help you:", type: "multiple_choice", options: ["Notice details of plant parts", "Ignore science", "Skip observation", "Delete evidence"], correctIndex: 0, explanation: "Detail seeing." },
      { prompt: "True or false: All plant parts do exactly the same job.", type: "true_false", options: ["True", "False"], correctIndex: 1, explanation: "Different parts, different jobs." },
      { prompt: "Which part is usually underground?", type: "multiple_choice", options: ["Roots", "Flowers always", "Only petals", "Only fruit skins always"], correctIndex: 0, explanation: "Roots below." },
      { prompt: "A good observation note says:", type: "multiple_choice", options: ["What you see and what job it may do", "Only a random joke", "Only a password", "Only a score"], correctIndex: 0, explanation: "Link evidence to function." },
      { prompt: "Why watch plant videos?", type: "multiple_choice", options: ["To connect visible parts to life processes", "To avoid plants", "To skip learning", "To hide details"], correctIndex: 0, explanation: "Media + meaning." },
    ],
  },
  {
    title: "Animal Adaptations on Camera",
    videos: [V.animals, V.foodWebs, V.foodChains],
    quiz: [
      { prompt: "An adaptation helps a living thing:", type: "multiple_choice", options: ["Survive in its environment", "Fail on purpose", "Avoid all food", "Stop moving forever"], correctIndex: 0, explanation: "Survival feature/behaviour." },
      { prompt: "Body coverings can help with:", type: "multiple_choice", options: ["Protection, warmth or camouflage", "Writing essays", "Coding apps", "Spelling only"], correctIndex: 0, explanation: "Covering functions." },
      { prompt: "True or false: You should use visible evidence before deciding what an adaptation does.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Evidence first." },
      { prompt: "Feeding structures are adapted for:", type: "multiple_choice", options: ["Getting food", "Playing football only", "Reading novels only", "Drawing maps only"], correctIndex: 0, explanation: "Diet-related structures." },
      { prompt: "Camouflage helps many animals:", type: "multiple_choice", options: ["Blend into surroundings", "Become louder", "Grow Wi-Fi", "Learn algebra instantly"], correctIndex: 0, explanation: "Hide/blend." },
      { prompt: "True or false: Movement styles can be adaptations.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "e.g. swimming, flying." },
      { prompt: "Comparing animals on camera helps you:", type: "multiple_choice", options: ["Notice different survival features", "Ignore differences", "Skip science", "Delete clues"], correctIndex: 0, explanation: "Compare evidence." },
      { prompt: "A behaviour adaptation example is:", type: "multiple_choice", options: ["Migrating or hunting in groups", "Turning into a rock instantly", "Becoming a cloud", "Becoming a spreadsheet"], correctIndex: 0, explanation: "Behavioural strategies." },
      { prompt: "Habitats provide:", type: "multiple_choice", options: ["Food, water, shelter and space", "Only ringtones", "Only passwords", "Only fonts"], correctIndex: 0, explanation: "Basic needs." },
      { prompt: "Best claim about an adaptation:", type: "multiple_choice", options: ["One linked to observed features", "A wild guess with no look", "Copying a joke", "Ignoring the video"], correctIndex: 0, explanation: "Evidence-based claims." },
    ],
  },
  {
    title: "Tiny Habitats, Big Communities",
    videos: [V.foodWebs, V.foodChains, V.foodComp],
    quiz: [
      { prompt: "A habitat provides:", type: "multiple_choice", options: ["Food, water, shelter and space", "Only homework", "Only Wi-Fi passwords", "Only trophies"], correctIndex: 0, explanation: "Needs for life." },
      { prompt: "Even a small pond can:", type: "multiple_choice", options: ["Support many connected organisms", "Support zero life always", "Create planets", "Stop sunlight forever"], correctIndex: 0, explanation: "Small habitats matter." },
      { prompt: "True or false: Organisms in a habitat can depend on each other.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Interdependence." },
      { prompt: "A community in nature means:", type: "multiple_choice", options: ["Living things sharing an area", "Only one rock alone", "Only one app", "Only one desk"], correctIndex: 0, explanation: "Shared living space." },
      { prompt: "Looking closely helps you:", type: "multiple_choice", options: ["Find organisms you might miss", "Skip details", "Avoid science", "Hide evidence"], correctIndex: 0, explanation: "Close observation." },
      { prompt: "True or false: A tree can be part of a habitat.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Trees shelter many lives." },
      { prompt: "Food connections in a habitat are shown by:", type: "multiple_choice", options: ["Food chains and webs", "Only spelling lists", "Only page numbers", "Only ringtones"], correctIndex: 0, explanation: "Feeding links." },
      { prompt: "If shelter disappears, many organisms may:", type: "multiple_choice", options: ["Struggle to survive", "Need less food forever automatically", "Stop needing water", "Become non-living instantly safely"], correctIndex: 0, explanation: "Shelter matters." },
      { prompt: "A garden patch is:", type: "multiple_choice", options: ["A possible tiny habitat", "Never a habitat", "Only a spreadsheet", "Only a cloud"], correctIndex: 0, explanation: "Local habitats." },
      { prompt: "Why use video here?", type: "multiple_choice", options: ["To see many organisms and interactions quickly", "To avoid looking", "To erase communities", "To skip evidence"], correctIndex: 0, explanation: "Rich visual evidence." },
    ],
  },
  {
    title: "A Visual Tour of the Solar System",
    videos: [V.solarSystem, V.solarSystem2, V.scienceMix],
    quiz: [
      { prompt: "The solar system’s centre is the:", type: "multiple_choice", options: ["Sun", "Moon", "Earth only", "Mars only"], correctIndex: 0, explanation: "Sun-centred system." },
      { prompt: "Planets orbit the Sun because of:", type: "multiple_choice", options: ["Gravity and motion", "Homework", "Wi-Fi", "Punctuation"], correctIndex: 0, explanation: "Orbital physics basics." },
      { prompt: "True or false: Classroom diagrams may change scale so everything fits.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Scale is often adjusted." },
      { prompt: "Moons orbit:", type: "multiple_choice", options: ["Planets", "Only apps", "Only clouds", "Only desks"], correctIndex: 0, explanation: "Natural satellites." },
      { prompt: "Earth is special for us because:", type: "multiple_choice", options: ["It supports life as we know it", "It is the hottest star", "It has no atmosphere ever", "It is not a planet"], correctIndex: 0, explanation: "Habitable planet." },
      { prompt: "True or false: There are eight planets in our solar system.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Eight recognised planets." },
      { prompt: "Comparing planet images helps you notice:", type: "multiple_choice", options: ["Size, colour and surface clues", "Only spellings", "Only fonts", "Only passwords"], correctIndex: 0, explanation: "Visual comparison." },
      { prompt: "The Sun provides Earth with:", type: "multiple_choice", options: ["Light and heat energy", "Only homework sheets", "Only plastic", "Only silence"], correctIndex: 0, explanation: "Solar energy." },
      { prompt: "A smaller body in the solar system could be:", type: "multiple_choice", options: ["An asteroid or comet", "A classroom chair", "A textbook only", "A football pitch"], correctIndex: 0, explanation: "Minor bodies." },
      { prompt: "Best learning tip for space videos:", type: "multiple_choice", options: ["Pause and compare features carefully", "Watch with eyes closed", "Ignore labels", "Skip all visuals"], correctIndex: 0, explanation: "Active watching." },
    ],
  },
  {
    title: "Light Up a Simple Circuit",
    videos: [V.circuit, V.electricity, V.energy],
    quiz: [
      { prompt: "A lamp lights when:", type: "multiple_choice", options: ["A complete conducting path lets current flow", "There is always a permanent gap", "Only wood is used as wire", "No cell is present"], correctIndex: 0, explanation: "Closed circuit." },
      { prompt: "An open circuit has:", type: "multiple_choice", options: ["A gap that stops current", "Guaranteed light always", "No need for a path", "Only magnets as fuel"], correctIndex: 0, explanation: "Gap = open." },
      { prompt: "True or false: Classroom circuits should use safe cells, not wall electricity.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Safety first." },
      { prompt: "A conductor example is:", type: "multiple_choice", options: ["Metal wire", "Dry rubber glove", "Plastic coating alone", "Wood block alone"], correctIndex: 0, explanation: "Metals conduct well." },
      { prompt: "A cell in a simple circuit acts as:", type: "multiple_choice", options: ["An energy source", "A cloud", "A planet", "A paragraph"], correctIndex: 0, explanation: "Provides energy." },
      { prompt: "True or false: Insulators help keep current on a safe path.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Coatings protect." },
      { prompt: "If the lamp is off but parts look connected, check for:", type: "multiple_choice", options: ["A hidden gap, loose wire or dead cell", "The moon phase only", "Spelling errors only", "Favourite colours only"], correctIndex: 0, explanation: "Troubleshoot path/source." },
      { prompt: "Current needs:", type: "multiple_choice", options: ["A closed loop path", "An endless open gap", "Only silence", "Only sunlight labels"], correctIndex: 0, explanation: "Complete path." },
      { prompt: "Watching a circuit demo helps you:", type: "multiple_choice", options: ["See cause and effect safely", "Touch wall sockets", "Skip safety", "Guess without looking"], correctIndex: 0, explanation: "Visual cause–effect." },
      { prompt: "Best safety rule:", type: "multiple_choice", options: ["Never use mains electricity for this lesson", "Use wall outlets for toy bulbs always", "Ignore teacher instructions", "Taste batteries"], correctIndex: 0, explanation: "No mains for class demos." },
    ],
  },
  {
    title: "Design With Shapes and Colour",
    videos: [V.speaking, V.scienceMix, V.studySkills],
    quiz: [
      { prompt: "Designers guide attention using:", type: "multiple_choice", options: ["Shape, line, colour, contrast and space", "Only random noise", "Only hidden text", "Only broken links"], correctIndex: 0, explanation: "Visual elements." },
      { prompt: "Contrast helps viewers:", type: "multiple_choice", options: ["Notice important parts", "Ignore everything", "Delete meaning", "Hide ideas"], correctIndex: 0, explanation: "Stand-out differences." },
      { prompt: "True or false: A strong visual choice supports the idea you want others to notice.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Form serves meaning." },
      { prompt: "Space in a design can:", type: "multiple_choice", options: ["Give the eye rest and focus", "Only create clutter always", "Remove all meaning", "Delete colour forever"], correctIndex: 0, explanation: "Negative space helps." },
      { prompt: "Colour can communicate:", type: "multiple_choice", options: ["Mood and emphasis", "Only CPU speed", "Only passwords", "Only gravity"], correctIndex: 0, explanation: "Colour meaning." },
      { prompt: "True or false: Every decoration improves a design.", type: "true_false", options: ["True", "False"], correctIndex: 1, explanation: "Extra clutter can hurt." },
      { prompt: "Studying photos and frames helps you:", type: "multiple_choice", options: ["Learn visual choices", "Avoid creativity", "Skip looking", "Hide patterns"], correctIndex: 0, explanation: "Learn by observing." },
      { prompt: "A visual story should have:", type: "multiple_choice", options: ["A clear idea the viewer can follow", "No idea at all", "Only noise", "Only tiny unreadable text"], correctIndex: 0, explanation: "Clarity of idea." },
      { prompt: "Line in art can show:", type: "multiple_choice", options: ["Direction and structure", "Only smell", "Only temperature numbers", "Only file sizes"], correctIndex: 0, explanation: "Line guides the eye." },
      { prompt: "After watching, a good next step is:", type: "multiple_choice", options: ["Create your own visual story with purpose", "Copy without thinking", "Avoid making anything", "Delete all colour always"], correctIndex: 0, explanation: "Apply the learning." },
    ],
  },
];
function buildAssessmentBlocksSqlFromQuiz(quizExpr) {
  // quizExpr is a jsonb variable name holding the 10-question array
  return `
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
                    'correctAnswer', ((q ->> 'correctIndex')::int = 0),
                    'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective-1'),
                    'difficulty', 'developing',
                    'xpWeight', 1,
                    'maximumAttempts', 3,
                    'hint', 'Think about what the video taught.',
                    'explanation', coalesce(q ->> 'explanation', ''),
                    'feedbackCorrect', 'Great watching and thinking!',
                    'feedbackIncorrect', 'Replay the key moment and try again.',
                    'feedbackRetry', 'Eliminate the answer that does not match the video.'
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
                    'difficulty', 'developing',
                    'xpWeight', 1,
                    'maximumAttempts', 3,
                    'hint', 'Use clues from the videos.',
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
            FROM jsonb_array_elements(${quizExpr}) WITH ORDINALITY AS quiz_rows(q, ordinality)
          ) built;
`;
}

function generateBasic6BankSql() {
  const bank = buildBasic6MediaBank();
  return JSON.stringify(bank);
}

function patchBasic6(source) {
  const bankJson = generateBasic6BankSql();

  // Insert media_quiz_bank after curriculum jsonb declaration ends
  if (!source.includes("media_quiz_bank jsonb :=")) {
    source = source.replace(
      "$curriculum$::jsonb;",
      `$curriculum$::jsonb;\n  media_quiz_bank jsonb := $media_quiz_bank$\n${bankJson}\n$media_quiz_bank$::jsonb;`
    );
  }

  // Declare topic_media variable if missing
  if (!source.includes("topic_media jsonb;")) {
    source = source.replace(
      "video_provider text;",
      "video_provider text;\n  topic_media jsonb;\n  topic_quiz jsonb;\n  video_item jsonb;\n  video_ord integer;"
    );
  }

  // Replace quiz generation + media + blocks with video-heavy version
  const oldQuizStart = "          SELECT coalesce(jsonb_agg(jsonb_build_object(\n            'id', lesson_id || '-q' || q,";
  const oldQuizMarker = source.indexOf(oldQuizStart);
  if (oldQuizMarker < 0) throw new Error("Could not find basic6 quiz builder");

  const mediaStart = source.indexOf("          media_blocks := '[]'::jsonb;", oldQuizMarker);
  const fixtureStart = source.indexOf("          fixture := jsonb_build_object(", mediaStart);
  if (mediaStart < 0 || fixtureStart < 0) throw new Error("Could not find media/fixture section");

  const newBuilder = `
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

`;

  source = source.slice(0, oldQuizMarker) + newBuilder + source.slice(fixtureStart);

  // Replace lesson blocks array to be video-first (intro + media + quiz + short summary)
  const blocksMarker = `'blocks',\n                jsonb_build_array(\n                  jsonb_build_object(\n                    'id',lesson_id || '-intro'`;
  const blocksIdx = source.indexOf(blocksMarker);
  if (blocksIdx < 0) {
    // try alternate spacing
    const alt = source.indexOf("'blocks',");
    if (alt < 0) throw new Error("Could not find blocks");
  }

  // Replace from 'blocks', through assessment_blocks concatenation ending before reflection
  const blocksRegex =
    /'blocks',\s*jsonb_build_array\([\s\S]*?\) \|\| media_blocks \|\|[\s\S]*?assessment_blocks \|\|[\s\S]*?nextStepText','Review any missed quiz question, then continue to the next lesson\.'\s*\)\),/;

  const blocksReplacement = `'blocks',
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
                )),`;

  if (!blocksRegex.test(source)) {
    throw new Error("Could not match basic6 blocks pattern for replacement");
  }
  source = source.replace(blocksRegex, blocksReplacement);

  // Force format video + shorter minutes
  source = source.replace(
    `'format',CASE WHEN lesson_position % 4 = 0 OR lesson_position % 5 = 0 THEN 'video' ELSE 'text' END,`,
    `'format','video',`
  );
  source = source.replace(
    `'estimatedMinutes',CASE WHEN lesson_variant = 1 THEN 25 ELSE 30 END,`,
    `'estimatedMinutes',CASE WHEN lesson_variant = 1 THEN 20 ELSE 22 END,`
  );

  // TeacherQuiz questions should support true_false
  source = source.replace(
    `SELECT jsonb_agg(jsonb_build_object(
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
          FROM generate_series(1, 10) q;`,
    `SELECT jsonb_agg(jsonb_build_object(
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
          FROM generate_series(1, 10) q;`
  );

  // Improve strand review quizzes with distinct options
  source = source.replace(
    `SELECT jsonb_agg(jsonb_build_object(
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
      FROM generate_series(1,10) q;`,
    `SELECT jsonb_agg(jsonb_build_object(
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
      FROM generate_series(1,10) q;`
  );

  // Header comment update
  source = source.replace(
    `--   4 subjects x 5 platform strands x 2 sub-strands x 2 lessons = 80 lessons\n--   10 assessment blocks and one linked 10-question quiz per lesson\n--   one additional 10-question review quiz after every strand`,
    `--   4 subjects x 5 platform strands x 2 sub-strands x 2 lessons = 80 lessons\n--   VIDEO-RICH lessons (≈90% watch time, ≈10% short tip text)\n--   Real 10-question quizzes (MC + T/F) with distinct options per topic\n--   one additional 10-question review quiz after every strand`
  );

  return source;
}

function patchPublic(source) {
  // Build per-lesson media bank for all 150 lessons from curriculum titles in file — generate SQL bank
  const subjects = [
    {
      key: "friendship",
      strands: [
        ["What Friendship Really Means","Knowing My Friendship Strengths","Kindness in Small Actions","Trust Is Built Step by Step","Listening With Full Attention","Being Dependable","Respecting Differences","Including Someone New","Celebrating a Friend Without Envy","My Good-Friend Action Plan"],
        ["Starting Friendly Conversations","Asking Questions That Show Care","Giving Honest Encouragement","Working Together Fairly","Sharing Without Keeping Score","Understanding Another Viewpoint","Handling Peer Pressure","Friendship Online and Offline","Spotting Healthy and Unhealthy Patterns","Growing a Friendship Over Time"],
        ["Why Friends Sometimes Disagree","Cooling Down Before Responding","Using I-Messages","Apologising Sincerely","Making Amends","Forgiveness Without Ignoring Harm","Setting a Respectful Boundary","Responding to Gossip","When to Ask an Adult for Help","Building a Class Where Everyone Belongs"],
      ],
    },
    {
      key: "growth-confidence",
      strands: [
        ["My Brain Can Grow","Fixed Thoughts and Growth Thoughts","The Power of Yet","Mistakes Are Information","Effort With a Good Strategy","Asking for Useful Feedback","Comparing Myself With My Past Self","Learning From Role Models","Turning Weaknesses Into Practice Plans","My Personal Growth Map"],
        ["What Healthy Confidence Looks Like","Naming My Strengths Honestly","Changing Unhelpful Self-Talk","Preparing Before I Perform","Taking One Brave Step","Speaking Up Respectfully","Trying Something New","Receiving Praise Well","Responding to Embarrassment","My Courage Challenge"],
        ["Choosing a Meaningful Goal","Making a Goal Specific","Breaking Big Goals Into Steps","Building a Helpful Habit","Designing My Environment","Tracking Progress Without Obsession","What to Do After a Setback","Changing a Strategy That Is Not Working","Building a Support Team","My 30-Day Growth Plan"],
      ],
    },
    {
      key: "emotional-wellbeing",
      strands: [
        ["Why We Have Emotions","Expanding My Emotion Vocabulary","Noticing Feelings in My Body","Separating Feelings From Actions","Finding the Trigger","Understanding Mixed Emotions","How Thoughts Affect Feelings","Reading Emotional Clues Carefully","Keeping a Mood Journal","My Emotional Weather Report"],
        ["What Stress Feels Like","Pause Before You Act","Breathing to Settle the Body","Using the Five Senses to Ground","Moving My Body Safely","Solving the Problem I Can Control","Making Time for Rest and Sleep","Handling Worry Before a Test","Creating a Calm-Down Plan","When Strong Feelings Need Adult Help"],
        ["Empathy Is More Than Feeling Sorry","Listen Before Giving Advice","Validating Someone's Feelings","Helping Without Taking Over","Respecting Privacy and Safety","Recognising Loneliness","Supporting a Grieving Friend","Responding to Bullying Safely","Finding Trusted Adults","My Personal Wellbeing Toolkit"],
      ],
    },
    {
      key: "communication-leadership",
      strands: [
        ["The Communication Cycle","Choosing Clear Words","Tone Changes Meaning","Reading Body Language Carefully","Listening and Paraphrasing","Asking Clarifying Questions","Giving Helpful Feedback","Disagreeing Without Disrespect","Speaking to a Group","My Communication Improvement Goal"],
        ["What Makes a Team Work","Setting a Shared Goal","Choosing Fair Team Roles","Making Space for Every Voice","Making Decisions Together","Handling a Team Member Who Is Stuck","Finding the Need Behind a Conflict","Brainstorming Win-Win Options","Agreeing and Following Up","Running a Successful Team Reflection"],
        ["Leadership Is Not Bossing","Leading by Example","Knowing the People You Serve","Making Fair Decisions","Planning a Small Service Project","Delegating With Trust","Motivating Without Pressure","Owning a Leadership Mistake","Celebrating the Team","My Young-Leader Service Plan"],
      ],
    },
    {
      key: "study-digital-balance",
      strands: [
        ["How Memory Builds Connections","Attention Before Memory","Retrieval Practice","Spacing Study Over Time","Explaining in My Own Words","Using Examples and Non-Examples","Mixing Different Problem Types","Making Useful Study Questions","Checking What I Truly Know","My Best Learning Recipe"],
        ["Creating One Homework List","Breaking an Assignment Into Steps","Estimating How Long Work Will Take","Choosing Today's Priorities","Preparing a Focused Study Space","Using a Weekly Study Plan","Taking Notes That Help Later","Starting When I Do Not Feel Ready","Asking for Help Early","My Independent Study System"],
        ["What Is My Screen Time For","How Apps Compete for Attention","Turning Off Unhelpful Notifications","Creating Device-Free Times","Protecting Personal Information","Strong Password Habits","Checking Whether Information Is Trustworthy","Responding to Harmful Online Behaviour","Balancing Screens, Sleep and Movement","My Family Digital Balance Agreement"],
      ],
    },
  ];

  const bank = {};
  for (const subject of subjects) {
    let lessonCounter = 0;
    for (let si = 0; si < subject.strands.length; si++) {
      const strandName = ["Becoming a Good Friend","Growing Healthy Friendships","Repair, Boundaries and Belonging","Understanding Growth","Courage and Self-Belief","Goals, Habits and Resilience","Knowing My Emotions","Managing Stress and Strong Feelings","Empathy, Support and Wellbeing","Clear and Respectful Communication","Teamwork and Conflict Skills","Leadership Through Service","Learning How to Learn","Organisation and Independent Study","Digital Wellbeing and Safe Media"][
        subject.key === "friendship" ? si : subject.key === "growth-confidence" ? si + 3 : subject.key === "emotional-wellbeing" ? si + 6 : subject.key === "communication-leadership" ? si + 9 : si + 12
      ];
      for (const title of subject.strands[si]) {
        lessonCounter += 1;
        const globalKey = `${subject.key}::${title}`;
        bank[globalKey] = {
          videos: lifeSkillsVideos(subject.key, lessonCounter).map((url, i) => ({
            url,
            provider: url.includes("tiktok.com") ? "tiktok" : "youtube",
            title: `Watch: ${title} (clip ${i + 1})`,
          })),
          quiz: lifeSkillsQuiz(title, subject.key, strandName),
        };
      }
    }
  }

  const bankJson = JSON.stringify(bank);

  if (!source.includes("life_media_bank jsonb :=")) {
    source = source.replace(
      "$curriculum$::jsonb;",
      `$curriculum$::jsonb;\n  life_media_bank jsonb := $life_media_bank$\n${bankJson}\n$life_media_bank$::jsonb;`
    );
  }

  if (!source.includes("lesson_media jsonb;")) {
    source = source.replace(
      "timestamp_text text;",
      "timestamp_text text;\n  lesson_media jsonb;\n  lesson_quiz jsonb;\n  video_item jsonb;\n  video_ord integer;\n  media_blocks jsonb;"
    );
  }

  // Replace the assessment builder (typed records section) through fixture start
  const assessStart = source.indexOf("        -- Retained only as reference for the original generator.");
  const fixtureStart = source.indexOf("        fixture := jsonb_build_object(", assessStart);
  if (assessStart < 0 || fixtureStart < 0) throw new Error("Could not locate public assessment section");

  const newAssess = `
        lesson_media := life_media_bank -> ((subject_data ->> 'key') || '::' || lesson_title);
        IF lesson_media IS NULL THEN
          RAISE EXCEPTION 'Missing media/quiz bank for lesson %', lesson_title;
        END IF;
        lesson_quiz := lesson_media -> 'quiz';

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
                  'estimatedSeconds', 40,
                  'statement', q ->> 'prompt',
                  'correctAnswer', ((q ->> 'correctIndex')::int = 0),
                  'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective'),
                  'difficulty', CASE WHEN lesson_index <= 5 THEN 'beginner' ELSE 'developing' END,
                  'xpWeight', 1,
                  'maximumAttempts', 3,
                  'hint', 'Think about the videos you just watched.',
                  'explanation', coalesce(q ->> 'explanation', ''),
                  'feedbackCorrect', 'Great job!',
                  'feedbackIncorrect', 'Rewatch a clip and try again.',
                  'feedbackRetry', 'Choose the safer, more respectful option.'
                )
              ELSE
                jsonb_build_object(
                  'id', lesson_id || '-q' || ordinality,
                  'type', 'multiple_choice',
                  'order', 10 + ordinality,
                  'required', true,
                  'estimatedSeconds', 50,
                  'prompt', q ->> 'prompt',
                  'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective'),
                  'difficulty', CASE WHEN lesson_index <= 5 THEN 'beginner' ELSE 'developing' END,
                  'xpWeight', 1,
                  'maximumAttempts', 3,
                  'hint', 'Use the lesson videos and the tip.',
                  'explanation', coalesce(q ->> 'explanation', ''),
                  'feedbackCorrect', 'Yes — that fits the lesson.',
                  'feedbackIncorrect', 'Not yet. Compare each option carefully.',
                  'feedbackRetry', 'Eliminate unsafe or disrespectful choices.',
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
          FROM jsonb_array_elements(lesson_quiz) WITH ORDINALITY AS quiz_rows(q, ordinality)
        ) built;

        media_blocks := '[]'::jsonb;
        FOR video_item, video_ord IN
          SELECT value, ordinality::integer
          FROM jsonb_array_elements(lesson_media -> 'videos') WITH ORDINALITY
        LOOP
          media_blocks := media_blocks || jsonb_build_array(jsonb_build_object(
            'id', lesson_id || '-video-' || video_ord,
            'type', 'video',
            'order', 1 + video_ord,
            'required', true,
            'estimatedSeconds', CASE WHEN video_ord = 1 THEN 320 WHEN video_ord = 2 THEN 280 ELSE 160 END,
            'source', video_item ->> 'url',
            'provider', coalesce(video_item ->> 'provider', 'youtube'),
            'title', coalesce(video_item ->> 'title', 'Watch and learn'),
            'caption', 'Watch first! Pause and name one helpful idea.'
          ));
        END LOOP;

        media_blocks := media_blocks || jsonb_build_array(jsonb_build_object(
          'id', lesson_id || '-kid-tip',
          'type', 'tip',
          'order', 5,
          'required', true,
          'estimatedSeconds', 50,
          'title', 'Tiny tip',
          'tone', 'remember',
          'body', left(teaching_text, 200) || CASE WHEN length(teaching_text) > 200 THEN '…' ELSE '' END
        ));

`;

  source = source.slice(0, assessStart) + newAssess + source.slice(fixtureStart);

  // Replace blocks inside fixture
  const publicBlocksRegex =
    /'blocks',\s*jsonb_build_array\([\s\S]*?'nextStepText','Complete the quiz, review any missed answer and practise your chosen action before the next lesson\.'\s*\)\s*\),/;

  const publicBlocksReplacement = `'blocks',
              jsonb_build_array(
                jsonb_build_object(
                  'id',lesson_id || '-intro','type','lesson_intro','order',1,'required',true,
                  'estimatedSeconds',40,'title',lesson_title,'shortDescription',lesson_description,
                  'objectives',jsonb_build_array(
                    'Learn “' || lesson_title || '” mainly by watching videos',
                    'Use a short tip to remember the big idea',
                    'Show understanding in a real 10-question quiz'
                  ),
                  'estimatedMinutes',18,
                  'rewardPreview',jsonb_build_object('xp',lesson_xp,'starsAvailable',3)
                )
              ) || media_blocks || assessment_blocks ||
              jsonb_build_array(
                jsonb_build_object(
                  'id',lesson_id || '-summary','type','summary','order',23,'required',true,
                  'estimatedSeconds',40,'heading','Nice work!',
                  'keyPoints',jsonb_build_array(
                    'I watched kid-friendly videos about ' || lesson_title || '.',
                    'I used a short tip to remember the idea.',
                    'I checked my understanding with a real quiz.'
                  ),
                  'nextStepText','Review any missed answer, then continue to the next lesson.'
                )
              ),`;

  if (!publicBlocksRegex.test(source)) throw new Error("Could not replace public lesson blocks");
  source = source.replace(publicBlocksRegex, publicBlocksReplacement);

  source = source.replace(`'estimatedMinutes',25,'xp',lesson_xp,'questionCount',10,'format','text',`, `'estimatedMinutes',18,'xp',lesson_xp,'questionCount',10,'format','video',`);
  source = source.replace(`'estimatedMinutes',25,'baseXpReward',lesson_xp,`, `'estimatedMinutes',18,'baseXpReward',lesson_xp,`);

  // Fix TeacherQuiz extraction for T/F
  source = source.replace(
    `SELECT jsonb_agg(jsonb_build_object(
          'id','q-' || q,
          'prompt',assessment_blocks -> (q - 1) ->> 'prompt',
          'type','multiple_choice',
          'options',jsonb_build_array(
            assessment_blocks -> (q - 1) -> 'options' -> 0 ->> 'text',
            assessment_blocks -> (q - 1) -> 'options' -> 1 ->> 'text',
            assessment_blocks -> (q - 1) -> 'options' -> 2 ->> 'text',
            assessment_blocks -> (q - 1) -> 'options' -> 3 ->> 'text'
          ),
          'correctIndex',0,
          'explanation','The correct response applies ' || lesson_title || ' safely, respectfully and specifically.'
        ) ORDER BY q)
        INTO quiz_questions
        FROM generate_series(1,10) q;`,
    `SELECT jsonb_agg(jsonb_build_object(
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
          'explanation',coalesce(assessment_blocks -> (q - 1) ->> 'explanation', 'Apply ' || lesson_title || ' safely and respectfully.')
        ) ORDER BY q)
        INTO quiz_questions
        FROM generate_series(1,10) q;`
  );

  source = source.replace(
    `-- Creates 5 public subjects, each with:\n--   3 strands\n--   2 sub-strands per strand\n--   10 lessons per strand (30 lessons per subject, 150 total)\n--   10-question quiz after every lesson (1,500 quiz questions)\n--   approved immutable PublicLearningRevision snapshots`,
    `-- Creates 5 public subjects, each with:\n--   3 strands\n--   2 sub-strands per strand\n--   10 lessons per strand (30 lessons per subject, 150 total)\n--   VIDEO-RICH lessons (≈90% watch / ≈10% tip text)\n--   Real 10-question quizzes (MC + T/F) with distinct options per lesson\n--   approved immutable PublicLearningRevision snapshots`
  );

  return source;
}

function patchVisual(source) {
  const bank = {};
  for (const lesson of VISUAL_LESSONS) {
    bank[lesson.title] = {
      videos: lesson.videos.map((url, i) => ({
        url,
        provider: "youtube",
        title: `Watch adventure clip ${i + 1}`,
      })),
      quiz: lesson.quiz,
    };
  }
  const bankJson = JSON.stringify(bank);

  if (!source.includes("visual_media_bank jsonb :=")) {
    source = source.replace(
      "timestamp_text text := to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"');",
      `timestamp_text text := to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');\n  visual_media_bank jsonb := $visual_media_bank$\n${bankJson}\n$visual_media_bank$::jsonb;\n  lesson_media jsonb;\n  lesson_quiz jsonb;\n  assessment_blocks jsonb;\n  quiz_questions jsonb;\n  video_item jsonb;\n  video_ord integer;\n  media_blocks jsonb;`
    );
  }

  // Replace fixture blocks construction inside the loop — find the VALUES lessons and enhance.
  // We'll replace from `fixture := jsonb_build_object(` through insert, injecting quizzes.

  const fixtureStart = source.indexOf("    fixture := jsonb_build_object(");
  const recordStart = source.indexOf("    record_data := jsonb_build_object(", fixtureStart);
  if (fixtureStart < 0 || recordStart < 0) throw new Error("visual fixture not found");

  const newFixtureSection = `
    lesson_media := visual_media_bank -> item.lesson_title;
    IF lesson_media IS NULL THEN
      RAISE EXCEPTION 'Missing visual media bank for %', item.lesson_title;
    END IF;
    lesson_quiz := lesson_media -> 'quiz';

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
              'estimatedSeconds', 40,
              'statement', q ->> 'prompt',
              'correctAnswer', ((q ->> 'correctIndex')::int = 0),
              'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective'),
              'difficulty', 'developing',
              'xpWeight', 1,
              'maximumAttempts', 3,
              'hint', 'Use what you saw in the videos.',
              'explanation', coalesce(q ->> 'explanation', ''),
              'feedbackCorrect', 'Great explorer!',
              'feedbackIncorrect', 'Rewatch and try again.',
              'feedbackRetry', 'Look for visual evidence.'
            )
          ELSE
            jsonb_build_object(
              'id', lesson_id || '-q' || ordinality,
              'type', 'multiple_choice',
              'order', 10 + ordinality,
              'required', true,
              'estimatedSeconds', 50,
              'prompt', q ->> 'prompt',
              'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective'),
              'difficulty', 'developing',
              'xpWeight', 1,
              'maximumAttempts', 3,
              'hint', 'Pause the video and compare options.',
              'explanation', coalesce(q ->> 'explanation', ''),
              'feedbackCorrect', 'Yes — that matches the adventure videos.',
              'feedbackIncorrect', 'Not yet. Compare each option with the video.',
              'feedbackRetry', 'Eliminate one wrong option and retry.',
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
      FROM jsonb_array_elements(lesson_quiz) WITH ORDINALITY AS quiz_rows(q, ordinality)
    ) built;

    media_blocks := '[]'::jsonb;
    FOR video_item, video_ord IN
      SELECT value, ordinality::integer
      FROM jsonb_array_elements(lesson_media -> 'videos') WITH ORDINALITY
    LOOP
      media_blocks := media_blocks || jsonb_build_array(jsonb_build_object(
        'id', lesson_id || '-video-' || video_ord,
        'type', 'video',
        'order', 1 + video_ord,
        'required', true,
        'estimatedSeconds', CASE WHEN video_ord = 1 THEN 300 ELSE 240 END,
        'source', video_item ->> 'url',
        'provider', 'youtube',
        'title', coalesce(video_item ->> 'title', 'Watch the adventure'),
        'caption', 'Pause when needed. Name three details you can see or hear.'
      ));
    END LOOP;

    media_blocks := media_blocks || jsonb_build_array(
      jsonb_build_object(
        'id',lesson_id || '-image','type','image','order',5,'required',false,'estimatedSeconds',60,
        'source',item.image_url,'altText','A detailed visual supporting ' || item.lesson_title,
        'caption','Optional extra look: what patterns do you notice?',
        'attribution','Unsplash educational photograph','decorative',false
      ),
      jsonb_build_object(
        'id',lesson_id || '-text','type','tip','order',6,'required',true,'estimatedSeconds',50,
        'title','Tiny tip','tone','remember',
        'body',left(item.lesson_text, 180) || CASE WHEN length(item.lesson_text) > 180 THEN '…' ELSE '' END
      )
    );

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
        'description','Video-first learning with a tiny tip.','order',1,
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
        'objectiveSummary','Watch videos, notice evidence, then show understanding in a quiz.',
        'difficulty','developing','estimatedMinutes',16,'baseXpReward',80,'passingScore',70,
        'masteryScore',90,'maximumLessonRedos',3,'publishedAt',timestamp_text,
        'learningObjectives',jsonb_build_array(jsonb_build_object(
          'id',lesson_id || '-objective','lessonVersionId',version_id,'code','VIS.' || item.strand_no || '.' || item.lesson_no,
          'description','Learn mainly from videos, then answer a real 10-question quiz.','order',1
        )),
        'blocks',
          jsonb_build_array(
            jsonb_build_object(
              'id',lesson_id || '-intro','type','lesson_intro','order',1,'required',true,'estimatedSeconds',35,
              'title',item.lesson_title,'shortDescription',item.lesson_description,
              'objectives',jsonb_build_array('Watch closely','Find visual evidence','Ace the quiz'),
              'estimatedMinutes',16,'rewardPreview',jsonb_build_object('xp',80,'starsAvailable',3)
            )
          ) || media_blocks || assessment_blocks ||
          jsonb_build_array(
            jsonb_build_object(
              'id',lesson_id || '-summary','type','summary','order',30,'required',true,'estimatedSeconds',40,
              'heading','Discovery complete',
              'keyPoints',jsonb_build_array(
                'I watched adventure videos carefully.',
                'I used a tiny tip to remember the idea.',
                'I checked my learning with a real quiz.'
              ),
              'nextStepText','Share one discovery, then continue.'
            )
          ),
        'createdAt',timestamp_text,'updatedAt',timestamp_text
      ))
    );

`;

  source = source.slice(0, fixtureStart) + newFixtureSection + source.slice(recordStart);

  source = source.replace(
    `'description',item.lesson_description,'estimatedMinutes',18,'xp',80,'questionCount',0,`,
    `'description',item.lesson_description,'estimatedMinutes',16,'xp',80,'questionCount',10,`
  );

  // Insert TeacherQuiz after each AdminLessonRecord insert
  const insertLesson = `INSERT INTO public."AdminLessonRecord"
      ("id","subject","status","position","record","createdBy","courseId","unitId","topicId","createdAt","updatedAt")
    VALUES
      (lesson_id,'science','published',item.lesson_no,record_data,teacher_id,subject_id,unit_id,topic_id,now(),now());
  END LOOP;`;

  const insertWithQuiz = `INSERT INTO public."AdminLessonRecord"
      ("id","subject","status","position","record","createdBy","courseId","unitId","topicId","createdAt","updatedAt")
    VALUES
      (lesson_id,'science','published',item.lesson_no,record_data,teacher_id,subject_id,unit_id,topic_id,now(),now());

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
      'explanation',coalesce(assessment_blocks -> (q - 1) ->> 'explanation', 'Use video evidence.')
    ) ORDER BY q)
    INTO quiz_questions
    FROM generate_series(1,10) q;

    INSERT INTO public."TeacherQuiz"
      ("createdBy","title","description","subject","gradeLevels","questions","baseXpReward",
       "passingScore","maxAttempts","version","status","courseId","unitId","topicId","lessonId","createdAt","updatedAt")
    VALUES
      (teacher_id,item.lesson_title || ' - Discovery Quiz',
       '[SKULKID-VISUAL-SEED] Ten-question quiz after ' || item.lesson_title,
       'science',ARRAY[1,2,3,4,5,6],quiz_questions,70,70,3,1,'ready',
       subject_id,unit_id,topic_id,lesson_id,now(),now());
  END LOOP;`;

  if (!source.includes(insertLesson)) throw new Error("Could not find visual lesson insert block");
  source = source.replace(insertLesson, insertWithQuiz);

  source = source.replace(
    "RAISE NOTICE 'Created Visual Discovery Adventures for Teacher Kay: all grades, 3 strands and 9 media-led lessons.';",
    "RAISE NOTICE 'Created Visual Discovery Adventures for Teacher Kay: all grades, 3 strands, 9 video-rich lessons and 9 real quizzes.';"
  );

  return source;
}

function main() {
  // Validate basic6 banks first
  for (const topic of BASIC_TOPICS) {
    const q = basic6Quiz(topic);
    const v = basic6Videos(topic);
    if (q.length !== 10) throw new Error(`Bad quiz length: ${topic}`);
    if (v.length < 2) throw new Error(`Need videos: ${topic}`);
  }

  const files = [
    ["teacher_kay_basic_6_curriculum.sql", patchBasic6],
    ["teacher_kay_public_self_improvement_curriculum.sql", patchPublic],
    ["teacher_kay_visual_discovery_public_learning.sql", patchVisual],
  ];

  for (const [name, patcher] of files) {
    const full = path.join(seedsDir, name);
    const backup = full + ".bak";
    // Always patch from the original backup so re-runs stay idempotent.
    if (!fs.existsSync(backup)) {
      fs.writeFileSync(backup, fs.readFileSync(full, "utf8"));
    }
    const original = fs.readFileSync(backup, "utf8");
    const patched = patcher(original);
    fs.writeFileSync(full, patched);
    console.log(`Patched ${name} (${patched.length} chars)`);
  }
}

main();

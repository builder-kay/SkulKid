import { curriculumFixtureSchema } from "@/domains/curriculum/schemas/lesson-version-schemas";
import type { CurriculumFixture, LessonBlock, LessonDifficulty, LessonVersion } from "@/domains/curriculum/types";

const timestamp = "2026-07-21T00:00:00.000Z";
const subjectId = "subject-english-language";

type Mission = {
  grade: 4 | 5 | 6;
  strand: string;
  title: string;
  code: string;
  teach: string;
  example: string;
  question: string;
  options: [string, string, string];
  correct: 0 | 1 | 2;
  check: string;
  checkAnswer: boolean;
};

const missions: Mission[] = [
  { grade: 4, strand: "oral", title: "Listen, Ask and Respond", code: "B4.1", teach: "Good listeners face the speaker, notice key words, and ask relevant questions. Polite responses show that the message was understood.", example: "After hearing directions to the library, Abena repeats the important steps and asks which door to use.", question: "Which response shows active listening?", options: ["Looking away and guessing", "Repeating the key idea and asking a useful question", "Interrupting before the speaker finishes"], correct: 1, check: "A relevant follow-up question can improve understanding.", checkAnswer: true },
  { grade: 4, strand: "reading", title: "Decode and Understand", code: "B4.2", teach: "Use letter patterns, syllables, context, and nearby clues to work out unfamiliar words. Then identify what the whole paragraph is mainly about.", example: "In 'The enormous tree shaded the whole yard', shaded and whole yard help us infer that enormous means very large.", question: "What is the main idea of a paragraph?", options: ["Its most important message", "Its longest word", "Its final punctuation mark"], correct: 0, check: "Context clues can include surrounding words and examples.", checkAnswer: true },
  { grade: 4, strand: "grammar", title: "Build Strong Noun Phrases", code: "B4.3", teach: "Determiners, pronouns and adjectives make meaning precise. Use a, an, the, this, those, whose and describing words appropriately.", example: "Those three bright kites uses a demonstrative, a number and an adjective before the noun.", question: "Choose the correct phrase.", options: ["an orange", "a orange", "an banana"], correct: 0, check: "The words this and those are demonstratives.", checkAnswer: true },
  { grade: 4, strand: "writing", title: "Plan a Clear Paragraph", code: "B4.4", teach: "A focused paragraph has a main idea, supporting details and a logical order. Plan, draft, revise, edit and share your writing.", example: "Topic: keeping the classroom tidy. A topic sentence states the idea; details explain bins, sweeping and teamwork.", question: "Which sentence belongs first in a focused paragraph?", options: ["A clear topic sentence", "An unrelated joke", "A repeated ending"], correct: 0, check: "Revision improves ideas and organisation before final editing.", checkAnswer: true },
  { grade: 4, strand: "conventions", title: "Capitals, Stops and Sentences", code: "B4.5", teach: "Begin sentences and proper names with capital letters. Use full stops, commas, question marks and exclamation marks to guide the reader.", example: "'Kojo, did you visit Tamale?' uses capitals for names, a comma for direct address and a question mark.", question: "Which sentence is punctuated correctly?", options: ["where is esi.", "Where is Esi?", "Where is esi!"], correct: 1, check: "A complete sentence expresses a complete thought.", checkAnswer: true },
  { grade: 4, strand: "extensive", title: "Choose, Read and Share", code: "B4.6", teach: "Independent readers choose suitable fiction and non-fiction, read regularly, keep a simple reading record and share thoughtful responses.", example: "After reading a folktale, Sena records the title, main characters, favourite event and reason for recommending it.", question: "What makes a useful reading response?", options: ["Only the book colour", "An idea from the text plus your reason", "Copying every page"], correct: 1, check: "Extensive reading includes books chosen for interest and enjoyment.", checkAnswer: true },
  { grade: 5, strand: "oral", title: "Tell and Present with Purpose", code: "B5.1", teach: "Adapt voice, pace, vocabulary and gesture to the audience. Retell events in sequence and contribute respectfully to conversations and role-play.", example: "A group retells a community clean-up story with a clear beginning, middle, ending and distinct character voices.", question: "What helps an audience follow a presentation?", options: ["Random order", "Clear sequence and audible speech", "Speaking as fast as possible"], correct: 1, check: "A speaker should adjust language for purpose and audience.", checkAnswer: true },
  { grade: 5, strand: "reading", title: "Infer, Summarise and Explain", code: "B5.2", teach: "Fluent readers group words meaningfully, infer unstated ideas, explain vocabulary in context and summarise important information.", example: "If a character packs an umbrella under dark clouds, we can infer that the character expects rain.", question: "Which detail best supports an inference?", options: ["Evidence from the text", "A completely unrelated memory", "The page number alone"], correct: 0, check: "A summary includes the most important ideas, not every detail.", checkAnswer: true },
  { grade: 5, strand: "grammar", title: "Make Precise Comparisons", code: "B5.3", teach: "Use nouns, pronouns, determiners, adjectives and adverbs accurately. Comparative and superlative forms show degrees of difference.", example: "Amina runs faster than Yaw, but Efua runs fastest of the three.", question: "Choose the correct comparison.", options: ["more taller", "tallest of the three", "most tall than"], correct: 1, check: "Adverbs can tell how, when or where an action happens.", checkAnswer: true },
  { grade: 5, strand: "writing", title: "Craft Stories and Persuasion", code: "B5.4", teach: "Narratives develop setting, characters, events and viewpoint. Persuasive writing states a position and supports it with organised reasons.", example: "A letter asking for a reading corner gives a clear request, reasons, examples and a respectful closing.", question: "What strengthens a persuasive paragraph?", options: ["A claim supported by reasons", "Changing the topic", "Repeating one word"], correct: 0, check: "A narrative normally develops events in a meaningful sequence.", checkAnswer: true },
  { grade: 5, strand: "conventions", title: "Edit Tense and Agreement", code: "B5.5", teach: "Keep subjects and verbs in agreement, control past and present-perfect forms, and use apostrophes, commas and quotation marks where needed.", example: "The pupils have finished their posters uses a plural subject with have and a present-perfect verb phrase.", question: "Choose the sentence with correct agreement.", options: ["The pupils has arrived.", "The pupils have arrived.", "The pupils is arriving."], correct: 1, check: "An apostrophe can mark a contraction or possession.", checkAnswer: true },
  { grade: 5, strand: "extensive", title: "Compare Books and Viewpoints", code: "B5.6", teach: "Read across genres, notice theme and viewpoint, and compare how two texts treat a similar topic. Support preferences with evidence.", example: "A poem and an information article may both explore water, but use different structures and purposes.", question: "A fair comparison should mention...", options: ["similarities and differences with evidence", "only the cover designs", "which text is longer"], correct: 0, check: "Genre affects a text's structure and purpose.", checkAnswer: true },
  { grade: 6, strand: "oral", title: "Discuss, Clarify and Persuade", code: "B6.1", teach: "In discussion, build on ideas, ask clarifying questions, distinguish fact from opinion and present a supported viewpoint respectfully.", example: "During a safety discussion, Kweku states a proposal, gives evidence, listens to a challenge and responds to the point.", question: "Which is evidence rather than opinion?", options: ["I think the park is best.", "The survey recorded 42 responses.", "Everyone surely agrees with me."], correct: 1, check: "Respectful disagreement addresses the idea, not the person.", checkAnswer: true },
  { grade: 6, strand: "reading", title: "Analyse Text and Author's Purpose", code: "B6.2", teach: "Identify central ideas, topic sentences, supporting evidence, text structure and the author's purpose. Evaluate whether a claim is well supported.", example: "Signal words such as because and therefore can reveal a cause-and-effect structure.", question: "Why might an author include statistics?", options: ["To support a claim with evidence", "To hide the topic", "To replace all explanations"], correct: 0, check: "The author's purpose may be to inform, persuade or entertain.", checkAnswer: true },
  { grade: 6, strand: "grammar", title: "Connect Ideas Precisely", code: "B6.3", teach: "Use conjunctions, prepositions, pronoun references and modifiers to connect ideas clearly. Avoid ambiguity by placing describing words near what they describe.", example: "Although the match ended, the spectators stayed because the awards followed connects contrast and reason.", question: "Which word signals contrast?", options: ["although", "because", "therefore"], correct: 0, check: "A clear pronoun must refer to an identifiable noun.", checkAnswer: true },
  { grade: 6, strand: "writing", title: "Research, Organise and Publish", code: "B6.4", teach: "Gather relevant information, group it into sections, paraphrase sources, link paragraphs and revise for purpose, audience and clarity.", example: "A report on local water use has a heading, introduction, organised findings, conclusion and source notes.", question: "What is paraphrasing?", options: ["Restating an idea accurately in your own words", "Copying without credit", "Changing the topic"], correct: 0, check: "Good research writing distinguishes source information from the writer's own ideas.", checkAnswer: true },
  { grade: 6, strand: "conventions", title: "Control Complex Sentences", code: "B6.5", teach: "Combine clauses into compound and complex sentences, maintain tense and agreement, and proofread spelling and punctuation systematically.", example: "When the bell rang, we packed our books, and we left quietly contains a dependent clause and two joined main clauses.", question: "Which is a complex sentence?", options: ["We waited because the rain was heavy.", "We waited.", "Rain!"], correct: 0, check: "A complex sentence contains a main clause and at least one dependent clause.", checkAnswer: true },
  { grade: 6, strand: "extensive", title: "Read Critically and Recommend", code: "B6.6", teach: "Sustained readers interpret theme, character, viewpoint and style, connect ideas across texts and recommend books with concise evidence.", example: "A review explains how a character's choices develop the theme, then cites a key event without retelling the whole plot.", question: "Which review is most useful?", options: ["Good book.", "I recommend it because the changing friendship makes the theme of trust convincing.", "It has many pages."], correct: 1, check: "A strong recommendation gives a judgement and supporting reason.", checkAnswer: true }
];

const strandNames: Record<string, string> = {
  oral: "Oral Language",
  reading: "Reading",
  grammar: "Grammar Usage",
  writing: "Writing",
  conventions: "Writing Conventions",
  extensive: "Extensive Reading"
};

function slug(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "");
}

function difficulty(grade: Mission["grade"]): LessonDifficulty {
  return grade === 4 ? "beginner" : grade === 5 ? "developing" : "proficient";
}

function versionFor(mission: Mission, index: number): LessonVersion {
  const lessonId = `lesson-english-b${mission.grade}-${mission.strand}`;
  const id = `${lessonId}-v1`;
  const objectiveIds = [`${id}-objective-1`, `${id}-objective-2`];
  const defaults = {
    learningObjectiveIds: objectiveIds,
    difficulty: difficulty(mission.grade), xpWeight: 1, maximumAttempts: 2,
    hint: "Return to the example and look for the clue that matches the rule.",
    explanation: mission.teach,
    feedbackCorrect: "Excellent thinking. You found the language clue.",
    feedbackIncorrect: "Not yet. Compare each choice with the example.",
    feedbackRetry: "Good effort. Use the hint, then try once more.", shuffleOptions: false
  };
  const blocks: LessonBlock[] = [
    { id: `${id}-intro`, type: "lesson_intro", order: 1, required: true, estimatedSeconds: 45, title: mission.title, shortDescription: `Basic ${mission.grade} ${strandNames[mission.strand]} mission`, objectives: ["Understand the key language idea.", "Apply it in a new context."], estimatedMinutes: 10, rewardPreview: { xp: 100 + index * 5, starsAvailable: 3 } },
    { id: `${id}-teach`, type: "text", order: 2, required: true, estimatedSeconds: 120, heading: "Power-up", body: mission.teach, emphasisTerms: ["purpose", "evidence", "meaning"] },
    { id: `${id}-example`, type: "worked_example", order: 3, required: true, estimatedSeconds: 120, title: "See it in action", problem: mission.example, orderedSteps: ["Read or listen for the main clue.", "Connect the clue to the language rule.", "Check that the meaning is clear."], finalAnswer: "A clear, supported response", explanation: mission.teach },
    { id: `${id}-tip`, type: "tip", order: 4, required: false, estimatedSeconds: 35, title: "Mission tip", body: "Say your choice aloud and explain why it fits. Explaining is a powerful way to check understanding.", tone: "tip" },
    { id: `${id}-challenge-1`, type: "multiple_choice", order: 5, required: true, estimatedSeconds: 75, prompt: mission.question, options: mission.options.map((text, optionIndex) => ({ id: `option-${optionIndex + 1}`, label: String.fromCharCode(65 + optionIndex), text })), correctOptionId: `option-${mission.correct + 1}`, ...defaults },
    { id: `${id}-challenge-2`, type: "true_false", order: 6, required: true, estimatedSeconds: 60, prompt: "Final checkpoint", statement: mission.check, correctAnswer: mission.checkAnswer, ...defaults },
    { id: `${id}-reflection`, type: "reflection", order: 7, required: false, estimatedSeconds: 45, prompt: "Where could you use this skill at school or at home?", responseType: "short_text", optional: true },
    { id: `${id}-summary`, type: "summary", order: 8, required: true, estimatedSeconds: 45, heading: "Mission complete", keyPoints: [mission.teach, "Use a clue or example to support your answer."], nextStepText: index === missions.length - 1 ? "You completed the Upper Primary English quest!" : "Continue to the next English mission." }
  ];
  return { id, lessonId, versionNumber: 1, status: "published", title: mission.title, description: `A gamified Basic ${mission.grade} mission aligned to ${mission.code}.`, objectiveSummary: `Develop and apply ${strandNames[mission.strand].toLowerCase()} skills.`, difficulty: difficulty(mission.grade), estimatedMinutes: 10, baseXpReward: 100 + index * 5, passingScore: 60, masteryScore: 80, publishedAt: timestamp, createdAt: timestamp, updatedAt: timestamp,
    learningObjectives: [
      { id: objectiveIds[0], lessonVersionId: id, code: `${mission.code}.SK1`, description: "Explain the mission's key language idea.", order: 1 },
      { id: objectiveIds[1], lessonVersionId: id, code: `${mission.code}.SK2`, description: "Apply the language idea accurately in context.", order: 2 }
    ], blocks };
}

const units = ([4, 5, 6] as const).map((grade, index) => ({ id: `unit-english-basic-${grade}`, subjectId, name: `Basic ${grade}`, slug: `basic-${grade}`, description: `Ghana standards-based English missions for Basic ${grade}.`, order: index + 1, createdAt: timestamp, updatedAt: timestamp }));
const topics = units.flatMap((unit) => Object.entries(strandNames).map(([key, name], index) => ({ id: `topic-english-b${unit.order + 3}-${key}`, unitId: unit.id, name, slug: slug(name), description: `Build ${name.toLowerCase()} knowledge and confidence.`, order: index + 1, createdAt: timestamp, updatedAt: timestamp })));
const lessons = missions.map((mission, index) => ({ id: `lesson-english-b${mission.grade}-${mission.strand}`, topicId: `topic-english-b${mission.grade}-${mission.strand}`, title: mission.title, slug: slug(mission.title), shortDescription: `Basic ${mission.grade} ${strandNames[mission.strand]} mission.`, order: index + 1, prerequisiteLessonId: index === 0 ? null : `lesson-english-b${missions[index - 1].grade}-${missions[index - 1].strand}`, createdAt: timestamp, updatedAt: timestamp }));

const fixture: CurriculumFixture = {
  subjects: [{ id: subjectId, name: "English Language", slug: "english-language", description: "Grow confident listening, speaking, reading and writing through Ghana-aligned missions.", icon: "book-open", colourToken: "subject-english", gradeLevels: [4, 5, 6], order: 2, status: "active", createdAt: timestamp, updatedAt: timestamp }],
  units, topics, lessons, lessonVersions: missions.map(versionFor)
};

export const englishCurriculum = curriculumFixtureSchema.parse(fixture);

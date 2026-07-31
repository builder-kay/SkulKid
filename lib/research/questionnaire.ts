export const INSTRUMENT_VERSION = "ucc-2026-v1";

export type FormType = "student" | "teacher" | "system";
export type QuestionKind = "single" | "likert" | "text" | "triad" | "metric" | "uat";

export type ChoiceOption = { value: string; label: string };

export type QuestionDef = {
  id: string;
  number: number | string;
  kind: QuestionKind;
  prompt: string;
  required: boolean;
  options?: ChoiceOption[];
  /** For triad: works | issue | notes */
  noteId?: string;
  maxLength?: number;
};

export type SectionDef = {
  id: string;
  title: string;
  description?: string;
  questions: QuestionDef[];
};

export type FormDef = {
  formType: FormType;
  title: string;
  subtitle: string;
  intro: string;
  sections: SectionDef[];
};

export const LIKERT_OPTIONS: ChoiceOption[] = [
  { value: "1", label: "SD" },
  { value: "2", label: "D" },
  { value: "3", label: "N" },
  { value: "4", label: "A" },
  { value: "5", label: "SA" }
];

export const LIKERT_FULL_LABELS: Record<string, string> = {
  "1": "Strongly Disagree",
  "2": "Disagree",
  "3": "Neutral",
  "4": "Agree",
  "5": "Strongly Agree"
};

function likert(id: string, number: number, prompt: string): QuestionDef {
  return { id, number, kind: "likert", prompt, required: true, options: LIKERT_OPTIONS };
}

function single(id: string, number: number, prompt: string, options: ChoiceOption[]): QuestionDef {
  return { id, number, kind: "single", prompt, required: true, options };
}

function text(id: string, number: number | string, prompt: string, required = false): QuestionDef {
  return { id, number, kind: "text", prompt, required, maxLength: 2000 };
}

const studentForm: FormDef = {
  formType: "student",
  title: "Student questionnaire",
  subtitle: "Form A — Evaluation of the SkulKid platform",
  intro: "This questionnaire is part of a research study to evaluate your experience using SkulKid. There are no right or wrong answers. Your responses are confidential — you do not need to write your name.",
  sections: [
    {
      id: "background",
      title: "About you",
      description: "Tick the option that best describes you.",
      questions: [
        single("s_q1", 1, "What class are you in?", [
          { value: "p3", label: "Primary 3" },
          { value: "p4", label: "Primary 4" },
          { value: "p5", label: "Primary 5" },
          { value: "p6", label: "Primary 6" }
        ]),
        single("s_q2", 2, "What is your gender?", [
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "prefer_not", label: "Prefer not to say" }
        ]),
        single("s_q3", 3, "How often do you use a computer, tablet, or phone?", [
          { value: "every_day", label: "Every day" },
          { value: "3_4_week", label: "3–4 times a week" },
          { value: "1_2_week", label: "Once or twice a week" },
          { value: "rarely", label: "Rarely or never" }
        ]),
        single("s_q4", 4, "Before SkulKid, had you used any online learning platform?", [
          { value: "regularly", label: "Yes, regularly" },
          { value: "sometimes", label: "Yes, sometimes" },
          { value: "first", label: "No, SkulKid was my first" }
        ]),
        single("s_q5", 5, "Which subject do you find most difficult?", [
          { value: "maths", label: "Mathematics" },
          { value: "english", label: "English Language" },
          { value: "science", label: "Science" },
          { value: "all", label: "All of them equally" }
        ])
      ]
    },
    {
      id: "usability",
      title: "Usability & design",
      description: "How much do you agree? SD = Strongly Disagree · SA = Strongly Agree",
      questions: [
        likert("s_q6", 6, "The SkulKid platform is easy to use without help from my teacher."),
        likert("s_q7", 7, "I can find lessons and quizzes quickly on the platform."),
        likert("s_q8", 8, "The text and pictures on the platform are clear and easy to read."),
        likert("s_q9", 9, "The platform works well on the device I used (computer/tablet)."),
        likert("s_q10", 10, "The loading speed of the platform is fast enough for me."),
        likert("s_q11", 11, "The design of the platform looks interesting and child-friendly.")
      ]
    },
    {
      id: "gamification",
      title: "Game features",
      description: "XP, badges, streaks, and the leaderboard.",
      questions: [
        likert("s_q12", 12, "Earning XP (experience points) after quizzes makes me want to keep learning."),
        likert("s_q13", 13, "Levelling up on the platform makes me feel proud of my progress."),
        likert("s_q14", 14, "I enjoy collecting badges when I complete lessons and challenges."),
        likert("s_q15", 15, "Earning the 'Comeback Kid' badge (after retrying a lesson) made me feel good about not giving up."),
        likert("s_q16", 16, "Maintaining my daily streak makes me want to open the platform every day."),
        likert("s_q17", 17, "Seeing my rank on the leaderboard makes me want to learn more."),
        likert("s_q18", 18, "I check the leaderboard to see how close I am to students ranked above me."),
        likert("s_q19", 19, "The daily goal feature reminds me to complete my learning task for the day."),
        likert("s_q20", 20, "The XP and badge rewards make difficult topics feel worth working hard on."),
        likert("s_q21", 21, "I feel more competitive about my learning because of the leaderboard.")
      ]
    },
    {
      id: "adaptive",
      title: "Quizzes & adaptive learning",
      description: "How the platform guides you after quiz scores.",
      questions: [
        likert("s_q22", 22, "When I scored below 50%, the platform was right to ask me to redo the lesson before moving on."),
        likert("s_q23", 23, "The 'Practice More' exercises (for scores 50–79%) helped me understand topics I almost got right."),
        likert("s_q24", 24, "I felt motivated to improve my quiz score after seeing which pathway I was placed on."),
        likert("s_q25", 25, "The platform helped me understand exactly which parts of a topic I was getting wrong."),
        likert("s_q26", 26, "The quiz feedback I received was clear and easy to understand."),
        likert("s_q27", 27, "I felt my learning improved because the platform matched the difficulty to my performance."),
        likert("s_q28", 28, "Unlocking the next lesson after scoring 80% or above felt like a real reward."),
        likert("s_q29", 29, "I was encouraged to retry lessons I failed rather than feeling like giving up.")
      ]
    },
    {
      id: "motivation",
      title: "Motivation & confidence",
      description: "How you felt while learning with SkulKid.",
      questions: [
        likert("s_q30", 30, "I feel more motivated to learn Mathematics since using SkulKid."),
        likert("s_q31", 31, "I feel more motivated to learn English Language since using SkulKid."),
        likert("s_q32", 32, "I feel less worried (anxious) about getting wrong answers when learning on SkulKid."),
        likert("s_q33", 33, "I feel more confident about my ability to do well in Mathematics."),
        likert("s_q34", 34, "I feel more confident about my ability to do well in English Language."),
        likert("s_q35", 35, "I am less afraid of getting a bad score because I know I can try again."),
        likert("s_q36", 36, "I feel motivated to open the platform even on days when I have no scheduled class."),
        likert("s_q37", 37, "SkulKid makes me believe that I can improve with practice and effort.")
      ]
    },
    {
      id: "multiplayer",
      title: "Working with classmates",
      description: "Challenges and group learning.",
      questions: [
        likert("s_q38", 38, "Competing with classmates in challenge mode makes learning more exciting."),
        likert("s_q39", 39, "Working with a partner on team challenges helped me learn better."),
        likert("s_q40", 40, "I feel a sense of belonging to my class when we participate in group challenges."),
        likert("s_q41", 41, "Multiplayer challenges encouraged me to explain answers to my classmates."),
        likert("s_q42", 42, "I feel that competing on the leaderboard with classmates is fair."),
        likert("s_q43", 43, "I would like more opportunities to work with classmates on the platform.")
      ]
    },
    {
      id: "effectiveness",
      title: "What you learned",
      description: "How SkulKid helped your learning.",
      questions: [
        likert("s_q44", 44, "Using SkulKid has helped me understand Mathematics better than before."),
        likert("s_q45", 45, "Using SkulKid has helped me understand English Language better than before."),
        likert("s_q46", 46, "I perform better in class exercises since I started using SkulKid."),
        likert("s_q47", 47, "SkulKid helped me understand topics I was confused about in class."),
        likert("s_q48", 48, "The quizzes on SkulKid are similar to the types of questions in my school tests."),
        likert("s_q49", 49, "I feel that I have genuinely learned new things from the lessons on SkulKid.")
      ]
    },
    {
      id: "opinions",
      title: "Your opinions",
      description: "Write as much or as little as you like. These are optional but very helpful.",
      questions: [
        text("s_q50", 50, "What did you LIKE most about the SkulKid platform? Why?"),
        text("s_q51", 51, "What did you DISLIKE or find difficult about the platform?"),
        text("s_q52", 52, "Which gamification feature (XP, badges, streaks, leaderboard, daily goal) helped you learn the most? Explain."),
        text("s_q53", 53, "Is there anything you would like to be added or changed on the platform?"),
        text("s_q54", 54, "How did using SkulKid change the way you feel about learning Mathematics or English? Explain.")
      ]
    }
  ]
};

const teacherForm: FormDef = {
  formType: "teacher",
  title: "Teacher questionnaire",
  subtitle: "Form B — Teacher perspective",
  intro: "Thank you for evaluating SkulKid. Your honest professional assessment helps improve the platform for Ghanaian primary schools. Responses are confidential.",
  sections: [
    {
      id: "background",
      title: "About your teaching",
      questions: [
        single("t_q1", 1, "What is your current teaching level?", [
          { value: "p3_4", label: "Primary 3–4" },
          { value: "p5_6", label: "Primary 5–6" },
          { value: "both", label: "Both levels" }
        ]),
        single("t_q2", 2, "How many years of teaching experience do you have?", [
          { value: "lt2", label: "Less than 2 years" },
          { value: "2_5", label: "2–5 years" },
          { value: "6_10", label: "6–10 years" },
          { value: "gt10", label: "More than 10 years" }
        ]),
        single("t_q3", 3, "How would you rate your own comfort level with educational technology?", [
          { value: "not", label: "Not comfortable at all" },
          { value: "slightly", label: "Slightly comfortable" },
          { value: "moderately", label: "Moderately comfortable" },
          { value: "very", label: "Very comfortable" }
        ]),
        single("t_q4", 4, "Had you used any gamified learning platform with students before SkulKid?", [
          { value: "frequently", label: "Yes, frequently" },
          { value: "occasionally", label: "Yes, occasionally" },
          { value: "first", label: "No, SkulKid was the first" }
        ])
      ]
    },
    {
      id: "dashboard",
      title: "Dashboard & monitoring",
      description: "SD = Strongly Disagree · SA = Strongly Agree",
      questions: [
        likert("t_q5", 5, "The teacher dashboard was easy to navigate and understand."),
        likert("t_q6", 6, "The student progress tracking feature helped me identify which students needed extra support."),
        likert("t_q7", 7, "The quiz performance breakdown (by topic/content area) was useful for planning lessons."),
        likert("t_q8", 8, "I was able to use the platform data to adjust my classroom teaching in response to student weaknesses."),
        likert("t_q9", 9, "The leaderboard and XP analytics helped me understand which students were most engaged."),
        likert("t_q10", 10, "The platform provided enough data about student learning behaviour to be useful in my teaching."),
        likert("t_q11", 11, "I felt confident interpreting the analytics and reports shown on the teacher dashboard."),
        likert("t_q12", 12, "The performance monitoring tools saved me time compared to manually tracking student progress.")
      ]
    },
    {
      id: "engagement",
      title: "Student engagement observations",
      description: "Based on your observations during the intervention.",
      questions: [
        likert("t_q13", 13, "Students appeared more motivated to complete learning tasks when using SkulKid than during conventional lessons."),
        likert("t_q14", 14, "Students showed higher on-task behaviour (focus, persistence) during SkulKid sessions than in regular class."),
        likert("t_q15", 15, "Students voluntarily discussed their XP progress, badges, or leaderboard ranks with their classmates."),
        likert("t_q16", 16, "Lower-performing students showed improvement in their participation and confidence during the intervention."),
        likert("t_q17", 17, "Students expressed positive attitudes toward Mathematics lessons more than before the intervention."),
        likert("t_q18", 18, "Students expressed positive attitudes toward English Language lessons more than before the intervention."),
        likert("t_q19", 19, "The gamification features (badges, leaderboard, streaks) appeared to motivate students to persist through difficult content."),
        likert("t_q20", 20, "Students asked to continue using the platform beyond their scheduled sessions."),
        likert("t_q21", 21, "The adaptive progression system (retry/practice more/unlock) kept students engaged at appropriate challenge levels."),
        likert("t_q22", 22, "The multiplayer challenge mode encouraged constructive peer interaction and collaborative learning.")
      ]
    },
    {
      id: "quality",
      title: "Quality & classroom fit",
      questions: [
        likert("t_q23", 23, "The platform is technically reliable (minimal crashes, fast loading) for classroom use."),
        likert("t_q24", 24, "The lesson content on SkulKid is aligned with the Ghana primary school curriculum."),
        likert("t_q25", 25, "The quiz questions are of appropriate difficulty for the year groups targeted."),
        likert("t_q26", 26, "The platform can be effectively integrated into regular lesson planning without major disruption."),
        likert("t_q27", 27, "I would recommend SkulKid to other primary school teachers."),
        likert("t_q28", 28, "I would continue using SkulKid with my students beyond this research study."),
        likert("t_q29", 29, "The platform has potential to reduce mathematics anxiety among primary school students."),
        likert("t_q30", 30, "The platform is accessible enough for students with limited prior technology experience.")
      ]
    },
    {
      id: "observations",
      title: "Professional observations",
      description: "Optional written comments.",
      questions: [
        text("t_q31", 31, "Which feature of the SkulKid platform had the most noticeable positive impact on your students? Describe what you observed."),
        text("t_q32", 32, "Did you notice any students who seemed negatively affected by any gamification feature (e.g. discouragement from the leaderboard)? Please describe."),
        text("t_q33", 33, "How did the adaptive progression system (retry / practice more / unlock) change the way students approached quizzes and lessons?"),
        text("t_q34", 34, "What improvements would you recommend to make SkulKid more effective as a classroom tool?"),
        text("t_q35", 35, "Any other comments or observations about the platform or the research experience?")
      ]
    }
  ]
};

const SYSTEM_FEATURES: Array<{ id: string; number: number; prompt: string }> = [
  { id: "c_f1", number: 1, prompt: "Student Login & Role Assignment" },
  { id: "c_f2", number: 2, prompt: "Course Browsing & Lesson Selection" },
  { id: "c_f3", number: 3, prompt: "Lesson Content Display & Media Rendering" },
  { id: "c_f4", number: 4, prompt: "Quiz Engine & Answer Submission" },
  { id: "c_f5", number: 5, prompt: "Adaptive Pathway Assignment (< 50% / 50–79% / ≥ 80%)" },
  { id: "c_f6", number: 6, prompt: "XP Award Calculation & Display" },
  { id: "c_f7", number: 7, prompt: "Badge Award Triggers & Notification" },
  { id: "c_f8", number: 8, prompt: "Streak Tracking & Daily Goal Counter" },
  { id: "c_f9", number: 9, prompt: "Leaderboard Ranking & Nearest Neighbours View" },
  { id: "c_f10", number: 10, prompt: "Level-Up Animation & Avatar Unlock" },
  { id: "c_f11", number: 11, prompt: "Teacher Dashboard — Student Progress View" },
  { id: "c_f12", number: 12, prompt: "Teacher Dashboard — Topic-Level Quiz Breakdown" },
  { id: "c_f13", number: 13, prompt: "Teacher Course Creation & Module Management" },
  { id: "c_f14", number: 14, prompt: "Teacher Quiz Builder & Gamification Configuration" },
  { id: "c_f15", number: 15, prompt: "Admin User Management & Content Moderation" },
  { id: "c_f16", number: 16, prompt: "Admin Platform Activity Monitor" },
  { id: "c_f17", number: 17, prompt: "System Log Export (Anonymised Participant Codes)" },
  { id: "c_f18", number: 18, prompt: "Mobile / Tablet Responsive Display" }
];

const SYSTEM_METRICS: Array<{ id: string; number: number; prompt: string; benchmark: string }> = [
  { id: "c_m1", number: 1, prompt: "Average Page Load Time (LCP)", benchmark: "< 2.5 seconds" },
  { id: "c_m2", number: 2, prompt: "Lighthouse Performance Score", benchmark: "> 90 / 100" },
  { id: "c_m3", number: 3, prompt: "Peak Concurrent Users Supported", benchmark: "> 60 users" },
  { id: "c_m4", number: 4, prompt: "Session Crash / Timeout Rate", benchmark: "< 2%" },
  { id: "c_m5", number: 5, prompt: "Quiz Submission Success Rate", benchmark: "> 98%" },
  { id: "c_m6", number: 6, prompt: "XP Award Processing Time", benchmark: "< 1 second" },
  { id: "c_m7", number: 7, prompt: "Leaderboard Refresh Latency", benchmark: "< 3 seconds" },
  { id: "c_m8", number: 8, prompt: "Mobile Responsive Layout", benchmark: "Pass" },
  { id: "c_m9", number: 9, prompt: "HTTPS Enforcement", benchmark: "Active" },
  { id: "c_m10", number: 10, prompt: "JWT Token Validation on Protected Routes", benchmark: "Pass" },
  { id: "c_m11", number: 11, prompt: "OWASP ZAP Scan — Critical Vulnerabilities", benchmark: "0" },
  { id: "c_m12", number: 12, prompt: "Overall SRMR (PLS-SEM Model Fit)", benchmark: "< 0.08" }
];

const SYSTEM_UAT: Array<{ id: string; number: number; prompt: string }> = [
  { id: "c_u1", number: 1, prompt: "Register a new student account" },
  { id: "c_u2", number: 2, prompt: "Log in and locate the dashboard" },
  { id: "c_u3", number: 3, prompt: "Browse and select a Mathematics course" },
  { id: "c_u4", number: 4, prompt: "Select a lesson and study lesson content" },
  { id: "c_u5", number: 5, prompt: "Complete a quiz and review the score" },
  { id: "c_u6", number: 6, prompt: "Observe XP award and badge notification" },
  { id: "c_u7", number: 7, prompt: "Check the leaderboard and own rank" },
  { id: "c_u8", number: 8, prompt: "View and understand the daily goal / streak counter" },
  { id: "c_u9", number: 9, prompt: "Log out and log back in without assistance" }
];

const systemForm: FormDef = {
  formType: "system",
  title: "System evaluation checklist",
  subtitle: "Form C — Technical & usability assessment",
  intro: "For the research team or designated system evaluator. Document functional completeness, performance metrics, and UAT findings.",
  sections: [
    {
      id: "features",
      title: "Functional completeness",
      description: "For each feature, mark Works or Issue and add a short note if needed.",
      questions: SYSTEM_FEATURES.map((item) => ({
        id: item.id,
        number: item.number,
        kind: "triad" as const,
        prompt: item.prompt,
        required: true,
        options: [
          { value: "works", label: "Works" },
          { value: "issue", label: "Issue" }
        ],
        noteId: `${item.id}_notes`
      }))
    },
    {
      id: "metrics",
      title: "System performance metrics",
      description: "Record observed values and whether the benchmark was met.",
      questions: SYSTEM_METRICS.map((item) => ({
        id: item.id,
        number: item.number,
        kind: "metric" as const,
        prompt: `${item.prompt} (target: ${item.benchmark})`,
        required: false,
        maxLength: 80
      }))
    },
    {
      id: "uat",
      title: "UAT observations",
      description: "n = 15 Primary 5 participants (non-participating school).",
      questions: [
        ...SYSTEM_UAT.map((item) => ({
          id: item.id,
          number: item.number,
          kind: "uat" as const,
          prompt: item.prompt,
          required: false
        })),
        text("c_c1", "C1", "Summary of usability issues identified during UAT and resolutions applied."),
        text("c_c2", "C2", "Overall UAT SUS (System Usability Scale) mean score and interpretation."),
        text("c_c3", "C3", "Any outstanding issues recommended for future development iterations."),
        text("c_evaluator", "Name", "Evaluator name (optional for research records).", false),
        text("c_eval_date", "Date", "Evaluation date (optional).", false)
      ]
    }
  ]
};

export const FORMS: Record<FormType, FormDef> = {
  student: studentForm,
  teacher: teacherForm,
  system: systemForm
};

export function getForm(formType: FormType): FormDef {
  return FORMS[formType];
}

export function isFormType(value: string): value is FormType {
  return value === "student" || value === "teacher" || value === "system";
}

export function allQuestions(form: FormDef): QuestionDef[] {
  return form.sections.flatMap((section) => section.questions);
}

export function likertSectionIds(form: FormDef): string[] {
  return form.sections
    .filter((section) => section.questions.some((q) => q.kind === "likert"))
    .map((section) => section.id);
}

export function computeSectionMeans(form: FormDef, answers: Record<string, unknown>): Record<string, number | null> {
  const means: Record<string, number | null> = {};
  for (const section of form.sections) {
    const likerts = section.questions.filter((q) => q.kind === "likert");
    if (!likerts.length) continue;
    const values = likerts
      .map((q) => Number(answers[q.id]))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
    means[section.id] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  }
  return means;
}

export function validateAnswers(form: FormDef, answers: Record<string, unknown>): string | null {
  for (const question of allQuestions(form)) {
    if (question.kind === "triad") {
      const status = answers[question.id];
      if (question.required && (status !== "works" && status !== "issue")) {
        return `Please mark feature ${question.number}.`;
      }
      continue;
    }
    if (question.kind === "metric") {
      const observed = answers[`${question.id}_observed`];
      const met = answers[`${question.id}_met`];
      if (typeof observed === "string" && observed.length > 80) return "A metric value is too long.";
      if (met != null && met !== "" && met !== "Y" && met !== "N") return "Metric met flag must be Y or N.";
      continue;
    }
    if (question.kind === "uat") {
      const completed = answers[`${question.id}_completed`];
      const meanTime = answers[`${question.id}_time`];
      const issues = answers[`${question.id}_issues`];
      if (typeof completed === "string" && completed.length > 40) return "UAT completion value is too long.";
      if (typeof meanTime === "string" && meanTime.length > 40) return "UAT time value is too long.";
      if (typeof issues === "string" && issues.length > 500) return "UAT issues note is too long.";
      continue;
    }
    const value = answers[question.id];
    if (question.required) {
      if (value == null || value === "") return `Please answer question ${question.number}.`;
    }
    if (question.kind === "likert") {
      if (value == null || value === "") {
        if (question.required) return `Please rate statement ${question.number}.`;
        continue;
      }
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 5) return `Invalid rating for question ${question.number}.`;
    }
    if (question.kind === "single") {
      if (value == null || value === "") {
        if (question.required) return `Please answer question ${question.number}.`;
        continue;
      }
      if (!question.options?.some((opt) => opt.value === value)) {
        return `Invalid option for question ${question.number}.`;
      }
    }
    if (question.kind === "text" && typeof value === "string") {
      const max = question.maxLength ?? 2000;
      if (value.length > max) return `Answer ${question.number} is too long.`;
    }
  }
  return null;
}

export function publicFeedbackUrls(origin: string) {
  const base = origin.replace(/\/$/, "");
  return {
    hub: `${base}/feedback`,
    student: `${base}/feedback/student`,
    teacher: `${base}/feedback/teacher`,
    system: `${base}/feedback/system`
  };
}

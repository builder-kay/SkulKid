export type TeacherTutorialPath =
  | "start"
  | "build"
  | "assess"
  | "communicate"
  | "monitor"
  | "personalise";

export type TeacherTutorial = {
  id: string;
  path: TeacherTutorialPath;
  title: string;
  summary: string;
  prerequisites: string[];
  steps: string[];
  success: string;
  mistakes: string[];
  note?: { tone: "tip" | "safety" | "publishing"; text: string };
  action: { label: string; href: string };
  visual: string[];
  keywords: string[];
};

export const teacherTutorialPaths: Array<{
  id: TeacherTutorialPath;
  label: string;
  description: string;
}> = [
  { id: "start", label: "Start teaching", description: "Create a classroom and welcome learners." },
  { id: "build", label: "Build learning", description: "Create courses, modules and strong lessons." },
  { id: "assess", label: "Assess learners", description: "Create, assign and review quiz challenges." },
  { id: "communicate", label: "Communicate", description: "Read messages and send useful updates." },
  { id: "monitor", label: "Monitor and support", description: "Understand progress and respond fairly." },
  { id: "personalise", label: "Personalise", description: "Shape the learning dashboard experience." }
];

export const teacherTutorials: TeacherTutorial[] = [
  {
    id: "create-class",
    path: "start",
    title: "Create your first class",
    summary: "Set up a named classroom for one Primary level before inviting learners.",
    prerequisites: ["A teacher account", "The class name and Primary level"],
    steps: [
      "Open Classes and choose Create a class.",
      "Enter a clear class name, select its Primary level and add an optional description.",
      "Choose Create class and wait for the classroom card to appear.",
      "Open the class to see its roster, courses, quizzes, leaderboard and monitoring tools."
    ],
    success: "The new class appears under Active classes with a join code and zero or more learners.",
    mistakes: [
      "If the class name is unclear, edit your naming convention before sharing its code.",
      "Do not create a second class just because no learner has joined yet—share the existing join code first."
    ],
    note: { tone: "tip", text: "A name such as “Basic 4 Science Explorers” is easier to recognise than “My class”." },
    action: { label: "Create a class", href: "/teacher/classes?create=1" },
    visual: ["Class name", "Primary level", "Join code"],
    keywords: ["classroom", "new class", "primary level", "grade"]
  },
  {
    id: "invite-students",
    path: "start",
    title: "Invite learners with a join code",
    summary: "Share the class code or direct join link and watch learners appear in the roster.",
    prerequisites: ["An active class", "Learners with SkulKid accounts"],
    steps: [
      "Open Classes and find the classroom card.",
      "Copy either the join code or the full join link.",
      "Share it in class, through WhatsApp or in the school’s approved communication group.",
      "Ask learners to open the link or enter the code, then refresh the class roster."
    ],
    success: "Joined learners appear in the class roster and can access assigned courses and quizzes.",
    mistakes: [
      "Make sure learners join with their own account rather than a sibling’s username.",
      "If a code is copied incorrectly, use Copy code instead of retyping it."
    ],
    note: { tone: "safety", text: "Share class links only with the intended learners and their guardians." },
    action: { label: "Open your classes", href: "/teacher/classes" },
    visual: ["Copy code", "Learner joins", "Roster updates"],
    keywords: ["invite", "join", "code", "link", "roster", "student"]
  },
  {
    id: "manage-roster",
    path: "start",
    title: "Manage a class roster",
    summary: "Review membership and use each classroom as the home for teaching activity.",
    prerequisites: ["An active class"],
    steps: [
      "Open the class and begin on the Roster tab.",
      "Confirm learner names and review their class activity.",
      "Use Courses to manage learning, Quizzes to assess, Leaderboard to celebrate progress and Monitor to support learners.",
      "Archive a classroom only when it should no longer accept normal teaching activity."
    ],
    success: "The roster contains only the intended learners and the class tabs show the correct activity.",
    mistakes: ["Do not archive an active class to hide it temporarily.", "Check the class name before making changes when you teach several classes."],
    action: { label: "Review classes", href: "/teacher/classes" },
    visual: ["Roster", "Courses", "Quizzes", "Monitor"],
    keywords: ["members", "students", "archive", "class tabs"]
  },
  {
    id: "create-course",
    path: "build",
    title: "Create a course or subject",
    summary: "Create the learning container that will hold modules and lessons.",
    prerequisites: ["A course title and description", "At least one Primary level", "A class if the course is class-based"],
    steps: [
      "Open Courses and choose Create course.",
      "Add the course name, description, colour, Primary levels and optional cover image.",
      "Choose My classes, Public Learning, or Classes + Public Learning as the audience.",
      "For a class audience, select one or more active classes.",
      "Save the course before adding modules and lessons."
    ],
    success: "The course appears in your Course workspace with its audience label.",
    mistakes: [
      "A course is not a lesson; use it to organise a complete learning path.",
      "If My classes or Classes + Public Learning is selected, choose at least one class."
    ],
    note: { tone: "publishing", text: "Public Learning courses remain private until a ready version is submitted and approved." },
    action: { label: "Create a course", href: "/teacher/curriculum?create=1" },
    visual: ["Course", "Audience", "Save"],
    keywords: ["course", "subject", "public learning", "audience", "class learning"]
  },
  {
    id: "course-audiences",
    path: "build",
    title: "Choose the correct course audience",
    summary: "Understand when learning belongs to classes, Public Learning, or both.",
    prerequisites: ["A teacher-created course"],
    steps: [
      "Choose My classes when only selected classrooms should use the course.",
      "Choose Public Learning when the approved course should be available across SkulKid.",
      "Choose Classes + Public Learning when selected classes need immediate updates and public learners should receive approved versions.",
      "Save the audience. Every module and lesson inside the course inherits it."
    ],
    success: "The course card shows the intended audience and the selected classes are listed where applicable.",
    mistakes: ["Do not create duplicate lessons for each audience.", "Changing a public course to class-only removes its public publication."],
    note: { tone: "publishing", text: "While an update is in review, assigned classes can use current ready lessons and public learners keep the last approved version." },
    action: { label: "Manage course audiences", href: "/teacher/curriculum" },
    visual: ["My classes", "Public Learning", "Both"],
    keywords: ["audience", "public", "combined", "class-only", "approval"]
  },
  {
    id: "add-module",
    path: "build",
    title: "Add modules to a course",
    summary: "Break a course into meaningful teaching units before placing lessons.",
    prerequisites: ["A teacher-created course"],
    steps: [
      "Open Courses and select the course.",
      "Under Modules, choose Add module.",
      "Enter a short module title and an optional description.",
      "Save it, then repeat only when the course needs another clear learning stage."
    ],
    success: "The module appears inside the selected course and can receive lessons.",
    mistakes: ["Do not use a module as a single lesson title.", "Check that the correct course is selected before adding it."],
    note: { tone: "tip", text: "Think Course → Module → Lesson. For example: Mathematics → Fractions → Comparing fractions." },
    action: { label: "Add a module", href: "/teacher/curriculum" },
    visual: ["Course", "Module", "Lesson"],
    keywords: ["module", "unit", "topic", "structure"]
  },
  {
    id: "create-lesson",
    path: "build",
    title: "Create a strong lesson",
    summary: "Build a complete lesson with guided teaching material, examples, assessment and rewards.",
    prerequisites: ["A teacher-created course", "A module or a module name", "A clear learning objective"],
    steps: [
      "Open Create Lesson and choose the course and module placement.",
      "Add the lesson title, description and measurable learning objectives.",
      "Build Teaching material with guided blocks that explain, model, practise, check and recap.",
      "Add optional images or supported videos with useful alternative text and viewing instructions.",
      "Add a worked example, assessment questions and appropriate XP and mastery settings.",
      "Use Check lesson, correct validation issues, then Save as draft or mark the lesson ready."
    ],
    success: "The ready lesson appears in the selected course and module in the Lesson library.",
    mistakes: [
      "A title and video alone are not enough—include a clear objective and learning activity.",
      "Do not mark a lesson ready while validation errors remain.",
      "Use age-appropriate language and verify every answer and explanation."
    ],
    note: { tone: "safety", text: "Only use media you are allowed to share, and never include private learner information in lesson material." },
    action: { label: "Create a lesson", href: "/teacher/lessons/new" },
    visual: ["Placement", "Teaching blocks", "Check", "Ready"],
    keywords: ["lesson", "guided blocks", "teaching material", "objectives", "video", "assessment", "xp"]
  },
  {
    id: "link-lessons",
    path: "build",
    title: "Link and reorder lessons",
    summary: "Place lessons inside the correct module and arrange the order learners should follow.",
    prerequisites: ["A course with a module", "At least one lesson created by you"],
    steps: [
      "Open Courses and select the course and module.",
      "Choose an available lesson and select Link to module.",
      "Use the arrow controls to move lessons earlier or later inside that module.",
      "Use Unlink only when the lesson should return to the unassigned area.",
      "Optionally attach a lesson to a topic group within the module."
    ],
    success: "The module lists every linked lesson in the intended teaching order.",
    mistakes: ["Reordering never moves a lesson to another module.", "An unassigned lesson may be difficult for learners to find in the intended path."],
    action: { label: "Organise course lessons", href: "/teacher/curriculum" },
    visual: ["Choose lesson", "Link", "Reorder"],
    keywords: ["link", "attach", "reorder", "unlink", "lesson order", "topic"]
  },
  {
    id: "publish-public-learning",
    path: "build",
    title: "Publish to Public Learning",
    summary: "Submit a frozen, learner-ready course version without exposing unfinished edits.",
    prerequisites: ["A Public Learning or combined course", "At least one complete lesson marked ready"],
    steps: [
      "Open Courses and select the public course.",
      "Review its levels, modules, lesson order and ready lesson count.",
      "Choose Submit to Public Learning.",
      "If approval is required, wait for an administrator to approve or return the version with a note.",
      "When changes are requested, correct the working course and choose Resubmit changes.",
      "For later edits, choose Submit updated version; the current approved version remains live during review."
    ],
    success: "The publication panel shows a live version number or an In review status.",
    mistakes: ["Marking a lesson ready does not itself publish the course publicly.", "Do not unpublish when you only intend to edit a future version."],
    note: { tone: "publishing", text: "An approved revision is frozen. Later course edits do not silently change what public learners see." },
    action: { label: "Open Public Learning publishing", href: "/teacher/curriculum" },
    visual: ["Ready lessons", "Submit", "Review", "Live"],
    keywords: ["publish", "approval", "in review", "changes requested", "revision", "public learning"]
  },
  {
    id: "ai-lesson-import",
    path: "build",
    title: "Use AI-assisted lesson preparation",
    summary: "Import teaching notes into an editable draft, then review every generated detail.",
    prerequisites: ["A supported source file", "AI configured by the platform administrator"],
    steps: [
      "Open Create Lesson and use the import or AI preparation controls.",
      "Choose the subject, Primary level and desired question count.",
      "Upload the source lesson material and wait for the editable draft.",
      "Review objectives, teaching blocks, examples, questions, answers and rewards.",
      "Correct the draft and run Check lesson before saving."
    ],
    success: "The generated material is editable in the normal lesson builder and passes validation.",
    mistakes: ["Never publish generated content without checking it.", "If AI is unavailable, continue with manual lesson creation."],
    note: { tone: "safety", text: "AI assists preparation; the teacher remains responsible for curriculum accuracy, age suitability and correct answers." },
    action: { label: "Prepare a lesson", href: "/teacher/lessons/new" },
    visual: ["Source file", "Editable draft", "Teacher review"],
    keywords: ["ai", "import", "extract", "document", "generate", "gemini"]
  },
  {
    id: "reusable-quiz",
    path: "assess",
    title: "Create a reusable quiz",
    summary: "Build one quiz in the library and assign frozen copies to one or many classes.",
    prerequisites: ["At least one active class before assignment", "Questions and correct answers"],
    steps: [
      "Open Quizzes and choose Create reusable quiz.",
      "Complete Quiz basics: title, description, subject, Primary levels and challenge settings.",
      "Build 1–30 multiple-choice or true/false questions and select exactly one correct answer.",
      "Add optional explanations learners can see after they become eligible for answer review.",
      "Review the learner-style preview, then Save draft or Mark ready."
    ],
    success: "The quiz card shows Ready and offers the Assign action.",
    mistakes: ["Draft quizzes cannot be assigned.", "Check for empty or duplicate answer choices and verify the correct-answer marker."],
    action: { label: "Create a reusable quiz", href: "/teacher/quizzes?create=1" },
    visual: ["Basics", "Questions", "Review", "Ready"],
    keywords: ["quiz library", "reusable", "multiple choice", "true false", "ready"]
  },
  {
    id: "class-quiz",
    path: "assess",
    title: "Create a one-off class quiz",
    summary: "Publish a quiz directly inside one classroom when it will not be reused.",
    prerequisites: ["An active class", "At least one valid question"],
    steps: [
      "Open Classes, select the classroom and open its Quizzes tab.",
      "Use Create a class quiz.",
      "Add the title, description, questions, correct answers, XP, pass mark and attempts.",
      "Optionally set the schedule and real-world reward.",
      "Publish the quiz. Learners receive the configured notification."
    ],
    success: "The quiz appears in the class’s active quiz list.",
    mistakes: ["Use the reusable Quiz Library if several classes need the same assessment.", "Verify the class before publishing because this quiz belongs only to that classroom."],
    action: { label: "Open classes", href: "/teacher/classes" },
    visual: ["Class", "Quiz", "Publish"],
    keywords: ["one-off", "class quiz", "assessment"]
  },
  {
    id: "assign-quiz",
    path: "assess",
    title: "Assign a quiz to classes",
    summary: "Publish frozen quiz copies to selected classes and notify their learners.",
    prerequisites: ["A reusable quiz marked Ready", "One or more active classes"],
    steps: [
      "Open Quizzes and choose Assign on a ready quiz.",
      "Select one or more owned classes.",
      "Optionally set a start time, end or take-by time and a real-world reward.",
      "Choose Assign and notify.",
      "Review any SMS delivery warning without creating duplicate assignments."
    ],
    success: "The quiz assignment count increases and each selected class receives its own frozen copy.",
    mistakes: ["The same source quiz cannot have two active copies in one class.", "Editing the library quiz later does not change existing assignments."],
    note: { tone: "publishing", text: "The notification includes the quiz schedule and direct platform link. Learners without a usable number may be skipped." },
    action: { label: "Assign a reusable quiz", href: "/teacher/quizzes" },
    visual: ["Ready quiz", "Choose classes", "Notify"],
    keywords: ["assign", "multi-class", "sms", "frozen copy"]
  },
  {
    id: "quiz-schedules",
    path: "assess",
    title: "Set quiz schedules and rewards",
    summary: "Control when a quiz can be opened and explain both platform and classroom rewards.",
    prerequisites: ["A ready reusable quiz or class quiz"],
    steps: [
      "Leave both schedule fields empty to open the quiz immediately until the teacher closes it.",
      "Set only Ends / take by to open now with a deadline.",
      "Set Starts at and Ends / take by for a fixed access window.",
      "Confirm the end is later than the start.",
      "Optionally describe a fair, school-appropriate real-world reward."
    ],
    success: "Learners can open the quiz only during the intended period and can see its stated rewards.",
    mistakes: ["Do not use speed rewards; scoring is based on answers.", "Avoid rewards that shame, exclude or unfairly burden learners."],
    note: { tone: "safety", text: "Use real-world rewards positively and follow school policy. Platform XP and stars remain governed by the quiz settings." },
    action: { label: "Open Quiz Library", href: "/teacher/quizzes" },
    visual: ["Start", "Take by", "Reward"],
    keywords: ["schedule", "deadline", "start time", "end time", "offline reward", "real-world reward"]
  },
  {
    id: "quiz-results",
    path: "assess",
    title: "Review and end quizzes",
    summary: "Use attempts, average scores and pass rates to decide when learners need support.",
    prerequisites: ["A published quiz assignment"],
    steps: [
      "Open the relevant class or Quiz Library analytics.",
      "Review attempt counts, average score and pass rate rather than one score in isolation.",
      "Encourage an eligible retake when practice would help.",
      "Close an unscheduled quiz when it should stop accepting attempts.",
      "Know that a manually closed or expired quiz becomes available to current class members in PASCO for unscored review and practice."
    ],
    success: "The active quiz reflects the intended status and ended material is no longer available for scored attempts.",
    mistakes: ["PASCO practice does not award XP or alter leaderboards.", "Do not expose answer explanations early when attempts remain."],
    action: { label: "Review class quizzes", href: "/teacher/classes" },
    visual: ["Attempts", "Insight", "End", "PASCO"],
    keywords: ["analytics", "attempts", "average", "pass rate", "close", "ended", "pasco"]
  },
  {
    id: "messages",
    path: "communicate",
    title: "Read and send messages",
    summary: "Respond to learner messages and send notices to the right audience.",
    prerequisites: ["At least one active class for class messaging"],
    steps: [
      "Open Messages to review incoming learner messages and unread indicators.",
      "Search by learner, class or message text when necessary.",
      "Choose Reply to prepare a private response to the learner.",
      "For a new notice, choose one class, all your learners, selected learners or one learner.",
      "Add a useful title and message, review the recipient count and send."
    ],
    success: "A success notice confirms how many learners received the message.",
    mistakes: ["Check the audience and recipient count before sending.", "Do not include confidential information in a whole-class notice."],
    note: { tone: "safety", text: "Keep messages respectful, specific and appropriate for the selected audience." },
    action: { label: "Compose a message", href: "/teacher/communications?compose=1" },
    visual: ["Choose audience", "Write", "Review count", "Send"],
    keywords: ["message", "notification", "reply", "audience", "inbox"]
  },
  {
    id: "send-advice",
    path: "communicate",
    title: "Send learning advice",
    summary: "Give a learner a focused next step based on their class performance.",
    prerequisites: ["A class with at least one learner"],
    steps: [
      "Open a class and choose Monitor.",
      "Review the performance snapshot before selecting a learner.",
      "Choose class adventure, platform adventure or general encouragement.",
      "Write a specific, supportive suggestion and send it."
    ],
    success: "The advice is attached to the selected learner and appears in their learning experience.",
    mistakes: ["Avoid generic criticism.", "Base advice on visible learning evidence and give one achievable next step."],
    action: { label: "Open class monitoring", href: "/teacher/classes" },
    visual: ["Review progress", "Choose learner", "Encourage"],
    keywords: ["advice", "coach", "nudge", "recommendation"]
  },
  {
    id: "monitor-progress",
    path: "monitor",
    title: "Monitor progress and leaderboards",
    summary: "Combine class activity, quiz performance and learner progress to guide support.",
    prerequisites: ["A class with learners"],
    steps: [
      "Open a class and review its Roster for participation.",
      "Use Leaderboard to view class XP, stars, quiz averages and passes.",
      "Use Monitor for completed lessons, quiz averages and learners who may need a nudge.",
      "Celebrate improvement as well as high totals.",
      "Use messages or advice to recommend the next useful activity."
    ],
    success: "You can identify learners who are on track and learners who need a clear next step.",
    mistakes: ["Do not treat the leaderboard as the only measure of learning.", "Consider attempts, improvement and participation together."],
    note: { tone: "tip", text: "Private encouragement is often more useful than publicly comparing a learner who needs support." },
    action: { label: "Open class dashboards", href: "/teacher/classes" },
    visual: ["Roster", "Leaderboard", "Monitor", "Support"],
    keywords: ["progress", "leaderboard", "xp", "stars", "performance"]
  },
  {
    id: "point-deductions",
    path: "monitor",
    title: "Use point deductions responsibly",
    summary: "Record an approved offline reward or classroom adjustment with a clear reason.",
    prerequisites: ["A learner with sufficient points", "A legitimate school-approved reason"],
    steps: [
      "Open the class roster and choose the learner’s point deduction action.",
      "Enter an amount within the displayed limit and available balance.",
      "Write the exact reason; the learner will see it.",
      "Review the learner and amount, then confirm.",
      "If the learner reports the deduction, follow its status in Monitor while an administrator reviews it."
    ],
    success: "The deduction appears with its reason and the learner’s balance updates.",
    mistakes: ["Never deduct points as an unexplained punishment.", "Do not repeat a deduction while a submission or report is still processing."],
    note: { tone: "safety", text: "Learners may dispute deductions. Administrators can uphold or reverse them, so reasons must be factual and fair." },
    action: { label: "Open class rosters", href: "/teacher/classes" },
    visual: ["Amount", "Reason", "Confirm", "Admin review"],
    keywords: ["deduct", "points", "dispute", "report", "offline reward"]
  },
  {
    id: "teacher-settings",
    path: "personalise",
    title: "Configure the learner experience",
    summary: "Choose dashboard progress sections, learning defaults and an appropriate daily goal.",
    prerequisites: ["A teacher account"],
    steps: [
      "Open Teacher settings.",
      "Start with Balanced, Focused or Celebratory, or adjust individual dashboard sections.",
      "Choose the daily XP goal, default subject and course-card spacing.",
      "Review the live dashboard preview.",
      "Choose Save changes, or Restore defaults when you want to start again."
    ],
    success: "The settings page says All changes saved and the preview reflects your choices.",
    mistakes: ["Do not hide every progress section without checking the preview.", "Unsaved changes are not applied."],
    action: { label: "Open Teacher settings", href: "/teacher/settings" },
    visual: ["Choose preset", "Adjust", "Preview", "Save"],
    keywords: ["settings", "daily goal", "dashboard", "xp", "stars", "streak", "default subject"]
  }
];

export function filterTeacherTutorials(
  tutorials: TeacherTutorial[],
  query: string,
  path: "all" | TeacherTutorialPath
) {
  const needle = query.trim().toLowerCase();
  return tutorials.filter((tutorial) => {
    if (path !== "all" && tutorial.path !== path) return false;
    if (!needle) return true;
    return [
      tutorial.title,
      tutorial.summary,
      ...tutorial.prerequisites,
      ...tutorial.steps,
      tutorial.success,
      ...tutorial.mistakes,
      tutorial.note?.text ?? "",
      ...tutorial.keywords
    ].join(" ").toLowerCase().includes(needle);
  });
}

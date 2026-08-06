/**
 * Generates supabase/seeds/teacher_kay_public_internet_safety.sql
 * Run: node scripts/generate-internet-safety-seed.mjs
 */
import fs from "node:fs";

const subjectId = "teacher-kay-public-internet-safety";
const subjectOrder = 1; // first among public learning subjects

const lessons = [
  {
    no: 1,
    substrand: 1,
    title: "What Is the Internet and Why Safety Matters",
    description: "Learn what the internet is, how devices connect, and why every explorer needs safety habits.",
    readingHeading: "Welcome to the online world",
    reading: `The internet is a worldwide network that lets computers, phones and tablets share information. You can learn, play games, watch videos and message friends — but the same tools can also expose you to tricks, mean behaviour or people who are not who they claim to be.

Internet safety means making careful choices so you can enjoy the good parts of being online while protecting your personal information, your feelings and your devices. Safety is a skill you practise, just like reading or football. In this subject you will learn how passwords, privacy, kindness and trusted adults work together to keep you safer.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=i307esUZTSc", title: "Be Internet Awesome overview" },
      { url: "https://www.youtube.com/watch?v=o4MwTvtyrUQ", title: "What is a browser?" }
    ],
    quiz: [
      { prompt: "The internet is best described as:", type: "multiple_choice", options: ["A worldwide network that lets devices share information", "One single computer owned by every school", "A toy that never connects to other people", "A password you write on your desk"], correctIndex: 0, explanation: "It is a global network of connected devices." },
      { prompt: "Why does internet safety matter for learners?", type: "multiple_choice", options: ["Because online tools can help and also create risks", "Because the internet has no useful learning content", "Because devices never store information", "Because adults never use the internet"], correctIndex: 0, explanation: "Helpful tools still need careful habits." },
      { prompt: "True or false: Internet safety is a skill you can practise and improve.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Safety habits grow with practice." },
      { prompt: "A browser is mainly used to:", type: "multiple_choice", options: ["Open websites and online pages", "Cook food for the whole class", "Replace every school rule", "Turn off gravity"], correctIndex: 0, explanation: "Browsers load web pages." },
      { prompt: "Which choice shows a safety mindset?", type: "multiple_choice", options: ["Enjoy useful sites while protecting private details", "Share every secret with strangers for fun", "Ignore any unusual message forever", "Never tell a trusted adult about online problems"], correctIndex: 0, explanation: "Balance learning with protection." },
      { prompt: "True or false: Online spaces can include both kind people and people who try to trick others.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Not everyone online is trustworthy." },
      { prompt: "Devices that may connect to the internet include:", type: "multiple_choice", options: ["Phones, tablets and computers", "Only paper notebooks", "Only wooden rulers", "Only chalkboards"], correctIndex: 0, explanation: "Many digital devices can go online." },
      { prompt: "The best reason to learn safety early is:", type: "multiple_choice", options: ["So you can explore useful content with fewer avoidable risks", "So you never use technology again", "So you can copy classmates’ passwords", "So you can hide problems from every adult"], correctIndex: 0, explanation: "Skills reduce preventable harm." },
      { prompt: "Which is NOT a goal of internet safety?", type: "multiple_choice", options: ["Posting your home address publicly for strangers", "Protecting personal information", "Responding wisely to risky messages", "Asking trusted adults for help"], correctIndex: 0, explanation: "Publicly posting your address is unsafe." },
      { prompt: "A careful online explorer should:", type: "multiple_choice", options: ["Pause and think before sharing or clicking", "Click every pop-up as fast as possible", "Reuse one weak password everywhere", "Meet online strangers alone immediately"], correctIndex: 0, explanation: "Pause-and-think is a core habit." }
    ]
  },
  {
    no: 2,
    substrand: 1,
    title: "Strong Passwords and Private Accounts",
    description: "Build passwords that are hard to guess, keep them private, and understand why unique passwords matter.",
    readingHeading: "Your password is a digital key",
    reading: `A password is like a key to your online account. If someone else gets the key, they may read your messages, change your settings or pretend to be you.

A strong password is long, unique and hard to guess. Avoid your name, birthday, school name or “123456”. Mix letters, numbers and symbols when allowed. Never share your password with friends, and only discuss recovery options with a trusted adult. Where possible, use different passwords for important accounts so one leak does not open everything.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=25G4tLVH1JE", title: "Internet safety and privacy (passwords)" },
      { url: "https://www.youtube.com/watch?v=AIOUlQeQbNM", title: "Two-factor authentication explained" }
    ],
    quiz: [
      { prompt: "A strong password is usually:", type: "multiple_choice", options: ["Long, unique and hard to guess", "Your first name only", "The word password123 forever", "Your exact birthday with no changes"], correctIndex: 0, explanation: "Length and uniqueness matter." },
      { prompt: "Why is reusing one password on every site risky?", type: "multiple_choice", options: ["If one account is stolen, others may be easier to break into", "It makes websites load faster forever", "It deletes all your homework automatically", "It improves your spelling score"], correctIndex: 0, explanation: "One leak can cascade." },
      { prompt: "True or false: You should share your school account password with classmates so they can help you finish work.", type: "true_false", options: ["True", "False"], correctIndex: 1, explanation: "Passwords stay private." },
      { prompt: "Which password is weakest?", type: "multiple_choice", options: ["ama123", "Tr!ckyRiver-Piano47", "A long phrase with symbols", "A unique mix of words and numbers"], correctIndex: 0, explanation: "Short and guessable is weak." },
      { prompt: "Two-factor authentication adds:", type: "multiple_choice", options: ["A second check (like a code) beyond the password", "A free pizza delivery", "Permission to post your address", "A reason to share passwords"], correctIndex: 0, explanation: "Something you know + something you have." },
      { prompt: "True or false: Writing your password on a sticky note on your laptop screen is a safe classroom habit.", type: "true_false", options: ["True", "False"], correctIndex: 1, explanation: "Visible notes are easy to steal." },
      { prompt: "If you suspect someone knows your password, you should:", type: "multiple_choice", options: ["Tell a trusted adult and change the password with help", "Ignore it and hope for the best", "Post the password online as a warning", "Give the password to more friends"], correctIndex: 0, explanation: "Adult help + change credentials." },
      { prompt: "Personal details that make weak passwords include:", type: "multiple_choice", options: ["Your name, birthday or pet’s name alone", "Random long phrases", "Unrelated word combinations", "Symbols mixed with uncommon words"], correctIndex: 0, explanation: "Easy personal facts are guessable." },
      { prompt: "Account recovery options should be set up:", type: "multiple_choice", options: ["With a trusted adult so you can regain access safely", "By emailing your password to strangers", "By posting codes in a public chat", "Never, because recovery is useless"], correctIndex: 0, explanation: "Recovery needs adult guidance." },
      { prompt: "The main job of a password is to:", type: "multiple_choice", options: ["Control who can open your account", "Decorate your desktop wallpaper", "Replace all school rules", "Delete internet safety lessons"], correctIndex: 0, explanation: "Access control." }
    ]
  },
  {
    no: 3,
    substrand: 1,
    title: "Personal Information and Oversharing",
    description: "Identify private details, decide what is safe to share, and practise thinking before you post.",
    readingHeading: "Not everything belongs online",
    reading: `Personal information can identify you or help someone find you offline. Examples include your full name with address, phone number, school name paired with your photo, exact location, and private family details.

Oversharing means posting more than is wise. Even a “private” chat can be copied or forwarded. Before you share, ask: Would I be comfortable if a teacher, parent or stranger saw this later? Safe shares might include a hobby or a first name in a supervised class platform. Unsafe shares include addresses, passwords and live location for strangers.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=yiKeLOKc1tw", title: "Online privacy for kids" },
      { url: "https://www.youtube.com/watch?v=HxySrSbSY7o", title: "Being safe on the internet" }
    ],
    quiz: [
      { prompt: "Which is usually private personal information?", type: "multiple_choice", options: ["Home address and phone number", "Favourite colour alone", "A fictional story character name", "The word “hello”"], correctIndex: 0, explanation: "Contact details identify you." },
      { prompt: "Oversharing means:", type: "multiple_choice", options: ["Posting more private detail than is wise", "Reading a book quietly", "Turning off a device for sleep", "Asking a teacher for help"], correctIndex: 0, explanation: "Too much private detail online." },
      { prompt: "True or false: A message marked private can never be copied or forwarded.", type: "true_false", options: ["True", "False"], correctIndex: 1, explanation: "Others can still reshare." },
      { prompt: "Before posting a photo, a smart check is:", type: "multiple_choice", options: ["Could this reveal my location, school or identity to strangers?", "Did I use the largest font possible?", "Will this delete my password?", "Does this break gravity?"], correctIndex: 0, explanation: "Look for identifying clues." },
      { prompt: "Which share is usually safer on a class platform?", type: "multiple_choice", options: ["A hobby interest without private contact details", "Your full home address", "Your parent’s bank PIN", "A live map pin to your house for everyone"], correctIndex: 0, explanation: "Interests ≠ private contact data." },
      { prompt: "True or false: Combining a school uniform photo with your full name and suburb can make you easier to identify.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Clues stack together." },
      { prompt: "If a new online “friend” asks for your address, you should:", type: "multiple_choice", options: ["Refuse and tell a trusted adult", "Send it immediately to be polite", "Post it publicly so everyone can visit", "Trade it for their password"], correctIndex: 0, explanation: "Never give address to strangers." },
      { prompt: "A good thinking question before sharing is:", type: "multiple_choice", options: ["Would I be okay if this stayed online for a long time?", "How can I click faster?", "How do I hide this from every adult forever?", "Which stranger should get my password?"], correctIndex: 0, explanation: "Future-you matters." },
      { prompt: "Personal information is risky when strangers can use it to:", type: "multiple_choice", options: ["Identify, contact or locate you", "Improve your handwriting automatically", "Make rain stop", "Finish PE for you"], correctIndex: 0, explanation: "Identification and contact risk." },
      { prompt: "The safest response to pressure to overshare is:", type: "multiple_choice", options: ["Pause, refuse private details, and ask an adult if unsure", "Share everything to avoid awkwardness", "Guess the stranger’s secrets in return", "Post your timetable and house keys photo"], correctIndex: 0, explanation: "Pause and get help." }
    ]
  },
  {
    no: 4,
    substrand: 1,
    title: "Phishing, Scams and Fake Messages",
    description: "Spot urgency tricks, fake links and requests for secrets — then choose a safe response.",
    readingHeading: "When a message tries to trick you",
    reading: `Phishing is when someone pretends to be a trusted person or company to steal passwords, codes or personal details. Scam messages often create urgency: “Act now or your account will close!” They may use odd spelling, unexpected prizes or links that look almost real.

Never enter passwords after clicking a suspicious link. Do not send secret codes from texts or email. If something feels wrong, stop, do not click, and show a trusted adult. Checking the real website address carefully (or opening the site yourself from a known bookmark) is safer than trusting a random link.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=R12_y2BhKbE", title: "Recognise phishing and scams" },
      { url: "https://www.youtube.com/watch?v=X9Htg8V3eik", title: "Five internet safety tips" }
    ],
    quiz: [
      { prompt: "Phishing mainly tries to:", type: "multiple_choice", options: ["Trick you into giving secrets like passwords or codes", "Help you sleep earlier", "Improve your football skills", "Water classroom plants"], correctIndex: 0, explanation: "Social engineering for credentials." },
      { prompt: "A common scam tactic is:", type: "multiple_choice", options: ["Fake urgency such as “Act now or lose your account”", "Calm reminders to revise for a test", "Teacher feedback on homework", "Library opening hours"], correctIndex: 0, explanation: "Urgency pushes careless clicks." },
      { prompt: "True or false: A real bank or school will usually ask you to email your password to “verify” your account.", type: "true_false", options: ["True", "False"], correctIndex: 1, explanation: "Legitimate orgs do not ask for passwords by email." },
      { prompt: "If a pop-up says your device is infected and demands an instant download, you should:", type: "multiple_choice", options: ["Be suspicious, avoid the download, and ask an adult", "Download immediately from the pop-up", "Enter your password into the pop-up form", "Share the pop-up with friends to “help” them"], correctIndex: 0, explanation: "Scareware is a common trick." },
      { prompt: "Before trusting a link, a safer habit is:", type: "multiple_choice", options: ["Check with an adult and open the real site carefully yourself", "Click first and read later", "Forward the link to the whole class", "Type your password into any page that asks"], correctIndex: 0, explanation: "Verify before you click." },
      { prompt: "True or false: Scam sites can copy the look of real sites but use a slightly different web address.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Lookalike URLs are common." },
      { prompt: "Social engineering means:", type: "multiple_choice", options: ["Tricking people into revealing information or taking unsafe actions", "Building bridges with concrete only", "Drawing maps of rivers", "Naming insects in science"], correctIndex: 0, explanation: "Human-targeted deception." },
      { prompt: "A prize message that asks for your password to “claim a free phone” is likely:", type: "multiple_choice", options: ["A scam", "A government maths exam", "A PE warm-up", "A library silent rule"], correctIndex: 0, explanation: "Too-good prizes + password requests = scam." },
      { prompt: "If you clicked a suspicious link by mistake, you should:", type: "multiple_choice", options: ["Tell a trusted adult right away", "Hide the device and never speak of it", "Enter more passwords to “fix” it", "Post the link publicly as revenge"], correctIndex: 0, explanation: "Fast adult help reduces harm." },
      { prompt: "HTTPS with a lock icon means the connection is encrypted, but you still must:", type: "multiple_choice", options: ["Confirm you are on the correct, trusted site", "Ignore the address completely", "Share your password in the chat sidebar", "Disable all safety settings"], correctIndex: 0, explanation: "Encryption ≠ automatic trust of the whole site identity." }
    ]
  },
  {
    no: 5,
    substrand: 1,
    title: "Safe Downloads, Apps and Links",
    description: "Choose trusted sources, ask before installing, and recognise risky download pressure.",
    readingHeading: "Only install what you trust",
    reading: `Downloads and apps can be useful — or they can install malware that steals information or damages a device. Safe practice: only install from trusted stores or sources your school/family approve, read permission requests carefully, and ask an adult before installing anything new.

Avoid “free” crack tools, random USB programs from strangers, and links that demand you install a “fixer” after a scary warning. Keep devices updated when adults manage updates. If an app asks for permissions it does not need (like your location for a simple calculator), pause and ask why.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=R12_y2BhKbE", title: "Avoid scam downloads and fake warnings" },
      { url: "https://www.youtube.com/watch?v=o4MwTvtyrUQ", title: "Browsing carefully online" }
    ],
    quiz: [
      { prompt: "The safest place to get a new learning app is usually:", type: "multiple_choice", options: ["A trusted official store or source approved by an adult", "A random link in an unknown chat", "An email attachment from a stranger", "A pop-up that appears while gaming"], correctIndex: 0, explanation: "Trusted sources reduce malware risk." },
      { prompt: "Malware can:", type: "multiple_choice", options: ["Harm a device or steal information", "Water plants automatically", "Write your essay ethically for free always", "Delete the need for passwords forever safely"], correctIndex: 0, explanation: "Malicious software causes harm." },
      { prompt: "True or false: You should ask a trusted adult before installing unfamiliar software.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Adult approval is a safety rule." },
      { prompt: "A scary banner says “Download this cleaner now or your files will be deleted.” You should:", type: "multiple_choice", options: ["Treat it as suspicious and get adult help", "Download instantly from the banner", "Enter admin passwords into the banner", "Ignore school rules and install it"], correctIndex: 0, explanation: "Pressure downloads are risky." },
      { prompt: "App permissions should match:", type: "multiple_choice", options: ["What the app genuinely needs to work", "Every possible sensor on the planet", "Your friends’ passwords", "A stranger’s home address"], correctIndex: 0, explanation: "Least privilege." },
      { prompt: "True or false: Keeping devices updated (with adult help) can fix known security problems.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Updates patch vulnerabilities." },
      { prompt: "Opening unknown email attachments is risky because they may:", type: "multiple_choice", options: ["Contain malware", "Contain only harmless sunlight", "Contain guaranteed exam answers ethically", "Contain free house keys"], correctIndex: 0, explanation: "Attachments can carry malware." },
      { prompt: "If an app requests your microphone but is only a simple flashlight tool, you should:", type: "multiple_choice", options: ["Question the permission and ask an adult", "Always allow every permission forever", "Post your password to unlock permissions", "Share the app link blindly with strangers"], correctIndex: 0, explanation: "Odd permissions deserve scrutiny." },
      { prompt: "A “free cracked game” from an unknown site is often:", type: "multiple_choice", options: ["A high-risk source of malware", "The safest school resource", "Approved by every teacher automatically", "Required for internet safety class"], correctIndex: 0, explanation: "Cracks are frequently malicious." },
      { prompt: "Best habit before clicking a download link:", type: "multiple_choice", options: ["Verify the source and ask if unsure", "Click as fast as possible", "Disable antivirus permanently first", "Type passwords into the download page always"], correctIndex: 0, explanation: "Verify first." }
    ]
  },
  {
    no: 6,
    substrand: 2,
    title: "Cyberbullying and Kind Online Choices",
    description: "Define cyberbullying, refuse to pile on, and practise upstander actions that protect people.",
    readingHeading: "Kindness is a safety skill",
    reading: `Cyberbullying is using digital tools to repeatedly hurt, scare, humiliate or exclude someone. It can happen in chats, games, comments or by sharing private images without consent.

Being kind online means treating people with respect, refusing to join pile-ons, and not forwarding hurtful content. If you see cyberbullying: do not amplify it, save evidence if safe, block/report when available, and tell a trusted adult. Supporting the target with a private kind message can help — but serious threats need adult action immediately.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=FJ82iJ4OeYo", title: "Cyberbullying awareness" },
      { url: "https://www.youtube.com/watch?v=6EtF2C64Iyc", title: "Digital citizenship and kindness" }
    ],
    quiz: [
      { prompt: "Cyberbullying is:", type: "multiple_choice", options: ["Using digital tools to repeatedly hurt, scare or humiliate someone", "Helping a classmate revise maths", "Borrowing a pencil with permission", "Turning in homework on time"], correctIndex: 0, explanation: "Repeated digital harm." },
      { prompt: "An upstander online might:", type: "multiple_choice", options: ["Refuse to share hurtful posts and seek trusted help", "Add mean comments to join the crowd", "Forward private photos without consent", "Ignore serious threats forever"], correctIndex: 0, explanation: "Stop harm and get help." },
      { prompt: "True or false: Forwarding a humiliating photo “as a joke” can still be cyberbullying.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Spreading harm counts." },
      { prompt: "If someone sends you threats online, you should:", type: "multiple_choice", options: ["Save evidence if safe and tell a trusted adult", "Threaten them back immediately", "Post their home address", "Delete everything and never tell anyone"], correctIndex: 0, explanation: "Evidence + adult support." },
      { prompt: "Piling on means:", type: "multiple_choice", options: ["Joining others in attacking someone online", "Stacking library books neatly", "Helping clean the classroom", "Practising football passes"], correctIndex: 0, explanation: "Group digital attacks." },
      { prompt: "True or false: Blocking and reporting tools can reduce contact from a bully, but adults may still be needed.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Tools help; adults matter too." },
      { prompt: "A kind private message to a targeted classmate is useful when it:", type: "multiple_choice", options: ["Shows support without sharing the bullying further", "Reposts the bullying to “expose” everyone", "Demands they fight the bully alone", "Shares their secrets as comfort"], correctIndex: 0, explanation: "Support without amplifying." },
      { prompt: "Digital citizenship includes:", type: "multiple_choice", options: ["Making respectful choices that protect people online", "Ignoring all community rules", "Stealing accounts for fun", "Spreading rumours faster"], correctIndex: 0, explanation: "Respectful online behaviour." },
      { prompt: "Which action worsens cyberbullying?", type: "multiple_choice", options: ["Laughing along and resharing the hurtful post", "Reporting the post", "Comforting the target privately", "Telling a teacher"], correctIndex: 0, explanation: "Amplifying spreads harm." },
      { prompt: "The best first adult to tell about school-related cyberbullying is often:", type: "multiple_choice", options: ["A trusted teacher, counsellor or parent/guardian", "A random stranger in a game chat", "Nobody ever", "Only the bully’s online friends"], correctIndex: 0, explanation: "Trusted real-world adults." }
    ]
  },
  {
    no: 7,
    substrand: 2,
    title: "Strangers, Friends and Trusted Adults Online",
    description: "Separate real-world trust from online friendliness, and know when to stop and get help.",
    readingHeading: "Friendly is not the same as trusted",
    reading: `People online can pretend to be anyone. A friendly username does not prove age, location or intentions. Never arrange to meet someone you only know online without a trusted adult involved — and the safest default for children is not to meet online-only contacts in person.

If someone makes you uncomfortable, asks for secrets, pushes for private photos, or tries to move you to a secret app, stop communication and tell a trusted adult immediately. Real friends respect boundaries. Trusted adults help you decide next steps and keep you safer.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=HxySrSbSY7o", title: "Being safe with people online" },
      { url: "https://www.youtube.com/watch?v=yiKeLOKc1tw", title: "Share with care and privacy" }
    ],
    quiz: [
      { prompt: "Someone being friendly in chat proves:", type: "multiple_choice", options: ["Only that their messages sound friendly — not their true identity", "They are definitely your classmate", "They live next door", "They are a school teacher"], correctIndex: 0, explanation: "Identity can be faked." },
      { prompt: "If an online contact asks to meet you alone, you should:", type: "multiple_choice", options: ["Refuse and tell a trusted adult", "Agree and keep it secret", "Share your live location immediately", "Bring only your password list"], correctIndex: 0, explanation: "No secret meetings." },
      { prompt: "True or false: A trusted adult is someone who helps keep you safe and can act when something is wrong.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Trusted adults support safety." },
      { prompt: "A red flag is when someone online:", type: "multiple_choice", options: ["Pressures you for private photos or secrecy from adults", "Reminds you to revise for a test", "Shares a public educational video", "Says good morning politely once"], correctIndex: 0, explanation: "Pressure + secrecy is dangerous." },
      { prompt: "Moving a chat to a “secret app adults must not know about” is:", type: "multiple_choice", options: ["A serious warning sign", "Always required for friendship", "Proof the person is a teacher", "A maths strategy"], correctIndex: 0, explanation: "Secrecy from adults is a red flag." },
      { prompt: "True or false: You should stop communication if someone online makes you uncomfortable.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Stop and get help." },
      { prompt: "Real friends typically:", type: "multiple_choice", options: ["Respect boundaries and do not demand dangerous secrets", "Require your passwords to stay friends", "Force you to hide from every adult", "Ask for your address on day one"], correctIndex: 0, explanation: "Respect is the test." },
      { prompt: "If you already shared something risky, the next step is:", type: "multiple_choice", options: ["Tell a trusted adult quickly so they can help", "Never speak again and hope", "Share even more to “fix” trust", "Post the chat for strangers to judge"], correctIndex: 0, explanation: "Early adult help matters." },
      { prompt: "Online “friends” you have never met in real life should be treated as:", type: "multiple_choice", options: ["People you do not fully know yet", "Automatic family members", "School principals", "Password managers"], correctIndex: 0, explanation: "Limited trust." },
      { prompt: "The safest default for children about meeting online-only contacts is:", type: "multiple_choice", options: ["Do not meet them in person without trusted adult involvement — usually do not meet", "Meet immediately in a private place", "Meet if they offer gifts", "Meet if they know your favourite game"], correctIndex: 0, explanation: "Adult involvement; usually avoid." }
    ]
  },
  {
    no: 8,
    substrand: 2,
    title: "Privacy Settings and Digital Footprints",
    description: "Control who sees your posts and understand that online activity can leave a lasting trail.",
    readingHeading: "Your trail online",
    reading: `A digital footprint is the record of what you do online — posts, comments, uploads, and sometimes things others share about you. Footprints can be hard to erase completely.

Privacy settings help you choose who can see your content and who can contact you. Check settings with a trusted adult, prefer private accounts when appropriate, and think before posting. Ask: Does this add a footprint I will still respect next year? Protecting others’ footprints matters too — do not post photos of classmates without permission.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=7bRZdUtmH8k", title: "Follow the digital trail" },
      { url: "https://www.youtube.com/watch?v=25G4tLVH1JE", title: "Privacy settings and protection" }
    ],
    quiz: [
      { prompt: "A digital footprint is:", type: "multiple_choice", options: ["A record of what you do and share online", "Only mud on your shoes", "A type of fish", "A school bell schedule"], correctIndex: 0, explanation: "Online activity trail." },
      { prompt: "Privacy settings mainly help you:", type: "multiple_choice", options: ["Control who sees posts and who can contact you", "Increase device temperature", "Delete the internet", "Skip all lessons"], correctIndex: 0, explanation: "Audience and contact control." },
      { prompt: "True or false: Once something is online, it may be copied or saved even if you later delete your post.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Copies can persist." },
      { prompt: "Before posting a classmate’s photo, you should:", type: "multiple_choice", options: ["Ask their permission", "Post first and apologise never", "Tag their address", "Add their phone number in the caption"], correctIndex: 0, explanation: "Consent respects their footprint." },
      { prompt: "A smaller, safer footprint often includes:", type: "multiple_choice", options: ["Less private identifying detail and more thoughtful posts", "Your full address on every platform", "Passwords in your bio", "Live location for strangers"], correctIndex: 0, explanation: "Share less that identifies you." },
      { prompt: "True or false: Other people can add to your digital footprint by posting about you.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Others’ posts can involve you." },
      { prompt: "Reviewing privacy settings with an adult is wise because:", type: "multiple_choice", options: ["Defaults change and adults can help choose safer options", "Adults must post for you always", "Privacy settings are illegal", "Footprints only exist offline"], correctIndex: 0, explanation: "Guided configuration." },
      { prompt: "Which activity can leave a footprint?", type: "multiple_choice", options: ["Posting, commenting, uploading and some online searches/shares", "Only sleeping", "Only drinking water", "Only tying shoelaces"], correctIndex: 0, explanation: "Many online actions leave traces." },
      { prompt: "A responsible question before posting is:", type: "multiple_choice", options: ["Will I still respect this footprint later?", "How can I anger the most people?", "Which stranger should get my password?", "How do I hide this from every adult forever?"], correctIndex: 0, explanation: "Future reputation and safety." },
      { prompt: "Private accounts are useful because they can:", type: "multiple_choice", options: ["Limit strangers’ access to your posts", "Guarantee nothing is ever screenshotted", "Replace the need for kindness", "Make phishing impossible forever"], correctIndex: 0, explanation: "Limits audience; not perfect secrecy." }
    ]
  },
  {
    no: 9,
    substrand: 2,
    title: "Fake News, Deepfakes and Checking Facts",
    description: "Question viral claims, spot manipulation clues, and verify before you share.",
    readingHeading: "Not everything viral is true",
    reading: `Anyone can publish online. Some posts are honest mistakes; some are deliberately misleading. Fake news spreads false claims. Edited images and deepfake-style media can make events look real when they are not.

Before you share: check who published it, look for evidence, compare with trusted sources, and watch for emotional manipulation (“Share before it’s deleted!”). If you cannot verify a shocking claim, do not spread it. Ask a teacher or trusted adult when unsure. Digital citizens slow down and check facts.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=6EtF2C64Iyc", title: "Digital citizenship and media caution" },
      { url: "https://www.youtube.com/watch?v=R12_y2BhKbE", title: "Spotting online tricks and fakes" }
    ],
    quiz: [
      { prompt: "Fake news is best described as:", type: "multiple_choice", options: ["False or misleading claims presented as real news", "Any maths worksheet", "A PE warm-up", "A library due date"], correctIndex: 0, explanation: "False claims framed as news." },
      { prompt: "A deepfake-style video can:", type: "multiple_choice", options: ["Make something look real even when it is manipulated", "Only show accurate classroom clocks", "Never fool anyone", "Replace all textbooks automatically"], correctIndex: 0, explanation: "Media can be fabricated." },
      { prompt: "True or false: You should verify shocking claims before sharing them.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Verify first." },
      { prompt: "A useful fact-check step is:", type: "multiple_choice", options: ["Compare the claim with trusted sources", "Share instantly to be first", "Add angrier comments", "Hide the claim from every adult"], correctIndex: 0, explanation: "Cross-check evidence." },
      { prompt: "Emotional urgency like “Share now or you will miss the truth!” often signals:", type: "multiple_choice", options: ["Possible manipulation", "Guaranteed accuracy", "A school timetable", "A science lab rule"], correctIndex: 0, explanation: "Urgency can bypass thinking." },
      { prompt: "True or false: Filters and editing mean social media posts always show life exactly as it is.", type: "true_false", options: ["True", "False"], correctIndex: 1, explanation: "Posts are often curated." },
      { prompt: "If you cannot verify a viral claim, the responsible action is:", type: "multiple_choice", options: ["Do not spread it and ask a trusted adult if needed", "Post it to every group chat", "Change the claim to make it scarier", "Attack people who ask questions"], correctIndex: 0, explanation: "Do not amplify unknowns." },
      { prompt: "Checking who published a claim helps because:", type: "multiple_choice", options: ["Source reputation and motive affect trustworthiness", "Authors never matter", "Only the font size matters", "Only emoji count as evidence"], correctIndex: 0, explanation: "Source evaluation." },
      { prompt: "AI-generated images in a “news” post mean you should:", type: "multiple_choice", options: ["Be extra careful and verify before believing or sharing", "Trust them more than photos", "Assume they are always school-approved", "Ignore all real photographs forever"], correctIndex: 0, explanation: "Synthetic media needs caution." },
      { prompt: "A digital citizen’s media habit is:", type: "multiple_choice", options: ["Slow down, question, verify, then decide", "Believe every caption", "Share first, think never", "Only trust anonymous rumours"], correctIndex: 0, explanation: "Deliberate verification." }
    ]
  },
  {
    no: 10,
    substrand: 2,
    title: "My Internet Safety Action Plan",
    description: "Combine passwords, privacy, kindness and help-seeking into a personal safety checklist you can use daily.",
    readingHeading: "Put your skills into one plan",
    reading: `An internet safety action plan turns lessons into habits. Include: strong unique passwords kept private; think-before-you-share rules; no clicking suspicious links; kind choices and no pile-ons; privacy settings reviewed with an adult; and a clear list of trusted adults you can tell if something feels wrong.

Practise your plan at home and school. Review it when you join a new app or game. Safety is not fear — it is confidence with boundaries. When you protect yourself and others, the internet stays a better place to learn and connect.`,
    videos: [
      { url: "https://www.youtube.com/watch?v=i307esUZTSc", title: "Be Internet Awesome recap" },
      { url: "https://www.youtube.com/watch?v=X9Htg8V3eik", title: "Five safety tips to remember" }
    ],
    quiz: [
      { prompt: "An internet safety action plan should include:", type: "multiple_choice", options: ["Passwords, sharing rules, scam caution, kindness and trusted adults", "Only your favourite game skins", "A list of strangers to meet alone", "Reasons to hide all problems"], correctIndex: 0, explanation: "Cover the core habits." },
      { prompt: "The best time to review your plan is:", type: "multiple_choice", options: ["When you join a new app or game, and regularly with an adult", "Never after creating it once", "Only after every password is leaked", "Only during holidays"], correctIndex: 0, explanation: "Update when context changes." },
      { prompt: "True or false: Internet safety means never using the internet.", type: "true_false", options: ["True", "False"], correctIndex: 1, explanation: "It means safer, smarter use." },
      { prompt: "If something online feels wrong, your plan should say:", type: "multiple_choice", options: ["Stop, save evidence if safe, and tell a trusted adult", "Solve it only by threatening others", "Post your address for help from strangers", "Ignore serious threats forever"], correctIndex: 0, explanation: "Stop and escalate safely." },
      { prompt: "A daily micro-habit from your plan could be:", type: "multiple_choice", options: ["Pause before posting or clicking unfamiliar links", "Reuse one weak password everywhere", "Share live location with unknown players", "Forward every viral rumour"], correctIndex: 0, explanation: "Pause-and-think daily." },
      { prompt: "True or false: Protecting others (consent, no pile-ons) belongs in your safety plan.", type: "true_false", options: ["True", "False"], correctIndex: 0, explanation: "Community safety included." },
      { prompt: "Trusted adults on your plan might include:", type: "multiple_choice", options: ["Parent/guardian, teacher or school counsellor", "Only anonymous game accounts", "Only people who ask for passwords", "Nobody"], correctIndex: 0, explanation: "Real trusted supporters." },
      { prompt: "Password rules in a strong plan say:", type: "multiple_choice", options: ["Use unique strong passwords and keep them private", "Write them on the classroom board", "Trade them for game items", "Share them in group chats"], correctIndex: 0, explanation: "Unique + private." },
      { prompt: "Confidence with boundaries means:", type: "multiple_choice", options: ["You can explore useful content while refusing unsafe requests", "You must accept every friend request", "You never ask adults for help", "You post private data to seem brave"], correctIndex: 0, explanation: "Brave and careful together." },
      { prompt: "The purpose of this whole subject is to help you:", type: "multiple_choice", options: ["Learn and connect online with stronger safety habits", "Fear every website forever", "Avoid all digital learning", "Collect strangers’ addresses"], correctIndex: 0, explanation: "Safer confident exploration." }
    ]
  }
];

const strandName = "Staying Safe on the Internet";
const substrandNames = {
  1: "Protect Yourself Online",
  2: "Kindness, Trust and Getting Help"
};

function sqlString(value) {
  return value.replace(/'/g, "''");
}

function quizJson(quiz) {
  return JSON.stringify(quiz);
}

const mediaBank = {};
for (const lesson of lessons) {
  mediaBank[lesson.title] = {
    videos: lesson.videos,
    readingHeading: lesson.readingHeading,
    reading: lesson.reading,
    description: lesson.description,
    quiz: lesson.quiz
  };
}

const valuesRows = lessons
  .map((lesson) => {
    const desc = sqlString(lesson.description);
    const title = sqlString(lesson.title);
    const substrand = sqlString(substrandNames[lesson.substrand]);
    return `      (${lesson.substrand},${lesson.no},'${sqlString(strandName)}','${substrand}','${title}','${desc}')`;
  })
  .join(",\n");

const sql = `-- Teacher Kay: Public Learning — Internet Safety
-- 1 strand, 2 sub-strands, 5 lessons each (10 total)
-- Each lesson: intro + reading text, then 2 videos, then a tough 10-question quiz
-- Subject order = ${subjectOrder} so it appears first among public learning subjects.
-- Rerunnable: replaces only ${subjectId}.

DO $seed$
DECLARE
  teacher_id uuid;
  teacher_count integer;
  subject_id text := '${subjectId}';
  unit_id text;
  topic_id text;
  lesson_id text;
  version_id text;
  revision_id uuid;
  public_snapshot jsonb;
  fixture jsonb;
  record_data jsonb;
  item record;
  timestamp_text text := to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  safety_media_bank jsonb := $safety_media_bank$
${JSON.stringify(mediaBank)}
$safety_media_bank$::jsonb;
  lesson_media jsonb;
  lesson_quiz jsonb;
  assessment_blocks jsonb;
  quiz_questions jsonb;
  video_item jsonb;
  video_ord integer;
  content_blocks jsonb;
BEGIN
  SELECT count(*) INTO teacher_count
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND coalesce(raw_app_meta_data ->> 'role', '') IN ('teacher','admin');

  IF teacher_count = 0 THEN
    RAISE EXCEPTION 'Teacher Kay was not found.';
  ELSIF teacher_count > 1 THEN
    RAISE EXCEPTION 'More than one Teacher Kay account was found.';
  END IF;

  SELECT id INTO teacher_id
  FROM auth.users
  WHERE lower(btrim(coalesce(raw_user_meta_data ->> 'display_name', ''))) = 'teacher kay'
    AND coalesce(raw_app_meta_data ->> 'role', '') IN ('teacher','admin')
  LIMIT 1;

  UPDATE public."Subject"
  SET "currentPublicRevisionId" = NULL
  WHERE id = subject_id AND "createdBy" = teacher_id;

  DELETE FROM public."PublicLearningRevision"
  WHERE "courseId" = subject_id;

  DELETE FROM public."TeacherQuiz"
  WHERE "createdBy" = teacher_id
    AND (
      "courseId" = subject_id
      OR "lessonId" LIKE subject_id || '-lesson-%'
    );

  DELETE FROM public."AdminLessonRecord"
  WHERE "createdBy" = teacher_id
    AND (
      "courseId" = subject_id
      OR id LIKE subject_id || '-lesson-%'
    );

  DELETE FROM public."Topic"
  WHERE "unitId" LIKE subject_id || '-strand-%';

  DELETE FROM public."Unit"
  WHERE "subjectId" = subject_id;

  DELETE FROM public."Subject"
  WHERE id = subject_id AND "createdBy" = teacher_id;

  -- Ensure this subject sorts first among Teacher Kay public learning.
  UPDATE public."Subject"
  SET "order" = GREATEST("order", 10), "updatedAt" = now()
  WHERE "createdBy" = teacher_id
    AND "visibility" = 'platform'
    AND id <> subject_id
    AND "order" < 10
    AND (
      "slug" LIKE 'teacher-kay-public-%'
      OR id = 'teacher-kay-visual-discovery'
    );

  INSERT INTO public."Subject"
    ("id","name","slug","description","icon","colourToken","coverUrl","gradeLevels",
     "order","status","visibility","ownerClassId","createdBy","createdAt","updatedAt")
  VALUES
    (subject_id,
     'Internet Safety',
     subject_id,
     'Learn how to explore online with confidence: strong passwords, private information, scam awareness, kindness, trusted adults and a personal safety action plan.',
     'shield',
     '#0F766E',
     'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=85',
     ARRAY[4,5,6],
     ${subjectOrder},
     'ACTIVE',
     'platform',
     NULL,
     teacher_id,
     now(),
     now());

  FOR item IN
    SELECT * FROM (VALUES
${valuesRows}
    ) AS lessons(substrand_no,lesson_no,strand_name,substrand_name,lesson_title,lesson_description)
  LOOP
    unit_id := subject_id || '-strand-1';
    topic_id := unit_id || '-substrand-' || item.substrand_no;
    lesson_id := subject_id || '-lesson-' || lpad(item.lesson_no::text,2,'0');
    version_id := lesson_id || '-v1';

    INSERT INTO public."Unit" ("id","subjectId","name","slug","description","order","createdAt","updatedAt")
    VALUES (unit_id,subject_id,item.strand_name,'strand-1-staying-safe-on-the-internet',
      'Build practical habits that protect your information, feelings and devices while you learn online.',1,now(),now())
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO public."Topic" ("id","unitId","name","slug","description","order","createdAt","updatedAt")
    VALUES (topic_id,unit_id,item.substrand_name,
      CASE item.substrand_no WHEN 1 THEN 'protect-yourself-online' ELSE 'kindness-trust-and-getting-help' END,
      CASE item.substrand_no
        WHEN 1 THEN 'Passwords, private information, scams and safe downloads.'
        ELSE 'Cyberbullying, trusted adults, privacy footprints, fact-checking and your action plan.'
      END,
      item.substrand_no,now(),now())
    ON CONFLICT ("id") DO NOTHING;

    lesson_media := safety_media_bank -> item.lesson_title;
    IF lesson_media IS NULL THEN
      RAISE EXCEPTION 'Missing internet safety media bank for %', item.lesson_title;
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
              'order', 20 + ordinality,
              'required', true,
              'estimatedSeconds', 45,
              'statement', q ->> 'prompt',
              'prompt', q ->> 'prompt',
              'shuffleOptions', false,
              'correctAnswer', ((q ->> 'correctIndex')::int = 0),
              'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective'),
              'difficulty', 'challenge',
              'xpWeight', 1,
              'maximumAttempts', 3,
              'hint', 'Use the reading and videos from this lesson.',
              'explanation', coalesce(q ->> 'explanation', ''),
              'feedbackCorrect', 'Sharp thinking — that keeps you safer.',
              'feedbackIncorrect', 'Not yet. Re-read the lesson idea and try again.',
              'feedbackRetry', 'Eliminate one unsafe option, then retry.'
            )
          ELSE
            jsonb_build_object(
              'id', lesson_id || '-q' || ordinality,
              'type', 'multiple_choice',
              'order', 20 + ordinality,
              'required', true,
              'estimatedSeconds', 55,
              'prompt', q ->> 'prompt',
              'learningObjectiveIds', jsonb_build_array(lesson_id || '-objective'),
              'difficulty', 'challenge',
              'xpWeight', 1,
              'maximumAttempts', 3,
              'hint', 'Match the safest choice to this lesson''s idea.',
              'explanation', coalesce(q ->> 'explanation', ''),
              'feedbackCorrect', 'Yes — that is the safer choice.',
              'feedbackIncorrect', 'Not yet. Compare each option with the lesson.',
              'feedbackRetry', 'Cross out one clearly unsafe option and retry.',
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

    content_blocks := jsonb_build_array(
      jsonb_build_object(
        'id', lesson_id || '-intro',
        'type', 'lesson_intro',
        'order', 1,
        'required', true,
        'estimatedSeconds', 40,
        'title', item.lesson_title,
        'shortDescription', item.lesson_description,
        'objectives', jsonb_build_array('Read the key idea carefully', 'Watch both safety videos', 'Ace the tough quiz'),
        'estimatedMinutes', 18,
        'rewardPreview', jsonb_build_object('xp', 100, 'starsAvailable', 3)
      ),
      jsonb_build_object(
        'id', lesson_id || '-reading',
        'type', 'text',
        'order', 2,
        'required', true,
        'estimatedSeconds', 120,
        'heading', coalesce(lesson_media ->> 'readingHeading', 'Lesson reading'),
        'body', coalesce(lesson_media ->> 'reading', item.lesson_description),
        'emphasisTerms', jsonb_build_array('internet safety', 'trusted adult', 'personal information')
      )
    );

    FOR video_item, video_ord IN
      SELECT value, ordinality::integer
      FROM jsonb_array_elements(lesson_media -> 'videos') WITH ORDINALITY
    LOOP
      content_blocks := content_blocks || jsonb_build_array(jsonb_build_object(
        'id', lesson_id || '-video-' || video_ord,
        'type', 'video',
        'order', 2 + video_ord,
        'required', true,
        'estimatedSeconds', CASE WHEN video_ord = 1 THEN 180 ELSE 160 END,
        'source', video_item ->> 'url',
        'provider', 'youtube',
        'title', coalesce(video_item ->> 'title', 'Watch the safety video'),
        'caption', 'Pause when needed. Note one safety action you can use today.'
      ));
    END LOOP;

    fixture := jsonb_build_object(
      'subjects', jsonb_build_array(jsonb_build_object(
        'id', subject_id, 'name', 'Internet Safety', 'slug', subject_id,
        'description', 'Practical online safety for upper primary learners.',
        'icon', 'shield', 'colourToken', '#0F766E',
        'gradeLevels', jsonb_build_array(4, 5, 6),
        'order', ${subjectOrder}, 'status', 'active',
        'createdAt', timestamp_text, 'updatedAt', timestamp_text
      )),
      'units', jsonb_build_array(jsonb_build_object(
        'id', unit_id, 'subjectId', subject_id, 'name', item.strand_name,
        'slug', 'strand-1-staying-safe-on-the-internet',
        'description', 'Practical internet safety habits.',
        'order', 1, 'createdAt', timestamp_text, 'updatedAt', timestamp_text
      )),
      'topics', jsonb_build_array(jsonb_build_object(
        'id', topic_id, 'unitId', unit_id, 'name', item.substrand_name,
        'slug', CASE item.substrand_no WHEN 1 THEN 'protect-yourself-online' ELSE 'kindness-trust-and-getting-help' END,
        'description', 'Lesson reading, two videos and a tough quiz.',
        'order', item.substrand_no, 'createdAt', timestamp_text, 'updatedAt', timestamp_text
      )),
      'lessons', jsonb_build_array(jsonb_build_object(
        'id', lesson_id, 'topicId', topic_id, 'title', item.lesson_title,
        'slug', regexp_replace(lower(item.lesson_title), '[^a-z0-9]+', '-', 'g'),
        'shortDescription', item.lesson_description, 'order', item.lesson_no,
        'prerequisiteLessonId', CASE WHEN item.lesson_no = 1 THEN NULL ELSE subject_id || '-lesson-' || lpad((item.lesson_no - 1)::text, 2, '0') END,
        'createdAt', timestamp_text, 'updatedAt', timestamp_text
      )),
      'lessonVersions', jsonb_build_array(jsonb_build_object(
        'id', version_id, 'lessonId', lesson_id, 'versionNumber', 1, 'status', 'published',
        'title', item.lesson_title, 'description', item.lesson_description,
        'objectiveSummary', 'Read, watch two videos, then prove understanding on a tough quiz.',
        'difficulty', 'challenge', 'estimatedMinutes', 18, 'baseXpReward', 100, 'passingScore', 70,
        'masteryScore', 90, 'maximumLessonRedos', 3, 'publishedAt', timestamp_text,
        'learningObjectives', jsonb_build_array(jsonb_build_object(
          'id', lesson_id || '-objective', 'lessonVersionId', version_id,
          'code', 'SAFE.1.' || item.lesson_no,
          'description', 'Apply this lesson''s internet safety idea in realistic choices.',
          'order', 1
        )),
        'blocks', content_blocks || assessment_blocks || jsonb_build_array(
          jsonb_build_object(
            'id', lesson_id || '-summary', 'type', 'summary', 'order', 40, 'required', true, 'estimatedSeconds', 40,
            'heading', 'Safety checkpoint complete',
            'keyPoints', jsonb_build_array(
              'I read the key safety idea.',
              'I watched both lesson videos.',
              'I checked my understanding with a tough quiz.'
            ),
            'nextStepText', 'Use one safer action today, then continue.'
          )
        ),
        'createdAt', timestamp_text, 'updatedAt', timestamp_text
      ))
    );

    record_data := jsonb_build_object(
      'id', lesson_id, 'subject', 'computing', 'courseId', subject_id, 'unitId', unit_id, 'topicId', topic_id,
      'grade', NULL, 'gradeLevels', jsonb_build_array(4, 5, 6),
      'unit', item.strand_name, 'chapter', item.strand_name, 'topic', item.substrand_name,
      'contentStandard', NULL, 'indicator', NULL, 'lessonNumber', item.lesson_no, 'title', item.lesson_title,
      'description', item.lesson_description, 'estimatedMinutes', 18, 'xp', 100, 'questionCount', 10,
      'format', 'video', 'status', 'published', 'createdAt', timestamp_text, 'updatedAt', timestamp_text,
      'fixture', fixture, 'createdBy', teacher_id
    );

    INSERT INTO public."AdminLessonRecord"
      ("id","subject","status","position","record","createdBy","courseId","unitId","topicId","createdAt","updatedAt")
    VALUES
      (lesson_id, 'computing', 'published', item.lesson_no, record_data, teacher_id, subject_id, unit_id, topic_id, now(), now());

    SELECT jsonb_agg(jsonb_build_object(
      'id', 'q-' || q,
      'prompt', CASE
        WHEN assessment_blocks -> (q - 1) ->> 'type' = 'true_false'
          THEN assessment_blocks -> (q - 1) ->> 'statement'
        ELSE assessment_blocks -> (q - 1) ->> 'prompt'
      END,
      'type', coalesce(assessment_blocks -> (q - 1) ->> 'type', 'multiple_choice'),
      'options', CASE
        WHEN assessment_blocks -> (q - 1) ->> 'type' = 'true_false' THEN jsonb_build_array('True', 'False')
        ELSE jsonb_build_array(
          assessment_blocks -> (q - 1) -> 'options' -> 0 ->> 'text',
          assessment_blocks -> (q - 1) -> 'options' -> 1 ->> 'text',
          assessment_blocks -> (q - 1) -> 'options' -> 2 ->> 'text',
          assessment_blocks -> (q - 1) -> 'options' -> 3 ->> 'text'
        )
      END,
      'correctIndex', CASE
        WHEN assessment_blocks -> (q - 1) ->> 'type' = 'true_false'
          THEN CASE WHEN (assessment_blocks -> (q - 1) ->> 'correctAnswer')::boolean THEN 0 ELSE 1 END
        ELSE (
          SELECT ord - 1
          FROM jsonb_array_elements(assessment_blocks -> (q - 1) -> 'options') WITH ORDINALITY AS o(opt, ord)
          WHERE opt ->> 'id' = assessment_blocks -> (q - 1) ->> 'correctOptionId'
          LIMIT 1
        )
      END,
      'explanation', coalesce(assessment_blocks -> (q - 1) ->> 'explanation', 'Use the lesson reading and videos.')
    ) ORDER BY q)
    INTO quiz_questions
    FROM generate_series(1, 10) q;

    INSERT INTO public."TeacherQuiz"
      ("createdBy","title","description","subject","gradeLevels","questions","baseXpReward",
       "passingScore","maxAttempts","version","status","courseId","unitId","topicId","lessonId","createdAt","updatedAt")
    VALUES
      (teacher_id, item.lesson_title || ' - Safety Quiz',
       '[SKULKID-INTERNET-SAFETY-SEED] Tough ten-question quiz for ' || item.lesson_title,
       'computing', ARRAY[4,5,6], quiz_questions, 80, 70, 3, 1, 'ready',
       subject_id, unit_id, topic_id, lesson_id, now(), now());
  END LOOP;

  SELECT jsonb_build_object(
    'course', jsonb_build_object(
      'id', s.id, 'name', s.name, 'slug', s.slug, 'description', s.description,
      'color', s."colourToken", 'coverUrl', s."coverUrl", 'gradeLevels', to_jsonb(s."gradeLevels"), 'order', s."order"
    ),
    'units', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', u.id, 'subjectId', u."subjectId", 'title', u.name, 'slug', u.slug,
        'description', u.description, 'order', u."order",
        'topics', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'id', t.id, 'unitId', t."unitId", 'title', t.name, 'slug', t.slug,
            'description', t.description, 'order', t."order",
            'lessonIds', coalesce((
              SELECT jsonb_agg(l.id ORDER BY l.position)
              FROM public."AdminLessonRecord" l
              WHERE l."topicId" = t.id AND l.status = 'published'
            ), '[]'::jsonb)
          ) ORDER BY t."order")
          FROM public."Topic" t WHERE t."unitId" = u.id
        ), '[]'::jsonb)
      ) ORDER BY u."order")
      FROM public."Unit" u WHERE u."subjectId" = s.id
    ), '[]'::jsonb),
    'lessons', coalesce((
      SELECT jsonb_agg(
        l.record || jsonb_build_object('classId', l."classId", 'courseId', l."courseId", 'unitId', l."unitId", 'topicId', l."topicId")
        ORDER BY l.position
      )
      FROM public."AdminLessonRecord" l
      WHERE l."courseId" = s.id AND l.status = 'published'
    ), '[]'::jsonb)
  )
  INTO public_snapshot
  FROM public."Subject" s
  WHERE s.id = subject_id;

  INSERT INTO public."PublicLearningRevision"
    ("courseId","version","status","snapshot","contentHash","submittedBy","submittedAt",
     "reviewedBy","reviewedAt","reviewNote","publishedAt")
  VALUES
    (subject_id, 1, 'approved', public_snapshot, md5(public_snapshot::text), teacher_id, now(),
     NULL, now(), 'Approved Internet Safety public subject (first in public order).', now())
  RETURNING id INTO revision_id;

  UPDATE public."Subject"
  SET "currentPublicRevisionId" = revision_id, "updatedAt" = now()
  WHERE id = subject_id;

  RAISE NOTICE 'Created Internet Safety for Teacher Kay: 1 strand, 2 sub-strands, 10 lessons, order %.', ${subjectOrder};
END
$seed$;

SELECT
  s.name,
  s."order",
  s."gradeLevels",
  u_count.strands,
  t_count.substrands,
  l_count.lessons,
  r.status AS publication_status
FROM public."Subject" s
JOIN LATERAL (SELECT count(*)::integer AS strands FROM public."Unit" u WHERE u."subjectId" = s.id) u_count ON true
JOIN LATERAL (
  SELECT count(*)::integer AS substrands
  FROM public."Topic" t
  JOIN public."Unit" u ON u.id = t."unitId"
  WHERE u."subjectId" = s.id
) t_count ON true
JOIN LATERAL (SELECT count(*)::integer AS lessons FROM public."AdminLessonRecord" l WHERE l."courseId" = s.id) l_count ON true
LEFT JOIN public."PublicLearningRevision" r ON r.id = s."currentPublicRevisionId"
WHERE s.id = '${subjectId}';
`;

const out = "F:/SkulKid/supabase/seeds/teacher_kay_public_internet_safety.sql";
fs.writeFileSync(out, sql);
console.log("Wrote", out, "lessons", lessons.length);

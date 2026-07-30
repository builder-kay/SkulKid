export type ChatSafetyCategory =
  | "link"
  | "phone_number"
  | "email"
  | "personal_information"
  | "bullying"
  | "threat"
  | "sexual_content";

export type ChatSafetyResult = {
  allowed: boolean;
  severity: "low" | "medium" | "high" | "critical";
  categories: ChatSafetyCategory[];
  reason: string | null;
};

const patterns: Array<{
  category: ChatSafetyCategory;
  severity: ChatSafetyResult["severity"];
  pattern: RegExp;
}> = [
  { category: "link", severity: "medium", pattern: /\b(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|org|net|io|app|gh)\b)/i },
  { category: "email", severity: "medium", pattern: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i },
  { category: "phone_number", severity: "high", pattern: /(?:\+?233|0)[\s-]?(?:2|5)\d(?:[\s-]?\d){7}\b/ },
  { category: "personal_information", severity: "high", pattern: /\b(?:my|our)\s+(?:address|location|password|phone|number|email|school address)\s+(?:is|:)/i },
  { category: "threat", severity: "critical", pattern: /\b(?:i(?:'ll| will)?\s+(?:kill|hurt|beat|stab)|you(?:'ll| will)\s+die|bring\s+(?:a\s+)?(?:knife|gun))\b/i },
  { category: "sexual_content", severity: "critical", pattern: /\b(?:send\s+(?:me\s+)?nudes?|naked\s+(?:photo|picture)|sex(?:ual)?\s+(?:photo|video)|porn)\b/i },
  { category: "bullying", severity: "high", pattern: /\b(?:nobody\s+likes\s+you|you(?:'re| are)\s+(?:stupid|ugly|useless|worthless)|go\s+away\s+forever|we\s+hate\s+you)\b/i }
];

export const childFriendlyChatRules = [
  "Use kind words and discuss class learning.",
  "Do not share phone numbers, addresses, passwords, email addresses or live locations.",
  "Do not send links, pictures, videos or files.",
  "Do not threaten, bully, embarrass or pressure another learner.",
  "Tell your teacher or another trusted adult if a message makes you feel unsafe.",
  "Messages may be reviewed by your teacher and SkulKid safety administrators."
] as const;

export function analyseClassChatMessage(input: string): ChatSafetyResult {
  const body = input.trim().replace(/\s+/g, " ");
  const matches = patterns.filter((item) => item.pattern.test(body));
  if (!matches.length) return { allowed: true, severity: "low", categories: [], reason: null };
  const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 } as const;
  const severity = matches.reduce<ChatSafetyResult["severity"]>(
    (current, item) => severityOrder[item.severity] > severityOrder[current] ? item.severity : current,
    "low"
  );
  const categories = [...new Set(matches.map((item) => item.category))];
  return {
    allowed: false,
    severity,
    categories,
    reason: categories.some((item) => ["link", "phone_number", "email", "personal_information"].includes(item))
      ? "For safety, class chat does not allow links or personal contact information."
      : "This message may be unsafe or hurtful and was sent to the teacher for review."
  };
}

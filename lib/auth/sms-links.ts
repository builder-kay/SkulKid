export type OtpSmsReason =
  | "learner-signup"
  | "teacher-signup"
  | "learner-password-reset"
  | "teacher-password-reset"
  | "teacher-moderation-appeal"
  | "username-recovery";

export function platformActionUrl(request: Request, path: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  let origin: string;
  try {
    origin = configured ? new URL(configured).origin : new URL(request.url).origin;
  } catch {
    origin = new URL(request.url).origin;
  }
  return new URL(path, `${origin}/`).toString();
}

export function otpSmsMessage(reason: OtpSmsReason, actionUrl: string) {
  const action = {
    "learner-signup": "learner signup",
    "teacher-signup": "teacher signup",
    "learner-password-reset": "learner password reset",
    "teacher-password-reset": "teacher password reset",
    "teacher-moderation-appeal": "teacher moderation appeal",
    "username-recovery": "username recovery"
  }[reason];
  return `Your SkulKid ${action} code is [otp]. It expires in 10 minutes. Continue: ${actionUrl}`;
}

export function recoveredUsernameSms(username: string, loginUrl: string) {
  return `Your SkulKid username is: ${username}. Sign in: ${loginUrl} Do not share this message.`;
}

export function assignedQuizSms(input: {
  quizTitle: string;
  className: string;
  startAt: string | null;
  endAt: string | null;
  quizUrl: string;
}) {
  const timing = input.startAt && input.endAt
    ? `Opens ${smsDate(input.startAt)} and ends ${smsDate(input.endAt)}.`
    : input.startAt
      ? `Opens ${smsDate(input.startAt)} and stays open until your teacher ends it.`
      : input.endAt
        ? `Take it by ${smsDate(input.endAt)}.`
        : "It is open now and stays available until your teacher ends it.";
  return `New SkulKid quiz for ${input.className}: ${input.quizTitle}. ${timing} Open quiz: ${input.quizUrl}`;
}

function smsDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.APP_TIME_ZONE || "Africa/Accra"
  }).format(new Date(value));
}

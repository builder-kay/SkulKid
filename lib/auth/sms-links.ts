export type OtpSmsReason =
  | "learner-signup"
  | "teacher-signup"
  | "learner-password-reset"
  | "teacher-password-reset"
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
    "username-recovery": "username recovery"
  }[reason];
  return `Your SkulKid ${action} code is [otp]. It expires in 10 minutes. Continue: ${actionUrl}`;
}

export function recoveredUsernameSms(username: string, loginUrl: string) {
  return `Your SkulKid username is: ${username}. Sign in: ${loginUrl} Do not share this message.`;
}

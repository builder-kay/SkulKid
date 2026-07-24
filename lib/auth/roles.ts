export type AppRole = "student" | "teacher" | "admin";

export function resolveAppRole(value: unknown): AppRole {
  if (value === "admin" || value === "teacher" || value === "student") return value;
  return "student";
}

export function roleHome(role: AppRole): string {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/dashboard";
}

export function isStaffRole(role: AppRole): boolean {
  return role === "admin" || role === "teacher";
}

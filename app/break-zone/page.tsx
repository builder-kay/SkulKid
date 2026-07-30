import { BreakZonePage } from "@/components/student/break-zone-page";
import { StudentShell } from "@/components/student/student-shell";

export default function Page() {
  return <StudentShell activeItem="break-zone"><BreakZonePage /></StudentShell>;
}

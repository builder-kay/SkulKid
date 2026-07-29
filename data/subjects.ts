import type { Subject } from "@/types/subject";

// Platform subjects come exclusively from the database. Keep this export for
// compatibility with older imports while avoiding bundled fallback subjects.
export const subjects: Subject[] = [];

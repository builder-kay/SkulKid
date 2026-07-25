import type { Metadata } from "next";
import { PascoArchivePage } from "@/components/student/pasco-archive-page";

export const metadata: Metadata = { title: "PASCO | SkulKid", description: "Review and practise your past class quizzes." };

export default function Page() {
  return <PascoArchivePage />;
}

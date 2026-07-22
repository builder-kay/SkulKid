export type OfficialCurriculumDocument = {
  id: string;
  subject: string;
  title: string;
  phase: "Kindergarten" | "Lower Primary" | "Upper Primary" | "Primary";
  gradeLevels: string[];
  year: 2019;
  authority: "NaCCA, Ministry of Education / Ghana Education Service";
  officialSourceUrl: string;
  documentUrl?: string;
  status: "current" | "integrated";
  note: string;
};

const library = "https://nacca.gov.gh/learning-areas-subjects/new-standards-based-curriculum-2019/";

export const ghanaPrimaryCurriculum: OfficialCurriculumDocument[] = [
  { id: "kg-integrated", subject: "Kindergarten", title: "Kindergarten Integrated Curriculum", phase: "Kindergarten", gradeLevels: ["KG1", "KG2"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, documentUrl: "https://nacca.gov.gh/wp-content/uploads/2019/06/KG-Curriculum.pdf", status: "current", note: "Integrates Language and Literacy, Numeracy, Creative Arts, and Our World and Our People." },
  { id: "maths-b1-b3", subject: "Mathematics", title: "Mathematics Lower Primary", phase: "Lower Primary", gradeLevels: ["B1", "B2", "B3"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, documentUrl: "https://nacca.gov.gh/wp-content/uploads/2019/04/MATHS-LOWER-PRIMARY-22-3-2019.pdf", status: "current", note: "Standards-based Mathematics curriculum for B1-B3." },
  { id: "maths-b4-b6", subject: "Mathematics", title: "Mathematics Upper Primary", phase: "Upper Primary", gradeLevels: ["B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "Standards-based Mathematics curriculum for B4-B6." },
  { id: "english-b1-b3", subject: "English Language", title: "English Lower Primary", phase: "Lower Primary", gradeLevels: ["B1", "B2", "B3"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "English Language curriculum for B1-B3." },
  { id: "english-b4-b6", subject: "English Language", title: "English Upper Primary", phase: "Upper Primary", gradeLevels: ["B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, documentUrl: "https://nacca.gov.gh/wp-content/uploads/2019/04/ENGLISH-UPPER-PRIMARY-B4-B6.pdf", status: "current", note: "English Language curriculum for B4-B6." },
  { id: "science-b1-b3", subject: "Science", title: "Science Lower Primary", phase: "Lower Primary", gradeLevels: ["B1", "B2", "B3"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "Science curriculum for B1-B3." },
  { id: "science-b4-b6", subject: "Science", title: "Science Upper Primary", phase: "Upper Primary", gradeLevels: ["B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "Science curriculum for B4-B6." },
  { id: "french-b4-b6", subject: "French", title: "French Upper Primary", phase: "Upper Primary", gradeLevels: ["B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "French curriculum begins at Upper Primary in this library." },
  { id: "computing-b4-b6", subject: "Computing", title: "Computing Upper Primary", phase: "Upper Primary", gradeLevels: ["B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "Computing curriculum for B4-B6." },
  { id: "ghanaian-language-b1-b3", subject: "Ghanaian Language", title: "Ghanaian Language Lower Primary", phase: "Lower Primary", gradeLevels: ["B1", "B2", "B3"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "Ghanaian Language curriculum for B1-B3." },
  { id: "ghanaian-language-b4-b6", subject: "Ghanaian Language", title: "Ghanaian Language Upper Primary", phase: "Upper Primary", gradeLevels: ["B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "Ghanaian Language curriculum for B4-B6." },
  { id: "history-b1-b6", subject: "History", title: "History B1-B6", phase: "Primary", gradeLevels: ["B1", "B2", "B3", "B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, documentUrl: "https://nacca.gov.gh/wp-content/uploads/2019/04/HISTORY-B1-B6.pdf", status: "current", note: "History curriculum spanning Lower and Upper Primary." },
  { id: "physical-education-b1-b6", subject: "Physical Education", title: "Physical Education B1-B6", phase: "Primary", gradeLevels: ["B1", "B2", "B3", "B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, documentUrl: "https://nacca.gov.gh/wp-content/uploads/2019/04/PHYSICAL-EDUCATION-B1-B6.pdf", status: "current", note: "Physical Education curriculum spanning B1-B6." },
  { id: "owop-b1-b3", subject: "Our World and Our People", title: "Our World and Our People Lower Primary", phase: "Lower Primary", gradeLevels: ["B1", "B2", "B3"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "integrated", note: "From 2024/25 this content has spaces in related subjects and is no longer an isolated Primary module." },
  { id: "owop-b4-b6", subject: "Our World and Our People", title: "Our World and Our People Upper Primary", phase: "Upper Primary", gradeLevels: ["B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "integrated", note: "From 2024/25 this content has spaces in related subjects and is no longer an isolated Primary module." },
  { id: "creative-arts-b1-b3", subject: "Creative Arts", title: "Creative Arts Lower Primary", phase: "Lower Primary", gradeLevels: ["B1", "B2", "B3"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, documentUrl: "https://nacca.gov.gh/wp-content/uploads/2019/06/CREATIVE-ARTS-B1-B3.pdf", status: "current", note: "Creative Arts curriculum for B1-B3." },
  { id: "creative-arts-b4-b6", subject: "Creative Arts", title: "Creative Arts Upper Primary", phase: "Upper Primary", gradeLevels: ["B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "Creative Arts curriculum for B4-B6." },
  { id: "rme-b1-b6", subject: "Religious and Moral Education", title: "Religious and Moral Education B1-B6", phase: "Primary", gradeLevels: ["B1", "B2", "B3", "B4", "B5", "B6"], year: 2019, authority: "NaCCA, Ministry of Education / Ghana Education Service", officialSourceUrl: library, status: "current", note: "Religious and Moral Education curriculum spanning B1-B6." }
];

export const officialCurriculumSubjects = [...new Set(ghanaPrimaryCurriculum.map((document) => document.subject))].sort();

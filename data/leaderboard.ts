export type LeaderboardLearner = { id: string; name: string; xp: number; stars: number; streak: number; level: number; avatar: string; colour: string };

export const platformLearners: LeaderboardLearner[] = [
  { id: "learner-ama", name: "Ama Mensah", xp: 1460, stars: 42, streak: 12, level: 3, avatar: "AM", colour: "from-fuchsia-500 to-violet-600" },
  { id: "learner-kojo", name: "Kojo Asare", xp: 1325, stars: 38, streak: 9, level: 3, avatar: "KA", colour: "from-blue-500 to-cyan-500" },
  { id: "learner-esi", name: "Esi Owusu", xp: 1190, stars: 34, streak: 15, level: 3, avatar: "EO", colour: "from-rose-500 to-orange-500" },
  { id: "learner-yaw", name: "Yaw Boateng", xp: 1050, stars: 31, streak: 7, level: 3, avatar: "YB", colour: "from-emerald-500 to-teal-500" },
  { id: "learner-akosua", name: "Akosua Addo", xp: 940, stars: 28, streak: 6, level: 2, avatar: "AA", colour: "from-amber-400 to-orange-500" },
  { id: "learner-kwame", name: "Kwame Ofori", xp: 825, stars: 24, streak: 5, level: 2, avatar: "KO", colour: "from-indigo-500 to-blue-600" },
  { id: "learner-abena", name: "Abena Darko", xp: 730, stars: 21, streak: 8, level: 2, avatar: "AD", colour: "from-pink-500 to-rose-500" },
  { id: "learner-kofi", name: "Kofi Antwi", xp: 640, stars: 18, streak: 4, level: 2, avatar: "KA", colour: "from-cyan-500 to-blue-500" },
  { id: "learner-adwoa", name: "Adwoa Nyarko", xp: 510, stars: 15, streak: 3, level: 2, avatar: "AN", colour: "from-lime-500 to-emerald-500" },
  { id: "learner-nana", name: "Nana Appiah", xp: 390, stars: 11, streak: 2, level: 1, avatar: "NA", colour: "from-violet-500 to-purple-600" },
  { id: "learner-afia", name: "Afia Gyasi", xp: 270, stars: 8, streak: 2, level: 1, avatar: "AG", colour: "from-orange-400 to-amber-500" }
];

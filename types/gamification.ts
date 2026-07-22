export type GamificationReward = {
  xp: number;
  stars: number;
  badges: Badge[];
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  iconName: string;
  earnedAt?: string;
};

export type StudentLevel = {
  level: number;
  title: string;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressToNextLevel: number;
};

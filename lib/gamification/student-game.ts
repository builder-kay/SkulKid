"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const gameChangedEvent = "skulkid:student-game-changed";
export const DAILY_LEARNING_XP_GOAL = 30;

export type QuizAnswerResult = { blockId: string; correct: boolean; attempts: number };
type QuizRecord = { bestScore: number; stars: number; passed: boolean; rewardedQuestionIds: string[]; perfectBonusClaimed: boolean };
export type GameHistoryEvent = { id: string; type: "joined" | "lesson" | "quiz" | "gift" | "streak" | "achievement"; title: string; detail: string; xp: number; stars: number; rank: number; createdAt: string };
export type GameState = { xp: number; avatarPoints: number; unlockedAvatarAssetIds: string[]; stars: number; streak: number; completedLessonIds: string[]; completedVideoPromptIds: string[]; claimedDailyReward: string | null; surpriseCount: number; lastReward: { title: string; detail: string; xp: number; stars: number } | null; dailyLearningDate: string | null; dailyLearningXp: number; lastStreakDate: string | null; quizRecords: Record<string, QuizRecord>; history: GameHistoryEvent[] };
export type Achievement = { id: string; name: string; description: string; icon: string; earned: boolean };

const initialState: GameState = { xp: 0, avatarPoints: 0, unlockedAvatarAssetIds: [], stars: 0, streak: 0, completedLessonIds: [], completedVideoPromptIds: [], claimedDailyReward: null, surpriseCount: 0, lastReward: null, dailyLearningDate: null, dailyLearningXp: 0, lastStreakDate: null, quizRecords: {}, history: [] };
let currentGameState = initialState;
let gameStateHydrated = false;
let gameStateRequest: Promise<GameState> | null = null;
let saveQueue: Promise<void> = Promise.resolve();

function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dayDifference(from: string, to: string) { return Math.round((new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()) / 86400000); }

export async function readGameState(): Promise<GameState> {
  if (gameStateHydrated) return currentGameState;
  if (gameStateRequest) return gameStateRequest;
  gameStateRequest = (async () => {
    try {
      const response = await fetch("/api/student/game-state", { cache: "no-store" });
      if (!response.ok) return currentGameState;
      const payload = await response.json() as { state: Partial<GameState> | null };
      const saved = payload.state ?? {};
      const state = { ...initialState, ...saved } as GameState;
      if (!Array.isArray(state.completedVideoPromptIds)) state.completedVideoPromptIds = [];
      if (!Array.isArray(state.unlockedAvatarAssetIds)) state.unlockedAvatarAssetIds = [];
      if (typeof saved.avatarPoints !== "number") state.avatarPoints = state.xp;
      if (!state.history.length) state.history = [{ id: "history-joined", type: "joined", title: "Joined SkulKid", detail: state.xp || state.stars ? "Earlier progress was imported when achievement history was introduced." : "Your learning adventure begins here.", xp: state.xp, stars: state.stars, rank: rankForXp(state.xp), createdAt: new Date().toISOString() }];
      currentGameState = state.lastStreakDate && dayDifference(state.lastStreakDate, localDate()) > 1 ? { ...state, streak: 0 } : state;
      gameStateHydrated = true;
      return currentGameState;
    } catch { return currentGameState; }
    finally { gameStateRequest = null; }
  })();
  return gameStateRequest;
}
function save(state: GameState) {
  currentGameState = state;
  gameStateHydrated = true;
  window.dispatchEvent(new CustomEvent(gameChangedEvent, { detail: state }));
  const payload = JSON.stringify(state);
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      const response = await fetch("/api/student/game-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload
      });
      if (!response.ok) throw new Error("Student progress could not be saved.");
    });
}
function rankForXp(xp: number) { const comparisonXp = [1460, 1325, 1190, 1050, 940, 825, 730, 640, 510, 390, 270]; return comparisonXp.filter((value) => value > xp).length + 1; }
function withHistory(state: GameState, event: Omit<GameHistoryEvent, "id" | "rank" | "createdAt">): GameState { return { ...state, history: [{ ...event, id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, rank: rankForXp(state.xp), createdAt: new Date().toISOString() }, ...state.history] }; }

function addLearningXp(state: GameState, earnedXp: number): GameState {
  const today = localDate();
  const dailyXp = state.dailyLearningDate === today ? state.dailyLearningXp + earnedXp : earnedXp;
  let streak = state.streak; let lastStreakDate = state.lastStreakDate;
  if (dailyXp >= DAILY_LEARNING_XP_GOAL && lastStreakDate !== today) {
    streak = lastStreakDate && dayDifference(lastStreakDate, today) === 1 ? streak + 1 : 1;
    lastStreakDate = today;
  }
  return { ...state, xp: state.xp + earnedXp, avatarPoints: state.avatarPoints + earnedXp, dailyLearningDate: today, dailyLearningXp: dailyXp, streak, lastStreakDate };
}

export function achievementsFor(state: GameState): Achievement[] {
  const count = state.completedLessonIds.length;
  return [
    { id: "first-step", name: "First Step", description: "Complete your first lesson", icon: "🚀", earned: count >= 1 },
    { id: "star-collector", name: "Star Collector", description: "Collect 10 stars", icon: "⭐", earned: state.stars >= 10 },
    { id: "lesson-explorer", name: "Lesson Explorer", description: "Complete 5 lessons", icon: "🧭", earned: count >= 5 },
    { id: "xp-champion", name: "XP Champion", description: "Earn 500 XP", icon: "🏆", earned: state.xp >= 500 },
    { id: "surprise-seeker", name: "Surprise Seeker", description: "Discover 3 mystery bonuses", icon: "🎁", earned: state.surpriseCount >= 3 }
  ];
}

export function useStudentGame() {
  const [state, setState] = useState(initialState);
  useEffect(() => { const refresh = (event?: Event) => { const next = (event as CustomEvent<GameState> | undefined)?.detail; if (next) setState(next); else void readGameState().then(setState); }; refresh(); window.addEventListener(gameChangedEvent, refresh); return () => { window.removeEventListener(gameChangedEvent, refresh); }; }, []);

  const completeLesson = useCallback((lessonId: string, baseXp: number) => {
    const current = currentGameState; if (current.completedLessonIds.includes(lessonId)) return current;
    const surprise = Math.random() < 0.35; const bonusXp = surprise ? 25 : 0;
    let next = addLearningXp({ ...current, completedLessonIds: [...current.completedLessonIds, lessonId], surpriseCount: current.surpriseCount + (surprise ? 1 : 0), lastReward: { title: surprise ? "Mystery bonus unlocked!" : "Lesson complete!", detail: surprise ? "You found a hidden 25 XP bonus." : "Your lesson completion reward is ready.", xp: baseXp + bonusXp, stars: 0 } }, baseXp + bonusXp);
    next = withHistory(next, { type: "lesson", title: surprise ? "Lesson completed with a mystery bonus" : "Lesson completed", detail: `Earned ${baseXp + bonusXp} XP.`, xp: baseXp + bonusXp, stars: 0 });
    save(next); return next;
  }, []);

  const submitQuiz = useCallback((lessonId: string, answers: QuizAnswerResult[], passingScore: number, masteryScore: number) => {
    const current = currentGameState; const previous = current.quizRecords[lessonId] ?? { bestScore: 0, stars: 0, passed: false, rewardedQuestionIds: [], perfectBonusClaimed: false };
    const score = answers.length ? Math.round((answers.filter((answer) => answer.correct).length / answers.length) * 100) : 0;
    const passed = score >= passingScore; const earnedStars = !passed ? 0 : score >= 90 ? 3 : score >= masteryScore ? 2 : 1;
    const newCorrect = answers.filter((answer) => answer.correct && !previous.rewardedQuestionIds.includes(answer.blockId));
    const questionXp = newCorrect.reduce((total, answer) => total + (answer.attempts <= 1 ? 10 : 5), 0);
    const firstPassXp = passed && !previous.passed ? (earnedStars === 3 ? 50 : earnedStars === 2 ? 30 : 20) : 0;
    const improvementXp = previous.bestScore > 0 && score > previous.bestScore ? 15 : 0;
    const perfectXp = score === 100 && !previous.perfectBonusClaimed ? 20 : 0;
    const totalXp = questionXp + firstPassXp + improvementXp + perfectXp;
    const starIncrease = Math.max(0, earnedStars - previous.stars);
    const record = { bestScore: Math.max(previous.bestScore, score), stars: Math.max(previous.stars, earnedStars), passed: previous.passed || passed, rewardedQuestionIds: [...new Set([...previous.rewardedQuestionIds, ...newCorrect.map((answer) => answer.blockId)])], perfectBonusClaimed: previous.perfectBonusClaimed || score === 100 };
    let next = addLearningXp({ ...current, stars: current.stars + starIncrease, quizRecords: { ...current.quizRecords, [lessonId]: record }, lastReward: { title: passed ? "Quiz passed!" : "Keep practising", detail: passed ? `${score}% earned ${earnedStars} star${earnedStars === 1 ? "" : "s"}.` : `${score}%—reach ${passingScore}% to pass.`, xp: totalXp, stars: starIncrease } }, totalXp);
    next = withHistory(next, { type: "quiz", title: passed ? "Quiz passed" : "Quiz attempted", detail: `${score}% score · ${earnedStars} star${earnedStars === 1 ? "" : "s"}.`, xp: totalXp, stars: starIncrease });
    save(next); return { state: next, score, passed, earnedStars, earnedXp: totalXp };
  }, []);

  const completeVideoPrompt = useCallback((blockId: string, xp: number) => {
    const current = currentGameState;
    if (current.completedVideoPromptIds.includes(blockId)) return current;
    const rewardXp = Math.min(50, Math.max(1, Math.round(xp)));
    let next = addLearningXp({ ...current, completedVideoPromptIds: [...current.completedVideoPromptIds, blockId], lastReward: { title: "Video participation bonus!", detail: "You reflected on what you watched.", xp: rewardXp, stars: 0 } }, rewardXp);
    next = withHistory(next, { type: "lesson", title: "Video participation completed", detail: `Earned ${rewardXp} XP for a video quick check.`, xp: rewardXp, stars: 0 });
    save(next); return next;
  }, []);

  const redeemAvatarAsset = useCallback((assetId: string, cost: number) => {
    const current = currentGameState;
    if (current.unlockedAvatarAssetIds.includes(assetId) || cost < 0 || current.avatarPoints < cost) return { state: current, redeemed: false };
    const next = withHistory({ ...current, avatarPoints: current.avatarPoints - cost, unlockedAvatarAssetIds: [...current.unlockedAvatarAssetIds, assetId] }, { type: "achievement", title: "Avatar item unlocked", detail: `Redeemed ${cost} Avatar Points for ${assetId}.`, xp: 0, stars: 0 });
    save(next); return { state: next, redeemed: true };
  }, []);

  const claimDailyReward = useCallback(() => {
    const current = currentGameState; const today = localDate();
    if (current.claimedDailyReward === today || current.dailyLearningDate !== today || current.dailyLearningXp < DAILY_LEARNING_XP_GOAL) return current;
    const roll = Math.random(); const rewardXp = roll < .05 ? 50 : roll < .25 ? 30 : roll < .65 ? 20 : 10;
    const next = withHistory({ ...current, xp: current.xp + rewardXp, avatarPoints: current.avatarPoints + rewardXp, claimedDailyReward: today, lastReward: { title: "Daily gift opened!", detail: `You discovered ${rewardXp} bonus XP.`, xp: rewardXp, stars: 0 } }, { type: "gift", title: "Daily mystery gift opened", detail: `Discovered ${rewardXp} XP and Avatar Points.`, xp: rewardXp, stars: 0 }); save(next); return next;
  }, []);

  const today = localDate(); const dailyLearningXp = state.dailyLearningDate === today ? state.dailyLearningXp : 0;
  return useMemo(() => ({ state, achievements: achievementsFor(state), completeLesson, completeVideoPrompt, redeemAvatarAsset, submitQuiz, claimDailyReward, dailyLearningXp, dailyGiftUnlocked: dailyLearningXp >= DAILY_LEARNING_XP_GOAL }), [state, completeLesson, completeVideoPrompt, redeemAvatarAsset, submitQuiz, claimDailyReward, dailyLearningXp]);
}

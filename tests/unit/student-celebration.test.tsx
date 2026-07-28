import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentCelebrationHost } from "@/components/student/student-celebration-host";
import {
  dispatchStudentCelebration,
  studentCelebrationEvent,
  type StudentCelebration
} from "@/lib/gamification/student-celebration";
import { useStudentGame } from "@/lib/gamification/student-game";
import { defaultAvatar } from "@/lib/student/student-profile";

function matchMedia(reduced = false) {
  return vi.fn().mockImplementation(() => ({
    matches: reduced,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
}

describe("student award celebrations", () => {
  const audio = {
    currentTime: 0,
    pause: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    preload: "",
    volume: 1
  };

  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMedia(false)
    });
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: vi.fn(function Audio() {
        return audio;
      })
    });
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => ({
      ok: true,
      json: async () => String(input).includes("/api/student/game-state")
        ? { state: null }
        : {}
    })));
    audio.pause.mockClear();
    audio.play.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("combines nearby rewards, plays once, ignores duplicates, and dismisses automatically", async () => {
    render(<StudentCelebrationHost avatar={defaultAvatar} learnerName="Ama" />);
    const first: StudentCelebration = {
      id: "combine-lesson",
      source: "lesson",
      title: "Lesson complete!",
      detail: "Your lesson reward is ready.",
      xp: 40,
      stars: 0,
      achievements: [],
      createdAt: new Date().toISOString()
    };
    const second: StudentCelebration = {
      id: "combine-quiz",
      source: "lesson_quiz",
      title: "Quiz passed!",
      detail: "You earned a quiz reward.",
      xp: 20,
      stars: 2,
      achievements: [{
        id: "first-step",
        name: "First Step",
        description: "Complete your first lesson",
        icon: "🚀"
      }],
      createdAt: new Date().toISOString()
    };

    act(() => {
      window.dispatchEvent(new CustomEvent(studentCelebrationEvent, { detail: first }));
      window.dispatchEvent(new CustomEvent(studentCelebrationEvent, { detail: first }));
      vi.advanceTimersByTime(500);
      window.dispatchEvent(new CustomEvent(studentCelebrationEvent, { detail: second }));
      vi.advanceTimersByTime(750);
    });

    expect(screen.getByRole("heading", { name: "Amazing work!" })).toBeInTheDocument();
    expect(screen.getByText("+60 XP")).toBeInTheDocument();
    expect(screen.getByText("+2 stars")).toBeInTheDocument();
    expect(screen.getByText("First Step unlocked")).toBeInTheDocument();
    expect(audio.play).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(4_200));
    expect(screen.queryByRole("heading", { name: "Amazing work!" })).not.toBeInTheDocument();
  });

  it("remembers a learner's mute choice and retries browser-blocked sound manually", async () => {
    audio.play.mockRejectedValueOnce(new Error("Playback blocked")).mockResolvedValue(undefined);
    render(<StudentCelebrationHost avatar={defaultAvatar} learnerName="Kojo" />);
    act(() => {
      dispatchStudentCelebration({
        id: "blocked-sound",
        source: "daily_gift",
        title: "Daily gift opened!",
        detail: "You discovered 20 bonus XP.",
        xp: 20,
        stars: 0,
        createdAt: new Date().toISOString()
      });
      vi.advanceTimersByTime(750);
    });
    await act(async () => undefined);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play celebration sound" }));
      await Promise.resolve();
    });
    expect(audio.play).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Mute celebration sound" }));
    expect(window.localStorage.getItem("skulkid:celebration-sound")).toBe("off");
  });

  it("emits explicit events for positive rewards but not zero rewards or shop redemptions", async () => {
    const received: StudentCelebration[] = [];
    const listener = (event: Event) => received.push((event as CustomEvent<StudentCelebration>).detail);
    window.addEventListener(studentCelebrationEvent, listener);
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    function RewardActions() {
      const game = useStudentGame();
      return (
        <>
          <button onClick={() => game.completeLesson("celebration-lesson", 40)}>Lesson</button>
          <button onClick={() => game.completeVideoPrompt("celebration-video", 5)}>Video</button>
          <button onClick={() => game.submitQuiz("celebration-quiz", [{ blockId: "q1", correct: true, attempts: 1 }], 70, 80)}>Quiz</button>
          <button onClick={() => game.claimDailyReward()}>Gift</button>
          <button onClick={() => game.redeemAvatarAsset("shop-item", 1)}>Shop</button>
        </>
      );
    }

    render(<RewardActions />);
    await act(async () => undefined);
    fireEvent.click(screen.getByText("Lesson"));
    fireEvent.click(screen.getByText("Video"));
    fireEvent.click(screen.getByText("Quiz"));
    fireEvent.click(screen.getByText("Quiz"));
    fireEvent.click(screen.getByText("Gift"));
    fireEvent.click(screen.getByText("Shop"));

    expect(received.map((event) => event.source)).toEqual([
      "lesson",
      "video",
      "lesson_quiz",
      "daily_gift"
    ]);
    expect(received[0].achievements.map((achievement) => achievement.id)).toContain("first-step");
    window.removeEventListener(studentCelebrationEvent, listener);
  });
});

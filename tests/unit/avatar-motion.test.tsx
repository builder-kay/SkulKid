import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CharacterAvatar } from "@/components/student/character-avatar";
import { defaultAvatar } from "@/lib/student/student-profile";

function matchMedia(reduced = false) {
  return vi.fn().mockImplementation(() => ({
    matches: reduced,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
}

describe("expressive avatar motion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMedia(false)
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps static avatars still and non-interactive", () => {
    const { container } = render(<CharacterAvatar avatar={defaultAvatar} label="Learner" />);
    const avatar = container.querySelector("svg");
    expect(avatar).toHaveAttribute("data-avatar-motion", "static");
    expect(avatar).toHaveAttribute("data-avatar-gesture", "none");
    expect(avatar).toHaveAttribute("role", "img");
    expect(avatar).not.toHaveAttribute("tabindex");
    act(() => vi.advanceTimersByTime(100_000));
    expect(avatar).toHaveAttribute("data-avatar-gesture", "none");
    expect(avatar).toHaveAttribute("data-avatar-blinking", "false");
  });

  it("blinks naturally, waves, and restores the selected expression", () => {
    const { container } = render(
      <CharacterAvatar avatar={{ ...defaultAvatar, expression: "smirk" }} label="Learner" motion="expressive" />
    );
    const avatar = container.querySelector("svg");
    act(() => vi.advanceTimersByTime(5_000));
    expect(avatar).toHaveAttribute("data-avatar-blinking", "true");
    expect(container.querySelectorAll(".avatar-motion-eye.is-blinking")).toHaveLength(2);
    act(() => vi.advanceTimersByTime(135));
    expect(avatar).toHaveAttribute("data-avatar-blinking", "false");

    act(() => vi.advanceTimersByTime(1_365));
    expect(avatar).toHaveAttribute("data-avatar-gesture", "wave");
    expect(avatar).toHaveAttribute("data-avatar-expression", "happy");
    act(() => vi.advanceTimersByTime(2_200));
    expect(avatar).toHaveAttribute("data-avatar-gesture", "none");
    expect(avatar).toHaveAttribute("data-avatar-expression", "smirk");
  });

  it("shows a brief idle mood and then returns to the saved face", () => {
    const { container } = render(
      <CharacterAvatar avatar={defaultAvatar} label="Learner" motion="expressive" />
    );
    const avatar = container.querySelector("svg");
    act(() => vi.advanceTimersByTime(21_000));
    expect(avatar).toHaveAttribute("data-avatar-expression", "surprised");
    act(() => vi.advanceTimersByTime(2_000));
    expect(avatar).toHaveAttribute("data-avatar-expression", "classic");
  });

  it("supports tap, Enter, and Space in the Avatar Studio", () => {
    const { container } = render(
      <CharacterAvatar avatar={defaultAvatar} interactive label="Learner" motion="expressive" />
    );
    const avatar = container.querySelector("svg")!;
    expect(avatar).toHaveAttribute("role", "button");
    expect(avatar).toHaveAttribute("tabindex", "0");

    fireEvent.click(avatar);
    expect(avatar).toHaveAttribute("data-avatar-gesture", "wave");
    act(() => vi.advanceTimersByTime(2_200));
    fireEvent.keyDown(avatar, { key: "Enter" });
    expect(avatar).toHaveAttribute("data-avatar-gesture", "wave");
    act(() => vi.advanceTimersByTime(2_200));
    fireEvent.keyDown(avatar, { key: " " });
    expect(avatar).toHaveAttribute("data-avatar-gesture", "wave");
  });

  it("runs a controlled celebration and restores the saved face", () => {
    const { container, rerender } = render(
      <CharacterAvatar avatar={{ ...defaultAvatar, expression: "smirk" }} celebrationSignal="reward-1" label="Learner" motion="expressive" />
    );
    const avatar = container.querySelector("svg");
    expect(avatar).toHaveAttribute("data-avatar-gesture", "celebrate");
    expect(avatar).toHaveAttribute("data-avatar-expression", "happy");

    rerender(
      <CharacterAvatar avatar={{ ...defaultAvatar, expression: "smirk" }} celebrationSignal="reward-1" label="Learner" motion="expressive" />
    );
    act(() => vi.advanceTimersByTime(3_200));
    expect(avatar).toHaveAttribute("data-avatar-gesture", "none");
    expect(avatar).toHaveAttribute("data-avatar-expression", "smirk");
  });

  it("disables automatic movement when reduced motion is requested", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMedia(true)
    });
    const { container } = render(
      <CharacterAvatar avatar={defaultAvatar} interactive label="Learner" motion="expressive" />
    );
    const avatar = container.querySelector("svg")!;
    act(() => vi.advanceTimersByTime(100_000));
    expect(avatar).toHaveAttribute("data-avatar-gesture", "none");
    expect(avatar).toHaveAttribute("data-avatar-blinking", "false");

    fireEvent.click(avatar);
    expect(avatar).toHaveAttribute("data-avatar-gesture", "none");
    expect(avatar).toHaveAttribute("data-avatar-expression", "happy");
    act(() => vi.advanceTimersByTime(650));
    expect(avatar).toHaveAttribute("data-avatar-expression", "classic");
  });
});

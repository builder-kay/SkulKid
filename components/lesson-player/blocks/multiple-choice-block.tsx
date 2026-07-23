"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { FeedbackPanel } from "@/components/shared/feedback-panel";
import { SkulKidButton } from "@/components/shared/skulkid-button";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import { cn } from "@/lib/utils";
import type { MultipleChoiceBlock } from "@/types/lesson";

export type MultipleChoiceBlockProps = {
  block: MultipleChoiceBlock;
  previewMode?: boolean;
  onAnswer?: (blockId: string, correct: boolean, attempts: number) => void;
};

export function MultipleChoiceBlockComponent({ block, previewMode = false, onAnswer }: MultipleChoiceBlockProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [checkedOptionId, setCheckedOptionId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [awardedXp, setAwardedXp] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const isCorrect = checkedOptionId === block.correctOptionId;
  const canCheck = selectedOptionId !== null && checkedOptionId === null;

  function checkAnswer() {
    if (!selectedOptionId || checkedOptionId) {
      return;
    }

    setCheckedOptionId(selectedOptionId);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    onAnswer?.(block.id, selectedOptionId === block.correctOptionId, nextAttempts);
    if (selectedOptionId === block.correctOptionId) {
      setAwardedXp((current) => current ?? block.xpReward);
    }
  }

  function tryAgain() {
    setCheckedOptionId(null);
    setSelectedOptionId(null);
  }

  return (
    <LessonBlockShell block={block}>
      <fieldset className="space-y-4">
        <legend className="text-xl font-bold text-text-primary">{block.question}</legend>
        <div className="grid gap-3" role="radiogroup">
          {block.options.map((option) => {
            const selected = selectedOptionId === option.id;
            const checked = checkedOptionId !== null;
            const correct = checked && option.id === block.correctOptionId;
            const incorrect = checked && selected && option.id !== block.correctOptionId;

            return (
              <button
                aria-checked={selected}
                className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selected ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200",
                  correct && "border-green-500 bg-green-50",
                  incorrect && "border-red-500 bg-red-50"
                )}
                disabled={checked}
                key={option.id}
                onClick={() => setSelectedOptionId(option.id)}
                role="radio"
                type="button"
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-black", selected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700")}>
                  {option.label}
                </span>
                <span className="font-semibold">{option.text}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap gap-3">
        <SkulKidButton disabled={!canCheck} onClick={checkAnswer} type="button">
          Check answer
        </SkulKidButton>
        {checkedOptionId && !isCorrect ? (
          <SkulKidButton onClick={tryAgain} type="button" variant="outline">
            Try again
          </SkulKidButton>
        ) : null}
        {block.hint ? (
          <SkulKidButton
            aria-expanded={showHint}
            onClick={() => setShowHint((current) => !current)}
            type="button"
            variant="ghost"
          >
            <HelpCircle aria-hidden="true" className="size-4" />
            Hint
          </SkulKidButton>
        ) : null}
      </div>

      {showHint && block.hint ? (
        <FeedbackPanel className="mt-4" tone="info" title="Hint">
          {block.hint}
        </FeedbackPanel>
      ) : null}

      {checkedOptionId ? (
        <FeedbackPanel
          className="mt-4"
          tone={isCorrect ? "success" : "danger"}
          title={isCorrect ? "Correct answer" : "Not quite yet"}
        >
          <p>{block.explanation}</p>
          {previewMode && isCorrect && awardedXp !== null ? (
            <p className="mt-1 font-black">Challenge reward: +{awardedXp} XP</p>
          ) : null}
        </FeedbackPanel>
      ) : null}
    </LessonBlockShell>
  );
}

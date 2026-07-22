"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { FeedbackPanel } from "@/components/shared/feedback-panel";
import { SkulKidButton } from "@/components/shared/skulkid-button";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import type { FillBlankBlock } from "@/types/lesson";

export type FillBlankBlockProps = {
  block: FillBlankBlock;
  previewMode?: boolean;
  onAnswer?: (blockId: string, correct: boolean, attempts: number) => void;
};

function normalizeAnswer(value: string, caseSensitive: boolean) {
  const trimmed = value.trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

export function FillBlankBlockComponent({ block, previewMode = false, onAnswer }: FillBlankBlockProps) {
  const [response, setResponse] = useState("");
  const [checkedResponse, setCheckedResponse] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [awardedXp, setAwardedXp] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const normalizedCheckedResponse =
    checkedResponse === null ? null : normalizeAnswer(checkedResponse, block.caseSensitive);
  const acceptedAnswers = block.acceptedAnswers.map((answer) =>
    normalizeAnswer(answer, block.caseSensitive)
  );
  const isCorrect =
    normalizedCheckedResponse !== null && acceptedAnswers.includes(normalizedCheckedResponse);
  const canCheck = response.trim().length > 0 && checkedResponse === null;

  function checkAnswer() {
    if (!canCheck) {
      return;
    }

    setCheckedResponse(response);
    const correct = acceptedAnswers.includes(normalizeAnswer(response, block.caseSensitive));
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    onAnswer?.(block.id, correct, nextAttempts);
    if (correct) {
      setAwardedXp((current) => current ?? block.xpReward);
    }
  }

  return (
    <LessonBlockShell block={block}>
      <div className="space-y-4">
        <label className="block text-xl font-bold" htmlFor={`${block.id}-answer`}>
          {block.sentence}
        </label>
        <input
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
          disabled={checkedResponse !== null}
          id={`${block.id}-answer`}
          onChange={(event) => setResponse(event.target.value)}
          placeholder="Type your answer"
          value={response}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <SkulKidButton disabled={!canCheck} onClick={checkAnswer} type="button">
          Check answer
        </SkulKidButton>
        {checkedResponse !== null && !isCorrect ? (
          <SkulKidButton
            onClick={() => {
              setCheckedResponse(null);
              setResponse("");
            }}
            type="button"
            variant="outline"
          >
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

      {checkedResponse !== null ? (
        <FeedbackPanel
          className="mt-4"
          tone={isCorrect ? "success" : "danger"}
          title={isCorrect ? "Correct answer" : "Not quite yet"}
        >
          <p>{block.explanation}</p>
          {previewMode && isCorrect && awardedXp !== null ? (
            <p className="mt-1">Preview XP: +{awardedXp}</p>
          ) : null}
        </FeedbackPanel>
      ) : null}
    </LessonBlockShell>
  );
}

"use client";

import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuestionOptionState = "idle" | "selected" | "correct" | "incorrect";

export type QuestionOptionProps = {
  label: string;
  children: React.ReactNode;
  state?: QuestionOptionState;
};

export function QuestionOption({ label, children, state = "idle" }: QuestionOptionProps) {
  const Icon = state === "correct" ? CheckCircle2 : state === "incorrect" ? XCircle : Circle;

  return (
    <button
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        state === "selected" && "border-primary ring-2 ring-blue-100",
        state === "correct" && "border-green-700 bg-green-50",
        state === "incorrect" && "border-red-700 bg-red-50"
      )}
      type="button"
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold">
        {label}
      </span>
      <span>{children}</span>
    </button>
  );
}

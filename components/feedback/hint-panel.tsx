import { Lightbulb } from "lucide-react";
import { FeedbackPanel } from "@/components/shared/feedback-panel";

export type HintPanelProps = {
  children: React.ReactNode;
};

export function HintPanel({ children }: HintPanelProps) {
  return (
    <FeedbackPanel tone="info" title="Hint">
      <div className="flex gap-2">
        <Lightbulb aria-hidden="true" className="mt-1 size-4 shrink-0" />
        <div>{children}</div>
      </div>
    </FeedbackPanel>
  );
}

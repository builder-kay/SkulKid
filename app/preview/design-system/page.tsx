import Link from "next/link";
import { CheckCircle2, Info } from "lucide-react";
import { QuestionOption } from "@/components/design-system/question-option";
import { Checkbox, Input, Select, Textarea } from "@/components/design-system/form-controls";
import { ProgressRing } from "@/components/design-system/progress-ring";
import { Skeleton } from "@/components/design-system/skeleton";
import { Surface } from "@/components/design-system/surface";
import { HintPanel } from "@/components/feedback/hint-panel";
import { LevelBadge } from "@/components/gamification/level-badge";
import { StarRating } from "@/components/gamification/star-rating";
import { XpBadge } from "@/components/gamification/xp-badge";
import { LessonBlockShell } from "@/components/lesson-player/lesson-block-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FeedbackPanel } from "@/components/shared/feedback-panel";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SkulKidButton } from "@/components/shared/skulkid-button";
import { SkulKidCard } from "@/components/shared/skulkid-card";
import {
  contrastRatio,
  passesAaForNormalText,
  radiusTokens,
  semanticColours,
  spacingTokens,
  typographyTokens
} from "@/domains/design-system/tokens";
import type { TextBlock } from "@/types/lesson";

const sampleBlock: TextBlock = {
  id: "design-system-block",
  type: "text",
  order: 1,
  heading: "Lesson block shell",
  content: "Content appears inside a consistent, accessible lesson container."
};

export default function DesignSystemPreviewPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label text-muted">Internal preview</p>
          <h1 className="mt-2 text-display text-text-primary">SkulKid Design System</h1>
          <p className="mt-3 max-w-3xl text-body-large text-text-secondary">
            A living foundation for accessible, friendly and reliable learning interfaces.
          </p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" href="/admin">Back to admin</Link>
      </header>

      <div className="grid gap-6">
        <Section title="Semantic Colours">
          <div className="grid gap-4 md:grid-cols-3">
            {semanticColours.map((colour) => {
              const ratio = contrastRatio(colour.foreground, colour.value);
              const passes = passesAaForNormalText(colour.foreground, colour.value);
              return (
                <SkulKidCard className="overflow-hidden" key={colour.token}>
                  <div className="h-24 p-4" style={{ background: colour.value, color: colour.foreground }}>
                    <p className="font-bold">{colour.name}</p>
                    <p className="text-sm">{colour.token}</p>
                  </div>
                  <div className="flex items-center gap-2 p-4 text-sm font-semibold">
                    <CheckCircle2 aria-hidden="true" className={passes ? "size-4 text-green-700" : "size-4 text-red-700"} />
                    Contrast {ratio}:1 {passes ? "AA" : "Review"}
                  </div>
                </SkulKidCard>
              );
            })}
          </div>
        </Section>

        <Section title="Typography">
          <div className="grid gap-3">
            {typographyTokens.map(([name, size, lineHeight, weight]) => (
              <div className="rounded-xl bg-white p-4" key={name}>
                <p className="font-bold">{name}</p>
                <p className="text-text-secondary">{size} / {lineHeight} / {weight}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Spacing And Radius">
          <div className="grid gap-4 md:grid-cols-2">
            <TokenList title="Spacing" tokens={spacingTokens} />
            <TokenList title="Radius" tokens={radiusTokens} />
          </div>
        </Section>

        <Section title="Buttons And Forms">
          <div className="grid gap-4 lg:grid-cols-2">
            <SkulKidCard className="space-y-3 p-5">
              <div className="flex flex-wrap gap-3">
                <SkulKidButton>Primary</SkulKidButton>
                <SkulKidButton variant="secondary">Secondary</SkulKidButton>
                <SkulKidButton variant="outline">Outline</SkulKidButton>
                <SkulKidButton variant="ghost">Ghost</SkulKidButton>
                <SkulKidButton variant="success">Success</SkulKidButton>
                <SkulKidButton variant="danger">Danger</SkulKidButton>
              </div>
              <SkulKidButton disabled>Disabled readable</SkulKidButton>
            </SkulKidCard>
            <SkulKidCard className="grid gap-3 p-5">
              <Input aria-label="Learner name" defaultValue="Preview Learner" />
              <Textarea aria-label="Reflection" defaultValue="I feel ready to compare fractions." />
              <Select aria-label="Subject" defaultValue="math">
                <option value="math">Mathematics</option>
                <option value="english">English Language</option>
              </Select>
              <label className="flex min-h-11 items-center gap-3 font-semibold">
                <Checkbox defaultChecked aria-label="Show hints" />
                Show hints
              </label>
            </SkulKidCard>
          </div>
        </Section>

        <Section title="Progress, Feedback And Badges">
          <div className="grid gap-4 lg:grid-cols-3">
            <SkulKidCard className="space-y-4 p-5">
              <ProgressBar label="Course progress" value={66} />
              <ProgressRing label="Daily goal" value={72} />
            </SkulKidCard>
            <SkulKidCard className="space-y-3 p-5">
              <FeedbackPanel tone="success" title="Correct">
                You used the idea well.
              </FeedbackPanel>
              <FeedbackPanel tone="danger" title="Try again">
                Look again at the equal parts.
              </FeedbackPanel>
              <HintPanel>Count the total number of equal pieces.</HintPanel>
            </SkulKidCard>
            <SkulKidCard className="space-y-3 p-5">
              <XpBadge xp={90} />
              <LevelBadge level={3} />
              <StarRating stars={2} />
            </SkulKidCard>
          </div>
        </Section>

        <Section title="Lesson And Question States">
          <LessonBlockShell block={sampleBlock}>
            <p className="text-body text-text-secondary">{sampleBlock.content}</p>
          </LessonBlockShell>
          <div className="grid gap-3 md:grid-cols-2">
            <QuestionOption label="A">Idle option</QuestionOption>
            <QuestionOption label="B" state="selected">Selected option</QuestionOption>
            <QuestionOption label="C" state="correct">Correct option</QuestionOption>
            <QuestionOption label="D" state="incorrect">Incorrect option</QuestionOption>
          </div>
        </Section>

        <Section title="Loading And States">
          <div className="grid gap-4 lg:grid-cols-3">
            <Surface className="space-y-3 p-5" variant="raised">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </Surface>
            <EmptyState title="No lessons yet" description="Published lessons will appear here." />
            <ErrorState title="Could not load" description="Try again or check your connection." />
          </div>
        </Section>

        <Section title="Accessibility And Motion">
          <SkulKidCard className="flex gap-3 p-5">
            <Info aria-hidden="true" className="mt-1 size-5 text-primary" />
            <p className="max-w-3xl text-body text-text-secondary">
              Components use visible focus rings, semantic elements, minimum practical 44px controls,
              screen-reader-friendly status regions and reduced-motion support through global CSS.
            </p>
          </SkulKidCard>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={title.toLowerCase().replaceAll(" ", "-")} className="space-y-4">
      <h2 className="text-heading-2" id={title.toLowerCase().replaceAll(" ", "-")}>{title}</h2>
      {children}
    </section>
  );
}

function TokenList({ title, tokens }: { title: string; tokens: readonly (readonly [string, string])[] }) {
  return (
    <SkulKidCard className="p-5">
      <h3 className="text-heading-3">{title}</h3>
      <div className="mt-4 grid gap-2">
        {tokens.map(([name, value]) => (
          <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm" key={name}>
            <span className="font-bold">{name}</span>
            <span className="text-text-secondary">{value}</span>
          </div>
        ))}
      </div>
    </SkulKidCard>
  );
}

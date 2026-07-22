import { Inbox } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

export type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <SkulKidCard className="p-8 text-center">
      <Inbox aria-hidden="true" className="mx-auto size-10 text-muted" />
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-text-secondary">{description}</p>
    </SkulKidCard>
  );
}

import { AlertTriangle } from "lucide-react";
import { SkulKidCard } from "@/components/shared/skulkid-card";

export type ErrorStateProps = {
  title: string;
  description: string;
};

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <SkulKidCard className="border-red-200 p-8 text-center">
      <AlertTriangle aria-hidden="true" className="mx-auto size-10 text-danger" />
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-text-secondary">{description}</p>
    </SkulKidCard>
  );
}

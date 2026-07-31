import { notFound } from "next/navigation";
import { FeedbackWizard } from "@/components/research/feedback-wizard";
import { getForm, isFormType } from "@/lib/research/questionnaire";

export default async function FeedbackFormPage({ params }: { params: Promise<{ form: string }> }) {
  const { form: formKey } = await params;
  if (!isFormType(formKey)) notFound();
  return <FeedbackWizard form={getForm(formKey)} />;
}

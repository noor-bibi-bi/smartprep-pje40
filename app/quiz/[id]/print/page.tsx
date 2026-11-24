import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintExamClient } from "@/components/print/print-exam-client";

export const metadata: Metadata = {
  title: "Print Exam Sheet — SmartPrep",
};
export const dynamic = "force-dynamic";

export default async function PrintQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/quiz/${id}/print`);
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, module_tag, difficulty, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, options, correct_index, explanation, position")
    .eq("quiz_id", id)
    .order("position", { ascending: true });

  if (!questions || questions.length === 0) notFound();

  return (
    <main className="min-h-screen bg-paper py-4 sm:py-8 px-4">
      <PrintExamClient
        quizTitle={quiz.title}
        moduleTag={quiz.module_tag}
        difficulty={quiz.difficulty}
        questions={questions}
      />
    </main>
  );
}

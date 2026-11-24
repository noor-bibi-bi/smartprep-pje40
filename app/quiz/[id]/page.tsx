import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StudySetClient } from "@/components/quiz/study-set-client";

export const metadata: Metadata = {
  title: "Study Set — SmartPrep",
};
export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

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
    <main className="container-sheet py-8 sm:py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-accent"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to Dashboard
      </Link>

      <StudySetClient
        quizId={quiz.id}
        quizTitle={quiz.title}
        moduleTag={quiz.module_tag}
        questions={questions}
      />
    </main>
  );
}

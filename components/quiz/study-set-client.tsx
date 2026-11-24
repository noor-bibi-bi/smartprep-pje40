"use client";

import { useState } from "react";
import { QuizPlayer, type QuestionViewData } from "@/components/quiz/quiz-player";
import { FlashcardPlayer } from "@/components/quiz/flashcard-player";
import { CheckSquare, Layers } from "lucide-react";

interface StudySetClientProps {
  quizId: string;
  quizTitle: string;
  moduleTag?: string | null;
  questions: QuestionViewData[];
}

export function StudySetClient({
  quizId,
  quizTitle,
  moduleTag,
  questions,
}: StudySetClientProps) {
  const [mode, setMode] = useState<"quiz" | "flashcards">("quiz");

  return (
    <div className="space-y-8">
      {/* Top Bar with Mode Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-5">
        <div>
          {moduleTag && (
            <span className="inline-block rounded bg-accent-tint/60 px-2 py-0.5 font-mono text-xs font-semibold text-accent mb-1.5">
              {moduleTag}
            </span>
          )}
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            {quizTitle}
          </h1>
          <p className="text-sm text-mute">
            {questions.length} question{questions.length === 1 ? "" : "s"} • Active Recall & Spaced Repetition
          </p>
        </div>

        {/* Mode Switcher: Quiz vs Flashcards */}
        <div className="flex rounded-lg border border-rule bg-raised p-1 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setMode("quiz")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              mode === "quiz"
                ? "bg-paper text-ink shadow-sm"
                : "text-mute hover:text-ink"
            }`}
          >
            <CheckSquare size={16} aria-hidden />
            <span>Interactive Quiz</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("flashcards")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
              mode === "flashcards"
                ? "bg-paper text-ink shadow-sm"
                : "text-mute hover:text-ink"
            }`}
          >
            <Layers size={16} aria-hidden />
            <span>SM-2 Flashcards</span>
          </button>
        </div>
      </div>

      {/* Render selected player */}
      {mode === "quiz" ? (
        <QuizPlayer quizId={quizId} quizTitle={quizTitle} questions={questions} />
      ) : (
        <FlashcardPlayer quizTitle={quizTitle} questions={questions} />
      )}
    </div>
  );
}

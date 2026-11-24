"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, Sparkles, Clock } from "lucide-react";
import { reviewFlashcardAction } from "@/app/quiz/actions";
import { toast } from "sonner";
import type { QuestionViewData } from "@/components/quiz/quiz-player";

interface FlashcardPlayerProps {
  quizTitle: string;
  questions: QuestionViewData[];
}

export function FlashcardPlayer({ quizTitle, questions }: FlashcardPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentQ = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  function handleRate(quality: number) {
    if (!currentQ || isPending) return;

    startTransition(async () => {
      const res = await reviewFlashcardAction({
        questionId: currentQ.id,
        quality,
      });

      if (res.success && res.sm2) {
        toast.success(`Reviewed! Next due in ${res.sm2.interval_days} day(s).`);
      }

      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    });
  }

  function handleRestart() {
    setCurrentIndex(0);
    setIsFlipped(false);
  }

  if (isFinished) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-rule bg-paper p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-tint text-accent">
          <Sparkles size={32} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink">Session Finished!</h2>
        <p className="mt-1 text-sm text-mute">
          You reviewed all {questions.length} cards in {quizTitle}.
        </p>
        <div className="my-6 rounded-lg border border-rule bg-raised/40 p-5 text-sm text-ink">
          <p className="font-medium">Spaced repetition schedule updated.</p>
          <p className="mt-1 text-xs text-mute">
            Cards marked Again will reappear tomorrow; Easy cards will wait several days.
          </p>
        </div>
        <Button size="md" onClick={handleRestart}>
          <RotateCw size={16} aria-hidden />
          <span>Review Again</span>
        </Button>
      </div>
    );
  }

  const correctAnswerText = currentQ.options[currentQ.correct_index];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-mute">
        <span className="font-mono uppercase">
          Card {currentIndex + 1} of {questions.length}
        </span>
        <span className="flex items-center gap-1 font-mono">
          <Clock size={14} /> SM-2 Active Recall
        </span>
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsFlipped(!isFlipped);
          }
        }}
        className="cursor-pointer select-none rounded-xl border-2 border-rule bg-paper p-8 min-h-[260px] flex flex-col justify-between transition-all hover:border-accent shadow-sm"
      >
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-mute">
            {isFlipped ? "Answer" : "Question (click to flip)"}
          </span>
          <p className="mt-4 font-display text-lg font-bold text-ink sm:text-xl">
            {isFlipped ? correctAnswerText : currentQ.question_text}
          </p>
          {isFlipped && currentQ.explanation && (
            <p className="mt-4 text-sm text-mute border-t border-rule/50 pt-3">
              {currentQ.explanation}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 text-xs text-mute border-t border-rule/30">
          <span className="flex items-center gap-1">
            <RotateCw size={13} /> Click card to flip
          </span>
          <span>{isFlipped ? "Rate your recall below" : "Recall the term"}</span>
        </div>
      </div>

      {/* SM-2 Recall Buttons */}
      {isFlipped && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-center font-mono text-xs uppercase text-mute">
            How well did you recall this?
          </p>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRate(0)}
              className="flex flex-col items-center justify-center rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors"
            >
              <span className="text-sm font-bold">Again</span>
              <span className="text-[10px] opacity-75">1 day</span>
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRate(3)}
              className="flex flex-col items-center justify-center rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs font-semibold text-warning hover:bg-warning/20 transition-colors"
            >
              <span className="text-sm font-bold">Hard</span>
              <span className="text-[10px] opacity-75">3 days</span>
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRate(4)}
              className="flex flex-col items-center justify-center rounded-lg border border-accent/40 bg-accent-tint/60 p-3 text-xs font-semibold text-accent hover:bg-accent-tint transition-colors"
            >
              <span className="text-sm font-bold">Good</span>
              <span className="text-[10px] opacity-75">4 days</span>
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleRate(5)}
              className="flex flex-col items-center justify-center rounded-lg border border-success/40 bg-success/10 p-3 text-xs font-semibold text-success hover:bg-success/20 transition-colors"
            >
              <span className="text-sm font-bold">Easy</span>
              <span className="text-[10px] opacity-75">6+ days</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

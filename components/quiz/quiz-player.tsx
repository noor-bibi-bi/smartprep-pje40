"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Award } from "lucide-react";
import { recordAttemptAction } from "@/app/quiz/actions";
import { toast } from "sonner";
import Link from "next/link";

export interface QuestionViewData {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

interface QuizPlayerProps {
  quizId: string;
  quizTitle: string;
  questions: QuestionViewData[];
}

export function QuizPlayer({ quizId, quizTitle, questions }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }>
  >([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [, startSaving] = useTransition();

  const currentQ = questions[currentIndex];

  function handleSelectOption(index: number) {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQ.correct_index;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    const recorded = {
      questionId: currentQ.id,
      selectedAnswer: currentQ.options[index],
      isCorrect,
    };
    const nextAnswers = [...userAnswers, recorded];
    setUserAnswers(nextAnswers);
  }

  function handleNext() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      // Record attempt in Supabase
      startSaving(async () => {
        const finalScore = score + (selectedOption === currentQ.correct_index ? 0 : 0);
        const res = await recordAttemptAction({
          quizId,
          score: finalScore,
          total: questions.length,
          answers: userAnswers,
        });
        if (res.success) {
          toast.success("Attempt recorded in your study history!");
        }
      });
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setUserAnswers([]);
    setIsCompleted(false);
  }

  if (isCompleted) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="mx-auto max-w-xl rounded-xl border border-rule bg-paper p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-tint text-accent">
          <Award size={36} aria-hidden />
        </div>

        <h2 className="font-display text-2xl font-bold text-ink">Quiz Complete!</h2>
        <p className="mt-1 text-sm text-mute">{quizTitle}</p>

        <div className="my-6 rounded-lg border border-rule bg-raised/50 p-6">
          <p className="font-mono text-3xl font-extrabold text-accent">
            {score} / {questions.length}
          </p>
          <p className="mt-1 text-sm font-medium text-mute">{percentage}% Accuracy</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary" size="md" onClick={handleRestart}>
            <RotateCcw size={16} aria-hidden />
            <span>Retake Quiz</span>
          </Button>
          <Link
            href={`/dashboard`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-deep dark:text-ink text-[0.95rem]"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress header */}
      <div className="flex items-center justify-between text-sm text-mute">
        <span className="font-mono uppercase">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="font-mono font-semibold text-accent">Score: {score}</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-raised overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="rounded-xl border border-rule bg-paper p-6 sm:p-8 shadow-sm">
        <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
          {currentQ.question_text}
        </h3>

        <div className="mt-6 space-y-3">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectOption = idx === currentQ.correct_index;

            let buttonClass = "border-rule bg-raised/40 hover:bg-raised text-ink hover:border-accent";
            if (isAnswered) {
              if (isCorrectOption) {
                buttonClass = "border-accent bg-accent-tint/60 text-ink font-semibold";
              } else if (isSelected) {
                buttonClass = "border-danger bg-danger/10 text-danger";
              } else {
                buttonClass = "opacity-50 border-rule";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`w-full text-left rounded-lg border p-4 text-sm sm:text-base flex items-start gap-3 transition-colors ${buttonClass}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rule font-mono text-xs font-semibold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{option}</span>
                {isAnswered && isCorrectOption && (
                  <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5" />
                )}
                {isAnswered && isSelected && !isCorrectOption && (
                  <XCircle size={18} className="text-danger shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next action */}
        {isAnswered && (
          <div className="mt-6 rounded-lg border border-accent/20 bg-accent-tint/20 p-4 space-y-3 animate-fade-in">
            {currentQ.explanation && (
              <p className="text-sm text-ink/90">
                <strong className="text-accent">Explanation:</strong> {currentQ.explanation}
              </p>
            )}
            <div className="flex justify-end">
              <Button size="md" onClick={handleNext}>
                <span>{currentIndex + 1 < questions.length ? "Next Question" : "Finish Quiz"}</span>
                <ArrowRight size={16} aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

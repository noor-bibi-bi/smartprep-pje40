"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, CheckSquare, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuestionItem {
  id: string;
  position: number;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

interface PrintExamClientProps {
  quizTitle: string;
  moduleTag?: string | null;
  difficulty: string;
  questions: QuestionItem[];
}

export function PrintExamClient({
  quizTitle,
  moduleTag,
  difficulty,
  questions,
}: PrintExamClientProps) {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);

  return (
    <div className="mx-auto max-w-4xl py-6 print-page">
      {/* Print Controls (Hidden when printing) */}
      <div className="no-print mb-8 rounded-xl border border-rule bg-raised p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Dashboard
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {/* Answer key toggle */}
            <button
              type="button"
              onClick={() => setShowAnswerKey((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                showAnswerKey
                  ? "border-accent bg-accent-tint/60 text-accent"
                  : "border-rule bg-paper text-mute hover:text-ink"
              }`}
            >
              {showAnswerKey ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>Answer Key: {showAnswerKey ? "ON" : "OFF"}</span>
            </button>

            {showAnswerKey && (
              <button
                type="button"
                onClick={() => setShowExplanations((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  showExplanations
                    ? "border-accent bg-accent-tint/60 text-accent"
                    : "border-rule bg-paper text-mute hover:text-ink"
                }`}
              >
                <CheckSquare size={14} />
                <span>Explanations: {showExplanations ? "ON" : "OFF"}</span>
              </button>
            )}

            <Button size="md" onClick={() => window.print()}>
              <Printer size={16} aria-hidden />
              <span>Print / Save as PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Exam Sheet */}
      <div className="bg-white text-black p-4 sm:p-8 font-serif">
        {/* Exam Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-neutral-600">
                {moduleTag ? `Course: ${moduleTag} · ` : ""}Examination Paper · Level: {difficulty.toUpperCase()}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl mt-1">
                {quizTitle}
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Total Questions: {questions.length} · Multiple Choice Assessment
              </p>
            </div>
            <div className="border-2 border-black p-3 text-center min-w-[120px]">
              <span className="block text-[10px] font-mono uppercase font-bold text-neutral-500">
                Score
              </span>
              <span className="text-xl font-bold font-mono">______ / {questions.length}</span>
            </div>
          </div>

          {/* Student Fields */}
          <div className="mt-6 grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-neutral-300 font-sans text-xs">
            <div>
              <span className="font-bold">Student Name:</span>{" "}
              <span className="inline-block border-b border-black w-48 sm:w-64" />
            </div>
            <div className="text-right">
              <span className="font-bold">Date:</span>{" "}
              <span className="inline-block border-b border-black w-32 sm:w-44" />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-6 bg-neutral-50 border border-neutral-200 p-3 text-xs text-neutral-700 font-sans">
          <strong>Instructions:</strong> Read each question carefully. Select the single best answer for each question by clearly marking the corresponding letter box.
        </div>

        {/* Questions Section */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="print-break-inside-avoid pt-2">
              <div className="flex items-start gap-2">
                <span className="font-bold font-mono text-sm">{idx + 1}.</span>
                <p className="font-medium text-sm sm:text-base leading-relaxed flex-1">
                  {q.question_text}
                </p>
              </div>

              <div className="mt-2.5 ml-6 grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans text-xs sm:text-sm">
                {q.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <div key={optIdx} className="flex items-center gap-2.5 py-1">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-neutral-400 font-mono text-xs font-semibold">
                        {letter}
                      </span>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Optional Answer Key Section */}
        {showAnswerKey && (
          <div className="mt-12 print-break-before-page border-t-2 border-black pt-6">
            <h2 className="text-xl font-bold tracking-tight text-black border-b border-neutral-300 pb-2">
              Official Answer Key & Explanations
            </h2>
            <p className="text-xs text-neutral-500 font-sans mt-1 mb-4">
              For grading and revision reference only.
            </p>

            <div className="space-y-4 font-sans text-xs sm:text-sm">
              {questions.map((q, idx) => {
                const correctLetter = String.fromCharCode(65 + q.correct_index);
                const correctText = q.options[q.correct_index];

                return (
                  <div
                    key={q.id}
                    className="p-3 rounded border border-neutral-200 bg-neutral-50 print-break-inside-avoid"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-neutral-700">Q{idx + 1}:</span>
                      <span className="font-bold text-black">
                        Option [{correctLetter}] — {correctText}
                      </span>
                    </div>
                    {showExplanations && q.explanation && (
                      <p className="mt-1.5 text-xs text-neutral-600 pl-6 border-l-2 border-neutral-400">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

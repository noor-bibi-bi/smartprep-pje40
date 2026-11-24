"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FileText,
  ChevronRight,
  Trash2,
  Printer,
  Cloud,
  CloudOff,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { deleteQuizAction } from "@/app/dashboard/actions";

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30",
  medium: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30",
  hard: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30",
};

export interface QuizSummary {
  id: string;
  title: string;
  module_tag: string | null;
  difficulty: Difficulty;
  engine_used: "cloud" | "offline";
  created_at: string;
  question_count: number;
  attempt_count: number;
  best_score: number | null;
  best_total: number | null;
}

interface QuizListClientProps {
  quizzes: QuizSummary[];
}

export function QuizListClient({ quizzes }: QuizListClientProps) {
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract unique module tags
  const tags = Array.from(
    new Set(
      quizzes
        .map((q) => q.module_tag?.trim())
        .filter((tag): tag is string => Boolean(tag))
    )
  ).sort();

  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedTag === "ALL") return true;
    return q.module_tag?.trim().toLowerCase() === selectedTag.toLowerCase();
  });

  function handleDelete(quizId: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(quizId);
    startDeleteTransition(async () => {
      const res = await deleteQuizAction(quizId);
      setDeletingId(null);
      if (res.success) {
        toast.success(`"${title}" deleted.`);
      } else {
        toast.error(res.error || "Failed to delete quiz.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Module Filter Tabs */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="flex items-center gap-1 text-mute font-medium">
            <Filter size={14} aria-hidden /> Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTag("ALL")}
            className={`rounded-full px-3 py-1 font-mono transition-colors ${
              selectedTag === "ALL"
                ? "bg-ink text-paper font-semibold"
                : "border border-rule bg-raised/50 text-mute hover:text-ink"
            }`}
          >
            All Modules ({quizzes.length})
          </button>
          {tags.map((tag) => {
            const count = quizzes.filter((q) => q.module_tag?.trim() === tag).length;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-3 py-1 font-mono transition-colors ${
                  selectedTag === tag
                    ? "bg-accent text-white font-semibold"
                    : "border border-rule bg-raised/50 text-mute hover:text-ink"
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <ul className="overflow-hidden rounded-md border border-rule bg-raised divide-y divide-rule">
        {filteredQuizzes.map((quiz) => {
          const dateLabel = new Date(quiz.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          const scoreLabel =
            quiz.best_score !== null && quiz.best_total !== null
              ? `${quiz.best_score}/${quiz.best_total}`
              : null;

          const pct =
            quiz.best_score !== null && quiz.best_total !== null && quiz.best_total > 0
              ? Math.round((quiz.best_score / quiz.best_total) * 100)
              : null;

          const isCurrentDeleting = isDeleting && deletingId === quiz.id;

          return (
            <li
              key={quiz.id}
              className={`flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-accent-tint/30 ${
                isCurrentDeleting ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              {/* Main Clickable Area */}
              <Link
                href={`/quiz/${quiz.id}`}
                className="flex min-w-0 flex-1 items-center gap-3.5 focus-visible:outline-none"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-rule bg-paper text-mute">
                  <FileText size={18} aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="truncate font-medium text-ink hover:text-accent transition-colors">
                      {quiz.title}
                    </span>
                    {quiz.module_tag && (
                      <span className="rounded bg-accent-tint/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
                        {quiz.module_tag}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-mono text-label uppercase text-mute flex-wrap">
                    <span>{dateLabel}</span>
                    <span>·</span>
                    <span>{quiz.question_count} Qs</span>
                    {quiz.attempt_count > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          {quiz.attempt_count} attempt{quiz.attempt_count !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        DIFFICULTY_COLORS[quiz.difficulty]
                      }`}
                    >
                      {quiz.difficulty}
                    </span>
                    <span
                      title={quiz.engine_used === "cloud" ? "Cloud AI" : "Offline Engine"}
                      className="ml-0.5"
                    >
                      {quiz.engine_used === "cloud" ? (
                        <Cloud size={12} className="text-blue-500" />
                      ) : (
                        <CloudOff size={12} className="text-mute" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="hidden sm:block shrink-0 text-right pr-2">
                  {scoreLabel ? (
                    <span className="font-mono text-sm tabular text-ink">
                      {scoreLabel}
                      {pct !== null && (
                        <span className="ml-1 text-mute text-xs">({pct}%)</span>
                      )}
                    </span>
                  ) : (
                    <span className="font-mono text-label uppercase text-mute">Not taken</span>
                  )}
                </div>
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/quiz/${quiz.id}/print`}
                  title="Print Exam Sheet"
                  className="rounded p-2 text-mute hover:bg-paper hover:text-ink transition-colors"
                >
                  <Printer size={16} aria-hidden />
                </Link>

                <button
                  type="button"
                  title="Delete Study Set"
                  onClick={() => handleDelete(quiz.id, quiz.title)}
                  className="rounded p-2 text-mute hover:bg-danger/10 hover:text-danger transition-colors"
                >
                  <Trash2 size={16} aria-hidden />
                </button>

                <Link
                  href={`/quiz/${quiz.id}`}
                  className="rounded p-2 text-mute hover:text-accent transition-colors"
                >
                  <ChevronRight size={18} aria-hidden />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

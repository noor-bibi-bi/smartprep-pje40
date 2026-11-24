import type { Metadata } from "next";
import Link from "next/link";
import { Plus, BookOpen, Target, Layers, Trophy, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuizListClient, type QuizSummary } from "@/components/dashboard/quiz-list-client";
import { ScoreTrendChart, type AttemptDataPoint } from "@/components/analytics/score-trend-chart";
import { MasteryDistributionChart, type MasteryCounts } from "@/components/analytics/mastery-distribution-chart";
import { ButtonLink } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { OfflineSyncPanel } from "@/components/dashboard/offline-sync-panel";

export const metadata: Metadata = {
  title: "Dashboard — SmartPrep",
};
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  // 1. Fetch quizzes with question count
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select(
      "id, title, module_tag, difficulty, engine_used, created_at, questions(count)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 2. Fetch all attempt stats per quiz
  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, score, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // 3. Fetch questions for SM-2 mastery analytics
  const nowIso = new Date().toISOString();
  const { data: allQuestions } = await supabase
    .from("questions")
    .select("id, ease_factor, repetitions, next_review_at")
    .eq("user_id", user.id);

  const dueCount = (allQuestions ?? []).filter((q) => q.next_review_at <= nowIso).length;
  const learningCount = (allQuestions ?? []).filter(
    (q) => q.repetitions <= 2 && q.next_review_at > nowIso
  ).length;
  const masteredCount = (allQuestions ?? []).filter(
    (q) => q.repetitions > 2 && q.ease_factor >= 2.5 && q.next_review_at > nowIso
  ).length;

  const masteryCounts: MasteryCounts = {
    due: dueCount,
    learning: learningCount,
    mastered: masteredCount,
    total: allQuestions?.length ?? 0,
  };

  // Map quiz titles for quick lookup
  const quizTitleMap = new Map<string, string>();
  (quizzes ?? []).forEach((q) => quizTitleMap.set(q.id, q.title));

  // Prepare attempt points for trend chart
  const attemptPoints: AttemptDataPoint[] = (attempts ?? []).map((a) => ({
    id: a.id,
    quizTitle: quizTitleMap.get(a.quiz_id) || "Study Quiz",
    score: a.score,
    total: a.total,
    percentage: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
    createdAt: a.created_at,
  }));

  // Aggregate attempt data per quiz
  const attemptMap = new Map<
    string,
    { count: number; best_score: number | null; best_total: number | null }
  >();
  if (attempts) {
    for (const a of attempts) {
      const existing = attemptMap.get(a.quiz_id);
      if (!existing) {
        attemptMap.set(a.quiz_id, {
          count: 1,
          best_score: a.score,
          best_total: a.total,
        });
      } else {
        const prevPct =
          existing.best_total ? (existing.best_score ?? 0) / existing.best_total : 0;
        const newPct = a.total ? a.score / a.total : 0;
        attemptMap.set(a.quiz_id, {
          count: existing.count + 1,
          best_score: newPct >= prevPct ? a.score : existing.best_score,
          best_total: newPct >= prevPct ? a.total : existing.best_total,
        });
      }
    }
  }

  const enriched: QuizSummary[] = (quizzes ?? []).map((q) => {
    const agg = attemptMap.get(q.id);
    return {
      id: q.id,
      title: q.title,
      module_tag: q.module_tag,
      difficulty: q.difficulty as "easy" | "medium" | "hard",
      engine_used: q.engine_used as "cloud" | "offline",
      created_at: q.created_at,
      question_count: (q.questions as unknown as { count: number }[])?.[0]?.count ?? 0,
      attempt_count: agg?.count ?? 0,
      best_score: agg?.best_score ?? null,
      best_total: agg?.best_total ?? null,
    };
  });

  // KPI calculations
  const totalQuizzes = enriched.length;
  const totalAttempts = attempts?.length ?? 0;
  const avgScore =
    totalAttempts > 0 && attempts
      ? Math.round(
          (attempts.reduce(
            (sum, a) => sum + (a.total > 0 ? a.score / a.total : 0),
            0
          ) /
            totalAttempts) *
            100
        )
      : null;
  const totalQuestions = enriched.reduce((s, q) => s + q.question_count, 0);

  return (
    <main className="container-sheet py-10 sm:py-14">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="exam-label mb-2">Your library</p>
          <h1 className="font-display text-title text-ink">Study Dashboard</h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper px-3 py-1 font-mono text-xs text-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {user.email}
            </span>
          </div>

          <OfflineSyncPanel />
        </div>
        <ButtonLink href="/create" size="lg">
          <Plus size={18} aria-hidden />
          New Study Set
        </ButtonLink>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KpiCard
          icon={<BookOpen size={20} />}
          label={`Study Set${totalQuizzes === 1 ? "" : "s"}`}
          value={String(totalQuizzes)}
        />
        <KpiCard
          icon={<Layers size={20} />}
          label={`Question${totalQuestions === 1 ? "" : "s"}`}
          value={String(totalQuestions)}
        />
        <KpiCard
          icon={<Target size={20} />}
          label={`Quiz Attempt${totalAttempts === 1 ? "" : "s"}`}
          value={String(totalAttempts)}
        />
        <KpiCard
          icon={<Trophy size={20} />}
          label="Avg Score"
          value={avgScore !== null ? `${avgScore}%` : "—"}
        />
        <KpiCard
          icon={<Clock size={20} />}
          label="Due for Review"
          value={String(dueCount)}
          highlight={dueCount > 0}
        />
      </div>

      {/* Analytics Charts Grid */}
      {totalQuizzes > 0 && (
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScoreTrendChart attempts={attemptPoints} />
          <MasteryDistributionChart counts={masteryCounts} />
        </div>
      )}

      {/* Study Sets List Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink">Your Study Sets</h2>
      </div>

      {/* Study Sets List */}
      {enriched.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rule bg-paper py-20 text-center">
          <BookOpen size={40} className="mx-auto mb-4 text-mute" />
          <h2 className="font-display text-lg font-semibold text-ink">No study sets yet</h2>
          <p className="mt-1 text-sm text-mute">
            Upload a PDF or paste notes to generate your first quiz.
          </p>
          <div className="mt-6">
            <Link
              href="/create"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-deep dark:text-ink text-[0.95rem]"
            >
              <Plus size={16} aria-hidden />
              Create Study Set
            </Link>
          </div>
        </div>
      ) : (
        <QuizListClient quizzes={enriched} />
      )}
    </main>
  );
}

function KpiCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        highlight
          ? "border-accent bg-accent-tint/30"
          : "border-rule bg-paper"
      }`}
    >
      <div
        className={`mb-2 flex items-center gap-2 ${
          highlight ? "text-accent" : "text-mute"
        }`}
      >
        {icon}
      </div>
      <p className="font-mono text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs text-mute uppercase tracking-wide">{label}</p>
    </div>
  );
}

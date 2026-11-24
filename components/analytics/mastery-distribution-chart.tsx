"use client";

import { Layers } from "lucide-react";

export interface MasteryCounts {
  due: number;
  learning: number;
  mastered: number;
  total: number;
}

interface MasteryDistributionChartProps {
  counts: MasteryCounts;
}

export function MasteryDistributionChart({ counts }: MasteryDistributionChartProps) {
  const { due, learning, mastered, total } = counts;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rule bg-paper p-8 text-center">
        <Layers size={28} className="mx-auto mb-2 text-mute" />
        <p className="text-sm font-medium text-ink">No flashcard retention data</p>
        <p className="mt-1 text-xs text-mute">Create study sets to build your mastery breakdown.</p>
      </div>
    );
  }

  const duePct = Math.round((due / total) * 100);
  const learningPct = Math.round((learning / total) * 100);
  const masteredPct = Math.max(0, 100 - duePct - learningPct);

  return (
    <div className="rounded-xl border border-rule bg-paper p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-accent" />
          <h3 className="font-display text-base font-bold text-ink">Spaced Repetition Mastery</h3>
        </div>
        <span className="font-mono text-xs text-mute">{total} total cards</span>
      </div>

      {/* Progress Bar Breakdown */}
      <div className="h-4 w-full overflow-hidden rounded-full bg-raised flex">
        {due > 0 && (
          <div
            title={`Due for Review: ${due} (${duePct}%)`}
            style={{ width: `${duePct}%` }}
            className="bg-amber-500 h-full transition-all duration-300"
          />
        )}
        {learning > 0 && (
          <div
            title={`Learning: ${learning} (${learningPct}%)`}
            style={{ width: `${learningPct}%` }}
            className="bg-indigo-500 h-full transition-all duration-300"
          />
        )}
        {mastered > 0 && (
          <div
            title={`Mastered: ${mastered} (${masteredPct}%)`}
            style={{ width: `${masteredPct}%` }}
            className="bg-emerald-500 h-full transition-all duration-300"
          />
        )}
      </div>

      {/* Legend & Count details */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md border border-rule bg-raised/50 p-2">
          <div className="flex items-center justify-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Due</span>
          </div>
          <p className="font-mono text-base font-bold text-ink mt-0.5">{due}</p>
          <p className="text-[10px] text-mute">{duePct}%</p>
        </div>

        <div className="rounded-md border border-rule bg-raised/50 p-2">
          <div className="flex items-center justify-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>Learning</span>
          </div>
          <p className="font-mono text-base font-bold text-ink mt-0.5">{learning}</p>
          <p className="text-[10px] text-mute">{learningPct}%</p>
        </div>

        <div className="rounded-md border border-rule bg-raised/50 p-2">
          <div className="flex items-center justify-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Mastered</span>
          </div>
          <p className="font-mono text-base font-bold text-ink mt-0.5">{mastered}</p>
          <p className="text-[10px] text-mute">{masteredPct}%</p>
        </div>
      </div>
    </div>
  );
}

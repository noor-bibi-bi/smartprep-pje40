"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";

export interface AttemptDataPoint {
  id: string;
  quizTitle: string;
  score: number;
  total: number;
  percentage: number;
  createdAt: string;
}

interface ScoreTrendChartProps {
  attempts: AttemptDataPoint[];
}

export function ScoreTrendChart({ attempts }: ScoreTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Take the last 15 attempts sorted chronologically
  const sorted = useMemo(() => {
    return [...attempts]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-15);
  }, [attempts]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-rule bg-paper p-8 text-center">
        <TrendingUp size={28} className="mx-auto mb-2 text-mute" />
        <p className="text-sm font-medium text-ink">No quiz attempt data yet</p>
        <p className="mt-1 text-xs text-mute">Take a quiz to visualize your score progression.</p>
      </div>
    );
  }

  // Chart dimensions
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Compute points
  const points = sorted.map((att, idx) => {
    const x =
      sorted.length === 1
        ? paddingX + chartW / 2
        : paddingX + (idx / (sorted.length - 1)) * chartW;
    const y = paddingY + chartH - (att.percentage / 100) * chartH;
    return { x, y, ...att };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Area under line
  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${paddingY + chartH} L ${points[0].x} ${
          paddingY + chartH
        } Z`
      : "";

  const hovered = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="rounded-xl border border-rule bg-paper p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-accent" />
          <h3 className="font-display text-base font-bold text-ink">Score Performance Trend</h3>
        </div>
        <span className="font-mono text-xs text-mute">Last {sorted.length} attempts</span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Y Axis Guide Lines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = paddingY + chartH - (pct / 100) * chartH;
            return (
              <g key={pct}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-rule-soft"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-mute font-mono text-[10px]"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && (
            <path
              d={areaD}
              fill="currentColor"
              className="text-accent/10"
            />
          )}

          {/* Trend line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="currentColor"
              className="text-accent"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {points.map((p, idx) => (
            <g
              key={p.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === idx ? 6 : 4}
                className="fill-paper stroke-accent transition-all duration-150"
                strokeWidth={hoveredIndex === idx ? 3 : 2}
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hovered && (
          <div
            className="pointer-events-none absolute top-2 rounded-md border border-rule bg-raised px-2.5 py-1.5 shadow-md text-xs font-sans transition-all"
            style={{
              left: `${(hovered.x / width) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-semibold text-ink truncate max-w-[150px]">{hovered.quizTitle}</p>
            <p className="font-mono text-accent font-bold">
              {hovered.score}/{hovered.total} ({hovered.percentage}%)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

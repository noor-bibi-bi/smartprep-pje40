import { Check } from "lucide-react";

/**
 * Signature element per docs/STYLE.md: a dense typographic spec sheet listing
 * exactly what the product does — real data, no invented statistics.
 */
const SPEC_ROWS = [
  ["Input", "PDF (up to 4.5 MB) or pasted notes; PDFs are parsed in server memory, not stored"],
  ["Output", "Choose 3–20 multiple-choice questions, with four options each"],
  ["Difficulty", "Easy, medium or hard"],
  ["Generation", "Groq GPT-OSS 120B, GPT-OSS 20B fallback, or the offline generator"],
  ["Review", "Edit questions before saving; take scored quizzes with explanations"],
  ["Flashcards", "SM-2 spaced-repetition reviews"],
  ["Dashboard", "Private account study sets, module tags, attempt and mastery analytics"],
  ["Printing", "Printable exam sheets with optional answer keys and explanations"],
  ["Privacy", "Study-set records are isolated by Row-Level Security"],
] as const;

export function SpecTable() {
  return (
    <section className="container-sheet mt-20 sm:mt-28">
      <p className="exam-label mb-3">The spec sheet</p>
      <h2 className="font-display text-title text-ink">Exactly what you get</h2>

      <dl className="mt-8 overflow-hidden rounded-md border border-rule">
        {SPEC_ROWS.map(([label, value], index) => (
          <div
            key={label}
            className={`grid grid-cols-1 gap-1 bg-raised px-5 py-4 sm:grid-cols-12 sm:gap-6 sm:px-7 ${
              index !== SPEC_ROWS.length - 1 ? "border-b border-rule-soft" : ""
            }`}
          >
            <dt className="font-mono text-label uppercase text-mute sm:col-span-3 sm:pt-1">
              {label}
            </dt>
            <dd className="flex items-start gap-2 text-[0.95rem] text-ink sm:col-span-9">
              <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-success" />
              <span>{value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

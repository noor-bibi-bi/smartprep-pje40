import { ArrowRight, Zap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="container-sheet pt-14 sm:pt-20 lg:pt-24">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="exam-label mb-5 flex items-center gap-2">
            <Zap size={13} aria-hidden className="text-accent" />
            Powered by Groq AI
          </p>
          <h1 className="text-display font-normal text-ink">
            Turn PDFs and notes into study sets in seconds
          </h1>
          <p className="mt-6 max-w-measure text-body text-mute">
            Generate multiple-choice questions with explanations from a PDF or
            pasted notes, then edit them before saving. A free account is
            required; your study sets stay private in your account under
            Row-Level Security.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            {isAuthenticated ? (
              <>
                <ButtonLink href="/dashboard" size="lg">
                  Go to dashboard
                  <ArrowRight size={18} aria-hidden />
                </ButtonLink>
                <ButtonLink href="/create" variant="secondary" size="lg">
                  Create a study set
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href="/signup" size="lg">
                  Create free account
                  <ArrowRight size={18} aria-hidden />
                </ButtonLink>
                <ButtonLink href="/login" variant="secondary" size="lg">
                  Sign in
                </ButtonLink>
              </>
            )}
          </div>
          <p className="mt-5 font-mono text-label uppercase text-mute">
            Create a free account · PDFs parsed in memory, not stored
          </p>
        </div>

        {/* Signature element: a miniature exam sheet, rendered honestly with type */}
        <div className="lg:col-span-5">
          <ExamSheetPreview />
        </div>
      </div>
    </section>
  );
}

function ExamSheetPreview() {
  const rows = [
    { n: "01", text: "Define the primary claim of the document", mark: "A" },
    { n: "02", text: "Identify the method used in the study", mark: "B" },
    { n: "03", text: "Explain the result in one sentence", mark: "C" },
  ];

  return (
    <div
      aria-hidden
      className="animate-slide-up rounded-md border border-rule bg-raised shadow-float"
    >
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <span className="font-mono text-label uppercase text-mute">
          Multiple-choice exam
        </span>
        <span className="font-mono text-label uppercase text-accent">Easy</span>
      </div>
      <ol>
        {rows.map((row) => (
          <li
            key={row.n}
            className="flex items-center gap-4 border-b border-rule-soft px-5 py-4 last:border-b-0"
          >
            <span className="font-mono text-sm text-mute tabular">{row.n}</span>
            <span className="flex-1 text-sm text-ink">{row.text}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-rule font-mono text-xs text-mute">
              {row.mark}
            </span>
          </li>
        ))}
      </ol>
      <div className="px-5 py-4">
        <div className="h-1.5 w-full overflow-hidden rounded-sm bg-rule-soft">
          <div className="h-full w-2/3 bg-accent" />
        </div>
        <p className="mt-3 font-mono text-label uppercase text-mute">
          Score 7 / 10 · review with explanations
        </p>
      </div>
    </div>
  );
}

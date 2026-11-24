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
            required to use SmartPrep; saved study sets stay private in your
            own account.
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
            PDFs parsed in server memory · Original files not stored
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
  const questions = [
    {
      n: "01",
      text: "Which pigment absorbs light energy for photosynthesis?",
      options: ["Chlorophyll", "Cellulose", "Glucose", "Oxygen"],
      correctIndex: 0,
    },
    {
      n: "02",
      text: "Where does the Calvin cycle take place?",
      options: ["Thylakoid membrane", "Stroma", "Cytoplasm", "Mitochondrial matrix"],
      correctIndex: 1,
    },
    {
      n: "03",
      text: "Which gas is released during photosynthesis?",
      options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Methane"],
      correctIndex: 2,
    },
  ];

  return (
    <section
      aria-label="Sample photosynthesis quiz"
      className="animate-slide-up rounded-md border border-rule bg-raised shadow-float"
    >
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <span className="font-mono text-label uppercase text-mute">
          Sample
        </span>
        <span className="font-mono text-label uppercase text-accent">Easy</span>
      </div>
      <ol>
        {questions.map((question) => (
          <li
            key={question.n}
            className="border-b border-rule-soft px-5 py-4 last:border-b-0"
          >
            <div className="flex items-start gap-3">
              <span className="font-mono text-sm text-mute tabular">{question.n}</span>
              <p className="flex-1 text-sm text-ink">{question.text}</p>
            </div>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {question.options.map((option, index) => {
                const isCorrect = index === question.correctIndex;

                return (
                  <li
                    key={option}
                    className={`flex items-center gap-2 rounded-sm border px-2 py-1.5 text-xs ${
                      isCorrect
                        ? "border-success/40 bg-success/10 text-ink"
                        : "border-rule-soft text-mute"
                    }`}
                  >
                    <span className="font-mono">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {isCorrect && (
                      <span className="font-semibold text-success">Correct</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <div className="px-5 py-3">
        <p className="font-mono text-label uppercase text-mute">
          Correct answers marked
        </p>
      </div>
    </section>
  );
}

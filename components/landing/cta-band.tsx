import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function CtaBand({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="container-sheet mt-20 sm:mt-28">
      <div className="rounded-md border border-rule bg-raised px-6 py-12 text-center sm:px-12 sm:py-16">
        <p className="exam-label mb-4">Ready when you are</p>
        <h2 className="mx-auto max-w-measure font-display text-title text-ink">
          Make every study session count
        </h2>
        <p className="mx-auto mt-4 max-w-measure text-mute">
          {isAuthenticated
            ? "Build private study sets from PDFs or pasted notes, then practice with scored quizzes and SM-2 spaced-repetition flashcards."
            : "A free account is required to create and save private study sets from PDFs or pasted notes, then practice with scored quizzes and SM-2 spaced-repetition flashcards."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
      </div>
    </section>
  );
}

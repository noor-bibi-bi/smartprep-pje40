import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How SmartPrep handles account, study-set, quiz, and flashcard data.",
};

export default function PrivacyPage() {
  return (
    <main className="container-sheet py-10 sm:py-14">
      <article className="max-w-measure">
        <p className="exam-label mb-3">Privacy</p>
        <h1 className="font-display text-title text-ink">Privacy notice</h1>
        <p className="mt-4 text-mute">
          SmartPrep is a PJE40 university project. This notice explains what
          information the study app uses and where it goes.
        </p>

        <div className="mt-8 space-y-8">
          <section className="space-y-3">
            <h2 className="font-display text-heading text-ink">
              Information the app uses
            </h2>
            <ul className="list-disc space-y-2 pl-6 text-mute">
              <li>
                Account information: your email address and display name.
                Supabase Auth handles your sign-in credentials.
              </li>
              <li>
                Saved study sets: their title, optional module tag, source type,
                difficulty, generated questions, answer choices, correct
                answers, and explanations.
              </li>
              <li>
                Quiz attempts: the answers you selected, your score, the total
                questions, and the attempt date. A duration may also be saved.
              </li>
              <li>
                Flashcard progress: review intervals, repetition counts, ease
                factors, and the dates cards are due or were last reviewed.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-heading text-ink">
              Why it is used
            </h2>
            <p className="text-mute">
              This information runs the study app: it lets you save and reopen
              study sets, take and score quizzes, review flashcards, and see
              your study progress.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-heading text-ink">
              Where information is stored and processed
            </h2>
            <p className="text-mute">
              Supabase Auth manages account information. Supabase stores your
              profile, saved study sets, quiz attempts, and flashcard progress.
              The database uses Row-Level Security to restrict each user&apos;s
              records to their own account.
            </p>
            <p className="text-mute">
              Uploaded PDFs are parsed in server memory; the PDF files are not
              stored. Extracted text is not saved as a study-set record. When
              cloud generation runs, up to 24,000 characters of extracted or
              pasted study text are sent to Groq to generate questions. If you
              choose the offline generator, it generates questions without
              sending that text to Groq.
            </p>
            <p className="text-mute">
              If saving a study set to Supabase fails because of a network or
              server problem, SmartPrep can queue the generated set in this
              browser&apos;s local storage so it can be synced later from your
              dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-heading text-ink">
              Account and data deletion
            </h2>
            <p className="text-mute">
              To request deletion of your account and its associated data,
              contact{" "}
              <a
                href="mailto:Hassanadeel2803@gmail.com"
                className="font-medium text-ink underline hover:text-ink/80"
              >
                Hassanadeel2803@gmail.com
              </a>
              .
            </p>
          </section>

          <p className="border-t border-rule pt-5 text-sm text-mute">
            SmartPrep is a PJE40 university project.
          </p>
        </div>
      </article>
    </main>
  );
}

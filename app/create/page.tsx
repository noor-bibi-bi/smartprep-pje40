import type { Metadata } from "next";
import { CreateQuizClient } from "@/components/create/create-quiz-client";

export const metadata: Metadata = { title: "New quiz" };

export default function CreatePage() {
  return (
    <main className="container-sheet py-10 sm:py-14">
      <header className="mb-10 max-w-measure">
        <p className="exam-label mb-2">New exam sheet</p>
        <h1 className="font-display text-title text-ink">Create a study set</h1>
        <p className="mt-3 text-mute">
          Upload a PDF or paste notes to generate editable questions. PDFs are
          parsed in server memory and not stored. A free account is required;
          saved study sets are private to your account under Row-Level Security.
        </p>
      </header>
      <CreateQuizClient />
    </main>
  );
}

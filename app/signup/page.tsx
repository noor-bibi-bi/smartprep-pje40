import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create an account — SmartPrep",
  description: "Sign up for SmartPrep to generate AI-assisted quizzes and spaced-repetition study sets.",
};

export default function SignupPage() {
  return (
    <div className="container-sheet py-12 sm:py-20">
      <div className="mx-auto max-w-md rounded-lg border border-rule bg-paper p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-1 text-center">
          <p className="font-mono text-label uppercase text-mute">Get Started</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Create your account
          </h1>
          <p className="text-sm text-mute">
            Turn your lecture notes and PDFs into active recall study sets.
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  );
}

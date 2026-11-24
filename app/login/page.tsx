import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in — SmartPrep",
  description: "Sign in to access your study sets, quizzes, and spaced-repetition flashcards.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <div className="container-sheet py-12 sm:py-20">
      <div className="mx-auto max-w-md rounded-lg border border-rule bg-paper p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-1 text-center">
          <p className="font-mono text-label uppercase text-mute">Account Access</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Welcome back
          </h1>
          <p className="text-sm text-mute">
            Sign in to your SmartPrep account to continue your revisions.
          </p>
        </div>

        <LoginForm nextPath={next} />
      </div>
    </div>
  );
}

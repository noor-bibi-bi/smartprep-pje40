"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, UserPlus } from "lucide-react";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signup(null, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-danger/40 bg-danger/10 p-3.5 text-sm text-danger"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Your name or handle</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          placeholder="Noor"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="student@university.ac.uk"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="At least 6 characters"
          disabled={isPending}
        />
        <p className="text-xs text-mute">Minimum 6 characters.</p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Spinner size="sm" />
            Creating account…
          </>
        ) : (
          <>
            <UserPlus size={18} aria-hidden />
            Sign up
          </>
        )}
      </Button>

      <p className="text-center text-sm text-mute">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline hover:text-ink/80">
          Sign in instead
        </Link>
      </p>
    </form>
  );
}

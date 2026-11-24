"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { login } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, LogIn } from "lucide-react";

interface LoginFormProps {
  nextPath?: string;
}

export function LoginForm({ nextPath = "/dashboard" }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await login(null, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          disabled={isPending}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Spinner size="sm" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn size={18} aria-hidden />
            Sign in
          </>
        )}
      </Button>

      <p className="text-center text-sm text-mute">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-ink underline hover:text-ink/80">
          Create one now
        </Link>
      </p>
    </form>
  );
}

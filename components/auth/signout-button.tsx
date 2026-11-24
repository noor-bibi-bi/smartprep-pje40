"use client";

import { useTransition } from "react";
import { signout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface SignOutButtonProps {
  className?: string;
  variant?: "ghost" | "secondary" | "primary" | "danger";
  size?: "md" | "lg";
}

export function SignOutButton({
  className,
  variant = "ghost",
  size = "md",
}: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signout();
        });
      }}
      aria-label="Sign out"
    >
      {isPending ? (
        <Spinner size="sm" />
      ) : (
        <LogOut size={16} aria-hidden />
      )}
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}

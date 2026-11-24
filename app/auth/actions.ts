"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  error?: string;
}

export async function login(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const requestedNext = (formData.get("next") as string) || "/dashboard";
  const next = isSafeRedirect(requestedNext) ? requestedNext : "/dashboard";

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = (formData.get("displayName") as string) || "";

  if (!email || !password) {
    return { error: "Please provide both email and password." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || splitEmail(email),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

function splitEmail(email: string): string {
  return email.split("@")[0] || "Student";
}

function isSafeRedirect(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return (
    path === "/dashboard" ||
    path === "/create" ||
    path.startsWith("/quiz/")
  );
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface SaveStudySetPayload {
  title: string;
  module_tag?: string | null;
  source_type: "pdf" | "text";
  difficulty: "easy" | "medium" | "hard";
  engine_used: "cloud" | "offline";
  questions: Array<{
    question_text: string;
    options: string[];
    correct_index: number;
    explanation: string;
    position?: number;
  }>;
}

export interface SaveStudySetResult {
  success: boolean;
  quizId?: string;
  error?: string;
  isNetworkOrServerError?: boolean;
}

export async function saveStudySetAction(
  payload: SaveStudySetPayload,
): Promise<SaveStudySetResult> {
  try {
    const title = payload.title?.trim();
    if (!title || title.length > 200) {
      return { success: false, error: "Study set title must be 1 to 200 characters." };
    }
    if (payload.module_tag && payload.module_tag.trim().length > 100) {
      return { success: false, error: "Module tag must be 100 characters or fewer." };
    }

    const questionValidation = z
      .array(
        z.object({
          question_text: z.string().trim().min(5).max(1000),
          options: z.array(z.string().trim().min(1).max(500)).length(4),
          correct_index: z.number().int().min(0).max(3),
          explanation: z.string().trim().max(2000),
          position: z.number().int().min(0).optional(),
        }),
      )
      .min(3)
      .max(25)
      .safeParse(payload.questions);

    if (!questionValidation.success) {
      return {
        success: false,
        error: "The study set contains invalid questions or answers.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "You must be signed in to save study sets.",
        isNetworkOrServerError: false,
      };
    }

    if (!payload.questions || payload.questions.length === 0) {
      return {
        success: false,
        error: "At least one question is required.",
      };
    }

    // 1. Insert quiz row
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        title: payload.title.trim() || "Untitled Study Set",
        module_tag: payload.module_tag?.trim() || null,
        source_type: payload.source_type,
        difficulty: payload.difficulty,
        engine_used: payload.engine_used,
      })
      .select("id")
      .single();

    if (quizError || !quiz) {
      console.error("Save quiz error:", quizError);
      return {
        success: false,
        error: quizError?.message || "Failed to create study set record.",
        isNetworkOrServerError: true,
      };
    }

    // 2. Insert question rows
    const questionRows = payload.questions.map((q, index) => ({
      quiz_id: quiz.id,
      user_id: user.id,
      position: q.position ?? index,
      question_text: q.question_text.trim(),
      options: q.options.map((opt) => opt.trim()),
      correct_index: q.correct_index,
      explanation: q.explanation?.trim() || null,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      next_review_at: new Date().toISOString(),
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionRows);

    if (questionsError) {
      console.error("Save questions error:", questionsError);
      return {
        success: false,
        error: questionsError.message,
        isNetworkOrServerError: true,
      };
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      quizId: quiz.id,
    };
  } catch (err: unknown) {
    console.error("Unexpected save error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Connection failed.",
      isNetworkOrServerError: true,
    };
  }
}

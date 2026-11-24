"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateSM2 } from "@/lib/sm2";
import { revalidatePath } from "next/cache";

export interface RecordAttemptPayload {
  quizId: string;
  score: number;
  total: number;
  durationSeconds?: number;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }>;
}

export async function recordAttemptAction(payload: RecordAttemptPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", payload.quizId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (quizError || !quiz) {
      return { success: false, error: "Study set not found" };
    }

    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id, options, correct_index")
      .eq("quiz_id", payload.quizId)
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    if (questionsError || !questions || questions.length === 0) {
      return { success: false, error: "Study set questions not found" };
    }

    const questionById = new Map(questions.map((question) => [question.id, question]));
    const verifiedAnswers = payload.answers.map((answer) => {
      const question = questionById.get(answer.questionId);
      const isCorrect =
        question !== undefined &&
        typeof answer.selectedAnswer === "string" &&
        answer.selectedAnswer === question.options[question.correct_index];

      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
      };
    });

    const score = verifiedAnswers.filter((answer) => answer.isCorrect).length;
    const total = questions.length;

    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        quiz_id: payload.quizId,
        score,
        total,
        duration_seconds: payload.durationSeconds ?? null,
        answers: verifiedAnswers,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Record attempt error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, attemptId: data.id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to record attempt" };
  }
}

export interface ReviewCardPayload {
  questionId: string;
  quality: number; // 0..5
}

export async function reviewFlashcardAction(payload: ReviewCardPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // 1. Fetch current question SM-2 state
    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("id, ease_factor, interval_days, repetitions, user_id")
      .eq("id", payload.questionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !question) {
      return { success: false, error: "Question not found" };
    }

    // 2. Calculate updated SM-2 parameters
    const nextSM2 = calculateSM2({
      quality: payload.quality,
      repetitions: question.repetitions,
      ease_factor: question.ease_factor,
      interval_days: question.interval_days,
      now: new Date(),
    });

    // 3. Persist back to question row
    const { error: updateError } = await supabase
      .from("questions")
      .update({
        ease_factor: nextSM2.ease_factor,
        interval_days: nextSM2.interval_days,
        repetitions: nextSM2.repetitions,
        next_review_at: nextSM2.next_review_at,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", question.id)
      .eq("user_id", user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/quiz`);
    return { success: true, sm2: nextSM2 };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update card" };
  }
}

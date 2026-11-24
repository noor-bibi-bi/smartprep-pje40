import { z } from "zod";

export const generatedQuestionSchema = z.object({
  question_text: z.string().min(5, "Question text must be at least 5 characters long"),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .length(4, "Must have exactly 4 options"),
  correct_index: z.number().int().min(0).max(3),
  explanation: z.string().default(""),
});

export const quizGeneratedPayloadSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1, "Must contain at least 1 question"),
  engine_used: z.enum(["cloud", "offline"]),
});

export type GeneratedQuestionItem = z.infer<typeof generatedQuestionSchema>;
export type QuizGeneratedPayload = z.infer<typeof quizGeneratedPayloadSchema>;

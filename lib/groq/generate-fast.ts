import type { GeneratedQuestionItem } from "@/lib/quizSchema";
import type { Difficulty } from "@/lib/types";
import { getGroqClient, PRIMARY_MODEL, FALLBACK_MODEL } from "@/lib/groq/client";
import { SYSTEM_PROMPT, buildUserPrompt, truncateForModel } from "@/lib/groq/prompts";
import { parseQuizResponse } from "@/lib/quiz/parser";

const GROQ_TIMEOUT_MS = 25_000;
const MAX_TOKENS = 2_500;

export class CloudGenerationTimeoutError extends Error {
  constructor(message = "Cloud AI generation exceeded 12-second timeout") {
    super(message);
    this.name = "CloudGenerationTimeoutError";
  }
}

/**
 * Generates questions using Groq cloud LLM with a 12-second timeout.
 * Rejects with CloudGenerationTimeoutError if the deadline is exceeded.
 */
export async function generateCloudQuestions(
  text: string,
  difficulty: Difficulty,
  count = 10,
): Promise<GeneratedQuestionItem[]> {
  const client = getGroqClient();
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new CloudGenerationTimeoutError());
  }, GROQ_TIMEOUT_MS);

  try {
    let completion;
    try {
      completion = await client.chat.completions.create(
        {
          model: PRIMARY_MODEL,
          temperature: 0.6,
          max_tokens: MAX_TOKENS,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: buildUserPrompt(truncateForModel(text), difficulty, count, false),
            },
          ],
        },
        { signal: controller.signal },
      );
    } catch (primaryErr: unknown) {
      // If primary model fails (e.g. model decommissioned or busy), try fallback model
      if (primaryErr instanceof Error && primaryErr.name === "AbortError") {
        throw primaryErr;
      }
      completion = await client.chat.completions.create(
        {
          model: FALLBACK_MODEL,
          temperature: 0.6,
          max_tokens: MAX_TOKENS,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: buildUserPrompt(truncateForModel(text), difficulty, count, false),
            },
          ],
        },
        { signal: controller.signal },
      );
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No completion content returned by cloud model");
    }

    const parsed = parseQuizResponse(content, count);
    if (!parsed.ok) {
      throw new Error(`Cloud model returned invalid JSON: ${parsed.reason}`);
    }

    const cleanOpt = (s: string) => s.replace(/^[A-Da-d][).:-]\s*/, "").trim().toLowerCase();

    // Convert parser format (with string correct_answer) to schema-conforming items (correct_index)
    return parsed.questions.slice(0, count).map((q) => {
      const cleanAns = cleanOpt(q.correct_answer);
      let originalIdx = q.options.indexOf(q.correct_answer);
      if (originalIdx === -1) {
        originalIdx = q.options.findIndex((opt) => cleanOpt(opt) === cleanAns);
      }
      if (originalIdx === -1) {
        const letterMatch = q.correct_answer.match(/^[A-Da-d]$/);
        if (letterMatch) {
          originalIdx = letterMatch[0].toUpperCase().charCodeAt(0) - 65;
        }
      }
      if (originalIdx === -1 || originalIdx >= q.options.length) {
        originalIdx = 0;
      }

      // Clean prefix "A) ", "B. ", etc. from option strings
      const cleanedOptions = q.options.map((opt) => opt.replace(/^[A-Da-d][).:-]\s*/, "").trim());

      // Fisher-Yates shuffle options so the correct answer is uniformly distributed across A, B, C, D
      const indexed = cleanedOptions.map((opt, i) => ({ opt, isCorrect: i === originalIdx }));
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
      }

      const shuffledOptions = indexed.map((x) => x.opt);
      const correctIndex = indexed.findIndex((x) => x.isCorrect);

      return {
        question_text: q.question_text,
        options: shuffledOptions,
        correct_index: correctIndex >= 0 ? correctIndex : 0,
        explanation: q.explanation || "",
      };
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new CloudGenerationTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

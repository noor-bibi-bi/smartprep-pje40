import { apiError, newCorrelationId, okJson, toErrorDetail } from "@/lib/api-utils";
import { difficultySchema, MAX_PDF_BYTES } from "@/lib/validation";
import { extractPdfText, isPdfBytes } from "@/lib/pdf/extract";
import { generateCloudQuestions, CloudGenerationTimeoutError } from "@/lib/groq/generate-fast";
import { generateOfflineQuiz } from "@/lib/offlineQuizGenerator";
import { quizGeneratedPayloadSchema } from "@/lib/quizSchema";
import type { GeneratedQuestionItem } from "@/lib/quizSchema";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const correlationId = newCorrelationId();

  try {
    const ip = getClientIp(request.headers);
    const limit = rateLimit(`generate:${ip}`, 8, 60_000);
    if (!limit.allowed) {
      return apiError(
        "RATE_LIMITED",
        "Too many quiz generations. Please wait before trying again.",
        correlationId,
        undefined,
        `Retry in ${limit.retryAfterSeconds} seconds`,
      );
    }

    let text = "";
    let difficulty: "easy" | "medium" | "hard" = "medium";
    let preferredEngine: "cloud" | "offline" | "auto" = "auto";
    let questionCount = 10;
    let fileName = "Study Notes";
    let salt: number | string = Math.random();

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const diffVal = form.get("difficulty");
      const diffParsed = difficultySchema.safeParse(diffVal);
      if (diffParsed.success) {
        difficulty = diffParsed.data;
      }

      const saltVal = form.get("salt");
      if (saltVal) {
        salt = String(saltVal);
      }

      const engineVal = form.get("engine");
      if (engineVal === "cloud" || engineVal === "offline") {
        preferredEngine = engineVal;
      }

      const countVal = Number(form.get("count"));
      if (countVal >= 3 && countVal <= 25) {
        questionCount = countVal;
      }

      // Check if text was pasted directly or if a PDF file was uploaded
      const pastedText = form.get("text");
      const file = form.get("pdf");

      if (typeof pastedText === "string" && pastedText.trim().length > 0) {
        text = pastedText.trim();
        fileName = (form.get("title") as string) || "Pasted Notes";
      } else if (file instanceof File) {
        fileName = file.name;
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          return apiError("INVALID_FILE_TYPE", "Only PDF documents are accepted.", correlationId);
        }
        if (file.size === 0) {
          return apiError("VALIDATION_ERROR", "The uploaded file is empty.", correlationId);
        }
        if (file.size > MAX_PDF_BYTES) {
          return apiError("FILE_TOO_LARGE", "File too large. Maximum size is 4.5MB.", correlationId);
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        if (!isPdfBytes(bytes)) {
          return apiError("INVALID_FILE_TYPE", "The file is not a valid PDF document.", correlationId);
        }

        try {
          text = await extractPdfText(bytes);
        } catch (err) {
          return apiError(
            "VALIDATION_ERROR",
            "The PDF could not be read. It may be scanned images or corrupted.",
            correlationId,
            undefined,
            toErrorDetail(err),
          );
        }
      } else {
        return apiError("VALIDATION_ERROR", "Either a PDF file or text content is required.", correlationId);
      }
    } else if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      if (!body) {
        return apiError("VALIDATION_ERROR", "Invalid JSON payload.", correlationId);
      }
      text = typeof body.text === "string" ? body.text : "";
      fileName = typeof body.title === "string" ? body.title : "Study Set";
      if (body.difficulty && difficultySchema.safeParse(body.difficulty).success) {
        difficulty = body.difficulty;
      }
      if (body.engine === "cloud" || body.engine === "offline") {
        preferredEngine = body.engine;
      }
      if (body.count >= 3 && body.count <= 25) {
        questionCount = Number(body.count);
      }
      if (body.salt !== undefined) {
        salt = body.salt;
      }
    } else {
      return apiError("VALIDATION_ERROR", "Unsupported Content-Type.", correlationId);
    }

    if (text.length > 100_000) {
      return apiError(
        "VALIDATION_ERROR",
        "The study text is too large. Please provide 100,000 characters or fewer.",
        correlationId,
      );
    }

    if (!text || text.trim().length < 40) {
      return apiError(
        "EMPTY_PDF",
        "The document contains too little readable text to generate a quiz. Please paste more text or choose a clearer PDF.",
        correlationId,
      );
    }

    let questions: GeneratedQuestionItem[] = [];
    let engineUsed: "cloud" | "offline" = "offline";
    let fallbackNotice: string | undefined;

    // Dual-engine generator pipeline
    if (preferredEngine === "offline") {
      questions = generateOfflineQuiz(text, questionCount, { difficulty, salt });
      engineUsed = "offline";
    } else {
      // Try Cloud Groq with timeout first
      try {
        questions = await generateCloudQuestions(text, difficulty, questionCount);
        engineUsed = "cloud";
      } catch (err) {
        console.warn(`[${correlationId}] Cloud generation failed or timed out. Falling back to offline engine:`, err);
        // Fallback gracefully to offline generator
        questions = generateOfflineQuiz(text, questionCount, { difficulty, salt });
        engineUsed = "offline";
        if (err instanceof CloudGenerationTimeoutError) {
          fallbackNotice = "Cloud AI took longer than 25 seconds — generated offline from your text instead.";
        } else {
          fallbackNotice = "Cloud AI is temporarily unavailable — questions generated instantly via offline engine.";
        }
      }
    }

    // Ensure questions pass the shared schema
    const payloadValidation = quizGeneratedPayloadSchema.safeParse({
      questions,
      engine_used: engineUsed,
    });

    if (!payloadValidation.success) {
      // If validation fails, try a clean offline generation
      questions = generateOfflineQuiz(text, questionCount, { difficulty, salt });
      engineUsed = "offline";
    }

    return okJson({
      title: fileName.replace(/\.pdf$/i, ""),
      questions,
      engine_used: engineUsed,
      fallback_notice: fallbackNotice,
      extracted_char_count: text.length,
    });
  } catch (error) {
    console.error(`[${correlationId}] Unexpected generate-quiz error:`, error);
    return apiError(
      "INTERNAL_ERROR",
      "Something went wrong while generating questions.",
      correlationId,
      undefined,
      toErrorDetail(error),
    );
  }
}

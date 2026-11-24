import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { extractPdfText } from "@/lib/pdf/extract";
import { generateOfflineQuiz } from "@/lib/offlineQuizGenerator";
import { generatedQuestionSchema } from "@/lib/quizSchema";
import { calculateSM2 } from "@/lib/sm2";

describe("Hardening & End-to-End Pipeline", () => {
  const pdfPath = path.resolve(process.cwd(), "tests", "fixtures", "sample.pdf");

  it("successfully reads and parses text from the committed sample PDF", async () => {
    expect(fs.existsSync(pdfPath)).toBe(true);
    const buffer = fs.readFileSync(pdfPath);
    expect(buffer.length).toBeGreaterThan(500);

    const extracted = await extractPdfText(new Uint8Array(buffer));
    expect(extracted.length).toBeGreaterThan(100);
    expect(extracted.trim().length).toBeGreaterThan(100);
  });

  it("generates a 10-question offline study set complying with Zod schema", async () => {
    const buffer = fs.readFileSync(pdfPath);
    const extracted = await extractPdfText(new Uint8Array(buffer));

    const questions = generateOfflineQuiz(extracted, 10);

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(10);

    for (const q of questions) {
      const parsed = generatedQuestionSchema.safeParse(q);
      expect(parsed.success).toBe(true);
      expect(q.options.length).toBe(4);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThanOrEqual(3);
      expect(q.options[q.correct_index]).toBeTruthy();
    }
  });

  it("accurately generates larger question counts (15 and 20) with complete sentences", async () => {
    const buffer = fs.readFileSync(pdfPath);
    const extracted = await extractPdfText(new Uint8Array(buffer));

    const questions15 = generateOfflineQuiz(extracted, 15, { difficulty: "hard" });
    expect(questions15.length).toBeGreaterThan(0);
    expect(questions15.length).toBeLessThanOrEqual(15);

    const questions20 = generateOfflineQuiz(extracted, 20, { difficulty: "medium" });
    expect(questions20.length).toBeGreaterThan(0);
    expect(questions20.length).toBeLessThanOrEqual(20);

    // Verify sentences are complete (end with terminal punctuation, not cut off)
    for (const q of questions20) {
      expect(q.question_text).toMatch(/[.?!]["']?\s*$/);
      // Blank is not at the very end
      expect(q.question_text).not.toMatch(/_______\s*["']?\s*$/);
    }
  });

  it("handles edge cases: empty input, short notes, and invalid PDF buffers gracefully", async () => {
    // 1. Empty text to offline generator throws or returns empty
    const emptyResult = generateOfflineQuiz("", 5);
    expect(emptyResult.length).toBe(0);

    // 2. Short text returns whatever is extractable or empty
    const shortResult = generateOfflineQuiz("Too short.", 5);
    expect(Array.isArray(shortResult)).toBe(true);

    // 3. Invalid PDF buffer throws or rejects rather than hangs
    const invalidBuffer = new Uint8Array(Buffer.from("Not a real PDF file contents"));
    await expect(extractPdfText(invalidBuffer)).rejects.toThrow();
  });

  it("simulates full SM-2 repetition progression across all questions", () => {
    // Simulate user reviewing questions with quality grades (Again=0, Hard=3, Good=4, Easy=5)
    let state = {
      repetitions: 0,
      interval_days: 0,
      ease_factor: 2.5,
    };

    // Review 1: Good (4)
    state = calculateSM2({ quality: 4, ...state });
    expect(state.repetitions).toBe(1);
    expect(state.interval_days).toBe(1);

    // Review 2: Easy (5)
    state = calculateSM2({ quality: 5, ...state });
    expect(state.repetitions).toBe(2);
    expect(state.interval_days).toBe(6);
    expect(state.ease_factor).toBeGreaterThan(2.5);

    // Review 3: Again (0) -> reset repetition count and interval
    state = calculateSM2({ quality: 0, ...state });
    expect(state.repetitions).toBe(0);
    expect(state.interval_days).toBe(1);
    expect(state.ease_factor).toBeGreaterThanOrEqual(1.3);
  });
});

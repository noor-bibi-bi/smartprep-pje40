import { describe, it, expect } from "vitest";
import { generateOfflineQuiz } from "@/lib/offlineQuizGenerator";
import { quizGeneratedPayloadSchema } from "@/lib/quizSchema";

const SAMPLE_TEXT = `
Cell biology is the study of cell structure and function, and it revolves around the concept that the cell is the fundamental unit of life.
Focusing on the cell allows a detailed understanding of the tissues and organisms that cells compose.
Some organisms have only one cell, while others are organized into cooperative groups with huge numbers of cells.
On the whole, cell biology focuses on the structure and function of a cell, from the most general properties shared by all cells, to the unique, highly intricate functions particular to specialized cells.
The starting point for this discipline might be considered the 1830s.
Though scientists had been using microscopes for centuries, they were not always sure what they were looking at.
Robert Hooke's initial observation in 1665 of plant-cell walls in slices of cork was followed shortly by Antonie van Leeuwenhoek's first descriptions of live cells with visibly moving parts.
In the 1830s two scientists who were colleagues — Matthias Schleiden, looking at plant cells, and Theodor Schwann, looking first at animal cells — provided the first clearly stated definition of the cell.
Their definition stated that that all living creatures, both simple and complex, are made out of one or more cells, and the cell is the structural and functional unit of life.
The internal components of cells include organelles such as mitochondria, which generate energy, and the nucleus, which stores genetic material.
`;

describe("Offline Quiz Generator", () => {
  it("generates questions that adhere strictly to quizGeneratedPayloadSchema", () => {
    const questions = generateOfflineQuiz(SAMPLE_TEXT, 5);
    expect(questions.length).toBeGreaterThanOrEqual(1);

    const validation = quizGeneratedPayloadSchema.safeParse({
      questions,
      engine_used: "offline",
    });

    expect(validation.success).toBe(true);
  });

  it("produces deterministic output for the same input", () => {
    const run1 = generateOfflineQuiz(SAMPLE_TEXT, 5);
    const run2 = generateOfflineQuiz(SAMPLE_TEXT, 5);

    expect(run1).toEqual(run2);
  });

  it("ensures every question has exactly 4 options and valid correct_index", () => {
    const questions = generateOfflineQuiz(SAMPLE_TEXT, 5);

    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThanOrEqual(3);
      expect(typeof q.options[q.correct_index]).toBe("string");
      expect(q.options[q.correct_index].length).toBeGreaterThan(0);
      expect(q.question_text).toContain("_______");
    }
  });

  it("distributes the correct answer across multiple option positions (not all Option A)", () => {
    const questions = generateOfflineQuiz(SAMPLE_TEXT, 6);
    const indices = questions.map((q) => q.correct_index);
    const uniquePositions = new Set(indices);
    // Across 6 questions, answers must appear at more than 1 option position
    expect(uniquePositions.size).toBeGreaterThan(1);
  });
});

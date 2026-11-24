import { describe, it, expect } from "vitest";
import { calculateSM2 } from "@/lib/sm2";

describe("SM-2 Spaced Repetition Algorithm", () => {
  const fixedNow = new Date("2026-11-24T12:00:00Z");

  it("resets repetitions to 0 and interval to 1 on failure (quality < 3)", () => {
    const result = calculateSM2({
      quality: 1, // Again
      repetitions: 4,
      ease_factor: 2.5,
      interval_days: 15,
      now: fixedNow,
    });

    expect(result.repetitions).toBe(0);
    expect(result.interval_days).toBe(1);
    expect(new Date(result.next_review_at).toISOString()).toBe("2026-11-25T12:00:00.000Z");
    expect(result.ease_factor).toBeLessThan(2.5);
  });

  it("sets interval to 1 on first successful recall (repetitions = 0 -> 1)", () => {
    const result = calculateSM2({
      quality: 4, // Good
      repetitions: 0,
      ease_factor: 2.5,
      interval_days: 0,
      now: fixedNow,
    });

    expect(result.repetitions).toBe(1);
    expect(result.interval_days).toBe(1);
    expect(result.ease_factor).toBe(2.5); // (5 - 4) gives no EF change
  });

  it("sets interval to 6 on second successful recall (repetitions = 1 -> 2)", () => {
    const result = calculateSM2({
      quality: 4, // Good
      repetitions: 1,
      ease_factor: 2.5,
      interval_days: 1,
      now: fixedNow,
    });

    expect(result.repetitions).toBe(2);
    expect(result.interval_days).toBe(6);
  });

  it("scales interval by ease factor on subsequent successful recalls", () => {
    const result = calculateSM2({
      quality: 5, // Easy
      repetitions: 2,
      ease_factor: 2.5,
      interval_days: 6,
      now: fixedNow,
    });

    expect(result.repetitions).toBe(3);
    // EF' for quality 5: 2.5 + 0.1 = 2.6
    expect(result.ease_factor).toBe(2.6);
    // interval = 6 * 2.6 = 15.6 -> 16
    expect(result.interval_days).toBe(16);
  });

  it("enforces minimum ease factor floor of 1.3", () => {
    const result = calculateSM2({
      quality: 0,
      repetitions: 0,
      ease_factor: 1.35,
      interval_days: 0,
      now: fixedNow,
    });

    expect(result.ease_factor).toBe(1.3);
  });
});

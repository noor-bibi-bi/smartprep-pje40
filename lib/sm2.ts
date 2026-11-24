/**
 * SuperMemo 2 (SM-2) Spaced Repetition Algorithm
 *
 * References:
 * - Quality grade: 0 to 5
 *   0: Complete blackout
 *   1: Incorrect; remembered upon seeing answer
 *   2: Incorrect; where the correct one seemed easy to recall
 *   3: Correct with serious difficulty
 *   4: Correct after hesitation
 *   5: Perfect recall
 *
 * Algorithm specifications:
 * - EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 *   Where minimum EF = 1.3
 * - If quality < 3:
 *     repetitions = 0
 *     interval = 1 (review tomorrow)
 * - If quality >= 3:
 *     repetitions = repetitions + 1
 *     if repetitions == 1: interval = 1
 *     else if repetitions == 2: interval = 6
 *     else: interval = round(previous_interval * EF)
 */

export interface SM2Input {
  quality: number; // 0..5
  repetitions: number;
  ease_factor: number;
  interval_days: number;
  now?: Date;
}

export interface SM2Output {
  repetitions: number;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
}

export function calculateSM2({
  quality,
  repetitions,
  ease_factor,
  interval_days,
  now = new Date(),
}: SM2Input): SM2Output {
  // Clamp quality between 0 and 5
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  // Calculate new Ease Factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(
    1.3,
    ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  let newRepetitions: number;
  let newIntervalDays: number;

  if (q < 3) {
    // Failed recall: reset repetitions count and schedule review for tomorrow
    newRepetitions = 0;
    newIntervalDays = 1;
  } else {
    // Successful recall
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) {
      newIntervalDays = 1;
    } else if (newRepetitions === 2) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(interval_days * newEaseFactor);
    }
  }

  // Calculate next review timestamp
  const nextDate = new Date(now.getTime());
  nextDate.setDate(nextDate.getDate() + newIntervalDays);

  return {
    repetitions: newRepetitions,
    ease_factor: Number(newEaseFactor.toFixed(2)),
    interval_days: newIntervalDays,
    next_review_at: nextDate.toISOString(),
  };
}

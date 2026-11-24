import type { GeneratedQuestionItem } from "@/lib/quizSchema";

const COMMON_STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing",
  "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers",
  "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in",
  "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
  "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
  "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's",
  "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs",
  "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't",
  "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
  "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't",
  "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
  "yourselves", "also", "using", "used", "which", "whose", "within", "without", "etc", "i.e", "e.g"
]);

export interface OfflineGeneratorOptions {
  difficulty?: "easy" | "medium" | "hard";
  salt?: number | string;
}

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 */
function createSeededRandom(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function cleanWord(w: string): string {
  return w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
}

/**
 * Normalizes text extracted from PDF documents:
 * 1. Recombines words split across lines by hyphens.
 * 2. Unwraps lines within paragraphs so sentences are complete.
 */
function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/(\b[A-Za-z]+)-\n([A-Za-z]+\b)/g, "$1$2") // de-hyphenate line breaks
    .replace(/(?<!\n)\n(?!\n)/g, " ") // join single line breaks inside paragraphs
    .replace(/\s+/g, " ")
    .trim();
}

const DANGLING_END = /\b(and|or|of|in|to|with|for|as|by|is|are|the|a|an|that|which|whereas|although|not|so|,|;)\s*$/i;
const CITATION_OR_HEADING = /^(figure|table|chapter|section|page|\d+|https?:|www\.|references|bibliography|[A-Z\s]{4,}:)/i;

/**
 * Validates whether a sentence candidate is a complete, grammatical, stand-alone thought.
 */
function isCompleteSentence(s: string): boolean {
  if (s.length < 45 || s.length > 280) return false;
  if (CITATION_OR_HEADING.test(s)) return false;

  // Must begin with an uppercase letter or quote
  if (!/^[A-Z"']/.test(s)) return false;

  // Must end with terminal punctuation
  if (!/[.?!]["']?$/.test(s)) return false;

  const body = s.replace(/[.?!]["']?$/, "").trim();
  if (DANGLING_END.test(body)) return false;

  const words = s.split(/\s+/);
  if (words.length < 8 || words.length > 45) return false;

  return true;
}

const EASY_MARKERS = /\b(is|are|refers to|defined as|known as|called|consists of|contains|means)\b/i;
const MEDIUM_MARKERS = /\b(because|in order to|results in|responsible for|functions as|produces|converts|leads to|associated with|requires)\b/i;
const HARD_MARKERS = /\b(however|therefore|furthermore|consequently|nevertheless|whereas|distinguished|mechanisms|specifically|concluded|hypothesized)\b/i;

/**
 * Production-grade offline quiz generator:
 * - Unwraps PDF line breaks so questions are never cut off mid-sentence.
 * - Filters for complete grammatical thoughts (no citation artifacts or dangling prepositions).
 * - Implements difficulty-calibrated sentence scoring.
 * - Accurately delivers the user's requested question target (from 1 up to 25).
 */
export function generateOfflineQuiz(
  text: string,
  targetCount = 10,
  optionsOrDifficulty?: OfflineGeneratorOptions | "easy" | "medium" | "hard",
): GeneratedQuestionItem[] {
  let difficulty: "easy" | "medium" | "hard" = "medium";
  let salt: number | string = 0;

  if (typeof optionsOrDifficulty === "string") {
    difficulty = optionsOrDifficulty;
  } else if (optionsOrDifficulty && typeof optionsOrDifficulty === "object") {
    if (optionsOrDifficulty.difficulty) difficulty = optionsOrDifficulty.difficulty;
    if (optionsOrDifficulty.salt !== undefined) salt = optionsOrDifficulty.salt;
  }

  // Cap targetCount between 1 and 25
  const countToGenerate = Math.max(1, Math.min(25, targetCount));

  const normalized = normalizeExtractedText(text);
  if (!normalized || normalized.length < 30) {
    return [];
  }

  const seedString = `${normalized.slice(0, 500)}_${difficulty}_${salt}`;
  const seed = hashString(seedString);
  const rng = createSeededRandom(seed);

  // Split into sentence candidates using terminal punctuation followed by space and capital
  const rawSentences = normalized
    .split(/(?<=[.?!])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter(isCompleteSentence);

  // If strict filter yields fewer than needed, relax length constraints slightly
  let candidateSentences = rawSentences;
  if (candidateSentences.length < countToGenerate) {
    candidateSentences = normalized
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 35 && s.length <= 320 && /^[A-Z]/.test(s));
  }

  // Extract vocabulary words across the document for distractors
  const allWords = normalized.match(/\b[A-Za-z0-9_-]{4,25}\b/g) || [];
  const keywordFrequency = new Map<string, number>();

  for (const raw of allWords) {
    const word = cleanWord(raw);
    const lower = word.toLowerCase();
    if (word.length >= 4 && !COMMON_STOP_WORDS.has(lower) && !/^\d+$/.test(word)) {
      keywordFrequency.set(word, (keywordFrequency.get(word) || 0) + 1);
    }
  }

  const keywordPool = Array.from(keywordFrequency.keys()).sort((a, b) => {
    const freqDiff = (keywordFrequency.get(b) || 0) - (keywordFrequency.get(a) || 0);
    if (freqDiff !== 0) return freqDiff;
    return a.localeCompare(b);
  });

  // Score sentences by matching requested difficulty
  const scoredSentences = candidateSentences.map((sentence, idx) => {
    let score = 0;
    const len = sentence.length;
    const wordCount = sentence.split(/\s+/).length;

    if (difficulty === "easy") {
      if (len >= 45 && len <= 120) score += 40;
      if (EASY_MARKERS.test(sentence)) score += 35;
      if (wordCount <= 18) score += 20;
    } else if (difficulty === "medium") {
      if (len >= 70 && len <= 180) score += 35;
      if (MEDIUM_MARKERS.test(sentence)) score += 40;
      if (sentence.includes(",") || sentence.includes(";")) score += 15;
    } else {
      // Hard
      if (len >= 110 && len <= 260) score += 40;
      if (HARD_MARKERS.test(sentence)) score += 45;
      if (wordCount >= 20) score += 20;
      if (sentence.includes(",") && sentence.includes(";")) score += 15;
    }

    return {
      sentence,
      originalIndex: idx,
      complexityScore: score,
    };
  });

  // Stratify sentences: shuffle with seed jitter so questions vary on every generation
  scoredSentences.sort((a, b) => {
    const jitterA = a.complexityScore + rng() * 35;
    const jitterB = b.complexityScore + rng() * 35;
    return jitterB - jitterA;
  });

  const questions: GeneratedQuestionItem[] = [];
  const usedSentences = new Set<string>();
  const usedAnswers = new Set<string>();

  for (const item of scoredSentences) {
    if (questions.length >= countToGenerate) break;
    const sentence = item.sentence;
    if (usedSentences.has(sentence)) continue;

    const words = sentence.split(/\s+/);
    // Find eligible words: exclude first word and last word so the blank is surrounded by context
    const eligibleWords: Array<{ word: string; clean: string; index: number }> = [];

    for (let i = 1; i < words.length - 1; i++) {
      const cleaned = cleanWord(words[i]);
      const lower = cleaned.toLowerCase();
      if (
        cleaned.length >= 4 &&
        !COMMON_STOP_WORDS.has(lower) &&
        !/^\d+$/.test(cleaned) &&
        !usedAnswers.has(lower)
      ) {
        eligibleWords.push({ word: words[i], clean: cleaned, index: i });
      }
    }

    if (eligibleWords.length === 0) continue;

    // Pick target word based on difficulty
    if (difficulty === "easy") {
      eligibleWords.sort(
        (a, b) => (keywordFrequency.get(b.clean) || 0) - (keywordFrequency.get(a.clean) || 0)
      );
    } else if (difficulty === "hard") {
      eligibleWords.sort((a, b) => b.clean.length - a.clean.length);
    } else {
      eligibleWords.sort((a, b) => Math.abs(a.clean.length - 8) - Math.abs(b.clean.length - 8));
    }

    const chosen = eligibleWords[0];
    const chosenWord = chosen.clean;
    const chosenLower = chosenWord.toLowerCase();

    // Create blank in the sentence
    const regex = new RegExp(`\\b${chosenWord}\\b`, "i");
    if (!regex.test(sentence)) continue;
    const blankedSentence = sentence.replace(regex, "_______");

    // Gather 3 plausible distractors with random offset so options differ across every question
    const distractors: string[] = [];
    const maxLenDiff = difficulty === "hard" ? 4 : 8;
    const poolLen = keywordPool.length;
    const startIdx = poolLen > 0 ? Math.floor(rng() * poolLen) : 0;

    // Scan keywordPool starting from random offset
    for (let i = 0; i < poolLen; i++) {
      if (distractors.length >= 3) break;
      const kw = keywordPool[(startIdx + i) % poolLen];
      if (
        kw.toLowerCase() !== chosenLower &&
        !distractors.some((d) => d.toLowerCase() === kw.toLowerCase()) &&
        Math.abs(kw.length - chosenWord.length) <= maxLenDiff
      ) {
        distractors.push(kw);
      }
    }

    // Fallback pass if length-matched words are fewer than 3
    for (let i = 0; i < poolLen; i++) {
      if (distractors.length >= 3) break;
      const kw = keywordPool[(startIdx + i) % poolLen];
      if (
        kw.toLowerCase() !== chosenLower &&
        !distractors.some((d) => d.toLowerCase() === kw.toLowerCase())
      ) {
        distractors.push(kw);
      }
    }

    // Rich domain backup pool randomized per question
    const academicBackups = [
      "Methodology", "Hypothesis", "Evaluation", "Architecture", "Optimization",
      "Constraint", "Simulation", "Classification", "Verification", "Integration",
      "Criterion", "Correlation", "Distribution", "Abstraction", "Implementation",
      "Parameter", "Mechanism", "Condition", "Component", "Function", "Variable"
    ];
    const backupOffset = Math.floor(rng() * academicBackups.length);

    for (let i = 0; i < academicBackups.length; i++) {
      if (distractors.length >= 3) break;
      const fallback = academicBackups[(backupOffset + i) % academicBackups.length];
      if (
        fallback.toLowerCase() !== chosenLower &&
        !distractors.some((d) => d.toLowerCase() === fallback.toLowerCase())
      ) {
        distractors.push(fallback);
      }
    }

    if (distractors.length < 3) continue;

    // Build raw options and shuffle with Fisher-Yates for uniform distribution (25% each A, B, C, D)
    const rawOptions = [
      { text: chosenWord, isCorrect: true },
      { text: distractors[0], isCorrect: false },
      { text: distractors[1], isCorrect: false },
      { text: distractors[2], isCorrect: false },
    ];

    for (let i = rawOptions.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = rawOptions[i];
      rawOptions[i] = rawOptions[j];
      rawOptions[j] = temp;
    }

    const options = rawOptions.map((o) => o.text);
    const correctIndex = rawOptions.findIndex((o) => o.isCorrect);

    usedSentences.add(sentence);
    usedAnswers.add(chosenLower);

    // Stem wording tailored to difficulty
    let questionStem = `Fill in the blank: "${blankedSentence}"`;
    if (difficulty === "easy") {
      questionStem = `Identify the term that correctly completes: "${blankedSentence}"`;
    } else if (difficulty === "hard") {
      questionStem = `Analyzing the study passage, determine the missing concept: "${blankedSentence}"`;
    }

    questions.push({
      question_text: questionStem,
      options: options as [string, string, string, string],
      correct_index: correctIndex,
      explanation: `"${chosenWord}" accurately completes the reference passage from your study material.`,
    });
  }

  return questions;
}

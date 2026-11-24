"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { GeneratedQuestionItem } from "@/lib/quizSchema";

interface QuestionEditorProps {
  questions: GeneratedQuestionItem[];
  onChange: (questions: GeneratedQuestionItem[]) => void;
}

export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  function handleQuestionTextChange(index: number, text: string) {
    const updated = [...questions];
    updated[index] = { ...updated[index], question_text: text };
    onChange(updated);
  }

  function handleOptionChange(qIndex: number, optIndex: number, text: string) {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[optIndex] = text;
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    onChange(updated);
  }

  function handleCorrectIndexChange(qIndex: number, correctIdx: number) {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], correct_index: correctIdx };
    onChange(updated);
  }

  function handleExplanationChange(index: number, explanation: string) {
    const updated = [...questions];
    updated[index] = { ...updated[index], explanation };
    onChange(updated);
  }

  function handleDeleteQuestion(index: number) {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(Math.max(0, index - 1));
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  }

  function handleAddQuestion() {
    const newQuestion: GeneratedQuestionItem = {
      question_text: "New review question",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct_index: 0,
      explanation: "Explanation of why this answer is correct.",
    };
    onChange([...questions, newQuestion]);
    setExpandedIndex(questions.length);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            Review & Edit Question{questions.length === 1 ? "" : "s"} ({questions.length})
          </h2>
          <p className="text-sm text-mute">
            Refine questions, adjust options, or pick the correct answer before saving.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={handleAddQuestion}>
          <Plus size={16} aria-hidden />
          <span>Add Question</span>
        </Button>
      </div>

      <div className="space-y-3">
        {questions.map((q, qIndex) => {
          const isExpanded = expandedIndex === qIndex;

          return (
            <div
              key={qIndex}
              className="rounded-lg border border-rule bg-paper p-4 transition-all shadow-sm"
            >
              {/* Card Header / Summary */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : qIndex)}
                  className="flex flex-1 items-center gap-3 text-left font-medium text-ink hover:text-accent"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-mono font-bold text-mute">
                    {qIndex + 1}
                  </span>
                  <span className="line-clamp-1 flex-1 text-sm font-semibold">
                    {q.question_text || "Untitled Question"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-mute" />
                  ) : (
                    <ChevronDown size={18} className="text-mute" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(qIndex)}
                  disabled={questions.length <= 1}
                  title={questions.length <= 1 ? "At least one question required" : "Delete question"}
                  className="rounded p-1.5 text-mute hover:bg-danger/10 hover:text-danger disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>

              {/* Expanded Edit Form */}
              {isExpanded && (
                <div className="mt-4 space-y-4 border-t border-rule/60 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`q-text-${qIndex}`}>Question Text</Label>
                    <Input
                      id={`q-text-${qIndex}`}
                      value={q.question_text}
                      onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                      placeholder="Type the question..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Answer Options (click circle to set correct answer)</Label>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {q.options.map((option, optIndex) => {
                        const isCorrect = q.correct_index === optIndex;
                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 rounded-md border p-2.5 transition-colors ${
                              isCorrect
                                ? "border-accent bg-accent-tint/40"
                                : "border-rule bg-raised/50"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCorrectIndexChange(qIndex, optIndex)}
                              className="text-mute hover:text-accent focus:outline-none"
                              aria-label={`Mark option ${optIndex + 1} as correct`}
                            >
                              <CheckCircle2
                                size={18}
                                className={isCorrect ? "text-accent fill-accent/20" : "text-mute/50"}
                              />
                            </button>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              className="flex-1 bg-transparent text-sm text-ink outline-none"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`q-exp-${qIndex}`}>Explanation</Label>
                    <textarea
                      id={`q-exp-${qIndex}`}
                      value={q.explanation || ""}
                      onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                      rows={2}
                      className="w-full rounded-sm border border-rule bg-raised px-3 py-2 text-sm text-ink placeholder:text-mute/70 focus:border-accent focus-visible:outline-2"
                      placeholder="Explain why the answer is correct..."
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

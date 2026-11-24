"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Save,
  CheckCircle,
  Database,
  CloudOff,
} from "lucide-react";
import { UploadZone } from "@/components/create/upload-zone";
import { DifficultySelector } from "@/components/create/difficulty-selector";
import { GenerationProgress } from "@/components/create/generation-progress";
import { QuestionEditor } from "@/components/create/question-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { MAX_PDF_BYTES } from "@/lib/validation";
import { saveToOfflineQueue } from "@/lib/offlineQueue";
import { saveStudySetAction } from "@/app/create/actions";
import type { Difficulty } from "@/lib/types";
import type { GeneratedQuestionItem } from "@/lib/quizSchema";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // %PDF
const REQUEST_TIMEOUT_MS = 30_000;

export function CreateQuizClient() {
  const router = useRouter();

  // Mode: PDF upload vs Direct Text Paste
  const [inputMode, setInputMode] = useState<"pdf" | "text">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  // Configuration options
  const [title, setTitle] = useState("");
  const [moduleTag, setModuleTag] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [enginePreference, setEnginePreference] = useState<"auto" | "offline">("auto");

  // Generator & Editor States
  const [pending, setPending] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionItem[] | null>(null);
  const [engineUsed, setEngineUsed] = useState<"cloud" | "offline">("cloud");
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Saving states
  const [isSaving, startSavingTransition] = useTransition();
  const [offlineSavedNotice, setOfflineSavedNotice] = useState<string | null>(null);

  const isTextValid = pastedText.trim().length >= 40;
  const isShortWarning =
    (inputMode === "text" && pastedText.trim().length > 0 && pastedText.trim().length < 100) ||
    false;

  const fileReady = useMemo(
    () => file !== null && file.size <= MAX_PDF_BYTES && fileError === null,
    [file, fileError],
  );

  const canGenerate = (inputMode === "pdf" ? fileReady : isTextValid) && !pending;

  function handleSelect(next: File) {
    setFileError(null);
    setGenerationError(null);
    if (!next.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Only PDF documents are accepted.");
      setFile(next);
      return;
    }
    if (next.size > MAX_PDF_BYTES) {
      setFileError("File too large. Maximum size is 4.5MB.");
      setFile(next);
      return;
    }
    if (next.size === 0) {
      setFileError("That file is empty. Choose a PDF with readable text.");
      setFile(next);
      return;
    }
    setFile(next);
    if (!title) {
      setTitle(next.name.replace(/\.pdf$/i, ""));
    }
  }

  function handleClear() {
    setFile(null);
    setFileError(null);
    setGenerationError(null);
  }

  async function verifyPdfHeader(selected: File): Promise<boolean> {
    const buffer = await selected.slice(0, 4).arrayBuffer();
    const header = Array.from(new Uint8Array(buffer));
    return PDF_MAGIC.every((byte, i) => byte === header[i]);
  }

  async function generate() {
    if (!canGenerate) return;
    setFileError(null);
    setGenerationError(null);
    setFallbackNotice(null);
    setOfflineSavedNotice(null);

    if (inputMode === "pdf" && file) {
      const looksLikePdf = await verifyPdfHeader(file);
      if (!looksLikePdf) {
        setFileError("That file is not a valid PDF document.");
        return;
      }
    }

    setPending(true);
    try {
      const form = new FormData();
      form.append("difficulty", difficulty);
      form.append("count", String(questionCount));
      form.append("engine", enginePreference);
      form.append("salt", String(Date.now() + Math.random()));
      if (title.trim()) {
        form.append("title", title.trim());
      }

      if (inputMode === "pdf" && file) {
        form.append("pdf", file);
      } else {
        form.append("text", pastedText.trim());
        if (!title.trim()) {
          const autoTitle = pastedText.slice(0, 30).trim() + " Study Set";
          form.append("title", autoTitle);
          setTitle(autoTitle);
        }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setGenerationError(data?.error?.message || "Generation failed. Please try again.");
        return;
      }

      if (!data?.questions || data.questions.length === 0) {
        setGenerationError("No questions could be extracted from this material. Try providing more text.");
        return;
      }

      setGeneratedQuestions(data.questions);
      setEngineUsed(data.engine_used || "offline");
      if (data.fallback_notice) {
        setFallbackNotice(data.fallback_notice);
      }
      if (data.title && !title) {
        setTitle(data.title);
      }

      toast.success(
        `Generated ${data.questions.length} question${data.questions.length === 1 ? "" : "s"}! Review below.`,
      );
    } catch (err: unknown) {
      console.error("Quiz generation error:", err);
      setGenerationError("Network problem — check your connection or switch to Offline Engine.");
    } finally {
      setPending(false);
    }
  }

  function handleSaveStudySet() {
    if (!generatedQuestions || generatedQuestions.length === 0) return;

    startSavingTransition(async () => {
      const payload = {
        title: title.trim() || "Untitled Study Set",
        module_tag: moduleTag.trim() || null,
        source_type: inputMode,
        difficulty,
        engine_used: engineUsed,
        questions: generatedQuestions,
      };

      try {
        const res = await saveStudySetAction(payload);

        if (res.success && res.quizId) {
          toast.success("Study set saved! Opening your study set…");
          router.push(`/quiz/${res.quizId}`);
          return;
        }

        // If error is network or server connection, automatically fallback to offline queue
        if (res.isNetworkOrServerError) {
          fallbackToLocalStorage(payload, res.error);
        } else {
          toast.error(res.error || "Failed to save study set.");
        }
      } catch (err: unknown) {
        console.error("Save failure:", err);
        fallbackToLocalStorage(payload, err instanceof Error ? err.message : "Network failure");
      }
    });
  }

  function fallbackToLocalStorage(
    payload: {
      title: string;
      module_tag: string | null;
      source_type: "pdf" | "text";
      difficulty: "easy" | "medium" | "hard";
      engine_used: "cloud" | "offline";
      questions: GeneratedQuestionItem[];
    },
    errorMsg?: string,
  ) {
    const offlineId = `local-${Date.now()}`;
    saveToOfflineQueue({
      id: offlineId,
      title: payload.title,
      module_tag: payload.module_tag,
      source_type: payload.source_type,
      difficulty: payload.difficulty,
      engine_used: payload.engine_used,
      created_at: new Date().toISOString(),
      questions: payload.questions.map((q, idx) => ({
        ...q,
        position: idx,
      })),
    });

    setOfflineSavedNotice(
      `Saved locally in browser fallback queue (${errorMsg || "Supabase temporarily unreachable"}). You can retry sync from the Dashboard.`,
    );
    toast.warning("Saved locally to your browser.");
  }

  return (
    <div className="space-y-10">
      {/* Input Selection Header */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Create New Study Set</h1>
            <p className="text-sm text-mute">
              Upload lecture slides or paste raw revision notes to generate active recall study sets.
            </p>
          </div>

          {/* Dual-tab Input Switcher */}
          <div className="flex rounded-md border border-rule bg-raised p-1">
            <button
              type="button"
              onClick={() => {
                setInputMode("pdf");
                setGenerationError(null);
              }}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                inputMode === "pdf"
                  ? "bg-paper text-ink shadow-sm"
                  : "text-mute hover:text-ink"
              }`}
            >
              <Upload size={14} aria-hidden />
              <span>PDF File</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode("text");
                setGenerationError(null);
              }}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                inputMode === "text"
                  ? "bg-paper text-ink shadow-sm"
                  : "text-mute hover:text-ink"
              }`}
            >
              <FileText size={14} aria-hidden />
              <span>Paste Notes</span>
            </button>
          </div>
        </div>

        {/* Input Zone */}
        {inputMode === "pdf" ? (
          <div>
            <UploadZone
              file={file}
              onSelect={handleSelect}
              onClear={handleClear}
              error={fileError}
              disabled={pending}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="pasted-text">Lecture Notes or Reading Material</Label>
            <textarea
              id="pasted-text"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              disabled={pending}
              rows={7}
              placeholder="Paste lecture excerpts, textbook summaries, or bullet points here..."
              className="w-full rounded-md border border-rule bg-raised p-4 text-sm text-ink placeholder:text-mute/70 focus:border-accent focus-visible:outline-2"
            />
            <div className="flex items-center justify-between text-xs text-mute">
              <span>
                {pastedText.length} character{pastedText.length === 1 ? "" : "s"} (minimum 40 required)
              </span>
              {isShortWarning && (
                <span className="flex items-center gap-1 text-warning font-medium">
                  <AlertTriangle size={12} />
                  Short text: questions may be limited.
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Configuration Metadata */}
      <section className="grid grid-cols-1 gap-6 rounded-lg border border-rule bg-paper p-6 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="set-title">Study Set Title</Label>
          <Input
            id="set-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Molecular Biology - Chapter 4"
            disabled={pending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="module-tag">Module / Course Tag (optional)</Label>
          <Input
            id="module-tag"
            value={moduleTag}
            onChange={(e) => setModuleTag(e.target.value)}
            placeholder="e.g. BIO101 or CS204"
            disabled={pending}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="question-count">Question Target</Label>
          <div className="flex items-center gap-3">
            <input
              id="question-count"
              type="range"
              min="3"
              max="20"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              disabled={pending}
              className="w-full accent-accent"
            />
            <span className="w-8 font-mono text-sm font-bold text-ink">{questionCount}</span>
          </div>
        </div>
      </section>

      {/* Difficulty & Engine Selector */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={pending} />
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="font-mono text-xs uppercase text-mute">Generator:</span>
          <div className="flex rounded-md border border-rule bg-raised p-1 text-xs">
            <button
              type="button"
              onClick={() => setEnginePreference("auto")}
              className={`rounded px-2.5 py-1 ${
                enginePreference === "auto" ? "bg-paper font-semibold text-ink shadow-sm" : "text-mute"
              }`}
            >
              Cloud + Fallback
            </button>
            <button
              type="button"
              onClick={() => setEnginePreference("offline")}
              className={`rounded px-2.5 py-1 ${
                enginePreference === "offline" ? "bg-paper font-semibold text-ink shadow-sm" : "text-mute"
              }`}
            >
              Offline Only
            </button>
          </div>
        </div>
      </section>

      {/* Generate Action Button */}
      <section>
        <Button
          size="lg"
          onClick={generate}
          disabled={!canGenerate}
          className="w-full sm:w-auto"
        >
          {pending ? (
            <>
              <Spinner size="sm" />
              Generating questions…
            </>
          ) : (
            <>
              <Sparkles size={18} aria-hidden />
              Generate Study Set
            </>
          )}
        </Button>
      </section>

      {/* Progress & Status */}
      {pending && <GenerationProgress />}

      {/* Error alert */}
      {generationError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Generation Notice</p>
            <p className="mt-0.5">{generationError}</p>
          </div>
        </div>
      )}

      {/* Fallback notification notice banner */}
      {fallbackNotice && (
        <div className="flex items-center gap-2.5 rounded-md border border-accent/40 bg-accent-tint/30 p-3.5 text-xs text-ink">
          <CloudOff size={16} className="shrink-0 text-accent" />
          <span>{fallbackNotice}</span>
        </div>
      )}

      {/* Pre-Save Editor Section */}
      {generatedQuestions && generatedQuestions.length > 0 && (
        <section className="space-y-6 rounded-xl border-2 border-accent/30 bg-paper p-6 shadow-md animate-fade-in">
          <QuestionEditor questions={generatedQuestions} onChange={setGeneratedQuestions} />

          {/* Offline Saved Banner */}
          {offlineSavedNotice && (
            <div className="flex items-center gap-2.5 rounded-md border border-warning/50 bg-warning/10 p-4 text-sm text-ink">
              <Database size={18} className="shrink-0 text-warning" />
              <span>{offlineSavedNotice}</span>
            </div>
          )}

          {/* Pre-save action bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
            <div className="flex items-center gap-2 text-xs text-mute">
              <CheckCircle size={15} className="text-accent" />
              <span>
                Engine: <strong className="uppercase">{engineUsed}</strong> • Ready to save to your
                account
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={generate}
                disabled={isSaving || pending}
              >
                <RotateCcw size={16} aria-hidden />
                <span>Regenerate</span>
              </Button>

              <Button
                size="lg"
                onClick={handleSaveStudySet}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" />
                    Saving Study Set…
                  </>
                ) : (
                  <>
                    <Save size={18} aria-hidden />
                    Save & Finish
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

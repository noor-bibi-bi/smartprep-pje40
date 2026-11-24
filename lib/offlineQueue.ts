export interface OfflineQuizQueueItem {
  id: string;
  title: string;
  module_tag: string | null;
  source_type: "pdf" | "text";
  difficulty: "easy" | "medium" | "hard";
  engine_used: "cloud" | "offline";
  created_at: string;
  questions: Array<{
    question_text: string;
    options: string[];
    correct_index: number;
    explanation: string;
    position: number;
  }>;
}

const STORAGE_KEY = "smartprep_offline_queue";

export function getOfflineQueue(): OfflineQuizQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToOfflineQueue(item: OfflineQuizQueueItem): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getOfflineQueue();
    queue.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to save to offline queue:", err);
  }
}

export function removeFromOfflineQueue(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getOfflineQueue().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to remove from offline queue:", err);
  }
}

export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear offline queue:", err);
  }
}

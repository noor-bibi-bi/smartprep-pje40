"use client";

import { useEffect, useState, useTransition } from "react";
import { Database, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { saveStudySetAction } from "@/app/create/actions";
import {
  getOfflineQueue,
  removeFromOfflineQueue,
  type OfflineQuizQueueItem,
} from "@/lib/offlineQueue";

export function OfflineSyncPanel() {
  const [items, setItems] = useState<OfflineQuizQueueItem[]>([]);
  const [isSyncing, startSync] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(getOfflineQueue());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (items.length === 0) return null;

  function syncItems() {
    startSync(async () => {
      let synced = 0;
      const remaining: string[] = [];

      for (const item of items) {
        const result = await saveStudySetAction({
          title: item.title,
          module_tag: item.module_tag,
          source_type: item.source_type,
          difficulty: item.difficulty,
          engine_used: item.engine_used,
          questions: item.questions,
        });

        if (result.success) {
          removeFromOfflineQueue(item.id);
          synced += 1;
        } else {
          remaining.push(item.id);
          toast.error(result.error || `Could not sync "${item.title}".`);
        }
      }

      setItems(getOfflineQueue().filter((item) => remaining.includes(item.id)));
      if (synced > 0) {
        toast.success(`${synced} local study set${synced === 1 ? "" : "s"} synced.`);
      }
    });
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Database size={18} className="mt-0.5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-semibold text-ink">
            {items.length} study set{items.length === 1 ? "" : "s"} saved locally
          </p>
          <p className="mt-0.5 text-xs text-mute">
            Sync them to your account when your connection is available.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={syncItems}
        disabled={isSyncing}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-rule bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-accent disabled:opacity-60"
      >
        <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
        {isSyncing ? "Syncing..." : "Sync now"}
      </button>
    </div>
  );
}

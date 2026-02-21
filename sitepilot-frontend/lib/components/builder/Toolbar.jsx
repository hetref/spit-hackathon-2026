"use client";

/**
 * TOP TOOLBAR
 *
 * Dark-themed professional toolbar with undo/redo, device preview, save, publish.
 * Automatically uses real DB APIs when a siteId/pageId are present in the store,
 * otherwise falls back to legacy demo behaviour.
 */

import { useState } from "react";
import {
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Eye,
  RotateCcw,
  Layers,
  Zap,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import useUIStore from "@/lib/stores/uiStore";
import useHistoryStore from "@/lib/stores/historyStore";
import useBuilderStore, { clearSavedState } from "@/lib/stores/builderStore";
import { clsx } from "clsx";

export default function Toolbar() {
  const { devicePreview, setDevicePreview } = useUIStore();
  const { canUndo, canRedo, undo, redo } = useHistoryStore();
  const { getLayoutJSON, updateLayoutJSON, siteId, pageId, getPageLayout } =
    useBuilderStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saved" | "error" | null

  const handleUndo = () => {
    if (canUndo) {
      const previousState = undo();
      if (previousState) updateLayoutJSON(previousState);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextState = redo();
      if (nextState) updateLayoutJSON(nextState);
    }
  };

  const handleSave = async () => {
    const store = useBuilderStore.getState();
    const { siteId, pageId, layoutJSON, currentPageId } = store;

    // ── DB-backed save ──────────────────────────────────────────
    if (siteId && pageId) {
      setIsSaving(true);
      setSaveStatus(null);
      try {
        const page = layoutJSON?.pages?.find((p) => p.id === currentPageId);
        const res = await fetch(`/api/sites/${siteId}/pages/${pageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layout: page?.layout ?? [],
            name: page?.name,
            seo: page?.seo,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Save failed");
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (err) {
        console.error("Save error:", err);
        setSaveStatus("error");
        alert(`Save failed: ${err.message}`);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // ── Demo / localStorage fallback ────────────────────────────
    const fallbackLayout = getLayoutJSON();
    if (fallbackLayout) {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "sitepilot_builder_v2",
            JSON.stringify(fallbackLayout),
          );
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 2000);
      } catch {
        alert("Failed to save locally.");
      }
    }
  };

  const handlePublish = async () => {
    const { siteId, pageId } = useBuilderStore.getState();

    // ── DB-backed publish ───────────────────────────────────────
    if (siteId && pageId) {
      setIsPublishing(true);
      try {
        const res = await fetch(
          `/api/sites/${siteId}/pages/${pageId}/publish`,
          {
            method: "POST",
          },
        );
        const result = await res.json();
        if (result.success) {
          const open = confirm(`Page published!\n\nOpen preview in new tab?`);
          if (open) window.open(result.previewUrl, "_blank");
        } else {
          alert(`Publish failed: ${result.error}`);
        }
      } catch (err) {
        console.error("Publish error:", err);
        alert("Failed to publish — check the console for details.");
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // ── Legacy monolithic publish (demo mode) ──────────────────
    const layoutJSON = getLayoutJSON();
    setIsPublishing(true);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layoutJSON }),
      });
      const result = await response.json();
      if (result.success) {
        const open = confirm(
          `${result.message}\n\nOpen the published site in a new tab?`,
        );
        if (open) window.open(result.previewUrl, "_blank");
      } else {
        alert(`Publish failed: ${result.error}`);
      }
    } catch (err) {
      console.error("Publish error:", err);
      alert("Failed to publish — check the console for details.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="h-14 bg-[#1E293B] flex items-center justify-between px-4 shadow-lg">
      {/* Left Side — Logo + Undo/Redo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            SitePilot
          </span>
        </div>

        <div className="w-px h-6 bg-slate-600" />

        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={clsx(
            "p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors",
            !canUndo &&
              "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-300",
          )}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={clsx(
            "p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors",
            !canRedo &&
              "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-300",
          )}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Center — Device Preview */}
      <div className="flex items-center gap-0.5 bg-slate-700/60 rounded-lg p-0.5">
        {[
          { key: "desktop", Icon: Monitor, label: "Desktop" },
          { key: "tablet", Icon: Tablet, label: "Tablet" },
          { key: "mobile", Icon: Smartphone, label: "Mobile" },
        ].map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => setDevicePreview(key)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
              devicePreview === key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-600",
            )}
            title={label}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Right Side — Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (confirm("Reset to demo data? All changes will be lost.")) {
              clearSavedState();
              window.location.reload();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          title="Reset to demo"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={clsx(
            "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
            saveStatus === "saved"
              ? "bg-emerald-600 text-white"
              : "bg-slate-600 text-white hover:bg-slate-500",
            isSaving && "opacity-70 cursor-wait",
          )}
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saveStatus === "saved" ? (
            <CheckCircle2 size={14} />
          ) : (
            <Save size={14} />
          )}
          {isSaving ? "Saving…" : saveStatus === "saved" ? "Saved!" : "Save"}
        </button>

        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className={clsx(
            "flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-medium rounded-md hover:from-blue-500 hover:to-violet-500 transition-all shadow-md shadow-blue-500/20",
            isPublishing && "opacity-70 cursor-wait",
          )}
        >
          {isPublishing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Publishing…
            </>
          ) : (
            <>
              <Eye size={14} />
              Publish
            </>
          )}
        </button>
      </div>
    </div>
  );
}

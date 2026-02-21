"use client";

/**
 * TOP TOOLBAR
 *
 * Dark-themed professional toolbar with undo/redo, device preview, save, publish.
 * Publish opens a modal to name the deployment before pushing to S3 + CloudFront.
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
  X,
  Rocket,
  Globe,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import useUIStore from "@/lib/stores/uiStore";
import useHistoryStore from "@/lib/stores/historyStore";
import useBuilderStore, { clearSavedState } from "@/lib/stores/builderStore";
import { clsx } from "clsx";
import AIPageGenerator from "./AIPageGenerator";
// import { clsx } from "clsx";

// ─── Publish Modal Removed (now handled in Site Dashboard) ────────────────────────────────────────────────────────────

// ─── Success Toast / Banner ───────────────────────────────────────────────────

function PublishSuccessBanner({ result, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-[#0F172A] border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-500/10 p-4 flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 size={16} className="text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Published!</p>
        {result.deploymentName && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {result.deploymentName}
          </p>
        )}
        {result.siteUrl && (
          <a
            href={result.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1.5 transition-colors"
          >
            <Globe size={11} />
            {result.siteUrl.replace("https://", "")}
            <ExternalLink size={10} />
          </a>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────

export default function Toolbar({ saving: autoSaving, lastSaved, saveError }) {
  const { devicePreview, setDevicePreview } = useUIStore();
  const { canUndo, canRedo, undo, redo } = useHistoryStore();
  const { getLayoutJSON, updateLayoutJSON, siteId, pageId, getPageLayout } =
    useBuilderStore();

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saved" | "error" | null
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

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

    // ── DB-backed save ──────────────────────────────────────────────────────
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

    // ── Demo / localStorage fallback ────────────────────────────────────────
    const fallbackLayout = getLayoutJSON();
    if (fallbackLayout) {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "sitepilot_builder_v2",
            JSON.stringify(fallbackLayout)
          );
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 2000);
      } catch {
        alert("Failed to save locally.");
      }
    }
  };

  const handlePublishClick = async () => {
    const { siteId, pageId } = useBuilderStore.getState();

    // DB-backed: open the publish modal
    if (siteId && pageId) {
      if (isSaving || isPublishing) return;
      setIsPublishing(true);
      try {
        const res = await fetch(`/api/sites/${siteId}/pages/${pageId}/publish`, {
          method: "POST"
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to publish page");

        handlePublishSuccess({
          deploymentName: result.message || "Page marked as published."
        });
      } catch (err) {
        alert(err.message);
      } finally {
        setIsPublishing(false);
      }
      return;
    }

    // Legacy demo fallback
    alert("Save your site first using the DB-backed builder before publishing.");
  };

  const handlePublishSuccess = (result) => {
    setPublishResult(result);
    // Auto-dismiss success banner after 8 seconds
    setTimeout(() => setPublishResult(null), 8000);
  };

  return (
    <>
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
              "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-300"
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
              "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-300"
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
                  : "text-slate-400 hover:text-white hover:bg-slate-600"
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
          {/* AI Generate Button */}
          <button
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg text-xs font-medium"
            title="Generate with AI"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">AI Generate</span>
          </button>

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

          {/* Auto-save status indicator */}
          {autoSaving ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-400">
              <Loader2 size={10} className="animate-spin" />
              Auto-saving…
            </span>
          ) : lastSaved ? (
            <span className="text-[10px] text-emerald-400" title={lastSaved.toLocaleTimeString()}>
              Auto-saved
            </span>
          ) : saveError ? (
            <span className="text-[10px] text-red-400" title={saveError}>
              Save failed
            </span>
          ) : null}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={clsx(
              "flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
              saveStatus === "saved"
                ? "bg-emerald-600 text-white"
                : "bg-slate-600 text-white hover:bg-slate-500",
              isSaving && "opacity-70 cursor-wait"
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
            onClick={handlePublishClick}
            disabled={isPublishing}
            className={clsx(
              "flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-medium rounded-md transition-all shadow-md",
              isPublishing
                ? "bg-slate-600 opacity-70 cursor-wait shadow-none"
                : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-blue-500/20"
            )}
          >
            {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            {isPublishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>


      {/* AI Page Generator Modal */}
      <AIPageGenerator
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onGenerate={(containers) => {
          const currentLayout = getLayoutJSON();
          const currentPage = currentLayout.pages.find(p => p.id === currentLayout.pages[0].id);
          
          // Replace current page layout with AI-generated containers
          const updatedLayout = {
            ...currentLayout,
            pages: currentLayout.pages.map(p => 
              p.id === currentPage.id 
                ? { ...p, layout: containers }
                : p
            )
          };
          
          updateLayoutJSON(updatedLayout);
        }}
      />

      {/* Success Banner */}
      {publishResult && (
        <PublishSuccessBanner
          result={publishResult}
          onClose={() => setPublishResult(null)}
        />
      )}
    </>
  );
}

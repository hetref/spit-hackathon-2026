"use client";

/**
 * TOP TOOLBAR
 *
 * Dark-themed professional toolbar with undo/redo, device preview, save, publish.
 */

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
} from "lucide-react";
import useUIStore from "@/lib/stores/uiStore";
import useHistoryStore from "@/lib/stores/historyStore";
import useBuilderStore, { clearSavedState } from "@/lib/stores/builderStore";
import { siteAPI } from "@/lib/data/demoData";
import { clsx } from "clsx";

export default function Toolbar() {
  const { devicePreview, setDevicePreview } = useUIStore();
  const { canUndo, canRedo, undo, redo } = useHistoryStore();
  const { getLayoutJSON, updateLayoutJSON } = useBuilderStore();

  const handleUndo = () => {
    if (canUndo) {
      const previousState = undo();
      if (previousState) {
        updateLayoutJSON(previousState);
      }
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextState = redo();
      if (nextState) {
        updateLayoutJSON(nextState);
      }
    }
  };

  const handleSave = async () => {
    const layoutJSON = getLayoutJSON();
    try {
      const result = await siteAPI.saveSite(layoutJSON);
      alert(result.message);
    } catch (error) {
      alert("Failed to save");
    }
  };

  const handlePublish = async () => {
    const layoutJSON = getLayoutJSON();
    try {
      const result = await siteAPI.publishSite(layoutJSON);
      alert(result.message);
    } catch (error) {
      alert("Failed to publish");
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
          className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-600 text-white text-xs font-medium rounded-md hover:bg-slate-500 transition-colors"
        >
          <Save size={14} />
          Save
        </button>

        <button
          onClick={handlePublish}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-medium rounded-md hover:from-blue-500 hover:to-violet-500 transition-all shadow-md shadow-blue-500/20"
        >
          <Eye size={14} />
          Publish
        </button>
      </div>
    </div>
  );
}

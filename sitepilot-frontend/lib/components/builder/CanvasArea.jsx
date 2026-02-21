"use client";

/**
 * CANVAS AREA
 *
 * Main editing canvas with device preview and drop zones
 */

import { useState } from "react";
import CanvasRenderer from "../canvas/CanvasRenderer";
import useBuilderStore from "@/lib/stores/builderStore";
import useUIStore from "@/lib/stores/uiStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { defaultComponentProps } from "../registry";
import { clsx } from "clsx";

export default function CanvasArea() {
  const {
    layoutJSON,
    currentPageId,
    addComponent,
    addContainer,
    getLayoutJSON,
  } = useBuilderStore();
  const { devicePreview } = useUIStore();
  const { pushState } = useHistoryStore();

  // Get current page from layoutJSON and currentPageId
  const currentPage = layoutJSON?.pages?.find((p) => p.id === currentPageId);

  const handleDrop = (event, containerId, columnIndex) => {
    event.preventDefault();
    event.stopPropagation();

    const componentType = event.dataTransfer.getData("componentType");
    if (!componentType) return;

    const props = defaultComponentProps[componentType] || {};

    // Save state before modification
    pushState(getLayoutJSON());

    addComponent(containerId, columnIndex, componentType, props);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const getCanvasWidth = () => {
    switch (devicePreview) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      case "desktop":
      default:
        return "100%";
    }
  };

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">No page available</div>
          <div className="text-gray-500 text-sm">
            The builder is initializing...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F1F5F9] canvas-grid overflow-auto">
      <div className="min-h-full flex items-start justify-center p-6">
        <div
          className="bg-white shadow-xl rounded-lg transition-all duration-300 overflow-hidden"
          style={{
            width: getCanvasWidth(),
            minHeight: "100vh",
          }}
        >
          <CanvasWithDropZones
            page={currentPage}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CANVAS WITH DROP ZONES
// ============================================================================

function CanvasWithDropZones({ page, onDrop, onDragOver }) {
  return (
    <div className="relative">
      <CanvasRenderer page={page} onDrop={onDrop} onDragOver={onDragOver} />
    </div>
  );
}

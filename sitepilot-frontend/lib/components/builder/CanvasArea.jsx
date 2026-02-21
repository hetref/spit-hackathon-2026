"use client";

/**
 * CANVAS AREA
 *
 * Main editing canvas with device preview, drop zones,
 * collaborative cursor tracking, and block locking.
 *
 * Cursors are tracked ONLY inside this area (not toolbar / sidebars).
 */

import { useState, useRef, useCallback, useMemo } from "react";
import CanvasRenderer from "../canvas/CanvasRenderer";
import CursorLayer from "@/components/builder/CursorLayer";
import useBuilderStore from "@/lib/stores/builderStore";
import useUIStore from "@/lib/stores/uiStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { defaultComponentProps } from "../registry";
import { clsx } from "clsx";
import {
  useUpdateMyPresence,
  useOthers,
} from "@/lib/liveblocks-client";

export default function CanvasArea() {
  const {
    layoutJSON,
    currentPageId,
    addComponent,
    addContainer,
    getLayoutJSON,
    selectedNodeId,
    setSelectedNode,
  } = useBuilderStore();
  const { devicePreview } = useUIStore();
  const { pushState } = useHistoryStore();
  const canvasRef = useRef(null);

  // ── Liveblocks presence for cursor tracking ─────────────────────────────
  const updatePresence = useUpdateMyPresence();
  const others = useOthers();

  // Track cursor position relative to the canvas container
  const handlePointerMove = useCallback(
    (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      updatePresence({
        cursor: {
          x: e.clientX - rect.left + canvasRef.current.scrollLeft,
          y: e.clientY - rect.top + canvasRef.current.scrollTop,
        },
      });
    },
    [updatePresence]
  );

  const handlePointerLeave = useCallback(() => {
    updatePresence({ cursor: null });
  }, [updatePresence]);

  // ── Broadcast which node the local user has selected / is editing ───────
  const handleNodeSelect = useCallback(
    (nodeId) => {
      setSelectedNode(nodeId);
      updatePresence({
        selectedBlockId: nodeId,
        lockedBlockId: nodeId,
      });
    },
    [setSelectedNode, updatePresence]
  );

  const handleCanvasBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    updatePresence({
      selectedBlockId: null,
      lockedBlockId: null,
    });
  }, [setSelectedNode, updatePresence]);

  // ── Collect locked node IDs from other users ────────────────────────────
  const lockedByOthers = useMemo(() => {
    const map = {};
    for (const other of others) {
      const lockedId = other.presence?.lockedBlockId;
      if (lockedId) {
        map[lockedId] = {
          connectionId: other.connectionId,
          username: other.presence?.username || other.info?.name || "Anonymous",
          color: other.presence?.color || other.info?.color || "#999",
        };
      }
    }
    return map;
  }, [others]);

  // Get current page from layoutJSON and currentPageId
  const currentPage = layoutJSON?.pages?.find((p) => p.id === currentPageId);

  const handleDrop = (event, containerId, columnIndex) => {
    event.preventDefault();
    event.stopPropagation();

    const componentType = event.dataTransfer.getData("componentType");
    const componentId = event.dataTransfer.getData("componentId");
    const isExisting = event.dataTransfer.getData("isExisting") === "true";

    // Save state before modification
    pushState(getLayoutJSON());

    if (isExisting && componentId) {
      // Moving an existing component
      const { moveComponent } = useBuilderStore.getState();
      moveComponent(componentId, containerId, columnIndex);
    } else if (componentType) {
      // Adding a new component from sidebar
      const props = defaultComponentProps[componentType] || {};
      addComponent(containerId, columnIndex, componentType, props);
    }
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
      <div className="flex-1 flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center">
          <div className="text-gray-300 text-lg mb-2 font-black uppercase tracking-widest">No page available</div>
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            The builder is initializing...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="flex-1 bg-[#fcfdfc] overflow-auto relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="absolute inset-0 bg-[#fefefe] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-60 z-0 pointer-events-none" />

      {/* Remote cursors — scoped to canvas area only */}
      <CursorLayer />

      <div className="min-h-full flex items-start justify-center p-6 pl-20 relative z-10">
        <div
          className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] border border-gray-100 transition-all duration-300 overflow-hidden my-4"
          style={{
            width: getCanvasWidth(),
            minHeight: "100vh",
          }}
        >
          <CanvasWithDropZones
            page={currentPage}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            lockedByOthers={lockedByOthers}
            onNodeSelect={handleNodeSelect}
            onCanvasBackgroundClick={handleCanvasBackgroundClick}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CANVAS WITH DROP ZONES
// ============================================================================

function CanvasWithDropZones({ page, onDrop, onDragOver, lockedByOthers, onNodeSelect, onCanvasBackgroundClick }) {
  return (
    <div className="relative">
      <CanvasRenderer
        page={page}
        onDrop={onDrop}
        onDragOver={onDragOver}
        lockedByOthers={lockedByOthers}
        onNodeSelect={onNodeSelect}
        onCanvasBackgroundClick={onCanvasBackgroundClick}
      />
    </div>
  );
}

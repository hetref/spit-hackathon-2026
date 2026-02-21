"use client";

/**
 * CANVAS RENDERER
 *
 * Elementor-style layout: Container → Columns → Components
 * Handles selection, hover states, drop zones, and flex layout.
 */

import React, { useState } from "react";
import { componentRegistry } from "../registry";
import useBuilderStore from "@/lib/stores/builderStore";
import { clsx } from "clsx";
import { Box, GripVertical, Layers } from "lucide-react";

// ── Shared UI atoms ────────────────────────────────────────────────────────

/** Small coloured label that appears when a node is selected / hovered */
function NodeLabel({ label, color = "blue", position = "top-left" }) {
  const posMap = {
    "top-left": "-top-3 left-2",
    "top-right": "-top-3 right-2",
  };
  const bgMap = {
    blue: "bg-blue-600",
    violet: "bg-violet-600",
    emerald: "bg-emerald-600",
  };
  return (
    <span
      className={clsx(
        "absolute z-20 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-white shadow-sm pointer-events-none select-none",
        posMap[position],
        bgMap[color],
      )}
    >
      {label}
    </span>
  );
}

/** Corner resize handles shown on selected nodes */
function SelectionHandles() {
  const dot =
    "absolute w-2 h-2 rounded-full bg-blue-600 border-2 border-white shadow pointer-events-none";
  return (
    <>
      <span className={clsx(dot, "-top-1 -left-1")} />
      <span className={clsx(dot, "-top-1 -right-1")} />
      <span className={clsx(dot, "-bottom-1 -left-1")} />
      <span className={clsx(dot, "-bottom-1 -right-1")} />
    </>
  );
}

// ── Root Renderer ──────────────────────────────────────────────────────────

export default function CanvasRenderer({ page, onDrop, onDragOver }) {
  const { selectedNodeId, hoveredNodeId, setSelectedNode, setHoveredNode } =
    useBuilderStore();

  if (!page || !page.layout) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
        <Layers size={32} strokeWidth={1.5} />
        <span className="text-sm">No content to display</span>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-full bg-white"
      onClick={() => setSelectedNode(null)}
    >
      {page.layout.map(
        (container) =>
          !container.hidden && (
            <ContainerBlock
              key={container.id}
              container={container}
              isSelected={selectedNodeId === container.id}
              isHovered={hoveredNodeId === container.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(container.id);
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHoveredNode(container.id);
              }}
              onMouseLeave={() => setHoveredNode(null)}
              onDrop={onDrop}
              onDragOver={onDragOver}
            />
          ),
      )}
    </div>
  );
}

// ============================================================================
// CONTAINER
// ============================================================================

function ContainerBlock({
  container,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDrop,
  onDragOver,
}) {
  const settings = container.settings || {};
  const styles = container.styles || {};
  const isHorizontal = settings.direction !== "vertical";
  const contentWidth = settings.contentWidth || "boxed";
  const maxWidth = settings.maxWidth || 1280;
  const gap = settings.gap ?? 16;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={clsx(
        "relative transition-all duration-200 group/container",
        isSelected &&
          "ring-2 ring-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.3)]",
        isHovered && !isSelected && "ring-1 ring-violet-300",
      )}
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.textColor || "#1f2937",
        paddingTop: `${styles.paddingTop ?? 40}px`,
        paddingBottom: `${styles.paddingBottom ?? 40}px`,
        paddingLeft: `${styles.paddingLeft ?? 0}px`,
        paddingRight: `${styles.paddingRight ?? 0}px`,
        marginTop: `${styles.marginTop ?? 0}px`,
        marginBottom: `${styles.marginBottom ?? 0}px`,
      }}
    >
      {/* Selection handles */}
      {isSelected && <SelectionHandles />}

      {/* Label */}
      {isSelected && (
        <NodeLabel label="Container" color="violet" position="top-left" />
      )}
      {isHovered && !isSelected && (
        <NodeLabel label="Container" color="violet" position="top-left" />
      )}

      {/* Inner wrapper — handles content width + flex direction */}
      <div
        style={{
          maxWidth: contentWidth === "boxed" ? `${maxWidth}px` : "none",
          margin: contentWidth === "boxed" ? "0 auto" : undefined,
          padding: contentWidth === "boxed" ? "0 16px" : undefined,
          display: "flex",
          flexDirection: isHorizontal ? "row" : "column",
          gap: `${gap}px`,
          alignItems: isHorizontal
            ? settings.verticalAlign || "stretch"
            : undefined,
        }}
      >
        {container.columns.map((column, columnIndex) => (
          <Column
            key={column.id}
            column={column}
            columnIndex={columnIndex}
            containerId={container.id}
            isHorizontal={isHorizontal}
            isContainerSelected={isSelected}
            onDrop={onDrop}
            onDragOver={onDragOver}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COLUMN
// ============================================================================

function Column({
  column,
  columnIndex,
  containerId,
  isHorizontal,
  isContainerSelected,
  onDrop,
  onDragOver,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (event) => {
    setIsDragOver(false);
    if (onDrop) {
      onDrop(event, containerId, columnIndex);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
    if (onDragOver) onDragOver(event);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div
      className={clsx(
        "relative transition-all duration-200",
        isDragOver && "ring-2 ring-blue-400 ring-offset-1 rounded-lg",
        isContainerSelected && "outline-1 outline-dashed outline-violet-200",
      )}
      style={{
        width: isHorizontal ? `${(column.width / 12) * 100}%` : "100%",
        minHeight: "50px",
        backgroundColor: column.styles?.backgroundColor,
        paddingTop: column.styles?.paddingTop
          ? `${column.styles.paddingTop}px`
          : undefined,
        paddingBottom: column.styles?.paddingBottom
          ? `${column.styles.paddingBottom}px`
          : undefined,
        paddingLeft: column.styles?.paddingLeft
          ? `${column.styles.paddingLeft}px`
          : undefined,
        paddingRight: column.styles?.paddingRight
          ? `${column.styles.paddingRight}px`
          : undefined,
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {column.components.length === 0 ? (
        <div
          className={clsx(
            "h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-sm transition-all duration-200",
            isDragOver
              ? "border-blue-500 bg-blue-50/80 text-blue-600 scale-[1.01] shadow-inner"
              : "border-gray-200 text-gray-300 hover:border-gray-300 hover:text-gray-400",
          )}
          style={{ minHeight: "100px" }}
        >
          {isDragOver ? (
            <>
              <Box size={18} />
              <span className="text-xs font-medium">Drop here</span>
            </>
          ) : (
            <span className="text-xl leading-none">+</span>
          )}
        </div>
      ) : (
        <div
          className={clsx(
            "relative transition-all duration-200",
            isDragOver && "bg-blue-50/60 rounded-lg p-1",
          )}
        >
          {column.components.map(
            (component) =>
              !component.hidden && (
                <ComponentRenderer key={component.id} component={component} />
              ),
          )}
          {isDragOver && (
            <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none">
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg text-xs font-medium">
                Drop to add
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT RENDERER
// ============================================================================

function ComponentRenderer({ component }) {
  const { selectedNodeId, hoveredNodeId, setSelectedNode, setHoveredNode } =
    useBuilderStore();

  const Component = componentRegistry[component.type];

  if (!Component) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
        <span className="font-medium">Unknown:</span> &quot;{component.type}
        &quot;
      </div>
    );
  }

  const isSelected = selectedNodeId === component.id;
  const isHovered = hoveredNodeId === component.id;

  return (
    <div
      className={clsx(
        "relative transition-all duration-200",
        isSelected &&
          "ring-2 ring-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.3)] rounded-sm",
        isHovered && !isSelected && "ring-1 ring-blue-300 rounded-sm",
      )}
      onMouseEnter={(e) => {
        e.stopPropagation();
        setHoveredNode(component.id);
      }}
      onMouseLeave={() => setHoveredNode(null)}
    >
      {/* Selection handles */}
      {isSelected && <SelectionHandles />}

      {/* Label */}
      {isSelected && (
        <NodeLabel label={component.type} color="blue" position="top-right" />
      )}
      {isHovered && !isSelected && (
        <NodeLabel label={component.type} color="blue" position="top-right" />
      )}

      <Component
        props={component.props}
        styles={component.styles}
        isSelected={isSelected}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedNode(component.id);
        }}
      />
    </div>
  );
}

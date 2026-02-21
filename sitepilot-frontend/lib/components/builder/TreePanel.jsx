"use client";

/**
 * TREE / LAYERS PANEL
 *
 * Figma/Webflow-style hierarchical tree view showing page structure.
 * Features: expand/collapse, click to select, drag reorder, visibility toggle,
 * right-click context menu (delete, duplicate, rename).
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Box,
  Columns,
  Trash2,
  Copy,
  Pencil,
  GripVertical,
  Heading1,
  Type,
  Image,
  MousePointer2,
  Video,
  Map as MapIcon,
  Star,
  Minus,
  FormInput,
  AlignLeft,
  Square,
  Circle,
  CheckSquare,
  Link as LinkIcon,
  Grid3x3,
  Layout,
  Menu as MenuIcon,
  FileText,
} from "lucide-react";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { clsx } from "clsx";

// ─── Component type → icon mapping ──────────────────────────────────────────

const componentIconMap = {
  Heading: Heading1,
  Text: Type,
  Image: Image,
  Button: MousePointer2,
  Link: LinkIcon,
  LinkBox: Box,
  Divider: Minus,
  ImageBox: Box,
  Video: Video,
  Map: MapIcon,
  Icon: Star,
  Gallery: Grid3x3,
  Form: Square,
  Input: FormInput,
  Textarea: AlignLeft,
  Select: Square,
  Label: Type,
  Checkbox: CheckSquare,
  Radio: Circle,
  Hero: Layout,
  Features: Grid3x3,
  CTA: FileText,
  Navbar: MenuIcon,
  Footer: Layout,
};

function getComponentIcon(type) {
  return componentIconMap[type] || Box;
}

function getComponentLabel(comp) {
  // Try to derive a meaningful label from component props
  if (comp.props?.text && typeof comp.props.text === "string") {
    const trimmed = comp.props.text.replace(/<[^>]*>/g, "").trim();
    if (trimmed.length > 0)
      return trimmed.slice(0, 28) + (trimmed.length > 28 ? "…" : "");
  }
  if (comp.props?.label) return comp.props.label;
  if (comp.props?.alt) return comp.props.alt;
  return comp.type;
}

// ─── Context Menu ────────────────────────────────────────────────────────────

function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[9999] min-w-[160px] bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-1 text-xs"
      style={{ top: y, left: x }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className="my-1 border-t border-slate-700" />
        ) : (
          <button
            key={i}
            onClick={() => {
              item.action();
              onClose();
            }}
            className={clsx(
              "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
              item.danger
                ? "text-red-400 hover:bg-red-500/20"
                : "text-slate-300 hover:bg-slate-700",
            )}
          >
            {item.icon && <item.icon size={13} />}
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}

// ─── Inline rename input ─────────────────────────────────────────────────────

function InlineRename({ value, onConfirm, onCancel }) {
  const [newName, setNewName] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      autoFocus
      type="text"
      value={newName}
      onChange={(e) => setNewName(e.target.value)}
      onBlur={() => {
        if (newName.trim()) onConfirm(newName.trim());
        else onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (newName.trim()) onConfirm(newName.trim());
          else onCancel();
        }
        if (e.key === "Escape") onCancel();
      }}
      className="bg-slate-700 border border-blue-500 text-slate-200 text-xs rounded px-1.5 py-0.5 w-full max-w-[140px] outline-none"
    />
  );
}

// ─── Component tree node ─────────────────────────────────────────────────────

function ComponentNode({
  component,
  containerId,
  columnIndex,
  componentIndex,
  isSelected,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  dragOverId,
}) {
  const Icon = getComponentIcon(component.type);
  const label = getComponentLabel(component);

  return (
    <div
      draggable
      onDragStart={(e) =>
        onDragStart(
          e,
          "component",
          component.id,
          containerId,
          columnIndex,
          componentIndex,
        )
      }
      onDragOver={(e) => onDragOver(e, component.id)}
      onDrop={(e) => onDrop(e, containerId, columnIndex, componentIndex)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(component.id);
      }}
      onContextMenu={(e) => onContextMenu(e, "component", component)}
      className={clsx(
        "flex items-center gap-1.5 pl-12 pr-2 py-1.5 cursor-pointer group transition-colors text-xs select-none",
        isSelected
          ? "bg-blue-600/30 text-blue-300 border-l-2 border-blue-500"
          : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 border-l-2 border-transparent",
        component.hidden && "opacity-40",
        dragOverId === component.id &&
          "bg-blue-600/10 border-l-2 border-blue-400",
      )}
    >
      <GripVertical
        size={10}
        className="text-slate-600 opacity-0 group-hover:opacity-100 shrink-0 cursor-grab"
      />
      <Icon
        size={13}
        className={clsx(isSelected ? "text-blue-400" : "text-slate-500")}
      />
      <span className="truncate flex-1">{label}</span>

      {component.hidden && (
        <EyeOff size={12} className="text-slate-600 shrink-0" />
      )}
    </div>
  );
}

// ─── Column tree node ────────────────────────────────────────────────────────

function ColumnNode({
  column,
  columnIndex,
  containerId,
  selectedNodeId,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  dragOverId,
}) {
  const [expanded, setExpanded] = useState(true);
  const componentCount = column.components?.length || 0;

  return (
    <div>
      {/* Column header */}
      <div
        onDragOver={(e) => onDragOver(e, `col-${containerId}-${columnIndex}`)}
        onDrop={(e) =>
          onDrop(e, containerId, columnIndex, column.components?.length || 0)
        }
        className={clsx(
          "flex items-center gap-1.5 pl-7 pr-2 py-1.5 cursor-pointer group transition-colors text-xs select-none",
          "text-slate-500 hover:bg-slate-700/30 hover:text-slate-400",
          dragOverId === `col-${containerId}-${columnIndex}` &&
            "bg-blue-600/10",
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {componentCount > 0 ? (
          expanded ? (
            <ChevronDown size={12} className="text-slate-600 shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-slate-600 shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <Columns size={12} className="text-slate-600 shrink-0" />
        <span className="truncate flex-1">
          Column {columnIndex + 1}{" "}
          <span className="text-slate-600 text-[10px]">
            ({column.width}/12)
          </span>
        </span>
        <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100">
          {componentCount}
        </span>
      </div>

      {/* Components */}
      {expanded &&
        column.components?.map((comp, compIdx) => (
          <ComponentNode
            key={comp.id}
            component={comp}
            containerId={containerId}
            columnIndex={columnIndex}
            componentIndex={compIdx}
            isSelected={selectedNodeId === comp.id}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            dragOverId={dragOverId}
          />
        ))}
    </div>
  );
}

// ─── Container tree node ─────────────────────────────────────────────────────

function ContainerNode({
  container,
  containerIndex,
  selectedNodeId,
  onSelect,
  onContextMenu,
  renamingId,
  onRenameConfirm,
  onRenameCancel,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragOverId,
}) {
  const [expanded, setExpanded] = useState(true);
  const columnCount = container.columns?.length || 0;
  const componentCount =
    container.columns?.reduce(
      (sum, col) => sum + (col.components?.length || 0),
      0,
    ) || 0;
  const isSelected = selectedNodeId === container.id;
  const displayName = container.name || `Container ${containerIndex + 1}`;

  return (
    <div
      className={clsx(
        "border-b border-slate-700/50 last:border-0",
        container.hidden && "opacity-50",
      )}
    >
      {/* Container header */}
      <div
        draggable
        onDragStart={(e) =>
          onDragStart(e, "container", container.id, null, null, containerIndex)
        }
        onDragOver={(e) => onDragOver(e, container.id)}
        onDrop={(e) => onDrop(e, container.id, 0, 0)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(container.id);
        }}
        onContextMenu={(e) => onContextMenu(e, "container", container)}
        className={clsx(
          "flex items-center gap-1.5 px-2 py-2 cursor-pointer group transition-colors text-xs select-none",
          isSelected
            ? "bg-blue-600/20 text-blue-300"
            : "text-slate-300 hover:bg-slate-700/40 hover:text-slate-200",
        )}
      >
        <GripVertical
          size={11}
          className="text-slate-600 opacity-0 group-hover:opacity-100 shrink-0 cursor-grab"
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="shrink-0"
        >
          {expanded ? (
            <ChevronDown size={13} className="text-slate-500" />
          ) : (
            <ChevronRight size={13} className="text-slate-500" />
          )}
        </button>

        <Box
          size={13}
          className={clsx(
            isSelected ? "text-blue-400" : "text-slate-500",
            "shrink-0",
          )}
        />

        {renamingId === container.id ? (
          <InlineRename
            value={displayName}
            onConfirm={(name) => onRenameConfirm(container.id, name)}
            onCancel={onRenameCancel}
          />
        ) : (
          <span className="truncate flex-1 font-medium">{displayName}</span>
        )}

        <span className="text-[10px] text-slate-600 shrink-0 tabular-nums">
          {componentCount}w · {columnCount}c
        </span>

        {/* Visibility toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            useBuilderStore.getState().toggleContainerVisibility(container.id);
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-600 rounded transition-all"
          title={container.hidden ? "Show" : "Hide"}
        >
          {container.hidden ? (
            <EyeOff size={12} className="text-slate-500" />
          ) : (
            <Eye size={12} className="text-slate-500 hover:text-slate-300" />
          )}
        </button>
      </div>

      {/* Columns */}
      {expanded && (
        <div>
          {container.columns?.map((col, colIdx) => (
            <ColumnNode
              key={col.id}
              column={col}
              columnIndex={colIdx}
              containerId={container.id}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              dragOverId={dragOverId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main TreePanel ──────────────────────────────────────────────────────────

export default function TreePanel() {
  const {
    layoutJSON,
    currentPageId,
    selectedNodeId,
    setSelectedNode,
    deleteContainer,
    deleteComponent,
    duplicateContainer,
    duplicateComponent,
    renameContainer,
    reorderContainers,
    moveComponent,
    reorderComponent,
    toggleComponentVisibility,
  } = useBuilderStore();
  const { pushState, getLayoutJSON } = useHistoryStore();

  const [contextMenu, setContextMenu] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const dragRef = useRef(null);

  const page = layoutJSON?.pages?.find((p) => p.id === currentPageId);
  const containers = page?.layout || [];

  // ─── Selection handler ──────────────────────────────────────────
  const handleSelect = useCallback(
    (id) => {
      setSelectedNode(id);
    },
    [setSelectedNode],
  );

  // ─── Context menu handler ───────────────────────────────────────
  const handleContextMenu = useCallback(
    (e, nodeType, node) => {
      e.preventDefault();
      e.stopPropagation();

      const items = [];

      if (nodeType === "container") {
        items.push(
          {
            label: "Rename",
            icon: Pencil,
            action: () => setRenamingId(node.id),
          },
          {
            label: "Duplicate",
            icon: Copy,
            action: () => {
              pushState(useBuilderStore.getState().getLayoutJSON());
              duplicateContainer(node.id);
            },
          },
          { separator: true },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            action: () => {
              pushState(useBuilderStore.getState().getLayoutJSON());
              deleteContainer(node.id);
            },
          },
        );
      } else if (nodeType === "component") {
        items.push(
          {
            label: "Duplicate",
            icon: Copy,
            action: () => {
              pushState(useBuilderStore.getState().getLayoutJSON());
              duplicateComponent(node.id);
            },
          },
          {
            label: node.hidden ? "Show" : "Hide",
            icon: node.hidden ? Eye : EyeOff,
            action: () => toggleComponentVisibility(node.id),
          },
          { separator: true },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            action: () => {
              pushState(useBuilderStore.getState().getLayoutJSON());
              deleteComponent(node.id);
            },
          },
        );
      }

      setContextMenu({ x: e.clientX, y: e.clientY, items });
    },
    [
      pushState,
      duplicateContainer,
      deleteContainer,
      duplicateComponent,
      deleteComponent,
      toggleComponentVisibility,
    ],
  );

  // ─── Rename handler ────────────────────────────────────────────
  const handleRenameConfirm = useCallback(
    (containerId, name) => {
      pushState(useBuilderStore.getState().getLayoutJSON());
      renameContainer(containerId, name);
      setRenamingId(null);
    },
    [pushState, renameContainer],
  );

  // ─── Drag & Drop handlers ──────────────────────────────────────
  const handleDragStart = useCallback(
    (e, nodeType, nodeId, containerId, columnIndex, index) => {
      dragRef.current = { nodeType, nodeId, containerId, columnIndex, index };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", nodeId); // required for Firefox
    },
    [],
  );

  const handleDragOver = useCallback((e, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(targetId);
  }, []);

  const handleDrop = useCallback(
    (e, targetContainerId, targetColumnIndex, targetIndex) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(null);

      const drag = dragRef.current;
      if (!drag) return;

      pushState(useBuilderStore.getState().getLayoutJSON());

      if (drag.nodeType === "container") {
        // Reorder containers
        const fromIdx = containers.findIndex((c) => c.id === drag.nodeId);
        const toIdx = containers.findIndex((c) => c.id === targetContainerId);
        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
          reorderContainers(fromIdx, toIdx);
        }
      } else if (drag.nodeType === "component") {
        // If same column, reorder; otherwise move
        if (
          drag.containerId === targetContainerId &&
          drag.columnIndex === targetColumnIndex
        ) {
          if (drag.index !== targetIndex) {
            reorderComponent(
              targetContainerId,
              targetColumnIndex,
              drag.index,
              targetIndex,
            );
          }
        } else {
          moveComponent(
            drag.nodeId,
            targetContainerId,
            targetColumnIndex,
            targetIndex,
          );
        }
      }

      dragRef.current = null;
    },
    [containers, pushState, reorderContainers, moveComponent, reorderComponent],
  );

  const handleDragEnd = useCallback(() => {
    setDragOverId(null);
    dragRef.current = null;
  }, []);

  // ─── Empty state ───────────────────────────────────────────────
  if (containers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <Box size={32} className="text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No containers yet.</p>
          <p className="text-[10px] text-slate-600 mt-1">
            Add a container from the Elements tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page label */}
      <div className="px-3 py-2 border-b border-slate-700/50 flex items-center gap-2">
        <FileText size={12} className="text-slate-500" />
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Page Structure
        </span>
        <span className="ml-auto text-[10px] text-slate-600 tabular-nums">
          {containers.length} containers
        </span>
      </div>

      {/* Tree */}
      <div onDragLeave={() => setDragOverId(null)}>
        {containers.map((container, idx) => (
          <ContainerNode
            key={container.id}
            container={container}
            containerIndex={idx}
            selectedNodeId={selectedNodeId}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
            renamingId={renamingId}
            onRenameConfirm={handleRenameConfirm}
            onRenameCancel={() => setRenamingId(null)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            dragOverId={dragOverId}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

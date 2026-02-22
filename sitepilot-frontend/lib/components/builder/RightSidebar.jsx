"use client";

/**
 * RIGHT SIDEBAR
 *
 * Properties and styles editor for selected component.
 * Shows a "locked" message when the selected node is being edited by another user.
 */

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import useUIStore from "@/lib/stores/uiStore";
import { Trash2, Copy, Plus, Minus, Settings2, Paintbrush, Lock, X, Image as ImageIcon, Wand2, Loader2, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import FormSelector from "./FormSelector";
import { useOthers } from "@/lib/liveblocks-client";

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
  'Raleway', 'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display', 'Poppins',
  'Ubuntu', 'Mukta', 'Rubik', 'Work Sans', 'Noto Sans', 'Fira Sans', 'Quicksand',
  'Karla', 'Cabin', 'Barlow', 'Crimson Text', 'Bitter', 'Arimo', 'Titillium Web',
  'DM Sans', 'Manrope', 'Space Grotesk', 'Plus Jakarta Sans', 'Outfit', 'Lexend'
].sort();

export default function RightSidebar() {
  const store = useBuilderStore();
  const {
    layoutJSON,
    selectedNodeId,
    currentPageId,
    updateComponentProps,
    updateComponentStyles,
    deleteComponent,
    duplicateComponent,
    deleteContainer,
    duplicateContainer,
    updateContainerStyles,
    updateContainerSettings,
    addColumnToContainer,
    removeColumnFromContainer,
    updateColumnWidth,
    getLayoutJSON,
  } = store;
  
  const siteId = store.siteId;

  // Global settings (colors/fonts)
  const [globalSettings, setGlobalSettings] = useState(null);
  const [brandKit, setBrandKit] = useState(null);

  useEffect(() => {
    if (!siteId) return;
    // Fetch site global settings
    fetch(`/api/sites/${siteId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.site?.globalSettings) {
          setGlobalSettings(data.site.globalSettings);
        }
        // Also fetch brand kit from tenant
        if (data?.site?.tenantId) {
          fetch(`/api/tenants/${data.site.tenantId}/brand-kit`)
            .then(res => res.ok ? res.json() : null)
            .then(bk => { if (bk?.brandKit) setBrandKit(bk.brandKit); })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [siteId]);

  // Resolve effective global colors/fonts
  const effectiveGlobalColors = useMemo(() => {
    if (globalSettings?.colorMode === 'custom' && globalSettings?.globalColors) {
      return globalSettings.globalColors;
    }
    if (brandKit?.colors) return brandKit.colors;
    return { primary: '#3B82F6', secondary: '#8B5CF6', tertiary: '#EC4899' };
  }, [globalSettings, brandKit]);

  const effectiveGlobalFonts = useMemo(() => {
    if (globalSettings?.fontMode === 'custom' && globalSettings?.globalFonts) {
      return globalSettings.globalFonts;
    }
    if (brandKit?.fonts) return brandKit.fonts;
    return { heading: 'Poppins', body: 'Inter' };
  }, [globalSettings, brandKit]);
  
  const { pushState } = useHistoryStore();
  const { rightSidebarOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState("properties");

  // ── Check if the selected node is locked by another user ──────────────
  const others = useOthers();
  const selectedNodeLock = useMemo(() => {
    if (!selectedNodeId) return null;
    for (const other of others) {
      if (other.presence?.lockedBlockId === selectedNodeId) {
        return {
          username: other.presence?.username || other.info?.name || "Anonymous",
          color: other.presence?.color || other.info?.color || "#999",
        };
      }
    }
    return null;
  }, [selectedNodeId, others]);

  // ✅ Find selected node from current layout state
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !layoutJSON) return null;

    const page = layoutJSON.pages.find((p) => p.id === currentPageId);
    if (!page) return null;

    // Search for the node
    for (const container of page.layout) {
      if (container.id === selectedNodeId) return container;

      for (const column of container.columns) {
        for (const component of column.components) {
          if (component.id === selectedNodeId) return component;
        }
      }
    }

    return null;
  }, [layoutJSON, selectedNodeId, currentPageId]);

  if (!selectedNodeId || !selectedNode) {
    return (
      <div className={clsx(
        "w-80 bg-[#fcfdfc] border-l border-gray-100 flex flex-col h-full min-h-0 builder-sidebar z-20 shrink-0 absolute right-0 md:relative",
        rightSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        !rightSidebarOpen && "max-md:hidden"
      )}>
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
            <Settings2 size={20} className="text-[#8bc4b1] opacity-50" />
          </div>
          <p className="text-[10px] font-black tracking-widest uppercase text-[#1d2321]">Select an element</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 leading-relaxed">
            Click on any component or container on the canvas to view properties
          </p>
        </div>
      </div>
    );
  }

  // ── If the selected node is locked by another user ─────────────────────
  if (selectedNodeLock) {
    return (
      <div className={clsx(
        "w-80 bg-[#fcfdfc] border-l border-gray-100 flex flex-col h-full min-h-0 builder-sidebar z-20 shrink-0 absolute right-0 md:relative",
        rightSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        !rightSidebarOpen && "max-md:hidden"
      )}>
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border"
            style={{ backgroundColor: `${selectedNodeLock.color}10`, borderColor: `${selectedNodeLock.color}30` }}
          >
            <Lock size={20} style={{ color: selectedNodeLock.color }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1d2321]">Element Locked</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 leading-relaxed">
            <span
              className="mr-1"
              style={{ color: selectedNodeLock.color }}
            >
              {selectedNodeLock.username}
            </span>
            is currently editing
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mt-4 leading-relaxed">
            You can view real-time changes but cannot edit until they finish.
          </p>
        </div>
      </div>
    );
  }

  const isContainer = selectedNode.type === "container";
  const isComponent = selectedNode.type !== "container";

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this element?")) {
      pushState(getLayoutJSON());

      if (isContainer) {
        deleteContainer(selectedNodeId);
      } else {
        deleteComponent(selectedNodeId);
      }
    }
  };

  const handleDuplicate = () => {
    pushState(getLayoutJSON());
    if (isContainer) {
      duplicateContainer(selectedNodeId);
    } else {
      duplicateComponent(selectedNodeId);
    }
  };

  // ✅ Property update handler with history tracking
  const handleUpdateProps = (props) => {
    pushState(getLayoutJSON());
    updateComponentProps(selectedNodeId, props);
  };

  const handleUpdateStyles = (styles) => {
    pushState(getLayoutJSON());
    if (isContainer) {
      updateContainerStyles(selectedNodeId, styles);
    } else {
      updateComponentStyles(selectedNodeId, styles);
    }
  };

  return (
    <div className={clsx(
      "w-80 bg-white/80 backdrop-blur-md border-l border-gray-100 flex flex-col h-full min-h-0 builder-sidebar z-20 shadow-sm shrink-0 absolute right-0 md:relative bg-white",
      rightSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
      !rightSidebarOpen && "max-md:hidden"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Editing</p>
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  "w-2 h-2 rounded-full",
                  isContainer ? "bg-[#d3ff4a]" : "bg-[#0b1411]",
                )}
              />
              <h3 className="text-xl font-black text-[#1d2321] uppercase tracking-tighter">
                {isContainer ? "Container" : selectedNode.type}
              </h3>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleDuplicate}
              className="p-2 hover:bg-[#f2f4f2] hover:text-[#0b1411] rounded-xl text-gray-400 transition-colors"
              title="Duplicate"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f2f4f2] rounded-full p-1 border border-gray-100 shadow-inner">
          <button
            onClick={() => setActiveTab("properties")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300",
              activeTab === "properties"
                ? "bg-white text-[#0b1411] shadow-sm transform scale-105"
                : "text-gray-400 hover:text-gray-900",
            )}
          >
            <Settings2 size={12} />
            Properties
          </button>
          <button
            onClick={() => setActiveTab("styles")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300",
              activeTab === "styles"
                ? "bg-white text-[#0b1411] shadow-sm transform scale-105"
                : "text-gray-400 hover:text-gray-900",
            )}
          >
            <Paintbrush size={12} />
            Styles
          </button>
        </div>
      </div>

      {/* Content */}
      <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-4">
        {activeTab === "properties" && isComponent && (
          <PropertiesEditor
            component={selectedNode}
            onUpdate={handleUpdateProps}
            siteId={siteId}
          />
        )}

        {activeTab === "styles" && isComponent && (
          <StylesEditor
            styles={selectedNode.styles || {}}
            onUpdate={handleUpdateStyles}
            globalColors={effectiveGlobalColors}
            globalFonts={effectiveGlobalFonts}
          />
        )}

        {activeTab === "styles" && isContainer && (
          <StylesEditor
            styles={selectedNode.styles || {}}
            onUpdate={handleUpdateStyles}
            globalColors={effectiveGlobalColors}
            globalFonts={effectiveGlobalFonts}
          />
        )}

        {activeTab === "properties" && isContainer && (
          <ContainerPropertiesEditor
            container={selectedNode}
            onUpdateSettings={(settings) => {
              pushState(getLayoutJSON());
              updateContainerSettings(selectedNodeId, settings);
            }}
            onAddColumn={() => {
              pushState(getLayoutJSON());
              addColumnToContainer(selectedNodeId);
            }}
            onRemoveColumn={(colIndex) => {
              pushState(getLayoutJSON());
              removeColumnFromContainer(selectedNodeId, colIndex);
            }}
            onUpdateColumnWidth={(colIndex, width) => {
              pushState(getLayoutJSON());
              updateColumnWidth(selectedNodeId, colIndex, width);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONTAINER PROPERTIES EDITOR
// ============================================================================

function ContainerPropertiesEditor({
  container,
  onUpdateSettings,
  onAddColumn,
  onRemoveColumn,
  onUpdateColumnWidth,
}) {
  const settings = container.settings || {};

  return (
    <div className="space-y-4">
      {/* Direction */}
      <SelectField
        label="Direction"
        value={settings.direction || "horizontal"}
        options={[
          { value: "horizontal", label: "Horizontal (Row)" },
          { value: "vertical", label: "Vertical (Column)" },
        ]}
        onChange={(v) => onUpdateSettings({ direction: v })}
      />

      {/* Content Width */}
      <SelectField
        label="Content Width"
        value={settings.contentWidth || "boxed"}
        options={[
          { value: "boxed", label: "Boxed" },
          { value: "full", label: "Full Width" },
        ]}
        onChange={(v) => onUpdateSettings({ contentWidth: v })}
      />

      {/* Max Width (only when boxed) */}
      {(settings.contentWidth || "boxed") === "boxed" && (
        <InputField
          label="Max Width (px)"
          type="number"
          value={settings.maxWidth || 1280}
          onChange={(v) => onUpdateSettings({ maxWidth: parseInt(v) || 1280 })}
        />
      )}

      {/* Gap */}
      <InputField
        label="Gap (px)"
        type="number"
        value={settings.gap ?? 16}
        onChange={(v) => onUpdateSettings({ gap: parseInt(v) || 0 })}
      />

      {/* Vertical Align */}
      <SelectField
        label="Vertical Align"
        value={settings.verticalAlign || "stretch"}
        options={[
          { value: "stretch", label: "Stretch" },
          { value: "flex-start", label: "Top" },
          { value: "center", label: "Center" },
          { value: "flex-end", label: "Bottom" },
        ]}
        onChange={(v) => onUpdateSettings({ verticalAlign: v })}
      />

      {/* Column Widths */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Columns (width out of 12)
        </label>
        <div className="space-y-2">
          {(container.columns || []).map((col, i) => (
            <div key={col.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
              {/* Visual bar */}
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-200 rounded transition-all"
                  style={{ width: `${(col.width / 12) * 100}%` }}
                />
              </div>
              <input
                type="number"
                min={1}
                max={12}
                value={col.width}
                onChange={(e) =>
                  onUpdateColumnWidth(i, parseInt(e.target.value) || 1)
                }
                className="w-14 px-2 py-1 border border-gray-200 rounded text-sm text-center"
              />
              {container.columns.length > 1 && (
                <button
                  onClick={() => onRemoveColumn(i)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Remove column"
                >
                  <Minus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onAddColumn}
          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          <Plus size={14} /> Add Column
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PROPERTIES EDITOR
// ============================================================================

function PropertiesEditor({ component, onUpdate, siteId }) {
  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  const props = component.props || {};
  const componentType = component.type;

  // Dynamic property fields based on component type
  return (
    <div className="space-y-4">
      {/* Hero Component */}
      {component.type === "Hero" && (
        <>
          <InputField
            label="Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Subtitle"
            value={props.subtitle || ""}
            onChange={(value) => handleChange("subtitle", value)}
            multiline
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="CTA Text"
            value={props.ctaText || ""}
            onChange={(value) => handleChange("ctaText", value)}
          />
          <InputField
            label="CTA Link"
            value={props.ctaLink || ""}
            onChange={(value) => handleChange("ctaLink", value)}
          />
          <MediaField
            label="Background Image"
            value={props.backgroundImage || ""}
            onChange={(value) => handleChange("backgroundImage", value)}
          />
        </>
      )}

      {/* Text Component */}
      {component.type === "Text" && (
        <>
          <InputField
            label="Content"
            value={props.content || ""}
            onChange={(value) => handleChange("content", value)}
            multiline
            aiRewrite={true}
            componentType={componentType}
          />
          <SelectField
            label="Variant"
            value={props.variant || "p"}
            options={[
              { value: "h1", label: "Heading 1" },
              { value: "h2", label: "Heading 2" },
              { value: "h3", label: "Heading 3" },
              { value: "h4", label: "Heading 4" },
              { value: "p", label: "Paragraph" },
            ]}
            onChange={(value) => handleChange("variant", value)}
          />
        </>
      )}

      {/* Image Component */}
      {component.type === "Image" && (
        <>
          <MediaField
            label="Image File"
            value={props.src || ""}
            onChange={(value) => handleChange("src", value)}
          />
          <InputField
            label="Alt Text"
            value={props.alt || ""}
            onChange={(value) => handleChange("alt", value)}
          />
          <InputField
            label="Width (px)"
            type="number"
            value={props.width || ""}
            onChange={(value) =>
              handleChange("width", value ? parseInt(value) : null)
            }
          />
          <InputField
            label="Height (px)"
            type="number"
            value={props.height || ""}
            onChange={(value) =>
              handleChange("height", value ? parseInt(value) : null)
            }
          />
          <SelectField
            label="Object Fit"
            value={props.objectFit || "cover"}
            options={[
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
              { value: "fill", label: "Fill" },
              { value: "none", label: "None" },
              { value: "scale-down", label: "Scale Down" },
            ]}
            onChange={(value) => handleChange("objectFit", value)}
          />
          <InputField
            label="Border Radius (px)"
            type="number"
            value={props.borderRadius || 0}
            onChange={(value) =>
              handleChange("borderRadius", parseInt(value) || 0)
            }
          />
          <LinkField
            label="Link URL (optional)"
            value={props.linkUrl || ""}
            onChange={(value) => handleChange("linkUrl", value)}
          />
        </>
      )}

      {/* Button Component */}
      {component.type === "Button" && (
        <>
          <InputField
            label="Button Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <LinkField
            label="Link"
            value={props.link || ""}
            onChange={(value) => handleChange("link", value)}
          />
          <SelectField
            label="Open In"
            value={props.openInNewTab ? "new" : "same"}
            options={[
              { value: "same", label: "Same Tab" },
              { value: "new", label: "New Tab" },
            ]}
            onChange={(value) => handleChange("openInNewTab", value === "new")}
          />
          <SelectField
            label="Variant"
            value={props.variant || "primary"}
            options={[
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "outline", label: "Outline" },
            ]}
            onChange={(value) => handleChange("variant", value)}
          />
        </>
      )}

      {/* CTA Component */}
      {component.type === "CTA" && (
        <>
          <InputField
            label="Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Description"
            value={props.description || ""}
            onChange={(value) => handleChange("description", value)}
            multiline
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Button Text"
            value={props.buttonText || ""}
            onChange={(value) => handleChange("buttonText", value)}
          />
        </>
      )}

      {/* Heading Component */}
      {component.type === "Heading" && (
        <>
          <InputField
            label="Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <SelectField
            label="Level"
            value={props.level || "h2"}
            options={[
              { value: "h1", label: "H1" },
              { value: "h2", label: "H2" },
              { value: "h3", label: "H3" },
              { value: "h4", label: "H4" },
              { value: "h5", label: "H5" },
              { value: "h6", label: "H6" },
            ]}
            onChange={(value) => handleChange("level", value)}
          />
        </>
      )}

      {/* Link Component */}
      {component.type === "Link" && (
        <>
          <InputField
            label="Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
          />
          <LinkField
            label="URL"
            value={props.href || ""}
            onChange={(value) => handleChange("href", value)}
          />
          <SelectField
            label="Open In"
            value={props.openInNewTab ? "new" : "same"}
            options={[
              { value: "same", label: "Same Tab" },
              { value: "new", label: "New Tab" },
            ]}
            onChange={(value) => handleChange("openInNewTab", value === "new")}
          />
        </>
      )}

      {/* LinkBox Component */}
      {component.type === "LinkBox" && (
        <>
          <InputField
            label="Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
          />
          <InputField
            label="Description"
            value={props.description || ""}
            onChange={(value) => handleChange("description", value)}
          />
          <LinkField
            label="URL"
            value={props.href || ""}
            onChange={(value) => handleChange("href", value)}
          />
          <SelectField
            label="Open In"
            value={props.openInNewTab ? "new" : "same"}
            options={[
              { value: "same", label: "Same Tab" },
              { value: "new", label: "New Tab" },
            ]}
            onChange={(value) => handleChange("openInNewTab", value === "new")}
          />
        </>
      )}

      {/* ImageBox Component */}
      {component.type === "ImageBox" && (
        <>
          <MediaField
            label="Image File"
            value={props.src || ""}
            onChange={(value) => handleChange("src", value)}
          />
          <InputField
            label="Alt Text"
            value={props.alt || ""}
            onChange={(value) => handleChange("alt", value)}
          />
          <InputField
            label="Caption"
            value={props.caption || ""}
            onChange={(value) => handleChange("caption", value)}
          />
          <InputField
            label="Aspect Ratio"
            value={props.aspectRatio || "16/9"}
            onChange={(value) => handleChange("aspectRatio", value)}
          />
        </>
      )}

      {/* Video Component */}
      {component.type === "Video" && (
        <>
          <MediaField
            label="Video File"
            value={props.url || ""}
            onChange={(value) => handleChange("url", value)}
          />
          <SelectField
            label="Type"
            value={props.type || "youtube"}
            options={[
              { value: "youtube", label: "YouTube" },
              { value: "vimeo", label: "Vimeo" },
              { value: "direct", label: "Direct URL" },
            ]}
            onChange={(value) => handleChange("type", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.autoplay || false}
              onChange={(e) => handleChange("autoplay", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Autoplay</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.controls !== false}
              onChange={(e) => handleChange("controls", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Show controls</label>
          </div>
        </>
      )}

      {/* Map Component */}
      {component.type === "Map" && (
        <>
          <InputField
            label="Address"
            value={props.address || ""}
            onChange={(value) => handleChange("address", value)}
          />
          <InputField
            label="Height (px)"
            type="number"
            value={props.height || 400}
            onChange={(value) => handleChange("height", parseInt(value))}
          />
          <InputField
            label="Zoom Level"
            type="number"
            value={props.zoom || 15}
            onChange={(value) => handleChange("zoom", parseInt(value))}
          />
        </>
      )}

      {/* Icon Component */}
      {component.type === "Icon" && (
        <>
          <InputField
            label="Icon Name"
            value={props.name || "Star"}
            onChange={(value) => handleChange("name", value)}
          />
          <InputField
            label="Size (px)"
            type="number"
            value={props.size || 24}
            onChange={(value) => handleChange("size", parseInt(value))}
          />
        </>
      )}

      {/* Input Component */}
      {component.type === "Input" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Placeholder"
            value={props.placeholder || ""}
            onChange={(value) => handleChange("placeholder", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <SelectField
            label="Type"
            value={props.type || "text"}
            options={[
              { value: "text", label: "Text" },
              { value: "email", label: "Email" },
              { value: "password", label: "Password" },
              { value: "number", label: "Number" },
              { value: "tel", label: "Phone" },
              { value: "url", label: "URL" },
            ]}
            onChange={(value) => handleChange("type", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </>
      )}

      {/* Textarea Component */}
      {component.type === "Textarea" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Placeholder"
            value={props.placeholder || ""}
            onChange={(value) => handleChange("placeholder", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <InputField
            label="Rows"
            type="number"
            value={props.rows || 4}
            onChange={(value) => handleChange("rows", parseInt(value))}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </>
      )}

      {/* Checkbox Component */}
      {component.type === "Checkbox" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.checked || false}
              onChange={(e) => handleChange("checked", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Default checked</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </>
      )}

      {/* Select Component */}
      {component.type === "Select" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <InputField
            label="Placeholder"
            value={props.placeholder || ""}
            onChange={(value) => handleChange("placeholder", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
          <OptionsEditor
            label="Options"
            options={props.options || []}
            onChange={(options) => handleChange("options", options)}
          />
        </>
      )}

      {/* Radio Component */}
      {component.type === "Radio" && (
        <>
          <InputField
            label="Group Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
          <OptionsEditor
            label="Options"
            options={props.options || []}
            onChange={(options) => handleChange("options", options)}
          />
        </>
      )}

      {/* Label Component */}
      {component.type === "Label" && (
        <>
          <InputField
            label="Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
          />
          <InputField
            label="For (input name)"
            value={props.htmlFor || ""}
            onChange={(value) => handleChange("htmlFor", value)}
          />
        </>
      )}

      {/* FormEmbed Component */}
      {component.type === "FormEmbed" && (
        <>
          {siteId ? (
            <FormSelector
              value={props.formId}
              siteId={siteId}
              onChange={(formId, formName) => {
                handleChange("formId", formId);
                handleChange("formName", formName);
              }}
            />
          ) : (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border border-gray-200">
              Loading site information...
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={props.showTitle !== false}
              onChange={(e) => handleChange("showTitle", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Show form title</label>
          </div>
          {props.formId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              Form will be rendered when the page is published.
            </div>
          )}
        </>
      )}

      {/* Form Component */}
      {component.type === "Form" && (
        <>
          <InputField
            label="Action URL"
            value={props.action || ""}
            onChange={(value) => handleChange("action", value)}
          />
          <SelectField
            label="Method"
            value={props.method || "POST"}
            options={[
              { value: "GET", label: "GET" },
              { value: "POST", label: "POST" },
            ]}
            onChange={(value) => handleChange("method", value)}
          />
          <InputField
            label="Form Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
        </>
      )}

      {/* Divider Component */}
      {component.type === "Divider" && (
        <>
          <InputField
            label="Thickness (px)"
            type="number"
            value={props.thickness || 1}
            onChange={(value) => handleChange("thickness", parseInt(value))}
          />
          <SelectField
            label="Style"
            value={props.style || "solid"}
            options={[
              { value: "solid", label: "Solid" },
              { value: "dashed", label: "Dashed" },
              { value: "dotted", label: "Dotted" },
            ]}
            onChange={(value) => handleChange("style", value)}
          />
        </>
      )}

      {/* Gallery Component */}
      {component.type === "Gallery" && (
        <>
          <InputField
            label="Columns"
            type="number"
            value={props.columns || 3}
            onChange={(value) => handleChange("columns", parseInt(value))}
          />
          <GalleryEditor
            images={props.images || []}
            onChange={(images) => handleChange("images", images)}
          />
        </>
      )}

      {/* Features Component */}
      {component.type === "Features" && (
        <>
          <InputField
            label="Section Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
          />
          <FeaturesEditor
            items={props.items || []}
            onChange={(items) => handleChange("items", items)}
          />
        </>
      )}

      {/* Navbar Component */}
      {component.type === "Navbar" && (
        <>
          <InputField
            label="Logo Text"
            value={props.logo || ""}
            onChange={(value) => handleChange("logo", value)}
          />
          <NavLinksEditor
            links={props.links || []}
            onChange={(links) => handleChange("links", links)}
          />
        </>
      )}

      {/* Footer Component */}
      {component.type === "Footer" && (
        <>
          <InputField
            label="Copyright"
            value={props.copyright || ""}
            onChange={(value) => handleChange("copyright", value)}
          />
          <NavLinksEditor
            links={props.links || []}
            onChange={(links) => handleChange("links", links)}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// STYLES EDITOR
// ============================================================================

function StylesEditor({ styles, onUpdate, globalColors, globalFonts }) {
  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  return (
    <div className="space-y-5">
      {/* Spacing Section */}
      <div>
        <SectionLabel>Spacing</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label="Pad Top"
            type="number"
            value={styles.paddingTop || ""}
            onChange={(value) =>
              handleChange("paddingTop", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Pad Bottom"
            type="number"
            value={styles.paddingBottom || ""}
            onChange={(value) =>
              handleChange("paddingBottom", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Pad Left"
            type="number"
            value={styles.paddingLeft || ""}
            onChange={(value) =>
              handleChange("paddingLeft", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Pad Right"
            type="number"
            value={styles.paddingRight || ""}
            onChange={(value) =>
              handleChange("paddingRight", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Margin Top"
            type="number"
            value={styles.marginTop || ""}
            onChange={(value) =>
              handleChange("marginTop", parseInt(value) || 0)
            }
            compact
          />
          <InputField
            label="Margin Bottom"
            type="number"
            value={styles.marginBottom || ""}
            onChange={(value) =>
              handleChange("marginBottom", parseInt(value) || 0)
            }
            compact
          />
        </div>
      </div>

      {/* Colors Section */}
      <div>
        <SectionLabel>Colors</SectionLabel>
        <div className="space-y-3">
          <GlobalColorField
            label="Background"
            value={styles.backgroundColor || "#ffffff"}
            onChange={(v) => handleChange("backgroundColor", v)}
            globalColors={globalColors}
          />
          <GlobalColorField
            label="Text Color"
            value={styles.textColor || "#1f2937"}
            onChange={(v) => handleChange("textColor", v)}
            globalColors={globalColors}
          />
        </div>
      </div>

      {/* Typography Section */}
      <div>
        <SectionLabel>Typography</SectionLabel>
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
            <select
              value={styles.fontFamily || ''}
              onChange={(e) => handleChange("fontFamily", e.target.value || undefined)}
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              style={{ fontFamily: styles.fontFamily || globalFonts?.body || 'inherit' }}
            >
              <option value="">Global Default ({globalFonts?.body || 'Inter'})</option>
              <optgroup label="Google Fonts">
                {GOOGLE_FONTS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <SelectField
            label="Text Align"
            value={styles.textAlign || "left"}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            onChange={(value) => handleChange("textAlign", value)}
          />
          <InputField
            label="Font Size (px)"
            type="number"
            value={styles.fontSize || ""}
            onChange={(value) => handleChange("fontSize", parseInt(value) || 0)}
          />
          <SelectField
            label="Font Weight"
            value={styles.fontWeight || ""}
            options={[
              { value: "", label: "Default" },
              { value: "300", label: "Light" },
              { value: "400", label: "Regular" },
              { value: "500", label: "Medium" },
              { value: "600", label: "Semibold" },
              { value: "700", label: "Bold" },
              { value: "800", label: "Extrabold" },
              { value: "900", label: "Black" },
            ]}
            onChange={(value) => handleChange("fontWeight", value || undefined)}
          />
        </div>
      </div>

      {/* Border Section */}
      <div>
        <SectionLabel>Border</SectionLabel>
        <InputField
          label="Border Radius (px)"
          type="number"
          value={styles.borderRadius || ""}
          onChange={(value) =>
            handleChange("borderRadius", parseInt(value) || 0)
          }
        />
      </div>
    </div>
  );
}

// ============================================================================
// SECTION LABEL
// ============================================================================

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

// ============================================================================
// COLOR FIELD
// ============================================================================

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-xs font-mono text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="#ffffff"
        />
      </div>
    </div>
  );
}

// ============================================================================
// OPTIONS EDITOR (for Radio, Select)
// ============================================================================

function OptionsEditor({ label, options, onChange }) {
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange(newOptions);
  };

  const handleAddOption = () => {
    const newOptions = [
      ...options,
      { label: `Option ${options.length + 1}`, value: `${options.length + 1}` },
    ];
    onChange(newOptions);
  };

  const handleRemoveOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={option.label || ""}
              onChange={(e) =>
                handleOptionChange(index, "label", e.target.value)
              }
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Label"
            />
            <input
              type="text"
              value={option.value || ""}
              onChange={(e) =>
                handleOptionChange(index, "value", e.target.value)
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Value"
            />
            <button
              onClick={() => handleRemoveOption(index)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Remove option"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddOption}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add option
      </button>
    </div>
  );
}

// ============================================================================
// GALLERY EDITOR (for Gallery images)
// ============================================================================

function GalleryEditor({ images, onChange }) {
  const handleImageChange = (index, field, value) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    onChange(newImages);
  };

  const handleAddImage = () => {
    onChange([
      ...images,
      {
        src: "https://via.placeholder.com/400",
        alt: `Image ${images.length + 1}`,
      },
    ]);
  };

  const handleRemoveImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Images
      </label>
      <div className="space-y-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="p-2 bg-gray-50 border border-gray-200 rounded space-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                Image {index + 1}
              </span>
              <button
                onClick={() => handleRemoveImage(index)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={image.src || ""}
              onChange={(e) => handleImageChange(index, "src", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Image URL"
            />
            <input
              type="text"
              value={image.alt || ""}
              onChange={(e) => handleImageChange(index, "alt", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Alt text"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleAddImage}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add image
      </button>
    </div>
  );
}

// ============================================================================
// FEATURES EDITOR (for Features items)
// ============================================================================

function FeaturesEditor({ items, onChange }) {
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const handleAddItem = () => {
    onChange([
      ...items,
      { title: `Feature ${items.length + 1}`, description: "Description" },
    ]);
  };

  const handleRemoveItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Feature Items
      </label>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-2 bg-gray-50 border border-gray-200 rounded space-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                Feature {index + 1}
              </span>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={item.title || ""}
              onChange={(e) => handleItemChange(index, "title", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Title"
            />
            <input
              type="text"
              value={item.description || ""}
              onChange={(e) =>
                handleItemChange(index, "description", e.target.value)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Description"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleAddItem}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add feature
      </button>
    </div>
  );
}

// ============================================================================
// NAV LINKS EDITOR (for Navbar, Footer)
// ============================================================================

function NavLinksEditor({ links, onChange }) {
  const handleLinkChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange(newLinks);
  };

  const handleAddLink = () => {
    onChange([...links, { label: "New Link", href: "#" }]);
  };

  const handleRemoveLink = (index) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Links
      </label>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-md relative group">
            <button
              onClick={() => handleRemoveLink(index)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="space-y-3 mr-6">
              <InputField
                label="Label"
                value={link.label || ""}
                onChange={(value) => handleLinkChange(index, "label", value)}
              />
              <LinkField
                label="URL"
                value={link.href || ""}
                onChange={(value) => handleLinkChange(index, "href", value)}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddLink}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add link
      </button>
    </div>
  );
}

// ============================================================================
// FORM FIELDS
// ============================================================================

function MediaLibraryModal({ isOpen, onClose, onSelect, mediaList }) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0b1411]/80 backdrop-blur-sm p-4 sm:p-8" onClick={onClose}>
       <div 
         className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden relative"
         onClick={e => e.stopPropagation()}
       >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
            <div>
               <h2 className="text-xl font-black text-[#1d2321] uppercase tracking-tighter">Media Library</h2>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Select an asset to insert</p>
            </div>
            <button onClick={onClose} className="p-3 text-gray-400 hover:text-[#0b1411] hover:bg-[#f2f4f2] rounded-2xl transition-all shadow-sm">
               <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 bg-[#fcfdfc]">
             {mediaList.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center h-full">
                   <div className="h-24 w-24 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center mb-8 shadow-inner">
                     <ImageIcon size={40} className="text-gray-300" />
                   </div>
                   <h3 className="text-2xl font-black text-[#0b1411] uppercase tracking-tight mb-2">No Media Found</h3>
                   <p className="text-sm font-medium text-gray-500 max-w-sm">Use the Media Library from your dashboard to upload files first.</p>
                </div>
             ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                   {mediaList.map((item) => (
                      <div 
                         key={item.id}
                         onClick={() => onSelect(item.url)}
                         className="group relative aspect-square bg-gray-50 border border-gray-100 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#8bc4b1] hover:ring-2 hover:ring-[#8bc4b1]/30 transition-all duration-300"
                      >
                         <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-white text-[10px] font-bold tracking-wider uppercase truncate">{item.name}</p>
                         </div>
                      </div>
                   ))}
                </div>
             )}
          </div>
       </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

function MediaField({ label, value, onChange }) {
  const { tenantId } = useParams();
  const [media, setMedia] = useState([]);
  const [mediaType, setMediaType] = useState('url');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetch(`/api/tenants/${tenantId}/media`)
        .then(res => res.json())
        .then(data => {
            if (data.media) {
               // sort by newest
               setMedia(data.media.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
            }
        })
        .catch(err => console.error("Failed to fetch media for MediaField", err));
    }
  }, [tenantId]);

  useEffect(() => {
     if (value) {
         if (media.some(m => m.url === value)) {
             setMediaType('library');
         } else {
             setMediaType('url');
         }
     } else {
         setMediaType('url');
     }
  }, [value, media]);

  return (
    <div className="space-y-4 p-4 bg-[#f2f4f2]/50 border border-gray-100 rounded-xl relative">
      <SelectField
        label={label + " Source"}
        value={mediaType}
        onChange={(type) => {
            setMediaType(type);
            if (type !== 'library') {
               onChange('');
            }
        }}
        options={[
          { label: 'Media Library', value: 'library' },
          { label: 'Custom URL', value: 'url' }
        ]}
      />
      {mediaType === 'url' ? (
        <InputField
             label="URL"
             value={value || ''}
             onChange={onChange}
        />
      ) : (
        <div className="space-y-3">
            <button
               onClick={() => setModalOpen(true)}
               className="w-full h-12 bg-white border border-gray-200 text-[#0b1411] text-xs font-bold uppercase tracking-widest rounded-xl hover:border-[#8bc4b1] hover:text-[#8bc4b1] transition-all shadow-sm flex items-center justify-center gap-2 hover:shadow-md active:scale-95"
            >
               <ImageIcon size={16} />
               {(value && media.some(m => m.url === value)) ? "Change Media" : "Browse Library"}
            </button>
            {value && media.some(m => m.url === value) && (
                <div className="mt-2 rounded-2xl overflow-hidden border border-gray-200 bg-white p-1.5 shadow-inner">
                    <img src={value} alt="Preview" className="w-full h-auto max-h-40 object-contain rounded-xl" />
                </div>
            )}
            <MediaLibraryModal 
               isOpen={modalOpen} 
               onClose={() => setModalOpen(false)} 
               mediaList={media}
               onSelect={(url) => {
                  onChange(url);
                  setModalOpen(false);
               }}
            />
        </div>
      )}
    </div>
  );
}

function LinkField({ label, value, onChange }) {
  const { siteId } = useParams();
  const [pages, setPages] = useState([]);
  const [linkType, setLinkType] = useState('custom');

  useEffect(() => {
    if (siteId) {
      fetch(`/api/sites/${siteId}/pages`)
        .then(res => res.json())
        .then(data => {
            if (data.pages) setPages(data.pages);
        });
    }
  }, [siteId]);

  useEffect(() => {
     if (value) {
         if (pages.some(p => `/${p.slug}` === value || `/${p.slug.replace(/^\//,'')}/index.html` === value)) {
             setLinkType('page');
         } else {
             setLinkType('custom');
         }
     } else {
         setLinkType('custom');
     }
  }, [value, pages]);

  return (
    <div className="space-y-2">
      <SelectField
        label={label + " Type"}
        value={linkType}
        onChange={(type) => {
            setLinkType(type);
            if (type === 'page' && pages.length > 0) {
               onChange(`/${pages[0].slug.replace(/^\//,'')}`);
            } else {
               onChange('');
            }
        }}
        options={[
          { label: 'Site Page', value: 'page' },
          { label: 'Custom URL', value: 'custom' }
        ]}
      />
      {linkType === 'custom' ? (
        <InputField
             label="URL"
             value={value || ''}
             onChange={onChange}
        />
      ) : (
        <SelectField
             label="Select Page"
             value={value || (pages.length ? `/${pages[0].slug.replace(/^\//,'')}` : '')}
             onChange={onChange}
             options={pages.map(p => ({ label: p.name, value: `/${p.slug.replace(/^\//,'')}` }))}
        />
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  compact = false,
  aiRewrite = false,
  componentType = "",
}) {
  const [isRewriting, setIsRewriting] = useState(false);

  const handleRewrite = async () => {
    if (!value || isRewriting) return;
    setIsRewriting(true);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          fieldType: label,
          context: { componentType },
        }),
      });
      if (!res.ok) throw new Error("Failed to rewrite");
      const data = await res.json();
      if (data.text) {
        onChange(data.text);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to rewrite text. Please try again.");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-600">
          {label}
        </label>
        {aiRewrite && type === "text" && (
          <button
            onClick={handleRewrite}
            disabled={isRewriting || !value}
            className="flex items-center gap-1 text-[10px] uppercase font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-full transition-colors disabled:opacity-50"
            title="Rewrite with AI Magic"
          >
            {isRewriting ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Wand2 size={10} />
            )}
            {isRewriting ? "Rewriting..." : "AI ✨"}
          </button>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            "w-full border border-gray-200 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none",
            compact ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm",
          )}
        />
      )}
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function GlobalColorField({ label, value, onChange, globalColors }) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Determine if the current value matches a global color
  const matchedGlobal = useMemo(() => {
    if (!globalColors) return null;
    for (const [key, color] of Object.entries(globalColors)) {
      if (color?.toLowerCase() === value?.toLowerCase()) return key;
    }
    return null;
  }, [value, globalColors]);

  const colorOptions = useMemo(() => {
    if (!globalColors) return [];
    return Object.entries(globalColors).map(([key, color]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color,
    }));
  }, [globalColors]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        {/* Global color swatches */}
        {colorOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { onChange(opt.color); setShowCustomPicker(false); }}
            className={clsx(
              "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
              matchedGlobal === opt.key
                ? "border-[#0b1411] ring-2 ring-[#0b1411]/20 scale-110"
                : "border-gray-200 hover:border-gray-400"
            )}
            style={{ backgroundColor: opt.color }}
            title={`${opt.label} (${opt.color})`}
          />
        ))}

        {/* Custom button */}
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className={clsx(
            "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center text-[10px] font-bold",
            !matchedGlobal && !showCustomPicker
              ? "border-gray-300"
              : showCustomPicker
              ? "border-[#0b1411] ring-2 ring-[#0b1411]/20"
              : "border-gray-200 hover:border-gray-400"
          )}
          style={!matchedGlobal ? { backgroundColor: value } : { backgroundColor: '#f5f5f5' }}
          title="Custom color"
        >
          {matchedGlobal ? '⋯' : ''}
        </button>

        {/* Current value label */}
        <span className="text-[10px] font-mono font-bold text-gray-400 ml-1">
          {matchedGlobal ? matchedGlobal.toUpperCase() : value}
        </span>
      </div>

      {/* Custom color picker dropdown */}
      {showCustomPicker && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex gap-3 items-center">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-8 rounded border border-gray-200 cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      )}
    </div>
  );
}

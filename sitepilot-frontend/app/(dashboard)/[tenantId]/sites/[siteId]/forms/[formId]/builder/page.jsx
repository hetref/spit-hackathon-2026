"use client";

/**
 * FORM BUILDER PAGE
 *
 * Main form builder interface — same architecture as site builder.
 * Uses builderStore (not formBuilderStore) so all shared components
 * (RightSidebar, CanvasRenderer, TreePanel, Toolbar) work seamlessly.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import useBuilderStore, { clearSavedState } from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import FormToolbar from "@/lib/components/builder/FormToolbar";
import FormLeftSidebar from "@/lib/components/builder/FormLeftSidebar";
import RightSidebar from "@/lib/components/builder/RightSidebar";
import FormCanvasArea from "@/lib/components/builder/FormCanvasArea";

// ─── Default form layout JSON structure ─────────────────────────────────────

function createDefaultFormLayout(formName = "Form") {
  return {
    meta: {
      title: formName,
      favicon: "",
      description: "",
    },
    pages: [
      {
        id: "form-page-1",
        name: "Form",
        slug: "/",
        layout: [
          {
            id: "form-container-1",
            type: "container",
            name: "Form Container",
            settings: {
              direction: "horizontal",
              contentWidth: "boxed",
              maxWidth: 800,
              gap: 16,
              verticalAlign: "stretch",
            },
            styles: {
              paddingTop: 40,
              paddingBottom: 40,
              paddingLeft: 0,
              paddingRight: 0,
              marginTop: 0,
              marginBottom: 0,
            },
            columns: [
              {
                id: "form-column-1",
                width: 12,
                styles: {},
                components: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

// ─── Page component ─────────────────────────────────────────────────────────

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { updateLayoutJSON, getLayoutJSON } = useBuilderStore();
  const { initialize: initializeHistory, pushState } = useHistoryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  // Use ref so keyboard handler always has latest form/params
  const formRef = useRef(form);
  const paramsRef = useRef(params);
  useEffect(() => { formRef.current = form; }, [form]);
  useEffect(() => { paramsRef.current = params; }, [params]);

  // Auth guard
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  // Reset builder state on mount so site builder localStorage doesn't bleed in
  useEffect(() => {
    clearSavedState();
    return () => {
      // Clean up builder state when leaving form builder
      updateLayoutJSON(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load form data ──────────────────────────────────────────────────────────

  const loadForm = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/sites/${params.siteId}/forms/${params.formId}`
      );

      if (response.ok) {
        const data = await response.json();
        setForm(data.form);

        // Try to use saved builder data from the latest draft version
        const draftVersion = data.form.versions?.find(
          (v) => v.status === "DRAFT"
        );

        let layoutJSON;
        if (draftVersion?.builderData?.pages) {
          layoutJSON = draftVersion.builderData;
        } else {
          layoutJSON = createDefaultFormLayout(data.form.name || "Form");
        }

        // persist=false: form data must not contaminate site builder's localStorage
        updateLayoutJSON(layoutJSON, false);
        initializeHistory(layoutJSON);
      } else {
        const defaultLayout = createDefaultFormLayout("Form");
        updateLayoutJSON(defaultLayout, false);
        initializeHistory(defaultLayout);
      }
    } catch (error) {
      console.error("Failed to load form:", error);
      const defaultLayout = createDefaultFormLayout("Form");
      updateLayoutJSON(defaultLayout, false);
      initializeHistory(defaultLayout);
    } finally {
      setIsLoading(false);
    }
  }, [params.siteId, params.formId, updateLayoutJSON, initializeHistory]);

  useEffect(() => {
    if (session && params.formId) {
      loadForm();
    }
  }, [session, params.formId, loadForm]);

  // ── Save handler ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const layoutJSON = getLayoutJSON();
      const currentForm = formRef.current;
      const currentParams = paramsRef.current;
      const response = await fetch(
        `/api/sites/${currentParams.siteId}/forms/${currentParams.formId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            builderData: {
              ...layoutJSON,
              meta: {
                ...(layoutJSON?.meta || {}),
                title: currentForm?.name || "Form",
              },
            },
            status: "DRAFT",
          }),
        }
      );
      if (response.ok) {
        console.log("Form saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save form:", error);
    } finally {
      setSaving(false);
    }
  }, [getLayoutJSON]);

  // ── Publish handler ─────────────────────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    try {
      const layoutJSON = getLayoutJSON();
      const currentForm = formRef.current;
      const currentParams = paramsRef.current;
      const response = await fetch(
        `/api/sites/${currentParams.siteId}/forms/${currentParams.formId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            builderData: {
              ...layoutJSON,
              meta: {
                ...(layoutJSON?.meta || {}),
                title: currentForm?.name || "Form",
              },
            },
            status: "PUBLISHED",
          }),
        }
      );
      if (response.ok) {
        console.log("Form published!");
      }
    } catch (error) {
      console.error("Failed to publish form:", error);
    }
  }, [getLayoutJSON]);

  // ── Keyboard shortcut: Ctrl+S to save ──────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        pushState(getLayoutJSON());
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pushState, getLayoutJSON, handleSave]);

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading || isPending) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">FB</span>
            </div>
          </div>
          <p className="text-slate-300 text-sm font-medium">
            Loading Form Builder...
          </p>
          <p className="text-slate-500 text-xs mt-1">Preparing your canvas</p>
        </div>
      </div>
    );
  }

  // ── Main builder UI ─────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Toolbar */}
      <FormToolbar
        form={form}
        onSave={handleSave}
        onPublish={handlePublish}
        saving={saving}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — Elements + Layers */}
        <FormLeftSidebar />

        {/* Canvas Area */}
        <FormCanvasArea />

        {/* Right Sidebar — Properties + Styles */}
        <RightSidebar />
      </div>
    </div>
  );
}

"use client";

/**
 * WEBSITE BUILDER PAGE
 *
 * Loads a real site+page from the DB using URL params, or falls back to demo
 * data when navigating without a valid siteId.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Toolbar from "@/lib/components/builder/Toolbar";
import LeftSidebar from "@/lib/components/builder/LeftSidebar";
import RightSidebar from "@/lib/components/builder/RightSidebar";
import CanvasArea from "@/lib/components/builder/CanvasArea";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { demoWebsiteJSON } from "@/lib/data/demoData";

export default function WebsiteBuilderPage() {
  const params = useParams();
  const { siteId } = params;

  const { initializeBuilder, initializeFromAPI, getLayoutJSON } =
    useBuilderStore();
  const { initialize: initializeHistory, pushState } = useHistoryStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const loadSite = async () => {
      setIsLoading(true);
      setLoadError(null);

      // If no real siteId, fall back to demo data
      if (!siteId || siteId === "demo") {
        initializeBuilder(demoWebsiteJSON);
        initializeHistory(demoWebsiteJSON);
        setIsLoading(false);
        return;
      }

      try {
        // 1. Fetch site metadata + page list
        const siteRes = await fetch(`/api/sites/${siteId}`);
        if (!siteRes.ok)
          throw new Error(`Failed to load site: ${siteRes.statusText}`);
        const { site } = await siteRes.json();

        if (!site.pages?.length) {
          throw new Error("Site has no pages. Please create a page first.");
        }

        // 2. Fetch full layout for the first page
        const firstPage = site.pages[0];
        const pageRes = await fetch(
          `/api/sites/${siteId}/pages/${firstPage.id}`,
        );
        if (!pageRes.ok)
          throw new Error(`Failed to load page: ${pageRes.statusText}`);
        const { page } = await pageRes.json();

        // 3. Initialise store with DB-backed data
        initializeFromAPI({
          siteId: site.id,
          pageId: page.id,
          theme: site.theme,
          page,
        });

        // Sync history to the loaded layout
        initializeHistory({
          site: { id: site.id, name: site.name },
          theme: site.theme,
          pages: [page],
        });
      } catch (err) {
        console.error("Failed to load site:", err);
        setLoadError(err.message);
        // Graceful fallback to demo data so the builder still opens
        initializeBuilder(demoWebsiteJSON);
        initializeHistory(demoWebsiteJSON);
      } finally {
        setIsLoading(false);
      }
    };

    loadSite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Track layout changes — save to history on Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const layoutJSON = getLayoutJSON();
        if (layoutJSON) pushState(layoutJSON);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [getLayoutJSON, pushState]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Website Builder…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Error banner (non-blocking — builder still works in demo mode) */}
      {loadError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
          <span className="font-medium">⚠ Loaded in demo mode:</span>{" "}
          {loadError}
        </div>
      )}

      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <CanvasArea />
        <RightSidebar />
      </div>
    </div>
  );
}

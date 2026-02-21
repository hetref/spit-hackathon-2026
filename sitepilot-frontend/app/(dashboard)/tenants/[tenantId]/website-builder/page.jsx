"use client";

/**
 * WEBSITE BUILDER PAGE
 *
 * Main builder interface with toolbar, sidebars, and canvas
 */

import { useEffect, useState } from "react";
import Toolbar from "@/lib/components/builder/Toolbar";
import LeftSidebar from "@/lib/components/builder/LeftSidebar";
import RightSidebar from "@/lib/components/builder/RightSidebar";
import CanvasArea from "@/lib/components/builder/CanvasArea";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { demoWebsiteJSON, siteAPI } from "@/lib/data/demoData";

export default function WebsiteBuilderPage() {
  const { initializeBuilder, getLayoutJSON } = useBuilderStore();
  const { initialize: initializeHistory, pushState } = useHistoryStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load demo site data
    const loadSite = async () => {
      try {
        const data = await siteAPI.loadSite("demo");
        console.log("Loaded site data:", data);
        initializeBuilder(data);
        initializeHistory(data);
      } catch (error) {
        console.error("Failed to load site:", error);
        // Fallback to demo data
        console.log("Using demo data:", demoWebsiteJSON);
        initializeBuilder(demoWebsiteJSON);
        initializeHistory(demoWebsiteJSON);
      } finally {
        setIsLoading(false);
      }
    };

    loadSite();
  }, [initializeBuilder, initializeHistory]);

  // Track layout changes for history
  useEffect(() => {
    const layoutJSON = getLayoutJSON();
    if (layoutJSON) {
      const handleKeyDown = (e) => {
        // Save state on Ctrl+S or Cmd+S
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          pushState(layoutJSON);
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [getLayoutJSON, pushState]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Website Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Canvas Area */}
        <CanvasArea />

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}

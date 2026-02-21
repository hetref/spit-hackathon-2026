"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Toolbar from "@/lib/components/builder/Toolbar";
import LeftSidebar from "@/lib/components/builder/LeftSidebar";
import RightSidebar from "@/lib/components/builder/RightSidebar";
import CanvasArea from "@/lib/components/builder/CanvasArea";
import CollaborativeCanvas from "@/components/builder/CollaborativeCanvas";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { useSession } from "@/lib/auth-client";
import { getCursorColor } from "@/liveblocks.config";

export default function PageBuilderPage() {
  const params = useParams();
  const { tenantId, siteId, pageId } = params;
  const { data: session } = useSession();

  const { initializeFromAPI } = useBuilderStore();
  const { initialize: initializeHistory } = useHistoryStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // 1. Fetch site metadata
        const siteRes = await fetch(`/api/sites/${siteId}`);
        if (!siteRes.ok)
          throw new Error(`Failed to load site: ${siteRes.statusText}`);
        const { site } = await siteRes.json();

        // 2. Fetch the specific page
        const pageRes = await fetch(`/api/sites/${siteId}/pages/${pageId}`);
        if (!pageRes.ok)
          throw new Error(`Failed to load page: ${pageRes.statusText}`);
        const { page } = await pageRes.json();

        // 3. Initialize builder with this page
        initializeFromAPI({
          siteId: site.id,
          pageId: page.id,
          theme: site.theme,
          page,
        });

        // Sync history
        initializeHistory({
          site: { id: site.id, name: site.name },
          theme: site.theme,
          pages: [page],
        });
      } catch (err) {
        console.error("Failed to load page:", err);
        setLoadError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (siteId && pageId) {
      loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, pageId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Page Builder…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Page</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Derive user info for collaboration
  const userName = session?.user?.name || session?.user?.email || "Anonymous";
  const userColor = getCursorColor(
    Math.abs(hashCode(session?.user?.id || "anon"))
  );

  return (
    <CollaborativeCanvas
      tenantId={tenantId}
      siteId={siteId}
      pageId={pageId}
      userName={userName}
      userColor={userColor}
    >
      <div className="h-screen flex flex-col bg-white">
        <Toolbar />
        <div className="flex-1 flex overflow-hidden">
          <LeftSidebar />
          <CanvasArea />
          <RightSidebar />
        </div>
      </div>
    </CollaborativeCanvas>
  );
}

/** Simple string hash for deterministic color assignment */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

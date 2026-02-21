"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Create Site Modal ───────────────────────────────────────────────────────

function CreateSiteModal({ tenantId, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (!slugEdited) setSlug(slugify(e.target.value));
  };

  const handleSlugChange = (e) => {
    setSlug(slugify(e.target.value));
    setSlugEdited(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          name: name.trim(),
          slug,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create site");
      onCreated(data.site);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
            Create New Site
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Site Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Acme Marketing"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-gray-900/10 focus-within:border-gray-900 overflow-hidden transition-colors">
              <span className="px-4 py-3 bg-gray-50 border-r border-gray-300 text-gray-500 text-sm select-none">
                sitepilot.com/
              </span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="acme-marketing"
                className="flex-1 px-4 py-3 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this site's purpose..."
              rows={2}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6 -mx-6 px-6 sm:pb-0 pb-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-900 text-white text-sm font-medium border border-transparent rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Site'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Site Card ───────────────────────────────────────────────────────────────

function SiteCard({ site, tenantId, onDelete, router }) {
  const publishedCount = site.pages?.filter((p) => p.isPublished).length ?? 0;
  const totalPages = site._count?.pages ?? site.pages?.length ?? 0;

  const openBuilder = () => {
    router.push(`/${tenantId}/sites/${site.id}/pages`);
  };

  return (
    <div className="group flex flex-col bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden">

      {/* Header Info */}
      <div className="p-6 pb-4 border-b border-gray-100 flex-1">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
              <Globe className="h-6 w-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate group-hover:text-gray-900 transition-colors">
                {site.name}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5 truncate">
                /{site.slug}
              </p>
            </div>
          </div>
        </div>

        {site.description && (
          <p className="text-sm text-gray-500 mt-4 line-clamp-2 leading-relaxed">
            {site.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-5">
          {publishedCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {publishedCount} Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Draft
            </span>
          )}
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            Updated {formatDate(site.updatedAt)}
          </span>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between gap-3">
        <button
          onClick={openBuilder}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-900 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
          <Pencil size={15} className="text-gray-500" />
          Edit Pages
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {site.domain && (
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-white border border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              title="Open live site"
            >
              <ExternalLink size={16} />
            </a>
          )}
          <button
            onClick={() => onDelete(site)}
            className="p-2.5 border border-transparent text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-100"
            title="Delete site"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SitesPage() {
  const router = useRouter();
  const params = useParams();
  const { tenantId } = params;
  const { data: session, isPending } = useSession();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPending && !session) router.push("/auth/signin");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session && tenantId) fetchSites();
  }, [session, tenantId]);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites?tenantId=${tenantId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSites(data.sites || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (newSite) => {
    setSites((prev) => [newSite, ...prev]);
    setShowCreate(false);
    router.push(`/${tenantId}/sites/${newSite.id}/pages`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sites/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setSites((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 pb-12">

      {/* Header aligned with other dashboard views */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/${tenantId}`)}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                title="Back to Workspace"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Sites</h1>
                <p className="text-sm sm:text-base text-gray-500 mt-0.5">Manage your workspace websites</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              <Plus size={16} className="mr-2" />
              New Site
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12">
        {error && (
          <div className="mb-8 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span className="font-medium text-base">{error}</span>
          </div>
        )}

        {/* Sites grid */}
        {sites.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center">
            <div className="h-16 w-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center mb-6">
              <Globe size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">
              No sites created yet
            </h3>
            <p className="text-base text-gray-500 max-w-sm mb-8">
              Start building your digital presence by creating your first website in this workspace.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <Plus size={16} className="mr-2" />
              Create your first site
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                tenantId={tenantId}
                onDelete={setDeleteTarget}
                router={router}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateSiteModal
          tenantId={tenantId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-8 text-center text-gray-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-5">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">
              Delete Site
            </h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900 font-semibold">{deleteTarget.name}</strong>? This action cannot be undone and will permanently remove all pages and content.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-5 py-3 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {deleting ? "Deleting..." : "Delete Site"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

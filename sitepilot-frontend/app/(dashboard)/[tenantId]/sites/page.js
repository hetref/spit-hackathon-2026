"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Globe,
  Plus,
  Pencil,
  Eye,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { hasPermission } from "@/lib/permissions";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Create new site
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2.5">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Site name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="My Awesome Website"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden">
              <span className="px-3.5 py-2.5 bg-gray-50 border-r border-gray-300 text-gray-500 text-sm select-none">
                sitepilot/
              </span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="my-awesome-site"
                className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of this site…"
              rows={2}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              {loading ? "Creating…" : "Create site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Site Card ───────────────────────────────────────────────────────────────

function SiteCard({ site, tenantId, onDelete, router, userRole }) {
  const publishedCount = site.pages?.filter((p) => p.isPublished).length ?? 0;
  const totalPages = site._count?.pages ?? site.pages?.length ?? 0;
  const canEdit = hasPermission(userRole, 'sites:edit');
  const canDelete = hasPermission(userRole, 'sites:delete');

  const openBuilder = () => {
    const firstPage = site.pages?.[0];
    router.push(`/${tenantId}/sites/${site.id}/pages`);
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all duration-200">
      {/* Thumbnail placeholder */}
      <div
        className="h-36 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${site.theme?.primaryColor || "#6366f1"}22, ${site.theme?.secondaryColor || "#8b5cf6"}44)`,
        }}
      >
        <Globe size={40} className="text-indigo-400 opacity-60" />
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {site.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              /{site.slug}
            </p>
          </div>
          <span className="shrink-0 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5 font-medium">
            {totalPages} {totalPages === 1 ? "page" : "pages"}
          </span>
        </div>

        {site.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {site.description}
          </p>
        )}

        <div className="flex items-center gap-1 mt-2">
          {publishedCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {publishedCount} published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
              Draft
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            Updated {formatDate(site.updatedAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {canEdit ? (
            <button
              onClick={openBuilder}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Pencil size={14} />
              Edit in builder
            </button>
          ) : (
            <button
              onClick={() => router.push(`/${tenantId}/sites/${site.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye size={14} />
              View site
            </button>
          )}
          {site.domain && (
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
              title="Open live site"
            >
              <ExternalLink size={15} />
            </a>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(site)}
              className="p-2 border border-gray-200 text-gray-400 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
              title="Delete site"
            >
              <Trash2 size={15} />
            </button>
          )}
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
  const [userRole, setUserRole] = useState(null);

  const canCreate = hasPermission(userRole, 'sites:create');

  useEffect(() => {
    if (!isPending && !session) router.push("/auth/signin");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session && tenantId) {
      fetchSites();
      fetchUserRole();
    }
  }, [session, tenantId]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.userRole);
      }
    } catch (err) {
      console.error('Error fetching role:', err);
    }
  };

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
    // Navigate straight into the builder for the new site
    router.push(`/${tenantId}/sites/${newSite.id}/builder`);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
            <p className="text-sm text-gray-500 mt-1">
              {sites.length} site{sites.length !== 1 ? "s" : ""} in this
              workspace
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              <Plus size={16} />
              New site
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Sites grid */}
        {sites.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
            <Globe size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No sites yet
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              {canCreate ? 'Create your first site to get started.' : 'No sites have been created yet.'}
            </p>
            {canCreate && (
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={15} />
                Create site
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                tenantId={tenantId}
                onDelete={setDeleteTarget}
                router={router}
                userRole={userRole}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Delete site?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-medium text-gray-800">
                {deleteTarget.name}
              </span>{" "}
              and all its pages will be permanently deleted. This cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

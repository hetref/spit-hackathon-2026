"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Globe,
  ExternalLink,
  Loader2,
  ChevronLeft,
  Rocket,
  RotateCcw,
  CheckCircle2,
  Clock,
  Pencil,
  X,
  Check,
  AlertCircle,
  History,
  Zap,
  Copy,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Inline Rename Input ──────────────────────────────────────────────────────

function InlineRename({ siteId, deployment, onRenamed }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(deployment.deploymentName || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!value.trim()) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/deployments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentId: deployment.deploymentId,
          deploymentName: value.trim(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Rename failed");
      onRenamed({ ...deployment, deploymentName: value.trim() });
      setEditing(false);
    } catch (err) {
      alert(`Rename failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1.5 min-w-0">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="flex-1 min-w-0 px-2 py-0.5 text-sm bg-slate-100 border border-indigo-400 rounded focus:outline-none"
        />
        <button onClick={save} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
        </button>
        <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
          <X size={13} />
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 group min-w-0">
      <span className="font-medium text-gray-900 truncate text-sm">
        {deployment.deploymentName || (
          <span className="text-gray-400 italic">Untitled deployment</span>
        )}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-opacity"
        title="Rename deployment"
      >
        <Pencil size={11} />
      </button>
    </span>
  );
}

// ─── Deployment Row ───────────────────────────────────────────────────────────

function DeploymentRow({ siteId, siteSlug, deployment, onRollback, onRenamed }) {
  const [rolling, setRolling] = useState(false);

  const handleRollback = async () => {
    if (!confirm(`Roll back to "${deployment.deploymentName || deployment.deploymentId}"?\n\nYour live site will instantly serve this version.`)) return;
    setRolling(true);
    try {
      await onRollback(siteSlug, deployment.deploymentId);
    } finally {
      setRolling(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${deployment.isActive ? "bg-indigo-50/60" : ""
        }`}
    >
      {/* Status Dot */}
      <div className="shrink-0">
        {deployment.isActive ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-100 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Live
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">
            <Clock size={11} />
            Past
          </span>
        )}
      </div>

      {/* Name + ID */}
      <div className="flex-1 min-w-0">
        <InlineRename siteId={siteId} deployment={deployment} onRenamed={onRenamed} />
        <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
          {deployment.deploymentId}
        </p>
      </div>

      {/* KVS status */}
      <div className="shrink-0 hidden sm:block">
        {deployment.kvsUpdated ? (
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={12} />
            CDN live
          </span>
        ) : (
          <span className="text-xs text-amber-500 flex items-center gap-1">
            <AlertCircle size={12} />
            CDN pending
          </span>
        )}
      </div>

      {/* Timestamp */}
      <div className="shrink-0 text-right hidden md:block">
        <p className="text-xs text-gray-500">{formatRelative(deployment.createdAt)}</p>
        <p className="text-xs text-gray-400">{formatDate(deployment.createdAt)}</p>
      </div>

      {/* Actions */}
      {!deployment.isActive && (
        <button
          onClick={handleRollback}
          disabled={rolling}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
          title="Roll back to this deployment"
        >
          {rolling ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RotateCcw size={12} />
          )}
          Restore
        </button>
      )}
      {deployment.isActive && (
        <span className="shrink-0 w-[72px]" /> // spacer to align
      )}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
import {
  ArrowLeft,
  Globe,
  Plus,
  Loader2,
  ExternalLink,
  Trash2,
  Calendar,
  Clock,
  History,
  Link as LinkIcon,
  Monitor,
  Users,
  Timer,
  MousePointerClick,
  MonitorOff,
  LayoutTemplate
} from 'lucide-react'

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [site, setSite] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rollbackMsg, setRollbackMsg] = useState(null); // { type: 'success'|'error', text }
  const [copied, setCopied] = useState(false);

  const siteUrl = site ? `https://${site.slug}.sitepilot.devally.in` : null;

  // ── Fetch site + deployments ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!params.siteId) return;
    setLoading(true);
    try {
      const [siteRes, depRes] = await Promise.all([
        fetch(`/api/sites/${params.siteId}`),
        fetch(`/api/sites/${params.siteId}/deployments`),
      ]);

      if (!siteRes.ok) throw new Error((await siteRes.json()).error || "Failed to load site");
      const { site: siteData } = await siteRes.json();
      setSite(siteData);

      if (depRes.ok) {
        const { deployments: deps } = await depRes.json();
        setDeployments(deps || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.siteId]);

  useEffect(() => {
    if (!isPending && !session) router.push("/auth/signin");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session && params.siteId) fetchData();
  }, [session, params.siteId, fetchData]);

  // ── Rollback ──────────────────────────────────────────────────────────────
  const handleRollback = async (siteSlug, deploymentId) => {
    setRollbackMsg(null);
    try {
      const res = await fetch("/api/sites/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteSlug, deploymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rollback failed");

      // Update local state optimistically
      setDeployments((prev) =>
        prev.map((d) => ({
          ...d,
          isActive: d.deploymentId === deploymentId,
          kvsUpdated: d.deploymentId === deploymentId ? true : d.kvsUpdated,
        }))
      );
      setRollbackMsg({ type: "success", text: data.message });
      setTimeout(() => setRollbackMsg(null), 5000);
    } catch (err) {
      setRollbackMsg({ type: "error", text: err.message });
      setTimeout(() => setRollbackMsg(null), 6000);
    }
  };

  // ── Rename handler ────────────────────────────────────────────────────────
  const handleRenamed = (updatedDep) => {
    setDeployments((prev) =>
      prev.map((d) => (d.deploymentId === updatedDep.deploymentId ? updatedDep : d))
    );
  };

  // ── Copy URL ──────────────────────────────────────────────────────────────
  const handleCopyUrl = () => {
    if (!siteUrl) return;
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Render: Loading ──────────────────────────────────────────────────────
  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD] px-6">
        <div className="h-16 w-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center mb-6">
          <Globe size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Site not found</h2>
        <p className="text-base text-gray-500 max-w-sm text-center mb-8">
          The site you're looking for was either deleted or doesn't exist.
        </p>
        <button
          onClick={() => router.push(`/${params.tenantId}`)}
          className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 border border-transparent text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Workspace
        </button>
      </div>
    );
  }

  const activeDeployment = deployments.find((d) => d.isActive);

  // Fallback to determine visually if it's "published" 
  const isPublished = Boolean(site.domain || domains.length > 0)

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/${params.tenantId}/sites`)}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                title="Back to Sites"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 truncate max-w-md">
                  {site.name}
                </h1>
                <p className="text-sm sm:text-base text-gray-500 mt-0.5 truncate">
                  /{site.slug}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages`)}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                <LayoutTemplate size={16} className="mr-2" />
                Manage Pages
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-8">

        {/* Top Grid: Preview Card Left, Overview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Preview Card */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Site Preview</h2>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[340px] group">
              {isPublished ? (
                <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                  <iframe
                    src={`https://${domains[0] || site.domain}`}
                    className="w-full h-full border-0 pointer-events-none origin-top-left scale-[1]"
                    style={{ width: '100%', height: '100%' }}
                    title="Site Live Preview"
                  />
                  <div className="absolute inset-0 z-10 bg-transparent" />
                </div>
              ) : (
                <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center border-b border-gray-100 transition-colors">
                  <MonitorOff className="h-10 w-10 text-gray-300 mb-4" />
                  <span className="text-sm font-medium text-gray-500">Site is not published yet</span>
                  <span className="text-xs text-gray-400 mt-1 max-w-[200px] text-center">Connect a domain to see a live preview.</span>
                </div>
              )}

              <div className="p-5 bg-white flex justify-between items-center border-t border-gray-100">
                <div className="min-w-0 pr-3">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">Live View</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {isPublished ? (domains[0] || site.domain) : 'No connected domain'}
                  </p>
                </div>
                {isPublished && (
                  <a
                    href={`https://${domains[0] || site.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors flex-shrink-0"
                    title="Open live site"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Overview & Domains */}
          <div className="lg:col-span-2 space-y-8">

            {/* Stats Overview */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-col">
                  <div className="flex items-center gap-2.5 text-gray-500 mb-3">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Created</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 mt-auto">
                    {new Date(site.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-col">
                  <div className="flex items-center gap-2.5 text-gray-500 mb-3">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Last Updated</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 mt-auto">
                    {new Date(site.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-col">
                  <div className="flex items-center gap-2.5 text-gray-500 mb-3">
                    <History className="h-4 w-4" />
                    <span className="text-sm font-medium">Deployments</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 mt-auto">
                    {site._count?.versions || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Domains Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Connected Domains</h2>
                {!showAddDomain && (
                  <button
                    onClick={() => setShowAddDomain(true)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-800 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Add Domain
                  </button>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Add Domain Expandable Form */}
                {showAddDomain && (
                  <div className="p-5 bg-gray-50 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Configure new domain</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <LinkIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="subdomain.example.com"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                          className="pl-10 w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors"
                        />
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={handleAddDomain}
                          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddDomain(false)
                            setDomainInput('')
                          }}
                          className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Domains List */}
                <ul className="divide-y divide-gray-100">
                  {domains.length === 0 ? (
                    <li className="p-8 text-center bg-white flex flex-col items-center justify-center">
                      <div className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Monitor size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">No domains connected</p>
                      <p className="text-sm text-gray-500 mt-1">Add a custom domain to publish your site live.</p>
                    </li>
                  ) : (
                    domains.map((domain, idx) => (
                      <li key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                            <Globe size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 tracking-tight">{domain}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${idx === 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                {idx === 0 ? 'Primary' : 'Alias'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDomain(domain)}
                          className="text-sm text-red-600 font-medium hover:text-red-800 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-50 self-start sm:self-auto"
                        >
                          Remove
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* Analytics Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Site Analytics</h2>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                    <Users size={16} className="text-gray-400" /> Visitors
                  </span>
                  <span className="text-3xl font-bold text-gray-900">0</span>
                </div>

                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                    <MousePointerClick size={16} className="text-gray-400" /> Page Views
                  </span>
                  <span className="text-3xl font-bold text-gray-900">0</span>
                </div>

                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                    <Timer size={16} className="text-gray-400" /> Avg. Duration
                  </span>
                  <span className="text-3xl font-bold text-gray-900">0s</span>
                </div>

                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                    <ExternalLink size={16} className="text-gray-400" /> Bounce Rate
                  </span>
                  <span className="text-3xl font-bold text-gray-900">0%</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400"></span>
                  </span>
                  Analytics tracking will begin recording once traffic is detected on a live domain.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Deployment History ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <History size={15} className="text-indigo-500" />
              Deployment History
              <span className="text-xs text-gray-400 font-normal bg-gray-100 rounded-full px-2 py-0.5">
                {deployments.length}
              </span>
            </h2>
            <button
              onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/builder`)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Rocket size={12} />
              Publish new version
            </button>
          </div>

          {deployments.length === 0 ? (
            <div className="text-center py-16">
              <History size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-600">No deployments yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Open the builder and click &ldquo;Publish&rdquo; to create your first deployment.
              </p>
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/builder`)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Pencil size={13} />
                Open Builder
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {deployments.map((dep) => (
                <DeploymentRow
                  key={dep.id}
                  siteId={params.siteId}
                  siteSlug={site.slug}
                  deployment={dep}
                  onRollback={handleRollback}
                  onRenamed={handleRenamed}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

      </div>
    </div>
  );
}
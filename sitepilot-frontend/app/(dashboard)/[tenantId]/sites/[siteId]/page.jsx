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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Site not found</h2>
          <button
            onClick={() => router.push(`/${params.tenantId}/sites`)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm"
          >
            Back to Sites
          </button>
        </div>
      </div>
    );
  }

  const activeDeployment = deployments.find((d) => d.isActive);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages`)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Manage Pages
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{site.name}</h1>
                <p className="text-xs text-gray-500 mt-0.5">/{site.slug}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/builder`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Pencil size={14} />
                Edit in Builder
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Rollback notification ────────────────────────────────────────── */}
        {rollbackMsg && (
          <div
            className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${rollbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-200"
              }`}
          >
            {rollbackMsg.type === "success" ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
            )}
            {rollbackMsg.text}
          </div>
        )}

        {/* ── Live URL card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Globe size={15} className="text-indigo-500" />
              Live Site URL
            </h2>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 flex-1 min-w-0 px-4 py-2.5 rounded-xl border ${activeDeployment
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-gray-50 border-gray-200"
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${site.cfStatus === "LIVE" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                    }`}
                />
                <span
                  className={`text-sm font-medium truncate ${site.cfStatus === "LIVE" ? "text-emerald-800" : "text-amber-800"
                    }`}
                >
                  {siteUrl}
                </span>
              </div>

              <button
                onClick={handleCopyUrl}
                className="shrink-0 p-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-colors"
                title="Copy URL"
              >
                {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              </button>

              {site.cfStatus === "LIVE" ? (
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink size={13} />
                  Visit
                </a>
              ) : (
                <span className="shrink-0 text-xs text-amber-600 font-medium px-4 py-2 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  Provisioning…
                </span>
              )}
            </div>

            {activeDeployment && (
              <p className="text-xs text-gray-500 mt-2.5 flex items-center gap-1.5">
                <Zap size={11} className="text-indigo-400" />
                Served via CloudFront CDN · Deployment:{" "}
                <span className="font-mono">{activeDeployment.deploymentId.slice(0, 8)}…</span>
                {activeDeployment.deploymentName && (
                  <span className="text-gray-600">({activeDeployment.deploymentName})</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* ── Site Stats ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Pages", value: site.pages?.length ?? 0, color: "text-indigo-600 bg-indigo-50" },
            { label: "Deployments", value: deployments.length, color: "text-violet-600 bg-violet-50" },
            {
              label: "Tenant Status",
              value: site.cfStatus || "PROVISIONING",
              color: site.cfStatus === "LIVE" ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50",
            },
            {
              label: "Last updated",
              value: formatRelative(site.updatedAt),
              color: "text-blue-600 bg-blue-50",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`mt-1.5 text-lg font-bold rounded-md px-1.5 inline-block ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
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
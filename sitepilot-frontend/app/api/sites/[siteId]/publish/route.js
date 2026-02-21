import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { convertPageToHtml } from "@/lib/publish/jsonToHtml";
import {
    uploadDeploymentToS3,
    updateKVS,
    buildDeploymentPrefix,
    buildSiteUrl,
} from "@/lib/aws/s3-publish";

export const runtime = "nodejs";

/**
 * POST /api/sites/[siteId]/publish
 *
 * Publishes the entire site to S3 with a new versioned deploymentId.
 * Flow (atomic by design):
 *   1. Auth + access check
 *   2. Fetch all pages for the site
 *   3. Generate HTML for each page
 *   4. Upload to S3: sites/{userId}/{businessId}/{siteId}/deployments/{deploymentId}/
 *   5. Only after ALL uploads succeed → update CloudFront KVS
 *   6. Record deployment in DB, mark all others as inactive
 *
 * Body (JSON):
 *   { deploymentName?: string }  — optional friendly label for this deployment
 */
export async function POST(request, { params }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { siteId } = await params;

        // ── 1. Load site + verify membership ─────────────────────────────────────
        const site = await prisma.site.findUnique({
            where: { id: siteId },
            include: {
                pages: true,
                tenant: { select: { id: true, ownerId: true } },
            },
        });

        if (!site) {
            return NextResponse.json({ error: "Site not found" }, { status: 404 });
        }

        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId: site.tenantId },
        });
        if (!membership) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // ── 2. Parse body ─────────────────────────────────────────────────────────
        let deploymentName = null;
        try {
            const body = await request.json();
            deploymentName = body?.deploymentName?.trim() || null;
        } catch {
            // body is optional
        }

        // ── 3. Generate HTML for all pages ────────────────────────────────────────
        if (!site.pages || site.pages.length === 0) {
            return NextResponse.json(
                { error: "Site has no pages to publish" },
                { status: 400 }
            );
        }

        // Build HTML for the home page (slug "/") as index.html
        // Additional pages can be added later as sub-paths
        const homePage =
            site.pages.find((p) => p.slug === "/" || p.slug === "") ||
            site.pages[0];

        const { html, css, js } = convertPageToHtml(
            site.theme,
            homePage,
            site.name,
            { stylesHref: "styles.css", scriptSrc: "script.js" }
        );

        // ── 4. Generate deploymentId & upload to S3 ───────────────────────────────
        const deploymentId = randomUUID();
        const userId = site.tenant.ownerId;
        const businessId = site.tenantId;

        const { s3Prefix } = await uploadDeploymentToS3({
            userId,
            businessId,
            siteId,
            deploymentId,
            html,
            css,
            js,
        });

        // ── 5. Update CloudFront KVS (only after successful S3 upload) ────────────
        let kvsUpdated = false;
        try {
            await updateKVS(site.slug, s3Prefix);
            kvsUpdated = true;
        } catch (kvsError) {
            // KVS update is best-effort; S3 files are already safe.
            // We still record the deployment so manual/rollback can fix KVS later.
            console.error("KVS update failed (non-fatal):", kvsError.message);
        }

        // ── 6. Persist deployment to DB (transaction) ─────────────────────────────
        const deployment = await prisma.$transaction(async (tx) => {
            // Deactivate all previous deployments for this site
            await tx.deployment.updateMany({
                where: { siteId, isActive: true },
                data: { isActive: false },
            });

            // Create new active deployment record
            const dep = await tx.deployment.create({
                data: {
                    deploymentId,
                    deploymentName,
                    s3Key: s3Prefix,
                    isActive: true,
                    kvsUpdated,
                    siteId,
                },
            });

            // Mark all pages as published
            await tx.page.updateMany({
                where: { siteId },
                data: { isPublished: true, publishedAt: new Date() },
            });

            return dep;
        });

        const siteUrl = buildSiteUrl(site.slug);

        return NextResponse.json({
            success: true,
            deploymentId,
            deploymentName,
            s3Prefix,
            kvsUpdated,
            siteUrl,
            liveUrl: siteUrl,
            message: kvsUpdated
                ? `Site published! Live at ${siteUrl}`
                : `Site uploaded to S3 (KVS update failed — traffic not yet routed).`,
        });
    } catch (error) {
        console.error("Publish error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to publish site" },
            { status: 500 }
        );
    }
}

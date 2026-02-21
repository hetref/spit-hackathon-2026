import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { convertPageToHtml } from "@/lib/publish/jsonToHtml";

export const runtime = "nodejs";

/**
 * POST /api/sites/[siteId]/pages/[pageId]/publish
 *
 * Generates static HTML/CSS/JS for one page and writes it to
 * public/published/<site.slug>/<page.slug>/index.html
 * Shared styles/scripts live at public/published/<site.slug>/
 */
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, pageId } = await params;

    // Fetch site (includes theme)
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Verify tenant membership
    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch page with full layout
    const page = await prisma.page.findFirst({ where: { id: pageId, siteId } });
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Determine output paths
    const siteSlug = site.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Normalise page slug: "/" → root index.html at site dir
    const pageSlug = page.slug === "/" ? null : page.slug.replace(/^\//, "");

    const siteDir = join(process.cwd(), "public", "published", siteSlug);
    const pageDir = pageSlug ? join(siteDir, pageSlug) : siteDir;

    // Compute relative path from page HTML back to shared assets
    const assetDepth = pageSlug ? "../" : "";
    const stylesHref = `${assetDepth}styles.css`;
    const scriptSrc = `${assetDepth}script.js`;

    // Convert page to HTML
    const { html, css, js } = convertPageToHtml(site.theme, page, site.name, {
      stylesHref,
      scriptSrc,
    });

    // Ensure directories exist
    await mkdir(pageDir, { recursive: true });
    await mkdir(siteDir, { recursive: true });

    // Write files — shared assets at site root, HTML in page dir
    await Promise.all([
      writeFile(join(pageDir, "index.html"), html, "utf-8"),
      writeFile(join(siteDir, "styles.css"), css, "utf-8"),
      writeFile(join(siteDir, "script.js"), js, "utf-8"),
    ]);

    // Mark page as published in DB
    await prisma.page.update({
      where: { id: pageId },
      data: { isPublished: true, publishedAt: new Date() },
    });

    const previewUrl = pageSlug
      ? `/published/${siteSlug}/${pageSlug}/index.html`
      : `/published/${siteSlug}/index.html`;

    return NextResponse.json({
      success: true,
      message: "Page published successfully!",
      previewUrl,
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to publish page." },
      { status: 500 },
    );
  }
}

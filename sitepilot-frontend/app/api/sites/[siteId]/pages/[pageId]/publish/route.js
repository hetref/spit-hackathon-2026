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

    // Determine filenames: "/" → index.*, others → slug.*
    const isHomePage = page.slug === "/";
    const baseFilename = isHomePage 
      ? "index" 
      : page.slug.replace(/^\//, "").replace(/\//g, "-");

    const htmlFilename = `${baseFilename}.html`;
    const cssFilename = `${baseFilename}.css`;
    const jsFilename = `${baseFilename}.js`;

    const siteDir = join(process.cwd(), "public", "published", siteSlug);
    const htmlPath = join(siteDir, htmlFilename);
    const cssPath = join(siteDir, cssFilename);
    const jsPath = join(siteDir, jsFilename);

    // Convert page to HTML with page-specific asset links
    const { html, css, js } = convertPageToHtml(site.theme, page, site.name, {
      stylesHref: cssFilename,
      scriptSrc: jsFilename,
    });

    // Ensure directory exists
    await mkdir(siteDir, { recursive: true });

    // Write files — each page gets its own HTML, CSS, and JS
    await Promise.all([
      writeFile(htmlPath, html, "utf-8"),
      writeFile(cssPath, css, "utf-8"),
      writeFile(jsPath, js, "utf-8"),
    ]);

    // Mark page as published in DB
    await prisma.page.update({
      where: { id: pageId },
      data: { isPublished: true, publishedAt: new Date() },
    });

    const previewUrl = `/published/${siteSlug}/${htmlFilename}`;

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

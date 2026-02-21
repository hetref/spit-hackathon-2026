import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateVerificationToken, isValidDomain } from "@/lib/aws/dns-verification";

/**
 * GET /api/sites/[siteId]/domains
 * List all custom domains for a site
 */
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;

    // Verify site exists and user has access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
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

    // Fetch all custom domains for this site
    const domains = await prisma.customDomain.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ domains, count: domains.length });

  } catch (error) {
    console.error("GET /api/sites/[siteId]/domains error:", error);
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sites/[siteId]/domains
 * Add a new custom domain
 * 
 * Body: { domain: string }
 */
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId } = await params;
    const { domain } = await request.json();

    // Validate domain format
    if (!domain || !isValidDomain(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    // Verify site exists and user has access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "EDITOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if domain is already taken
    const existingDomain = await prisma.customDomain.findUnique({
      where: { domain: domain.toLowerCase() },
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: "Domain is already in use" },
        { status: 409 }
      );
    }

    // Generate verification token
    const verificationValue = generateVerificationToken(domain);
    const verificationRecord = `_sitepilot-verify.${domain}`;

    // Create domain record
    const customDomain = await prisma.customDomain.create({
      data: {
        domain: domain.toLowerCase(),
        siteId,
        status: "PENDING",
        verificationRecord: verificationValue,
      },
    });

    return NextResponse.json({
      domain: customDomain,
      dnsInstructions: {
        type: "TXT",
        host: verificationRecord,
        value: verificationValue,
        message: `Add a TXT record at ${verificationRecord} with value: ${verificationValue}`,
      },
    });

  } catch (error) {
    console.error("POST /api/sites/[siteId]/domains error:", error);
    return NextResponse.json(
      { error: "Failed to add domain" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sites/[siteId]/domains/[domainId]
 * Remove a custom domain
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, domainId } = await params;

    // Verify site exists and user has access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "EDITOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find domain
    const customDomain = await prisma.customDomain.findUnique({
      where: { id: domainId, siteId },
    });

    if (!customDomain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Remove from CloudFront if attached
    if (customDomain.attachedToCF) {
      try {
        const { removeDomainFromTenant } = await import("@/lib/aws/cf-domain-attach");
        await removeDomainFromTenant({
          tenantName: site.slug,
          domain: customDomain.domain,
        });
      } catch (error) {
        console.error("Failed to remove domain from CloudFront:", error);
        // Continue with deletion even if CloudFront removal fails
      }
    }

    // Delete domain record
    await prisma.customDomain.delete({
      where: { id: domainId },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("DELETE /api/sites/[siteId]/domains/[domainId] error:", error);
    return NextResponse.json(
      { error: "Failed to remove domain" },
      { status: 500 }
    );
  }
}

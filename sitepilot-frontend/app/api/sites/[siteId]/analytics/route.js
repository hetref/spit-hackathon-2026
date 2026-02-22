import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request, { params }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { siteId } = await params;

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

        // Per Site Aggregation
        const totalSessions = await prisma.visitorSession.count({
            where: { siteId }
        });

        const pageViews = await prisma.pageView.findMany({
            where: { siteId },
        });

        const totalViews = pageViews.length;

        // Avg Duration
        const viewsWithDuration = pageViews.filter(pv => pv.duration > 0);
        const totalDuration = viewsWithDuration.reduce((acc, pv) => acc + pv.duration, 0);
        const avgDuration = viewsWithDuration.length > 0 ? Math.floor(totalDuration / viewsWithDuration.length) : 0;

        // Per Page Aggregation
        const pagesMap = {};
        pageViews.forEach(pv => {
            const slug = pv.pageSlug;
            if (!pagesMap[slug]) {
                pagesMap[slug] = {
                    slug,
                    views: 0,
                    uniqueSessions: new Set(),
                    totalDuration: 0,
                    durationCount: 0
                };
            }
            pagesMap[slug].views += 1;
            pagesMap[slug].uniqueSessions.add(pv.sessionId);
            if (pv.duration > 0) {
                pagesMap[slug].totalDuration += pv.duration;
                pagesMap[slug].durationCount += 1;
            }
        });

        // Format page stats
        const pageStats = Object.values(pagesMap).map(p => ({
            slug: p.slug,
            views: p.views,
            uniqueSessions: p.uniqueSessions.size,
            avgDuration: p.durationCount > 0 ? Math.floor(p.totalDuration / p.durationCount) : 0
        })).sort((a, b) => b.views - a.views);

        return NextResponse.json({
            success: true,
            siteStats: {
                totalViews,
                uniqueSessions: totalSessions,
                avgDuration
            },
            pageStats
        });

    } catch (error) {
        console.error("Analytics fetch error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

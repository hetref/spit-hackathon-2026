import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request) {
    try {
        const body = await request.json();
        const { siteId, pageSlug, userAgent } = body;
        let { sessionId } = body;

        if (!siteId || !pageSlug) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // IP Hashing (pseudonymization)
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("remote-addr") || "unknown";
        const ipHash = crypto.createHash('sha256').update(ip + process.env.NEXTAUTH_SECRET).digest('hex');

        // Make sure session exists or create it
        let visitorSession;
        if (sessionId) {
            visitorSession = await prisma.visitorSession.findUnique({
                where: { id: sessionId }
            });
        }

        if (!visitorSession) {
            // Create new session
            visitorSession = await prisma.visitorSession.create({
                data: {
                    siteId,
                    ipHash,
                    userAgent: userAgent || "Unknown",
                }
            });
            sessionId = visitorSession.id;
        } else {
            // Update updatedAt so session lives on
            await prisma.visitorSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() }
            });
        }

        // Record page view
        const pageView = await prisma.pageView.create({
            data: {
                sessionId: visitorSession.id,
                siteId,
                pageSlug,
                enteredAt: new Date(),
            }
        });

        // Provide permissive CORS headers since styles/scripts run on third-party domains
        const response = NextResponse.json({ success: true, pageViewId: pageView.id, sessionId });

        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return response;

    } catch (error) {
        console.error("Analytics enter logic error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

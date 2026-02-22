import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const body = await request.json();
        const { pageViewId } = body;

        if (!pageViewId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const pageView = await prisma.pageView.findUnique({
            where: { id: pageViewId }
        });

        if (!pageView) {
            return NextResponse.json({ error: "PageView not found" }, { status: 404 });
        }

        const exitedAt = new Date();
        const duration = Math.floor((exitedAt.getTime() - pageView.enteredAt.getTime()) / 1000);

        await prisma.pageView.update({
            where: { id: pageViewId },
            data: {
                exitedAt,
                duration: duration > 0 ? duration : 0
            }
        });

        const response = NextResponse.json({ success: true, duration });

        // Provide permissive CORS headers since styles/scripts run on third-party domains
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return response;

    } catch (error) {
        console.error("Analytics exit logic error:", error);
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

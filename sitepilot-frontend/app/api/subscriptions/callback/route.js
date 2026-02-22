/**
 * app/api/subscriptions/callback/route.js
 *
 * GET /api/subscriptions/callback?razorpay_subscription_id=...&razorpay_payment_id=...
 *
 * Razorpay redirects the user here after checkout completion.
 * We do NOT trust the frontend param; the webhook is the authoritative source.
 * This route simply redirects the user to the dashboard with a status query param.
 */

import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const rzSubId = searchParams.get('razorpay_subscription_id');
    const rzPaymentId = searchParams.get('razorpay_payment_id');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    if (!rzSubId || !rzPaymentId) {
        // Payment not completed — redirect back to pricing
        return NextResponse.redirect(`${appUrl}/pricing?status=cancelled`);
    }

    // Redirect to dashboard billing section — subscription will be activated by webhook
    return NextResponse.redirect(
        `${appUrl}/dashboard?subscriptionActivated=true&paymentId=${rzPaymentId}`
    );
}

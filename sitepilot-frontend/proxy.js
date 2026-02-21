import { NextResponse } from 'next/server'
import { betterFetch } from '@better-fetch/fetch'

/**
 * Proxy (formerly Middleware) — route protection
 *
 * Uses betterFetch to call the session API endpoint — fully Edge Runtime
 * compatible (no Prisma / Node.js APIs imported).
 *
 * Auth routes (/signin, /signup, /verify-email, /invitations/*):
 *   - Unauthenticated users → can access freely
 *   - Authenticated users   → redirect to /dashboard
 *
 * Protected routes (/dashboard/*, /tenants/*, /api/*):
 *   - Authenticated users   → can access freely
 *   - Unauthenticated users → redirect to /signin?callbackUrl=...
 *
 * Fully public routes (/):
 *   - Always accessible, no session check
 *
 * API passthrough (/api/auth/*, /api/invitations/*):
 *   - Always accessible, needed for auth flows
 */

// Auth routes — redirect authenticated users away to /dashboard
const authPaths = [
    '/signin',
    '/signup',
    '/verify-email',
]

const authPathPrefixes = [
    '/invitations/',
]

// Always public — no session check in either direction
const publicPaths = [
    '/',
]

// API routes that must always be accessible (auth/invitation flows)
const publicApiPrefixes = [
    '/api/auth/',
    '/api/invitations/',
]

// Routes that require a valid session
const protectedPathPrefixes = [
    '/dashboard',
    '/tenants',
    '/test',
    '/api/',
]

export async function proxy(request) {
    const { pathname } = request.nextUrl

    // Fully public — no session check needed
    if (publicPaths.includes(pathname)) {
        return NextResponse.next()
    }

    // API auth/invitation endpoints are always accessible
    const isPublicApiRoute = publicApiPrefixes.some(prefix =>
        pathname.startsWith(prefix)
    )
    if (isPublicApiRoute) {
        return NextResponse.next()
    }

    const isAuthRoute =
        authPaths.includes(pathname) ||
        authPathPrefixes.some(prefix => pathname.startsWith(prefix))

    const isProtectedRoute = protectedPathPrefixes.some(prefix =>
        pathname.startsWith(prefix)
    )

    // Only hit the session endpoint when we actually need it
    if (isAuthRoute || isProtectedRoute) {
        const { data: session } = await betterFetch('/api/auth/get-session', {
            baseURL: request.nextUrl.origin,
            headers: {
                // Forward cookies so better-auth can read the session cookie
                cookie: request.headers.get('cookie') ?? '',
            },
        })

        if (isAuthRoute && session) {
            // Authenticated user visiting signin/signup → send to dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        if (isProtectedRoute && !session) {
            // Unauthenticated user visiting a protected route → send to signin
            const signinUrl = new URL('/signin', request.url)
            signinUrl.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(signinUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - Any path with a file extension (public assets)
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*|public).*)',
    ],
}

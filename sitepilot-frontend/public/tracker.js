/**
 * SitePilot Analytics Tracker v2
 *
 * IMPORTANT: Loaded via <script src="…/tracker.js" data-site="…" data-page="…" defer>
 *
 * KEY FIX: document.currentScript is ALWAYS null for deferred scripts.
 * We locate ourselves by scanning all <script> tags for [data-site].
 *
 * The API base URL is derived from the script's own `src` attribute so no
 * hardcoded URLs are ever needed.
 */
(function () {
    'use strict';

    // ─── Logging ────────────────────────────────────────────────────────────────
    var LABEL = '%c[SitePilot Analytics]%c';
    var STYLE_TAG = 'background:#0b1411;color:#d3ff4a;font-weight:bold;padding:2px 6px;border-radius:4px;';
    var STYLE_RST = 'color:inherit;font-weight:normal;';

    function log() {
        var args = [LABEL, STYLE_TAG, STYLE_RST];
        for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
        console.log.apply(console, args);
    }
    function warn() {
        var args = [LABEL, STYLE_TAG, STYLE_RST];
        for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
        console.warn.apply(console, args);
    }
    function errLog() {
        var args = [LABEL, STYLE_TAG, STYLE_RST];
        for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
        console.error.apply(console, args);
    }

    // ─── Guard against duplicate initialization ──────────────────────────────
    if (window._spTrackerInitialized) {
        log('Already initialized — skipping duplicate');
        return;
    }
    window._spTrackerInitialized = true;

    // ─── Locate our script tag ───────────────────────────────────────────────
    //
    // document.currentScript is ALWAYS null for deferred scripts because the
    // script executes after the document is fully parsed. We find ourselves by
    // scanning every <script> element for the data-site attribute.
    //
    function findScriptTag() {
        var scripts = document.querySelectorAll('script[data-site]');
        if (scripts.length > 0) return scripts[0];
        // Fallback: look for src containing "tracker.js"
        var all = document.querySelectorAll('script[src]');
        for (var i = 0; i < all.length; i++) {
            if (all[i].src && all[i].src.indexOf('tracker.js') !== -1) return all[i];
        }
        return null;
    }

    var scriptTag = findScriptTag();
    if (!scriptTag) {
        warn('Could not locate tracker script tag — aborting');
        return;
    }

    var siteId = scriptTag.getAttribute('data-site');
    var pageSlug = scriptTag.getAttribute('data-page') || window.location.pathname;

    if (!siteId) {
        warn('Missing data-site attribute — aborting');
        return;
    }

    // ─── Derive API base from script src ────────────────────────────────────
    //
    // Our script is at: https://app.devally.in/tracker.js
    // API base is:      https://app.devally.in
    //
    // This means we never need a hardcoded URL — it always points to wherever
    // this tracker.js file is actually being served from.
    //
    var apiBase = '';
    var scriptSrc = scriptTag.src || '';
    if (scriptSrc) {
        // Strip everything from /tracker.js onward
        apiBase = scriptSrc.replace(/\/tracker\.js(\?.*)?$/, '').replace(/\/+$/, '');
    }

    if (!apiBase) {
        warn('Could not derive API base from script src:', scriptSrc, '— aborting');
        return;
    }

    // ─── Boot log ───────────────────────────────────────────────────────────
    console.groupCollapsed('%c[SitePilot Analytics]%c Initialising tracker', STYLE_TAG, STYLE_RST);
    log('Script src       :', scriptSrc);
    log('API base         :', apiBase);
    log('Site ID          :', siteId);
    log('Page slug        :', pageSlug);
    log('Page URL         :', window.location.href);
    log('Referrer         :', document.referrer || '(none)');
    console.groupEnd();

    // ─── Cookie helpers ─────────────────────────────────────────────────────
    function setCookie(name, value, minutes) {
        var d = new Date();
        d.setTime(d.getTime() + minutes * 60 * 1000);
        // SameSite=None required for cross-origin cookies (S3 → our API)
        document.cookie =
            name + '=' + (value || '') +
            '; expires=' + d.toUTCString() +
            '; path=/' +
            '; SameSite=None; Secure';
    }

    function getCookie(name) {
        var eq = name + '=';
        var parts = document.cookie.split(';');
        for (var i = 0; i < parts.length; i++) {
            var c = parts[i].replace(/^ +/, '');
            if (c.indexOf(eq) === 0) return c.substring(eq.length);
        }
        return null;
    }

    // ─── State ──────────────────────────────────────────────────────────────
    var sessionId = getCookie('_sp_sid');
    var pageViewId = null;
    var exitSent = false;

    if (sessionId) {
        log('Existing session :', sessionId);
    } else {
        log('No session cookie found — will create a new one on enter');
    }

    // ─── Enter event ────────────────────────────────────────────────────────
    var enterUrl = apiBase + '/api/analytics/enter';
    log('Sending /enter →', enterUrl);

    var enterPayload = {
        siteId: siteId,
        pageSlug: pageSlug,
        sessionId: sessionId || null,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null
    };

    fetch(enterUrl, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enterPayload),
        keepalive: true
    })
        .then(function (res) {
            log('/enter response status :', res.status);
            if (!res.ok) {
                warn('/enter HTTP error —', res.status, res.statusText);
            }
            return res.json();
        })
        .then(function (data) {
            if (data.error) {
                warn('/enter API error :', data.error);
                return;
            }
            if (data.sessionId) {
                setCookie('_sp_sid', data.sessionId, 30);
                sessionId = data.sessionId;
                log('Session stored   :', sessionId);
            }
            if (data.pageViewId) {
                pageViewId = data.pageViewId;
                log('✅ Page view recorded. pageViewId:', pageViewId);
            }
        })
        .catch(function (e) {
            errLog('/enter fetch failed :', e.message || e);
        });

    // ─── Exit event ─────────────────────────────────────────────────────────
    var exitUrl = apiBase + '/api/analytics/exit';

    function sendExit() {
        if (!pageViewId || exitSent) return;
        exitSent = true;

        log('Sending /exit → pageViewId:', pageViewId);
        var payload = JSON.stringify({ pageViewId: pageViewId });

        if (navigator.sendBeacon) {
            // sendBeacon requires a Blob to set Content-Type
            var blob = new Blob([payload], { type: 'application/json' });
            var ok = navigator.sendBeacon(exitUrl, blob);
            log('sendBeacon result :', ok ? '✅ queued' : '⚠️ rejected (will fallback)');
            if (!ok) {
                // sendBeacon can return false when the queue is full
                fetch(exitUrl, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                }).catch(function (e) {
                    errLog('/exit fetch fallback failed:', e.message || e);
                });
            }
        } else {
            log('sendBeacon not available — using fetch fallback');
            fetch(exitUrl, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(function (e) {
                errLog('/exit fetch failed:', e.message || e);
            });
        }

        // Clear so we don't accidentally send again
        pageViewId = null;
    }

    // pagehide fires reliably on all browsers (including iOS Safari)
    window.addEventListener('pagehide', function (e) {
        log('pagehide fired (persisted=' + e.persisted + ')');
        sendExit();
    });

    // visibilitychange covers mobile backgrounding and tab switching
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            log('visibilitychange → hidden');
            sendExit();
        }
    });

    log('Event listeners attached (pagehide + visibilitychange)');
})();

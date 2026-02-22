(function () {
    "use strict";

    function init() {
        // Resolve the script tag — document.currentScript works for defer scripts
        var scriptTag = document.currentScript || document.querySelector('script[data-site]');
        if (!scriptTag) return;

        var siteId = scriptTag.getAttribute('data-site');
        var apiBase = scriptTag.getAttribute('data-api');
        var pageSlug = scriptTag.getAttribute('data-page') || window.location.pathname;

        if (!siteId || !apiBase) return;

        // Strip trailing slash from API base
        apiBase = apiBase.replace(/\/+$/, '');

        var pageViewId = null;
        var sessionId = getCookie('_sp_sid');

        // Fire enter event (non-blocking)
        var enterUrl = apiBase + '/api/analytics/enter';
        fetch(enterUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId: siteId,
                pageSlug: pageSlug,
                sessionId: sessionId,
                userAgent: navigator.userAgent,
                referrer: document.referrer || null
            }),
            keepalive: true
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.sessionId) {
                setCookie('_sp_sid', data.sessionId, 30);
                sessionId = data.sessionId;
            }
            if (data.pageViewId) {
                pageViewId = data.pageViewId;
            }
        })
        .catch(function () { /* silent — analytics must never break the page */ });

        // Fire exit event on page unload
        var exitUrl = apiBase + '/api/analytics/exit';
        function sendExit() {
            if (!pageViewId) return;
            var payload = JSON.stringify({ pageViewId: pageViewId });

            if (navigator.sendBeacon) {
                navigator.sendBeacon(exitUrl, new Blob([payload], { type: 'application/json' }));
            } else {
                fetch(exitUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                });
            }
            pageViewId = null; // prevent duplicate exits
        }

        // pagehide is the most reliable unload event for modern browsers
        window.addEventListener('pagehide', sendExit);
        // visibilitychange covers mobile tab switches and app backgrounding
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') sendExit();
        });
    }

    // ── Cookie helpers ──────────────────────────────────────────────────────
    function setCookie(name, value, minutes) {
        var expires = '';
        if (minutes) {
            var d = new Date();
            d.setTime(d.getTime() + minutes * 60000);
            expires = '; expires=' + d.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax; Secure';
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

    // Prevent multiple executions
    if (!window._spTrackerInitialized) {
        window._spTrackerInitialized = true;
        init();
    }
})();

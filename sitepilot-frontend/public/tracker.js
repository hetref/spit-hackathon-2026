(function () {
    // This tells the tracker exactly where your Next.js application is hosted, 
    // so it knows where to send the analytics data.
    const BACKEND_URL = "https://jeanene-unexposed-ingrid.ngrok-free.dev";

    function init() {
        const scriptTag = document.currentScript || document.querySelector('script[src*="tracker.js"]');
        if (!scriptTag) return;

        const siteId = scriptTag.getAttribute('data-site');
        const pageSlug = scriptTag.getAttribute('data-page') || window.location.pathname;

        if (!siteId) return;

        let pageViewId = null;
        let sessionId = getCookie('_sp_session');

        // Fire enter event
        fetch(`${BACKEND_URL}/api/analytics/enter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                siteId,
                pageSlug,
                sessionId,
                userAgent: navigator.userAgent
            }),
            keepalive: true
        })
            .then(res => res.json())
            .then(data => {
                if (data.sessionId) {
                    setCookie('_sp_session', data.sessionId, 30); // 30 mins session
                    sessionId = data.sessionId;
                }
                if (data.pageViewId) {
                    pageViewId = data.pageViewId;
                }
            })
            .catch(err => console.error('SitePilot Analytics Error:', err));

        // Fire exit event
        window.addEventListener('pagehide', function () {
            if (!pageViewId) return;
            const data = JSON.stringify({ pageViewId });

            // Use sendBeacon for reliable delivery during page unload
            if (navigator.sendBeacon) {
                navigator.sendBeacon(`${BACKEND_URL}/api/analytics/exit`, new Blob([data], { type: 'application/json' }));
            } else {
                fetch(`${BACKEND_URL}/api/analytics/exit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data,
                    keepalive: true
                });
            }
        });
    }

    // Basic cookie utils
    function setCookie(name, value, minutes) {
        let expires = "";
        if (minutes) {
            const date = new Date();
            date.setTime(date.getTime() + (minutes * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax; Secure";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Prevent multiple executions
    if (!window._spTrackerInitialized) {
        window._spTrackerInitialized = true;
        init();
    }
})();

// Content script for immediate cookie injection
(async function() {
    // Deterministic subdomain generation (same as background.js)
    async function generateDeterministicSubdomain(userId, secret, domain) {
        const dayTimestamp = Math.floor(Math.floor(Date.now() / 1000) / 86400);
        const message = `${userId}${domain}${dayTimestamp}`;

        const encoder = new TextEncoder();
        const messageData = encoder.encode(message);
        const secretData = encoder.encode(secret);

        const key = await crypto.subtle.importKey(
            'raw',
            secretData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        const hashArray = Array.from(new Uint8Array(signature));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex.substring(0, 32);
    }

    // Funktion zum Setzen des Cookies
    function setCookie(name, value) {
        // Cookie mit SameSite=None und Secure für Cross-Site-Requests
        document.cookie = `${name}=${value}; path=/; SameSite=None; Secure`;
    }

    try {
        // Hole gespeicherte Credentials aus dem Extension Storage
        const data = await chrome.storage.local.get(['userId', 'secret', 'appDomain', 'isLoggedIn']);

        if (!data.isLoggedIn || !data.userId || !data.secret || !data.appDomain) {
            // Nicht eingeloggt oder fehlende Daten - nichts tun
            return;
        }

        // Aktuelle Domain ermitteln
        const domain = window.location.hostname;

        // Generiere deterministische Subdomain für diese Domain
        const subdomain = await generateDeterministicSubdomain(data.userId, data.secret, domain);
        const openPimsUrl = `https://${subdomain}.${data.appDomain}`;

        // Setze den Cookie sofort
        setCookie('x-openpims', openPimsUrl);

        // Optional: Header-Injection für fetch und XMLHttpRequest
        // Dies stellt sicher, dass auch AJAX-Requests den Header haben
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            let [resource, config] = args;

            // Initialisiere config wenn nicht vorhanden
            if (!config) {
                config = {};
            }
            if (!config.headers) {
                config.headers = {};
            }

            // Füge X-OpenPIMS Header hinzu
            config.headers['X-OpenPIMS'] = openPimsUrl;

            return originalFetch.call(this, resource, config);
        };

        // XMLHttpRequest überschreiben
        const XHR = XMLHttpRequest.prototype;
        const originalOpen = XHR.open;
        const originalSend = XHR.send;

        XHR.open = function(method, url) {
            this._method = method;
            this._url = url;
            return originalOpen.apply(this, arguments);
        };

        XHR.send = function(data) {
            // Füge X-OpenPIMS Header hinzu
            this.setRequestHeader('X-OpenPIMS', openPimsUrl);
            return originalSend.apply(this, arguments);
        };

    } catch (error) {
        // Fehler still ignorieren, um die Seite nicht zu stören
        console.error('OpenPIMS content script error:', error);
    }
})();
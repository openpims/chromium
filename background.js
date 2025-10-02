// Konstanten
const CONSTANTS = {
    WINDOW_CONFIG: {
        type: 'popup',
        width: 400,
        height: 600
    },
    RULE_ID: 1,
    RULE_PRIORITY: 1
};

// Hilfsfunktionen
const createLoginWindow = () => {
    chrome.windows.create({
        url: 'login.html',
        ...CONSTANTS.WINDOW_CONFIG
    });
};

const getStorageData = async (keys) => {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
    });
};

// Hilfsfunktion für saubere Fehler
function createCleanError(message, status = null) {
    const error = new Error();
    error.message = message;
    if (status !== null) {
        error.status = status;
    }
    // Entferne den Stacktrace
    delete error.stack;
    return error;
}

// Deterministic subdomain generation with daily rotation
async function generateDeterministicSubdomain(userId, secret, domain) {
    // Get current day timestamp (same as PHP: floor(time() / 86400))
    const dayTimestamp = Math.floor(Math.floor(Date.now() / 1000) / 86400);

    // Concatenate inputs: userId + domain + dayTimestamp (secret is used as HMAC key, not in message)
    const message = `${userId}${domain}${dayTimestamp}`;

    // Convert to Uint8Array
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);
    const secretData = encoder.encode(secret);

    // Import secret as HMAC key
    const key = await crypto.subtle.importKey(
        'raw',
        secretData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    // Generate HMAC
    const signature = await crypto.subtle.sign('HMAC', key, messageData);

    // Convert to hex string (full 64 chars)
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Truncate to 32 chars (16 bytes = 128 bits) to fit DNS label limit of 63 chars
    return hashHex.substring(0, 32);
}

// Cache für generierte Subdomains (Key: domain, Value: {subdomain, timestamp})
const subdomainCache = new Map();

// Funktion um Subdomain für eine Domain zu bekommen (mit Cache)
async function getSubdomainForDomain(domain, userId, secret, appDomain) {
    const cacheKey = domain;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Prüfe Cache
    const cached = subdomainCache.get(cacheKey);
    if (cached && (now - cached.timestamp < oneDayMs)) {
        return cached.subdomain;
    }

    // Generiere neue Subdomain
    const subdomain = await generateDeterministicSubdomain(userId, secret, domain);
    const openPimsUrl = `https://${subdomain}.${appDomain}`;

    // Cache aktualisieren
    subdomainCache.set(cacheKey, { subdomain: openPimsUrl, timestamp: now });

    return openPimsUrl;
}

// Header-Regeln Management - verwendet declarativeNetRequest mit modifyHeaders
const updateHeaderRules = async () => {
    try {
        // Hole gespeicherte Credentials
        const { userId, secret, appDomain } = await getStorageData(['userId', 'secret', 'appDomain']);

        if (!userId || !secret || !appDomain) {
            console.error('Keine User-ID, Secret oder App-Domain für Header-Regeln vorhanden');
            return;
        }

        // Header-Regeln aktiviert
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Header-Regeln:', error);
    }
};

// Map zum Tracking welche Domains bereits Regeln haben
const domainsWithRules = new Set();

// Verwende webRequest ohne blocking (nur zum Erkennen neuer Domains)
chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        try {
            const url = new URL(details.url);
            const domain = url.hostname;

            // Skip wenn bereits eine Regel existiert
            if (domainsWithRules.has(domain)) {
                return;
            }

            const { userId, secret, appDomain, isLoggedIn } = await getStorageData(['userId', 'secret', 'appDomain', 'isLoggedIn']);

            if (!isLoggedIn || !userId || !secret || !appDomain) {
                return;
            }

            // Markiere Domain als bearbeitet (verhindert Race Conditions)
            domainsWithRules.add(domain);

            // Generiere Subdomain für diese Domain
            const subdomain = await generateDeterministicSubdomain(userId, secret, domain);
            const openPimsUrl = `https://${subdomain}.${appDomain}`;

            // Erstelle dynamische Regel für diese spezifische Domain
            const ruleId = Math.abs(hashCode(domain)) % 10000 + 1;

            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [ruleId],
                addRules: [{
                    id: ruleId,
                    priority: 1,
                    action: {
                        type: 'modifyHeaders',
                        requestHeaders: [{
                            operation: 'set',
                            header: 'x-openpims',
                            value: openPimsUrl
                        }]
                    },
                    condition: {
                        urlFilter: `*://${domain}/*`,
                        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script', 'stylesheet', 'image', 'font', 'object', 'media', 'websocket', 'other']
                    }
                }]
            });

            // Header-Regel erstellt
        } catch (error) {
            console.error('Fehler beim Erstellen der Header-Regel:', error);
        }
    },
    { urls: ["<all_urls>"] }
    // Kein "blocking" - nur zum Erkennen von Requests
);

// Hash-Funktion für konsistente Rule-IDs
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

// Event Listener
const initializeExtension = async () => {
    try {
        const { isLoggedIn } = await getStorageData(['isLoggedIn']);

        if (isLoggedIn) {
            await updateHeaderRules();
        }
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
    }
};

// Event Listener für Storage-Änderungen
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local') {
        if (changes.isLoggedIn) {
            if (changes.isLoggedIn.newValue) {
                await updateHeaderRules();
            } else {
                // Benutzer ausgeloggt
                // Lösche alle dynamischen Regeln und leere das Set
                const rules = await chrome.declarativeNetRequest.getDynamicRules();
                const ruleIds = rules.map(r => r.id);
                if (ruleIds.length > 0) {
                    await chrome.declarativeNetRequest.updateDynamicRules({
                        removeRuleIds: ruleIds
                    });
                }
                domainsWithRules.clear();
            }
        }
    }
});

// Initialisierung
initializeExtension();

// Login-Funktion
async function handleLogin(email, password, serverUrl) {
    try {
        const response = await fetch(serverUrl, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + btoa(email + ':' + password)
            }
        });

        if (!response.ok) {
            let errorMessage;

            switch (response.status) {
                case 401:
                    errorMessage = 'Ungültige E-Mail oder Passwort';
                    break;
                case 403:
                    errorMessage = 'Zugriff verweigert';
                    break;
                case 404:
                    errorMessage = 'Login-Service nicht erreichbar';
                    break;
                case 500:
                    errorMessage = 'Server-Fehler, bitte versuchen Sie es später erneut';
                    break;
                default:
                    errorMessage = `Login fehlgeschlagen (Status: ${response.status})`;
            }

            throw createCleanError(errorMessage, response.status);
        }

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            // Server gibt JSON zurück
            data = await response.json();

            if (!data.userId || !data.token || !data.domain) {
                throw createCleanError('Keine gültige User-ID, Token oder Domain vom Server erhalten');
            }

            // Speichere die Daten
            await chrome.storage.local.set({
                userId: data.userId,
                secret: data.token,
                appDomain: data.domain,
                email: email,
                serverUrl: serverUrl,
                isLoggedIn: true
            });
        } else {
            // Fallback: Server gibt nur Text zurück (alte API)
            const text = await response.text();

            if (!text || text.trim() === '') {
                throw createCleanError('Keine gültige Antwort vom Server erhalten');
            }

            // Parse als JSON falls möglich
            try {
                data = JSON.parse(text);

                if (!data.userId || !data.token || !data.domain) {
                    throw createCleanError('Keine gültige User-ID, Token oder Domain vom Server erhalten');
                }

                await chrome.storage.local.set({
                    userId: data.userId,
                    secret: data.token,
                    appDomain: data.domain,
                    email: email,
                    serverUrl: serverUrl,
                    isLoggedIn: true
                });
            } catch (e) {
                // Text ist kein JSON - alte API die nur URL zurückgibt
                throw createCleanError('Server-Antwort hat falsches Format. Erwartet JSON mit userId, token und domain.');
            }
        }

        // Aktualisiere die Header-Regeln
        await updateHeaderRules();

        return { success: true };
    } catch (error) {
        if (error.status) {
            console.error(`Login fehlgeschlagen (Status ${error.status}): ${error.message}`);
        } else {
            console.error(`Login fehlgeschlagen: ${error.message}`);
        }
        throw createCleanError(error.message, error.status);
    }
}

// Message Listener für Login-Anfragen
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'login') {
        // Wrapper für die asynchrone Verarbeitung
        (async () => {
            try {
                const data = await handleLogin(request.email, request.password, request.serverUrl);
                sendResponse({ success: true, data });
            } catch (error) {
                sendResponse({ 
                    success: false, 
                    error: error.message
                });
            }
        })();

        return true; // Wichtig für asynchrone Antworten
    }
});


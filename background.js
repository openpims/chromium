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

// Header-Regeln Management
const updateHeaderRules = async (url) => {
    if (!url) {
        console.error('Keine URL für Header-Regeln vorhanden');
        return;
    }

    try {
        console.log('Aktualisiere Header-Regeln mit URL:', url);
        const allResourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType);
        const rules = [{
            id: CONSTANTS.RULE_ID,
            priority: CONSTANTS.RULE_PRIORITY,
            action: {
                type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                requestHeaders: [{
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    header: "x-openpims",
                    value: url
                }]
            },
            condition: {
                urlFilter: "*",
                resourceTypes: allResourceTypes
            }
        }];

        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [CONSTANTS.RULE_ID],
            addRules: rules
        });
        console.log('Header-Regeln erfolgreich aktualisiert');
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Header-Regeln:', error);
    }
};

// Event Listener
const initializeExtension = async () => {
    try {
        const { isLoggedIn, openPimsUrl } = await getStorageData(['openPimsUrl', 'isLoggedIn']);

        if (isLoggedIn && openPimsUrl) {
            await updateHeaderRules(openPimsUrl);
        }
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
    }
};

// Event Listener für Storage-Änderungen
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local') {
        if (changes.openPimsUrl) {
            if (changes.openPimsUrl.newValue) {
                await updateHeaderRules(changes.openPimsUrl.newValue);
            } else {
                // Wenn die URL entfernt wurde (Logout), entferne die Header-Regeln
                try {
                    await chrome.declarativeNetRequest.updateDynamicRules({
                        removeRuleIds: [CONSTANTS.RULE_ID]
                    });
                    console.log('Header-Regeln erfolgreich entfernt');
                } catch (error) {
                    console.error('Fehler beim Entfernen der Header-Regeln:', error);
                }
            }
        }
    }
});

// Initialisierung
initializeExtension();

// Login-Funktion
async function handleLogin(email, password) {
    try {
        const response = await fetch('https://me.openpims.de', {
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

        const openPimsUrl = await response.text();

        if (!openPimsUrl || openPimsUrl.trim() === '') {
            throw createCleanError('Keine gültige URL vom Server erhalten');
        }

        // Aktualisiere die Header-Regeln mit der neuen URL
        await updateHeaderRules(openPimsUrl.trim());

        // Speichere die Daten
        await chrome.storage.local.set({
            openPimsUrl: openPimsUrl.trim(),
            email: email,
            isLoggedIn: true
        });

        return { token: openPimsUrl.trim() }; // Wir verwenden die URL als Token
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
                const data = await handleLogin(request.email, request.password);
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


// Warte bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', () => {
    // Lade die gespeicherten Daten
    chrome.storage.local.get(['userId', 'isLoggedIn', 'email', 'serverUrl'], (result) => {
        const loggedInContent = document.getElementById('loggedInContent');
        const loginForm = document.getElementById('loginForm');
        const urlElement = document.getElementById('url');

        if (result.isLoggedIn && result.userId) {
            urlElement.innerHTML = `
                <div style="margin-bottom: 10px;">Angemeldet als: ${result.email || 'Unbekannt'}</div>
                <div style="font-size: 0.9em; color: #666;">Server: ${result.serverUrl || 'https://me.openpims.de'}</div>
            `;
            loggedInContent.classList.remove('hidden');
            loginForm.classList.add('hidden');
        } else {
            loggedInContent.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }
    });

    // Registriere Login-Button Event-Listener
    const loginButton = document.getElementById('loginButton');
    if (!loginButton) return;

    loginButton.addEventListener('click', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const serverUrl = document.getElementById('serverUrl').value;
        const errorMessage = document.getElementById('errorMessage');
        const loginButton = document.getElementById('loginButton');

        // UI-Status zurücksetzen
        errorMessage.textContent = '';
        errorMessage.classList.remove('visible');
        loginButton.disabled = true;
        loginButton.textContent = 'Anmeldung läuft...';

        if (!email || !password || !serverUrl) {
            errorMessage.textContent = 'Bitte füllen Sie alle Felder aus.';
            errorMessage.classList.add('visible');
            loginButton.disabled = false;
            loginButton.textContent = 'Anmelden';
            return;
        }

        try {
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    action: 'login',
                    email: email,
                    password: password,
                    serverUrl: serverUrl
                }, response => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                });
            });

            if (!response.success) {
                throw new Error(response.error);
            }

            // Storage wurde bereits im background.js gesetzt
            // Hole die aktualisierten Daten
            const result = await chrome.storage.local.get(['userId', 'email', 'serverUrl']);

            // UI aktualisieren
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('loggedInContent').classList.remove('hidden');
            document.getElementById('url').innerHTML = `
                <div style="margin-bottom: 10px;">Angemeldet als: ${result.email}</div>
                <div style="font-size: 0.9em; color: #666;">Server: ${result.serverUrl}</div>
            `;
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.add('visible');
            
            // Setze das Passwort-Feld zurück
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        } finally {
            // UI-Status zurücksetzen
            loginButton.disabled = false;
            loginButton.textContent = 'Anmelden';
        }
    });

    // Logout-Button Event Listener
    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async () => {
    try {
        // Lösche die gespeicherten Daten
        await chrome.storage.local.remove(['userId', 'secret', 'appDomain', 'isLoggedIn', 'email', 'serverUrl']);
        
        // Aktualisiere die Anzeige
        const loggedInContent = document.getElementById('loggedInContent');
        const loginForm = document.getElementById('loginForm');
        const urlElement = document.getElementById('url');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('errorMessage');

        // Setze Formularfelder zurück
        emailInput.value = '';
        passwordInput.value = '';
        errorMessage.textContent = '';

        loggedInContent.classList.add('hidden');
        loginForm.classList.remove('hidden');
        urlElement.textContent = '';
        } catch (error) {
            // Silently ignore errors
        }
    });
});
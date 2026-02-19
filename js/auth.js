/* ============================================
   THMOVIES - Authentication Module
   ============================================ */

const Auth = (() => {
    const STORAGE_KEY = 'thm_session';

    // Hash a string with SHA-256 using Web Crypto API
    async function sha256(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Validate credentials against stored hashes
    async function validateCredentials(username, password) {
        const combined = `${username}:${password}`;

        // Try SHA-256 hash validation
        const hash = await sha256(combined);
        if (CONFIG.CREDENTIAL_HASHES.includes(hash)) {
            return true;
        }

        // Fallback: Base64 legacy validation
        for (const encoded of CONFIG.CREDS_LEGACY) {
            try {
                const decoded = atob(encoded);
                if (combined === decoded) {
                    return true;
                }
            } catch (e) {
                // Invalid base64, skip
            }
        }

        return false;
    }

    // Create a session object
    function createSession(username) {
        return {
            user: username,
            created: Date.now(),
            expires: Date.now() + CONFIG.SESSION_DURATION_MS
        };
    }

    // Save session to localStorage
    function saveSession(session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    // Get current session
    function getSession() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return null;
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    // Check if user is authenticated with a valid session
    function isAuthenticated() {
        // Check new session system
        const session = getSession();
        if (session && session.expires > Date.now()) {
            return true;
        }

        // Fallback: check old localStorage key for backward compatibility
        if (localStorage.getItem('authenticated') === 'true') {
            // Migrate to new session system
            const migrated = createSession('utente1');
            saveSession(migrated);
            localStorage.removeItem('authenticated');
            return true;
        }

        // Session expired or invalid
        clearSession();
        return false;
    }

    // Login
    async function login(username, password) {
        const valid = await validateCredentials(username, password);
        if (!valid) {
            return { success: false, error: 'Credenziali errate!' };
        }

        const session = createSession(username);
        saveSession(session);
        localStorage.setItem('showRulesOnLoad', 'true');

        return { success: true };
    }

    // Logout
    function logout() {
        clearSession();
        localStorage.removeItem('authenticated');
        localStorage.removeItem('showRulesOnLoad');
    }

    // Clear session
    function clearSession() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // Get current username
    function getUsername() {
        const session = getSession();
        return session?.user || 'Utente';
    }

    return {
        login,
        logout,
        isAuthenticated,
        getUsername,
        getSession
    };
})();

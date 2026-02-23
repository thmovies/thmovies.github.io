/* ============================================
   THMOVIES - Authentication Module
   Firebase Auth (primary) + Local fallback
   ============================================ */

const Auth = (() => {
    const STORAGE_KEY = 'thm_session';

    // =============================================
    // Utility: SHA-256 hash
    // =============================================
    async function sha256(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // =============================================
    // Firebase helpers
    // =============================================
    function isFirebaseReady() {
        return typeof firebase !== 'undefined' && CONFIG._firebaseReady === true;
    }

    function getFirebaseAuth() {
        return isFirebaseReady() ? firebase.auth() : null;
    }

    function usernameToEmail(username) {
        return `${username.toLowerCase().trim()}@${CONFIG.FIREBASE_EMAIL_DOMAIN}`;
    }

    function emailToUsername(email) {
        if (!email) return null;
        return email.split('@')[0];
    }

    // =============================================
    // Registration (Firebase only)
    // =============================================
    async function register(username, password) {
        // Validation
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return {
                success: false,
                error: 'Username: 3-20 caratteri, solo lettere, numeri e underscore.'
            };
        }

        if (password.length < 6) {
            return {
                success: false,
                error: 'La password deve avere almeno 6 caratteri.'
            };
        }

        if (!isFirebaseReady()) {
            return {
                success: false,
                error: 'Registrazione non disponibile. Firebase non configurato.'
            };
        }

        const auth = getFirebaseAuth();
        const email = usernameToEmail(username);

        try {
            const credential = await auth.createUserWithEmailAndPassword(email, password);

            // Set displayName to the real username
            await credential.user.updateProfile({
                displayName: username
            });

            // Create local session
            const session = createSession(username, 'firebase', credential.user.uid);
            saveSession(session);
            localStorage.setItem('showRulesOnLoad', 'true');

            return { success: true };
        } catch (err) {
            let errorMsg = 'Errore durante la registrazione.';

            switch (err.code) {
                case 'auth/email-already-in-use':
                    errorMsg = 'Username gia\' in uso. Scegline un altro.';
                    break;
                case 'auth/weak-password':
                    errorMsg = 'Password troppo debole. Usa almeno 6 caratteri.';
                    break;
                case 'auth/invalid-email':
                    errorMsg = 'Username non valido.';
                    break;
                case 'auth/network-request-failed':
                    errorMsg = 'Errore di rete. Controlla la connessione.';
                    break;
                default:
                    errorMsg = err.message || errorMsg;
            }

            return { success: false, error: errorMsg };
        }
    }

    // =============================================
    // Login (Firebase first, then local fallback)
    // =============================================
    async function login(username, password) {
        // 1) Try Firebase Auth first
        if (isFirebaseReady()) {
            try {
                const auth = getFirebaseAuth();
                const email = usernameToEmail(username);
                const credential = await auth.signInWithEmailAndPassword(email, password);

                const displayName = credential.user.displayName || username;
                const session = createSession(displayName, 'firebase', credential.user.uid);
                saveSession(session);
                localStorage.setItem('showRulesOnLoad', 'true');

                return { success: true };
            } catch (firebaseErr) {
                // If it's a network error, don't fall through to local
                if (firebaseErr.code === 'auth/network-request-failed') {
                    // Fall through to local validation
                    console.warn('Firebase network error, trying local fallback...');
                } else if (firebaseErr.code !== 'auth/user-not-found' &&
                           firebaseErr.code !== 'auth/wrong-password' &&
                           firebaseErr.code !== 'auth/invalid-credential') {
                    // Unexpected error
                    return {
                        success: false,
                        error: 'Errore di autenticazione. Riprova.'
                    };
                }
                // user-not-found or wrong-password: fall through to local validation
            }
        }

        // 2) Local fallback: SHA-256 hash validation
        const valid = await validateLocalCredentials(username, password);
        if (!valid) {
            return { success: false, error: 'Credenziali errate!' };
        }

        const session = createSession(username, 'local');
        saveSession(session);
        localStorage.setItem('showRulesOnLoad', 'true');

        return { success: true };
    }

    // =============================================
    // Local credential validation (hash + base64)
    // =============================================
    async function validateLocalCredentials(username, password) {
        const combined = `${username}:${password}`;

        // SHA-256 hash validation
        const hash = await sha256(combined);
        if (CONFIG.CREDENTIAL_HASHES.includes(hash)) {
            return true;
        }

        // Fallback: Base64 legacy validation
        for (const encoded of CONFIG.CREDS_LEGACY) {
            try {
                const decoded = atob(encoded);
                if (combined === decoded) return true;
            } catch (e) { /* skip */ }
        }

        return false;
    }

    // =============================================
    // Session management
    // =============================================
    function createSession(username, authType = 'local', uid = null) {
        return {
            user: username,
            authType: authType,  // 'firebase' or 'local'
            uid: uid,
            created: Date.now(),
            expires: Date.now() + CONFIG.SESSION_DURATION_MS
        };
    }

    function saveSession(session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    function getSession() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return null;
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // =============================================
    // Auth state check
    // =============================================
    function isAuthenticated() {
        // Check session
        const session = getSession();
        if (session && session.expires > Date.now()) {
            return true;
        }

        // Fallback: old localStorage key for backward compatibility
        if (localStorage.getItem('authenticated') === 'true') {
            const migrated = createSession('utente1', 'local');
            saveSession(migrated);
            localStorage.removeItem('authenticated');
            return true;
        }

        // Session expired or invalid
        clearSession();
        return false;
    }

    // =============================================
    // Logout
    // =============================================
    function logout() {
        // Sign out from Firebase if available
        if (isFirebaseReady()) {
            try {
                firebase.auth().signOut();
            } catch (e) { /* ignore */ }
        }

        clearSession();
        localStorage.removeItem('authenticated');
        localStorage.removeItem('showRulesOnLoad');
    }

    // =============================================
    // Getters
    // =============================================
    function getUsername() {
        // Try Firebase current user first
        if (isFirebaseReady()) {
            const firebaseUser = firebase.auth().currentUser;
            if (firebaseUser?.displayName) {
                return firebaseUser.displayName;
            }
        }

        // Fall back to session
        const session = getSession();
        return session?.user || 'Utente';
    }

    function getAuthType() {
        const session = getSession();
        return session?.authType || 'local';
    }

    function isFirebaseUser() {
        return getAuthType() === 'firebase';
    }

    // Check if registration is available
    function canRegister() {
        return isFirebaseReady();
    }

    return {
        register,
        login,
        logout,
        isAuthenticated,
        getUsername,
        getSession,
        getAuthType,
        isFirebaseUser,
        canRegister
    };
})();

/* ============================================
   THMOVIES - Configuration
   ============================================ */

const CONFIG = {
    TMDB_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0ZTExOGZjMThjNDdiZGU3ODc1ZDY0MGRlMGE4ZWQzMiIsIm5iZiI6MTc2ODkxMDYwOC4xNTM5OTk4LCJzdWIiOiI2OTZmNmYxMDViN2EyMjEzMTlmZTEwZTMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.byUoqZfilhnXxG6u41zxVIpnQ8Z3J4UqSzuGmDQHaPA',
    TMDB_BASE: 'https://api.themoviedb.org/3',
    TMDB_IMG: 'https://image.tmdb.org/t/p',
    TMDB_LANG: 'it-IT',

    DEBOUNCE_MS: 400,
    PLAYER_TIMEOUT_MS: 15000,
    SESSION_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
    TOAST_DURATION_MS: 4000,
    MAX_RESULTS: 20,
    MAX_TRENDING: 20,
    CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes

    // =============================================
    // FIREBASE CONFIGURATION
    // Replace with your Firebase project credentials
    // Create a project at https://console.firebase.google.com
    // Enable Email/Password auth in Authentication > Sign-in method
    // =============================================
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyByHqwiSAyOPdfe5m8CfOSWYmS9fgwE0Fs",
        authDomain: "thmovies-29cd0.firebaseapp.com",
        projectId: "thmovies-29cd0",
        storageBucket: "thmovies-29cd0.firebasestorage.app",
        messagingSenderId: "1090448112621",
        appId: "1:1090448112621:web:925999191ca0b5ccc1c5e4",
        measurementId: "G-SWLG41ZNT3"
    },

    // Email domain for Firebase Auth (username -> username@domain)
    FIREBASE_EMAIL_DOMAIN: 'thmovies.app',

    // SHA-256 hashes of "username:password" (local fallback)
    // utente1:gurman
    CREDENTIAL_HASHES: [
        '040ef152c8f070d2c0c89c5a8457e110c08cf5b8a1c852e8b5e79b9a4216030a'
    ],

    // Fallback Base64 credentials for compatibility
    CREDS_LEGACY: [
        'dXRlbnRlMTpndXJtYW4=' // utente1:gurman
    ],

    // =============================================
    // STREAMING PROVIDERS (Structured with metadata)
    //
    // Each provider object has:
    //   name:          Display name
    //   url:           Function that builds the embed URL
    //                  Movies: (id) => url
    //                  TV/Anime: (id, s, e) => url
    //   langs:         Array of audio languages available
    //                  'multi' = multiple langs, player has own switcher
    //                  'en' = English only, etc.
    //   subtitleParam: (optional) URL param name for default subtitle lang (ISO 639-1)
    //   dubParam:      (optional) true if provider supports ?dub=0/1 for anime sub/dub
    // =============================================
    PROVIDERS: {
        movie: [
            {
                name: 'VidSrc.cc',
                url: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
                langs: ['multi'],
                subtitleParam: 'ds_lang'
            },
            {
                name: 'VidSrc.icu',
                url: (id) => `https://vidsrc.icu/embed/movie/${id}`,
                langs: ['multi']
            },
            {
                name: 'AutoEmbed',
                url: (id) => `https://autoembed.cc/movie/${id}`,
                langs: ['en', 'hi', 'multi']
            },
            {
                name: 'NontonGo',
                url: (id) => `https://www.nontongo.win/embed/movie/${id}`,
                langs: ['multi']
            },
            {
                name: 'MultiEmbed',
                url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
                langs: ['multi']
            },
            {
                name: 'VidLink',
                url: (id) => `https://vidlink.pro/movie/${id}?autoplay=true`,
                langs: ['en']
            },
            {
                name: 'VidSrc.in',
                url: (id) => `https://vidsrc.in/embed/movie?tmdb=${id}`,
                langs: ['multi']
            },
            {
                name: '2Embed',
                url: (id) => `https://www.2embed.cc/embed/${id}`,
                langs: ['en']
            },
            {
                name: 'MoviesAPI',
                url: (id) => `https://moviesapi.club/movie/${id}`,
                langs: ['en']
            }
        ],

        tv: [
            {
                name: 'VidSrc.cc',
                url: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
                langs: ['multi'],
                subtitleParam: 'ds_lang'
            },
            {
                name: 'VidSrc.icu',
                url: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
                langs: ['multi']
            },
            {
                name: 'AutoEmbed',
                url: (id, s, e) => `https://autoembed.cc/tv/${id}/${s}/${e}`,
                langs: ['en', 'hi', 'multi']
            },
            {
                name: 'NontonGo',
                url: (id, s, e) => `https://www.nontongo.win/embed/tv/${id}/${s}/${e}`,
                langs: ['multi']
            },
            {
                name: 'MultiEmbed',
                url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
                langs: ['multi']
            },
            {
                name: 'VidLink',
                url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
                langs: ['en']
            },
            {
                name: 'VidSrc.in',
                url: (id, s, e) => `https://vidsrc.in/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
                langs: ['multi']
            },
            {
                name: '2Embed',
                url: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
                langs: ['en']
            },
            {
                name: 'MoviesAPI',
                url: (id, s, e) => `https://moviesapi.club/tv/${id}-${s}-${e}`,
                langs: ['en']
            }
        ],

        anime: [
            {
                name: 'VidSrc.icu',
                url: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
                langs: ['ja', 'en'],
                dubParam: true  // ?dub=0 (sub) / ?dub=1 (dub) - WORKS
            },
            {
                name: 'VidSrc.cc',
                url: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
                langs: ['multi'],
                subtitleParam: 'ds_lang'
            },
            {
                name: 'AutoEmbed',
                url: (id, s, e) => `https://autoembed.cc/tv/${id}/${s}/${e}`,
                langs: ['en', 'multi']
            },
            {
                name: 'NontonGo',
                url: (id, s, e) => `https://www.nontongo.win/embed/tv/${id}/${s}/${e}`,
                langs: ['multi']
            },
            {
                name: 'MultiEmbed',
                url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
                langs: ['multi']
            },
            {
                name: 'VidLink',
                url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
                langs: ['en']
            },
            {
                name: 'VidSrc.in',
                url: (id, s, e) => `https://vidsrc.in/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
                langs: ['multi']
            },
            {
                name: '2Embed',
                url: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
                langs: ['en']
            }
        ]
    },

    // Language options for the UI selectors
    LANG_OPTIONS: {
        movie: [
            { value: '', label: 'Auto (migliore disponibile)' },
            { value: 'it', label: 'Italiano (sottotitoli)' },
            { value: 'en', label: 'English (subtitles)' },
            { value: 'es', label: 'Espanol (subtitulos)' },
            { value: 'fr', label: 'Francais (sous-titres)' },
            { value: 'de', label: 'Deutsch (Untertitel)' }
        ],
        tv: [
            { value: '', label: 'Auto (migliore disponibile)' },
            { value: 'it', label: 'Italiano (sottotitoli)' },
            { value: 'en', label: 'English (subtitles)' },
            { value: 'es', label: 'Espanol (subtitulos)' },
            { value: 'fr', label: 'Francais (sous-titres)' },
            { value: 'de', label: 'Deutsch (Untertitel)' }
        ],
        anime: [
            { value: '', label: 'Auto' },
            { value: 'sub', label: 'Sub (Giapponese + Sottotitoli)' },
            { value: 'dub', label: 'Dub (Doppiaggio Inglese)' },
            { value: 'it', label: 'Italiano (sottotitoli)' }
        ]
    },

    GENRES: {
        movie: [
            { id: 28, name: 'Azione' },
            { id: 12, name: 'Avventura' },
            { id: 16, name: 'Animazione' },
            { id: 35, name: 'Commedia' },
            { id: 80, name: 'Crime' },
            { id: 18, name: 'Dramma' },
            { id: 14, name: 'Fantasy' },
            { id: 27, name: 'Horror' },
            { id: 10749, name: 'Romance' },
            { id: 878, name: 'Sci-Fi' },
            { id: 53, name: 'Thriller' }
        ],
        tv: [
            { id: 10759, name: 'Azione' },
            { id: 35, name: 'Commedia' },
            { id: 80, name: 'Crime' },
            { id: 18, name: 'Dramma' },
            { id: 10765, name: 'Sci-Fi & Fantasy' },
            { id: 9648, name: 'Mistero' }
        ],
        anime: [
            { id: 16, name: 'Animazione' },
            { id: 10759, name: 'Azione' },
            { id: 35, name: 'Commedia' },
            { id: 18, name: 'Dramma' },
            { id: 10765, name: 'Sci-Fi & Fantasy' },
            { id: 9648, name: 'Mistero' },
            { id: 10749, name: 'Romance' }
        ]
    },

    TYPEWRITER_WORDS: [
        'Cerca un film...',
        'Breaking Bad',
        'Interstellar',
        'Attack on Titan',
        'The Last of Us',
        'One Piece',
        'Oppenheimer',
        'Stranger Things',
        'Naruto',
        'Squid Game'
    ]
};

// =============================================
// Firebase Initialization (auto-detect if configured)
// =============================================
(function initFirebase() {
    if (typeof firebase === 'undefined') return;
    if (CONFIG.FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') return;

    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
        }
        CONFIG._firebaseReady = true;
    } catch (e) {
        console.warn('Firebase init failed:', e);
        CONFIG._firebaseReady = false;
    }
})();

// =============================================
// Device Detection Module
// Detects: phone, tablet, desktop, tv
// Sets body[data-device] for CSS targeting
// =============================================
const DeviceDetect = (() => {
    let _device = null;

    // TV keywords in user agent
    const TV_UA = /smart-?tv|webos|tizen|hbbtv|netcast|viera|nettv|roku|dlna|pov_tv|hisense|philipstv|samsungbrowser\/.*tv|crkey|firetv|aftb|aftt|afts|aftm|bravia|appletv|roku|playstation|xbox|nintendo/i;

    // Tablet keywords
    const TABLET_UA = /ipad|tablet|playbook|silk|kindle|nexus\s?(7|9|10)|sm-t|gt-p|gt-n|mediapad|lenovo\s?tab/i;

    // Phone keywords
    const PHONE_UA = /mobile|iphone|ipod|android.*mobile|windows\s?phone|blackberry|opera\s?mini|iemobile/i;

    function detect() {
        if (_device) return _device;

        const ua = navigator.userAgent || '';
        const w = window.screen?.width || window.innerWidth;
        const h = window.screen?.height || window.innerHeight;
        const maxDim = Math.max(w, h);
        const minDim = Math.min(w, h);
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;

        // 1) TV detection (UA-based, most reliable)
        if (TV_UA.test(ua)) {
            _device = 'tv';
        }
        // 2) Large screens without touch = TV (e.g. browser on smart TV)
        else if (maxDim >= 1800 && !hasTouch && !hasCoarsePointer) {
            // Could be large monitor or TV; only mark as TV if no fine pointer
            const hasFinePointer = window.matchMedia?.('(pointer: fine)')?.matches;
            _device = hasFinePointer ? 'desktop' : 'tv';
        }
        // 3) Tablet detection
        else if (TABLET_UA.test(ua)) {
            _device = 'tablet';
        }
        else if (hasTouch && minDim >= 600 && maxDim <= 1400) {
            // Touch device with tablet-like dimensions
            _device = 'tablet';
        }
        // 4) Phone detection
        else if (PHONE_UA.test(ua)) {
            _device = 'phone';
        }
        else if (hasTouch && hasCoarsePointer && maxDim <= 900) {
            _device = 'phone';
        }
        // 5) Desktop fallback
        else {
            _device = 'desktop';
        }

        return _device;
    }

    function apply() {
        const device = detect();
        document.documentElement.dataset.device = device;
        document.body?.dataset && (document.body.dataset.device = device);
        return device;
    }

    function getDevice() {
        return _device || detect();
    }

    function isPhone() { return getDevice() === 'phone'; }
    function isTablet() { return getDevice() === 'tablet'; }
    function isDesktop() { return getDevice() === 'desktop'; }
    function isTV() { return getDevice() === 'tv'; }
    function isTouchDevice() { return isPhone() || isTablet(); }

    // Auto-detect immediately
    detect();

    // Apply to <html> right away (body might not exist yet)
    if (document.documentElement) {
        document.documentElement.dataset.device = _device;
    }

    // Apply to <body> once DOM is ready
    if (document.body) {
        document.body.dataset.device = _device;
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.dataset.device = _device;
        });
    }

    // Re-evaluate on resize (e.g. desktop emulating mobile, or orientation change)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const oldDevice = _device;
            _device = null; // Reset cache
            const newDevice = detect();
            if (newDevice !== oldDevice) {
                apply();
                document.dispatchEvent(new CustomEvent('deviceChanged', {
                    detail: { from: oldDevice, to: newDevice }
                }));
            }
        }, 500);
    });

    return {
        detect,
        apply,
        getDevice,
        isPhone,
        isTablet,
        isDesktop,
        isTV,
        isTouchDevice
    };
})();

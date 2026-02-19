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

    // SHA-256 hashes of "username:password"
    // utente1:gurman
    CREDENTIAL_HASHES: [
        '040ef152c8f070d2c0c89c5a8457e110c08cf5b8a1c852e8b5e79b9a4216030a'
    ],

    // Fallback Base64 credentials for compatibility
    CREDS_LEGACY: [
        'dXRlbnRlMTpndXJtYW4=' // utente1:gurman
    ],

    // =============================================
    // STREAMING PROVIDERS
    // Each provider function receives:
    //   Movies: (id, lang) where lang = language code string like 'en', 'it', '' (auto)
    //   TV/Anime: (id, s, e, lang) same lang format
    //   Anime sub/dub: lang can be 'sub', 'dub', 'ja', 'en', 'it', '' (auto)
    // =============================================
    PROVIDERS: {
        movie: [
            // VidSrc.cc - best multi-source provider
            (id, lang) => {
                let url = `https://vidsrc.cc/v2/embed/movie/${id}`;
                if (lang) url += `?lang=${lang}`;
                return url;
            },
            // VidSrc.to - reliable fallback
            (id, lang) => {
                let url = `https://vidsrc.to/embed/movie/${id}`;
                if (lang) url += `?lang=${lang}`;
                return url;
            },
            // 2Embed - widely used
            (id, lang) => `https://www.2embed.cc/embed/${id}`,
            // VidLink.pro - clean player
            (id, lang) => `https://vidlink.pro/movie/${id}?autoplay=true`,
            // VidSrc.pro
            (id, lang) => {
                let url = `https://vidsrc.pro/embed/${id}`;
                if (lang) url += `?lang=${lang}`;
                return url;
            },
            // AutoEmbed
            (id, lang) => {
                let url = `https://autoembed.cc/movie/${id}`;
                if (lang) url += `?lang=${lang}`;
                return url;
            },
            // VidSrc.in
            (id, lang) => {
                let url = `https://vidsrc.in/embed/movie?tmdb=${id}`;
                if (lang) url += `&lang=${lang}`;
                return url;
            },
            // MultiEmbed
            (id, lang) => {
                let url = `https://multiembed.mov/?video_id=${id}&tmdb=1`;
                if (lang) url += `&lang=${lang}`;
                return url;
            },
            // MoviesAPI
            (id, lang) => `https://moviesapi.club/movie/${id}`
        ],

        tv: [
            // VidSrc.cc
            (id, s, e, lang) => {
                let url = `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`;
                if (lang) url += `?lang=${lang}`;
                return url;
            },
            // VidSrc.to
            (id, s, e, lang) => {
                let url = `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
                if (lang) url += `?lang=${lang}`;
                return url;
            },
            // 2Embed
            (id, s, e, lang) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
            // VidLink.pro
            (id, s, e, lang) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
            // VidSrc.pro
            (id, s, e, lang) => {
                let url = `https://vidsrc.pro/embed/${id}/${s}/${e}`;
                if (lang) url += `?lang=${lang}`;
                return url;
            },
            // AutoEmbed
            (id, s, e, lang) => {
                let url = `https://autoembed.cc/tv/${id}/${s}/${e}`;
                if (lang) url += `?lang=${lang}`;
                return url;
            },
            // VidSrc.in
            (id, s, e, lang) => {
                let url = `https://vidsrc.in/embed/tv?tmdb=${id}&season=${s}&episode=${e}`;
                if (lang) url += `&lang=${lang}`;
                return url;
            },
            // MultiEmbed
            (id, s, e, lang) => {
                let url = `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`;
                if (lang) url += `&lang=${lang}`;
                return url;
            },
            // MoviesAPI
            (id, s, e, lang) => `https://moviesapi.club/tv/${id}-${s}-${e}`
        ],

        anime: [
            // VidSrc.cc - BEST for anime, native sub/dub support
            (id, s, e, lang) => {
                // VidSrc.cc has dedicated anime endpoint with /sub and /dub
                if (lang === 'sub' || lang === 'ja') {
                    return `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?lang=ja`;
                }
                if (lang === 'dub' || lang === 'en') {
                    return `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?lang=en`;
                }
                return `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`;
            },
            // VidSrc.to
            (id, s, e, lang) => {
                let url = `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
                if (lang === 'sub' || lang === 'ja') url += '?lang=ja';
                else if (lang === 'dub' || lang === 'en') url += '?lang=en';
                else if (lang) url += `?lang=${lang}`;
                return url;
            },
            // 2Embed
            (id, s, e, lang) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
            // VidLink.pro
            (id, s, e, lang) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
            // VidSrc.pro
            (id, s, e, lang) => {
                let url = `https://vidsrc.pro/embed/${id}/${s}/${e}`;
                if (lang === 'sub' || lang === 'ja') url += '?lang=ja';
                else if (lang === 'dub' || lang === 'en') url += '?lang=en';
                else if (lang) url += `?lang=${lang}`;
                return url;
            },
            // AutoEmbed
            (id, s, e, lang) => {
                let url = `https://autoembed.cc/tv/${id}/${s}/${e}`;
                if (lang === 'sub' || lang === 'ja') url += '?lang=ja';
                else if (lang === 'dub' || lang === 'en') url += '?lang=en';
                else if (lang) url += `?lang=${lang}`;
                return url;
            },
            // VidSrc.in
            (id, s, e, lang) => {
                let url = `https://vidsrc.in/embed/tv?tmdb=${id}&season=${s}&episode=${e}`;
                if (lang === 'sub' || lang === 'ja') url += '&lang=ja';
                else if (lang === 'dub' || lang === 'en') url += '&lang=en';
                else if (lang) url += `&lang=${lang}`;
                return url;
            },
            // MultiEmbed
            (id, s, e, lang) => {
                let url = `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`;
                if (lang === 'sub' || lang === 'ja') url += '&lang=ja';
                else if (lang === 'dub' || lang === 'en') url += '&lang=en';
                else if (lang) url += `&lang=${lang}`;
                return url;
            }
        ]
    },

    // Language options for the UI selectors
    // 'value' is the lang code passed to providers
    LANG_OPTIONS: {
        movie: [
            { value: '', label: 'Auto (migliore disponibile)' },
            { value: 'it', label: 'Italiano' },
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Espanol' },
            { value: 'fr', label: 'Francais' },
            { value: 'de', label: 'Deutsch' }
        ],
        tv: [
            { value: '', label: 'Auto (migliore disponibile)' },
            { value: 'it', label: 'Italiano' },
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Espanol' },
            { value: 'fr', label: 'Francais' },
            { value: 'de', label: 'Deutsch' }
        ],
        anime: [
            { value: '', label: 'Auto' },
            { value: 'sub', label: 'Japanese Sub (Originale)' },
            { value: 'dub', label: 'English Dub' },
            { value: 'it', label: 'Italiano' }
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

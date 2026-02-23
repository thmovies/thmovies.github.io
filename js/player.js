/* ============================================
   THMOVIES - Player Module
   Video player, provider rotation, trailer
   Language-aware provider sorting & URL building
   ============================================ */

const Player = (() => {
    let currentProviderIndex = 0;
    let playerFrame = null;
    let loadingEl = null;
    let loadingText = null;
    let providerBadge = null;
    let providerDot = null;
    let providerName = null;

    function init() {
        playerFrame = document.getElementById('player');
        loadingEl = document.getElementById('playerLoading');
        loadingText = document.getElementById('playerLoadingText');
        providerBadge = document.getElementById('providerBadge');
        providerDot = providerBadge?.querySelector('.dot');
        providerName = document.getElementById('providerName');
    }

    function showLoading(show, text = 'Caricamento...') {
        if (loadingEl) {
            loadingEl.classList.toggle('active', show);
        }
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    function updateProviderBadge(name, active = true) {
        if (providerName) providerName.textContent = name;
        if (providerDot) providerDot.style.background = active ? 'var(--rating-high)' : 'var(--rating-low)';
    }

    function clear() {
        if (playerFrame) playerFrame.src = '';
        showLoading(false);
        updateProviderBadge('', false);

        const container = document.querySelector('.player-container');
        if (container) container.classList.remove('active');
    }

    // =============================================
    // Build the full URL for a provider + language
    // Handles subtitleParam (ds_lang) and dubParam (?dub=0/1)
    // =============================================
    function buildProviderUrl(provider, id, season, episode, lang, type) {
        // Build base URL
        let url;
        if (type === 'movie') {
            url = provider.url(id);
        } else {
            url = provider.url(id, season, episode);
        }

        if (!lang) return url;

        // --- ANIME: dub/sub handling ---
        if (type === 'anime') {
            if (provider.dubParam) {
                // VidSrc.icu style: ?dub=0 (sub) / ?dub=1 (dub)
                const separator = url.includes('?') ? '&' : '?';
                if (lang === 'sub' || lang === 'ja') {
                    url += `${separator}dub=0`;
                } else if (lang === 'dub' || lang === 'en') {
                    url += `${separator}dub=1`;
                }
                return url;
            }

            if (provider.subtitleParam) {
                // VidSrc.cc style: ds_lang for default subtitles
                const separator = url.includes('?') ? '&' : '?';
                if (lang === 'sub' || lang === 'ja') {
                    url += `${separator}${provider.subtitleParam}=en`;
                } else if (lang === 'it') {
                    url += `${separator}${provider.subtitleParam}=it`;
                }
                return url;
            }

            // Provider doesn't support lang params
            return url;
        }

        // --- MOVIE / TV: subtitle handling ---
        if (provider.subtitleParam && lang) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}${provider.subtitleParam}=${lang}`;
        }

        return url;
    }

    // =============================================
    // Sort providers: lang-aware come first
    // =============================================
    function sortProvidersByLang(providers, lang, type) {
        if (!lang) return [...providers]; // No sorting needed

        return [...providers].sort((a, b) => {
            const aScore = getProviderLangScore(a, lang, type);
            const bScore = getProviderLangScore(b, lang, type);
            return bScore - aScore; // Higher score first
        });
    }

    function getProviderLangScore(provider, lang, type) {
        let score = 0;

        // Anime: providers with dubParam get highest score for sub/dub
        if (type === 'anime' && (lang === 'sub' || lang === 'dub' || lang === 'ja' || lang === 'en')) {
            if (provider.dubParam) score += 10;
        }

        // Provider with subtitleParam supports subtitle language setting
        if (provider.subtitleParam) score += 5;

        // Provider that supports 'multi' audio
        if (provider.langs.includes('multi')) score += 3;

        // Provider supports the exact requested language
        if (provider.langs.includes(lang)) score += 2;

        return score;
    }

    // =============================================
    // Load player with provider rotation
    // =============================================
    async function load(state) {
        const { id, type, season, episode, lang } = state;
        if (!id) {
            Toast.error('Seleziona un titolo prima!');
            return false;
        }

        if (type !== 'movie' && (!season || !episode)) {
            Toast.error('Seleziona stagione ed episodio!');
            return false;
        }

        if (!playerFrame) init();

        const rawProviders = CONFIG.PROVIDERS[type];
        if (!rawProviders) return false;

        // Sort providers by language compatibility
        const providerList = sortProvidersByLang(rawProviders, lang, type);

        showLoading(true);

        const container = document.querySelector('.player-container');
        if (container) container.classList.add('active');

        let success = false;

        for (let i = currentProviderIndex; i < providerList.length; i++) {
            currentProviderIndex = i;

            const provider = providerList[i];
            const url = buildProviderUrl(provider, id, season, episode, lang, type);
            const displayName = provider.name;

            showLoading(true, `Tentativo con ${displayName} (${i + 1}/${providerList.length})...`);
            updateProviderBadge(displayName, true);

            playerFrame.src = url;

            // Store URL for "open in new tab"
            playerFrame.dataset.currentUrl = url;

            try {
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject('Timeout'), CONFIG.PLAYER_TIMEOUT_MS);
                    playerFrame.onload = () => {
                        clearTimeout(timeout);
                        setTimeout(resolve, 2000);
                    };
                    playerFrame.onerror = () => {
                        clearTimeout(timeout);
                        reject('Errore iframe');
                    };
                });

                success = true;
                showLoading(false);

                // Show language info in toast
                let langInfo = '';
                if (lang && provider.dubParam && type === 'anime') {
                    langInfo = lang === 'dub' || lang === 'en' ? ' (Dub)' : ' (Sub)';
                } else if (lang && provider.subtitleParam) {
                    langInfo = ` (sub: ${lang})`;
                }

                Toast.success(`Caricato da ${displayName}${langInfo}`);

                // Save to watch history
                WatchHistory.add(state);

                break;
            } catch (err) {
                Toast.warning(`${displayName} non riuscito. Provo il successivo...`);
            }
        }

        showLoading(false);

        if (!success) {
            Toast.error('Tutti i provider hanno fallito. Riprova o apri in nuova scheda.');
            updateProviderBadge('Fallito', false);
            currentProviderIndex = 0;
        }

        return success;
    }

    function retry(state) {
        const providerList = CONFIG.PROVIDERS[state.type];
        currentProviderIndex = (currentProviderIndex + 1) % providerList.length;
        return load(state);
    }

    function resetProviderIndex() {
        currentProviderIndex = 0;
    }

    function openInNewTab() {
        if (playerFrame?.dataset.currentUrl) {
            window.open(playerFrame.dataset.currentUrl, '_blank');
        }
    }

    // Trailer functions
    function showTrailer(trailerKey) {
        if (!trailerKey) return;
        const modal = document.getElementById('trailerModal');
        const trailerPlayer = document.getElementById('trailerPlayer');

        if (modal && trailerPlayer) {
            // Use youtube-nocookie.com to avoid Error 153
            const origin = encodeURIComponent(window.location.origin || 'https://thmovies.app');
            trailerPlayer.src = `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&controls=1&origin=${origin}&enablejsapi=0`;
            modal.classList.add('active');
            modal.focus();
        }
    }

    function closeTrailer() {
        const modal = document.getElementById('trailerModal');
        const trailerPlayer = document.getElementById('trailerPlayer');

        if (modal) modal.classList.remove('active');
        if (trailerPlayer) trailerPlayer.src = '';
    }

    return {
        init,
        load,
        retry,
        clear,
        resetProviderIndex,
        openInNewTab,
        showTrailer,
        closeTrailer,
        showLoading
    };
})();

/* ============================================
   Watch History Module
   ============================================ */

const WatchHistory = (() => {
    const STORAGE_KEY = 'thm_history';
    const MAX_ITEMS = 30;

    function getAll() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function save(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    function add(state) {
        if (!state.id || !state.title) return;

        let history = getAll();

        // Remove existing entry for this item
        history = history.filter(h => !(h.id === state.id && h.type === state.type));

        // Add to beginning
        history.unshift({
            id: state.id,
            type: state.type,
            title: state.title,
            poster: state.poster,
            season: state.season,
            episode: state.episode,
            timestamp: Date.now()
        });

        // Limit size
        if (history.length > MAX_ITEMS) {
            history = history.slice(0, MAX_ITEMS);
        }

        save(history);
    }

    function clear() {
        localStorage.removeItem(STORAGE_KEY);
    }

    return { getAll, add, clear };
})();

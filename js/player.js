/* ============================================
   THMOVIES - Player Module
   Video player, provider rotation, trailer
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

    // Load player with provider rotation
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

        const providerList = CONFIG.PROVIDERS[type];
        if (!providerList) return false;

        showLoading(true);

        const container = document.querySelector('.player-container');
        if (container) container.classList.add('active');

        let success = false;

        for (let i = currentProviderIndex; i < providerList.length; i++) {
            currentProviderIndex = i;

            const url = type === 'movie'
                ? providerList[i](id, lang)
                : providerList[i](id, season, episode, lang);

            let hostname;
            try {
                hostname = new URL(url).hostname.replace('www.', '');
            } catch {
                hostname = `Provider ${i + 1}`;
            }

            showLoading(true, `Tentativo con ${hostname} (${i + 1}/${providerList.length})...`);
            updateProviderBadge(hostname, true);

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
                Toast.success(`Caricato da ${hostname}`);

                // Save to watch history
                WatchHistory.add(state);

                break;
            } catch (err) {
                Toast.warning(`${hostname} non riuscito. Provo il successivo...`);
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
        currentProviderIndex = (currentProviderIndex + 1) % CONFIG.PROVIDERS[state.type].length;
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
            // Use youtube-nocookie.com to avoid Error 153 (embedding disabled on some videos)
            // Also add origin param for extra compatibility
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

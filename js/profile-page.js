/* ============================================
   THMOVIES - Profile Page Controller
   Stats, watch history, settings
   ============================================ */

const ProfilePage = (() => {
    const dom = {};

    function cacheDom() {
        dom.username = document.getElementById('profileUsername');
        dom.session = document.getElementById('profileSession');
        dom.statFavorites = document.getElementById('statFavorites');
        dom.statHistory = document.getElementById('statHistory');
        dom.statHours = document.getElementById('statHours');
        dom.historyList = document.getElementById('historyList');
        dom.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        dom.settingsThemeBtn = document.getElementById('settingsThemeBtn');
        dom.settingsExportBtn = document.getElementById('settingsExportBtn');
    }

    // Show user info
    function renderProfile() {
        const username = Auth.getUsername();
        if (dom.username) {
            dom.username.textContent = username || 'Utente';
        }

        if (dom.session) {
            const session = Auth.getSession();
            const parts = [];

            // Auth type badge
            if (session?.authType === 'firebase') {
                parts.push('Account Firebase');
            } else {
                parts.push('Accesso locale');
            }

            // Session date
            if (session?.created) {
                const date = new Date(session.created);
                parts.push(`dal ${date.toLocaleDateString('it-IT')} alle ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
            }

            dom.session.textContent = parts.join(' \u00B7 ');
        }
    }

    // Calculate and show stats
    function renderStats() {
        const favs = Favorites.getAll();
        const history = WatchHistory.getAll();

        if (dom.statFavorites) dom.statFavorites.textContent = favs.length;
        if (dom.statHistory) dom.statHistory.textContent = history.length;

        // Estimate hours: ~2h per movie, ~0.75h per episode
        const movieCount = history.filter(h => h.type === 'movie').length;
        const episodeCount = history.filter(h => h.type !== 'movie').length;
        const estimatedHours = Math.round(movieCount * 2 + episodeCount * 0.75);
        if (dom.statHours) dom.statHours.textContent = estimatedHours;
    }

    // Render watch history
    function renderHistory() {
        if (!dom.historyList) return;

        const history = WatchHistory.getAll();

        if (!history.length) {
            dom.historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>Nessun contenuto nella cronologia.</p>
                </div>
            `;
            return;
        }

        dom.historyList.innerHTML = '';
        history.forEach(item => {
            const posterUrl = item.poster
                ? API.getPosterUrl(item.poster)
                : API.getPosterUrl(null);

            const date = new Date(item.timestamp);
            const dateStr = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

            const episodeInfo = item.season && item.episode
                ? `S${item.season} E${item.episode}`
                : '';

            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <img class="history-item-poster" src="${posterUrl}" alt="${item.title}" loading="lazy">
                <div class="history-item-info">
                    <div class="history-item-title">${item.title || 'Senza titolo'}</div>
                    <div class="history-item-meta">
                        ${item.type === 'movie' ? 'Film' : item.type === 'anime' ? 'Anime' : 'Serie TV'}
                        ${episodeInfo ? ` &middot; ${episodeInfo}` : ''}
                    </div>
                </div>
                <div class="history-item-date">${dateStr}</div>
            `;

            el.addEventListener('click', () => {
                Shared.goToDetail(item.type, item.id);
            });

            dom.historyList.appendChild(el);
        });
    }

    function bindEvents() {
        // Clear history
        if (dom.clearHistoryBtn) {
            dom.clearHistoryBtn.addEventListener('click', () => {
                if (confirm('Vuoi cancellare tutta la cronologia?')) {
                    WatchHistory.clear();
                    renderHistory();
                    renderStats();
                    Toast.success('Cronologia cancellata');
                }
            });
        }

        // Theme toggle in settings
        if (dom.settingsThemeBtn) {
            dom.settingsThemeBtn.addEventListener('click', () => {
                const themeToggle = document.getElementById('themeToggle');
                if (themeToggle) themeToggle.click();
            });
        }

        // Export favorites
        if (dom.settingsExportBtn) {
            dom.settingsExportBtn.addEventListener('click', () => Favorites.exportJSON());
        }
    }

    function init() {
        Shared.init();
        cacheDom();
        Player.init();
        bindEvents();
        renderProfile();
        renderStats();
        renderHistory();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', ProfilePage.init);

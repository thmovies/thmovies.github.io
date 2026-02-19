/* ============================================
   THMOVIES - App Entry Point
   Initialization, routing, global events
   ============================================ */

const App = (() => {
    // App state
    const state = {
        currentType: 'movie',
        selected: {
            id: null,
            type: null,
            title: null,
            poster: null,
            season: 1,
            episode: 1,
            lang: '',
            trailerKey: null
        }
    };

    // DOM references (populated on init)
    const dom = {};

    function cacheDom() {
        // Nav tabs
        dom.navTabs = document.querySelectorAll('.nav-tab[data-type]');
        dom.mobileNavItems = document.querySelectorAll('.mobile-nav-item[data-type]');

        // Tab content sections
        dom.tabContents = document.querySelectorAll('.tab-content');

        // Search inputs and clear buttons
        dom.searchInputs = {};
        dom.clearBtns = {};
        dom.resultContainers = {};
        ['movie', 'tv', 'anime'].forEach(type => {
            dom.searchInputs[type] = document.getElementById(`${type}Search`);
            dom.clearBtns[type] = document.getElementById(`clear${type.charAt(0).toUpperCase() + type.slice(1)}`);
            dom.resultContainers[type] = document.getElementById(`${type}Results`);
        });

        // Episode selectors
        dom.episodeSelectors = {};
        dom.seasonSelects = {};
        dom.episodeSelects = {};
        dom.langSelects = {};

        dom.episodeSelectors.movie = document.getElementById('movieLangSelector');
        dom.langSelects.movie = document.getElementById('movieLangSelect');

        dom.episodeSelectors.tv = document.getElementById('tvEpisodeSelector');
        dom.seasonSelects.tv = document.getElementById('seasonSelect');
        dom.episodeSelects.tv = document.getElementById('episodeSelect');
        dom.langSelects.tv = document.getElementById('tvLangSelect');

        dom.episodeSelectors.anime = document.getElementById('animeEpisodeSelector');
        dom.seasonSelects.anime = document.getElementById('animeSeasonSelect');
        dom.episodeSelects.anime = document.getElementById('animeEpSelect');
        dom.langSelects.anime = document.getElementById('animeLangSelect');

        // Player buttons
        dom.playBtn = document.getElementById('playBtn');
        dom.trailerBtn = document.getElementById('trailerBtn');
        dom.retryBtn = document.getElementById('retryBtn');
        dom.openTabBtn = document.getElementById('openTabBtn');

        // Trending containers
        dom.trendingRow = document.getElementById('trendingRow');
        dom.continueWatchingRow = document.getElementById('continueWatchingRow');

        // Favorites
        dom.favoritesGrid = document.getElementById('favoritesGrid');
        dom.favoritesSection = document.getElementById('favoritesSection');

        // Media detail panel
        dom.mediaDetail = document.getElementById('mediaDetail');

        // Hero
        dom.hero = document.getElementById('hero');

        // Theme toggle
        dom.themeToggle = document.getElementById('themeToggle');
        dom.themeToggleMobile = document.getElementById('themeToggleMobile');

        // Rules overlay
        dom.rulesOverlay = document.getElementById('rulesOverlay');

        // Trailer modal
        dom.trailerModal = document.getElementById('trailerModal');
    }

    // Switch active tab/section
    function switchTab(type) {
        state.currentType = type;
        resetSelection();

        // Update nav tabs
        dom.navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        // Update mobile nav
        dom.mobileNavItems.forEach(item => {
            item.classList.toggle('active', item.dataset.type === type);
        });

        // Show correct tab content
        dom.tabContents.forEach(content => {
            content.classList.toggle('active', content.dataset.tab === type);
        });

        // Start typewriter on active search input
        const searchInput = dom.searchInputs[type];
        if (searchInput && !searchInput.value) {
            Search.startTypewriter(searchInput);
        }

        // Hide all episode selectors
        Object.values(dom.episodeSelectors).forEach(el => {
            if (el) el.classList.add('hidden');
        });
    }

    // Reset selection state
    function resetSelection() {
        state.selected = {
            id: null, type: null, title: null, poster: null,
            season: 1, episode: 1, lang: '', trailerKey: null
        };

        Player.clear();
        updateActionButtons();

        if (dom.mediaDetail) dom.mediaDetail.classList.remove('active');
    }

    // Handle media selection
    async function selectMedia(type, id) {
        state.selected = {
            id, type, title: null, poster: null,
            season: 1, episode: 1, lang: '', trailerKey: null
        };

        Player.clear();
        Player.resetProviderIndex();

        // Fetch details
        const details = await API.getDetails(type, id);
        if (!details) {
            Toast.error('Errore nel caricamento dei dettagli');
            return;
        }

        state.selected.title = details.title || details.name;
        state.selected.poster = details.poster_path;

        // Show media detail panel
        renderMediaDetail(details, type);

        // Fetch trailer - try to find best available YouTube trailer
        const videos = await API.getVideos(type, id);
        if (videos?.results?.length) {
            const ytVideos = videos.results.filter(v => v.site === 'YouTube');
            // Priority: Official Trailer > Trailer > Teaser > any YouTube video
            const trailer = ytVideos.find(v => v.type === 'Trailer' && v.official === true)
                || ytVideos.find(v => v.type === 'Trailer')
                || ytVideos.find(v => v.type === 'Teaser')
                || ytVideos[0];
            if (trailer) {
                state.selected.trailerKey = trailer.key;
            }
        }

        // Show episode selector
        const selector = dom.episodeSelectors[type];
        if (selector) selector.classList.remove('hidden');

        if (type === 'movie') {
            // Movie: ready to play
        } else {
            // TV/Anime: load seasons
            if (!details?.seasons) return;
            const seasonSelect = dom.seasonSelects[type];
            if (seasonSelect) {
                seasonSelect.innerHTML = '<option value="">Stagione...</option>';
                details.seasons
                    .filter(s => s.season_number > 0)
                    .forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.season_number;
                        opt.textContent = `Stagione ${s.season_number} (${s.episode_count} ep.)`;
                        seasonSelect.appendChild(opt);
                    });
            }
        }

        updateActionButtons();
        Toast.info(`Selezionato: ${state.selected.title}`);

        // Mark selected card
        const container = dom.resultContainers[state.currentType];
        if (container) UI.markSelectedCard(container, id);

        // Scroll to detail
        if (dom.mediaDetail) {
            dom.mediaDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Render media detail panel
    function renderMediaDetail(details, type) {
        if (!dom.mediaDetail) return;

        const title = details.title || details.name;
        const date = details.release_date || details.first_air_date || '';
        const year = date ? date.slice(0, 4) : 'N/D';
        const vote = details.vote_average;
        const overview = details.overview || 'Nessuna descrizione disponibile.';
        const posterUrl = API.getPosterUrl(details.poster_path);
        const genres = details.genres?.map(g => g.name).join(', ') || '';
        const runtime = details.runtime
            ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
            : details.number_of_seasons
                ? `${details.number_of_seasons} stagioni`
                : '';

        let ratingClass = 'low';
        if (vote >= 7) ratingClass = 'high';
        else if (vote >= 5) ratingClass = 'mid';

        dom.mediaDetail.innerHTML = `
            <div class="media-detail-header">
                <img class="media-detail-poster" src="${posterUrl}" alt="${title}" loading="lazy">
                <div class="media-detail-info">
                    <h2 class="media-detail-title">${title}</h2>
                    <div class="media-detail-meta">
                        <span class="rating-badge ${ratingClass}"><i class="fas fa-star"></i> ${vote ? vote.toFixed(1) : 'N/D'}</span>
                        <span>${year}</span>
                        ${runtime ? `<span>${runtime}</span>` : ''}
                        ${genres ? `<span>${genres}</span>` : ''}
                    </div>
                    <p class="media-detail-overview">${overview}</p>
                </div>
            </div>
        `;

        dom.mediaDetail.classList.add('active');
    }

    // Update action buttons visibility
    function updateActionButtons() {
        const hasSelection = !!state.selected.id;

        if (dom.playBtn) {
            dom.playBtn.disabled = !hasSelection;
            dom.playBtn.classList.toggle('hidden', false);
        }

        if (dom.trailerBtn) {
            dom.trailerBtn.classList.toggle('hidden', !state.selected.trailerKey);
            dom.trailerBtn.disabled = !state.selected.trailerKey;
        }

        if (dom.retryBtn) dom.retryBtn.classList.toggle('hidden', true);
        if (dom.openTabBtn) dom.openTabBtn.classList.toggle('hidden', true);
    }

    // Load episodes for a season
    async function loadEpisodes(type) {
        const seasonSelect = dom.seasonSelects[type];
        const episodeSelect = dom.episodeSelects[type];
        if (!seasonSelect || !episodeSelect) return;

        const season = seasonSelect.value;
        if (!season) return;

        state.selected.season = parseInt(season, 10);

        const data = await API.getSeasonDetails(state.selected.id, season);
        if (!data?.episodes) return;

        episodeSelect.innerHTML = '<option value="">Episodio...</option>';
        data.episodes.forEach(ep => {
            const opt = document.createElement('option');
            opt.value = ep.episode_number;
            opt.textContent = `Ep. ${ep.episode_number}: ${ep.name || 'Senza titolo'} ${ep.runtime ? `(${ep.runtime}m)` : ''}`;
            episodeSelect.appendChild(opt);
        });

        state.selected.episode = 1;
        episodeSelect.value = 1;
    }

    // Handle search results
    function handleSearchResults(data, type) {
        const container = dom.resultContainers[type];
        if (!container) return;

        if (!data) {
            container.innerHTML = '';
            return;
        }

        UI.renderResults(container, data, type, selectMedia);
    }

    // Load trending content
    async function loadTrending() {
        if (dom.trendingRow) {
            UI.showCarouselSkeletons(dom.trendingRow, 8);
        }

        const data = await API.getTrending('all', 'week');
        if (data?.results) {
            // Show hero with first trending item
            const heroItem = data.results[0];
            if (heroItem) UI.renderHero(heroItem);

            // Render trending row
            if (dom.trendingRow) {
                UI.renderCarousel(dom.trendingRow, data.results, null, selectMedia);
            }
        }
    }

    // Load continue watching
    function loadContinueWatching() {
        if (!dom.continueWatchingRow) return;
        const history = WatchHistory.getAll();

        if (!history.length) {
            const section = dom.continueWatchingRow.closest('.content-row');
            if (section) section.classList.add('hidden');
            return;
        }

        const section = dom.continueWatchingRow.closest('.content-row');
        if (section) section.classList.remove('hidden');

        dom.continueWatchingRow.innerHTML = '';
        history.slice(0, 10).forEach(item => {
            const mediaItem = {
                id: item.id,
                title: item.title,
                name: item.title,
                poster_path: item.poster,
                vote_average: null
            };
            const card = UI.createMediaCard(mediaItem, item.type, selectMedia, Favorites.isFavorite(item.id, item.type));
            card.classList.add('media-card-horizontal');
            dom.continueWatchingRow.appendChild(card);
        });
    }

    // Close rules overlay
    function closeRules() {
        if (dom.rulesOverlay) {
            dom.rulesOverlay.classList.remove('active');
            localStorage.removeItem('showRulesOnLoad');
        }
    }

    // Logout
    function logout() {
        if (confirm('Sicuro di voler effettuare il logout?')) {
            Auth.logout();
            window.location.href = 'index.html';
        }
    }

    // Bind all events
    function bindEvents() {
        // Nav tabs
        dom.navTabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.type));
        });

        // Mobile nav
        dom.mobileNavItems.forEach(item => {
            item.addEventListener('click', () => switchTab(item.dataset.type));
        });

        // Search inputs
        ['movie', 'tv', 'anime'].forEach(type => {
            const input = dom.searchInputs[type];
            const clearBtn = dom.clearBtns[type];
            if (input) {
                Search.setupSearch(input, clearBtn, type, handleSearchResults);
            }
        });

        // Season selectors
        ['tv', 'anime'].forEach(type => {
            const seasonSelect = dom.seasonSelects[type];
            if (seasonSelect) {
                seasonSelect.addEventListener('change', () => loadEpisodes(type));
            }

            const episodeSelect = dom.episodeSelects[type];
            if (episodeSelect) {
                episodeSelect.addEventListener('change', () => {
                    state.selected.episode = parseInt(episodeSelect.value, 10) || 1;
                });
            }
        });

        // Language selectors
        Object.entries(dom.langSelects).forEach(([type, select]) => {
            if (select) {
                select.addEventListener('change', () => {
                    state.selected.lang = select.value;
                });
            }
        });

        // Play button
        if (dom.playBtn) {
            dom.playBtn.addEventListener('click', async () => {
                Player.resetProviderIndex();
                const success = await Player.load(state.selected);
                if (success) {
                    if (dom.retryBtn) dom.retryBtn.classList.remove('hidden');
                    if (dom.openTabBtn) dom.openTabBtn.classList.remove('hidden');
                }
            });
        }

        // Trailer button
        if (dom.trailerBtn) {
            dom.trailerBtn.addEventListener('click', () => {
                Player.showTrailer(state.selected.trailerKey);
            });
        }

        // Retry button
        if (dom.retryBtn) {
            dom.retryBtn.addEventListener('click', async () => {
                const success = await Player.retry(state.selected);
                if (success) {
                    if (dom.retryBtn) dom.retryBtn.classList.remove('hidden');
                    if (dom.openTabBtn) dom.openTabBtn.classList.remove('hidden');
                }
            });
        }

        // Open in new tab
        if (dom.openTabBtn) {
            dom.openTabBtn.addEventListener('click', () => Player.openInNewTab());
        }

        // Theme toggle(s)
        if (dom.themeToggle) UI.initThemeToggle(dom.themeToggle);
        if (dom.themeToggleMobile) {
            dom.themeToggleMobile.addEventListener('click', () => {
                dom.themeToggle?.click();
            });
        }

        // Logout
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', logout);
        });

        // Rules overlay
        if (dom.rulesOverlay) {
            const closeBtn = dom.rulesOverlay.querySelector('.rules-close-btn');
            if (closeBtn) closeBtn.addEventListener('click', closeRules);
            dom.rulesOverlay.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeRules();
            });
        }

        // Trailer modal
        if (dom.trailerModal) {
            dom.trailerModal.addEventListener('click', (e) => {
                if (e.target === dom.trailerModal) Player.closeTrailer();
            });
            dom.trailerModal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') Player.closeTrailer();
            });
            const closeTrailerBtn = dom.trailerModal.querySelector('.trailer-close');
            if (closeTrailerBtn) {
                closeTrailerBtn.addEventListener('click', Player.closeTrailer);
            }
        }

        // Hero events
        document.addEventListener('heroPlay', (e) => {
            const { id, type } = e.detail;
            switchTab(type === 'movie' ? 'movie' : 'tv');
            selectMedia(type, id);
        });

        document.addEventListener('heroInfo', (e) => {
            const { id, type } = e.detail;
            switchTab(type === 'movie' ? 'movie' : 'tv');
            selectMedia(type, id);
        });

        // Favorites changed
        document.addEventListener('favoritesChanged', () => {
            loadFavorites();
            // Refresh current search results to update fav icons
            const input = dom.searchInputs[state.currentType];
            if (input?.value) {
                handleSearchResults(null, state.currentType);
                API.search(state.currentType, input.value).then(data => {
                    handleSearchResults(data, state.currentType);
                });
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC closes modals
            if (e.key === 'Escape') {
                Player.closeTrailer();
                closeRules();
            }

            // "/" focuses search
            if (e.key === '/' && !e.target.matches('input, textarea, select')) {
                e.preventDefault();
                const input = dom.searchInputs[state.currentType];
                if (input) input.focus();
            }
        });
    }

    // Load favorites section
    function loadFavorites() {
        if (dom.favoritesGrid) {
            Favorites.render(dom.favoritesGrid, selectMedia);
        }
    }

    // Initialize the app
    async function init() {
        // Check authentication
        if (!Auth.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Cache DOM
        cacheDom();

        // Initialize modules
        Player.init();

        // Bind events
        bindEvents();

        // Initialize UI features
        UI.initDynamicNavbar();
        UI.initScrollToTop();
        UI.initScrollReveal();

        // Show rules on first load
        if (localStorage.getItem('showRulesOnLoad') === 'true') {
            setTimeout(() => {
                if (dom.rulesOverlay) dom.rulesOverlay.classList.add('active');
            }, 500);
        }

        // Load initial data
        await loadTrending();
        loadContinueWatching();
        loadFavorites();

        // Start typewriter on initial tab
        const firstInput = dom.searchInputs[state.currentType];
        if (firstInput) Search.startTypewriter(firstInput);

        // Hide page loader
        UI.hidePageLoader();
    }

    return { init };
})();

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);

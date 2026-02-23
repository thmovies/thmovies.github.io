/* ============================================
   THMOVIES - Home Dashboard
   Hero, trending, popular rows, continue watching
   ============================================ */

const App = (() => {
    const dom = {};

    function cacheDom() {
        dom.trendingRow = document.getElementById('trendingRow');
        dom.continueWatchingRow = document.getElementById('continueWatchingRow');
        dom.continueWatchingSection = document.getElementById('continueWatchingSection');
        dom.popularMoviesRow = document.getElementById('popularMoviesRow');
        dom.popularTvRow = document.getElementById('popularTvRow');
        dom.popularAnimeRow = document.getElementById('popularAnimeRow');
        dom.favoritesRow = document.getElementById('favoritesRow');
        dom.hero = document.getElementById('hero');
        dom.trailerModal = document.getElementById('trailerModal');
    }

    // Navigate to detail page on card click
    function onCardClick(type, id) {
        Shared.goToDetail(type, id);
    }

    // Load trending content + hero
    async function loadTrending() {
        if (dom.trendingRow) {
            UI.showCarouselSkeletons(dom.trendingRow, 8);
        }

        const data = await API.getTrending('all', 'week');
        if (data?.results) {
            const heroItem = data.results[0];
            if (heroItem) UI.renderHero(heroItem);

            if (dom.trendingRow) {
                UI.renderCarousel(dom.trendingRow, data.results, null, onCardClick);
            }
        }
    }

    // Load continue watching row
    function loadContinueWatching() {
        if (!dom.continueWatchingRow) return;
        const history = WatchHistory.getAll();

        if (!history.length) {
            if (dom.continueWatchingSection) dom.continueWatchingSection.classList.add('hidden');
            return;
        }

        if (dom.continueWatchingSection) dom.continueWatchingSection.classList.remove('hidden');

        dom.continueWatchingRow.innerHTML = '';
        history.slice(0, 10).forEach(item => {
            const mediaItem = {
                id: item.id,
                title: item.title,
                name: item.title,
                poster_path: item.poster,
                vote_average: null
            };
            const card = UI.createMediaCard(mediaItem, item.type, onCardClick, Favorites.isFavorite(item.id, item.type));
            card.classList.add('media-card-horizontal');
            dom.continueWatchingRow.appendChild(card);
        });
    }

    // Load popular content rows
    async function loadPopularRows() {
        // Show skeletons
        [dom.popularMoviesRow, dom.popularTvRow, dom.popularAnimeRow].forEach(row => {
            if (row) UI.showCarouselSkeletons(row, 8);
        });

        // Fetch in parallel
        const [movies, tv, anime] = await Promise.all([
            API.getPopular('movie'),
            API.getPopular('tv'),
            API.getPopular('anime')
        ]);

        if (movies?.results && dom.popularMoviesRow) {
            UI.renderCarousel(dom.popularMoviesRow, movies.results, 'movie', onCardClick);
        }
        if (tv?.results && dom.popularTvRow) {
            UI.renderCarousel(dom.popularTvRow, tv.results, 'tv', onCardClick);
        }
        if (anime?.results && dom.popularAnimeRow) {
            UI.renderCarousel(dom.popularAnimeRow, anime.results, 'anime', onCardClick);
        }
    }

    // Load favorites preview
    function loadFavorites() {
        if (dom.favoritesRow) {
            Favorites.renderCarousel(dom.favoritesRow, onCardClick);
        }
    }

    function bindEvents() {
        // Hero play/info → navigate to detail
        document.addEventListener('heroPlay', (e) => {
            const { id, type } = e.detail;
            Shared.goToDetail(type === 'movie' ? 'movie' : 'tv', id);
        });

        document.addEventListener('heroInfo', (e) => {
            const { id, type } = e.detail;
            Shared.goToDetail(type === 'movie' ? 'movie' : 'tv', id);
        });

        // Favorites changed → refresh
        document.addEventListener('favoritesChanged', () => {
            loadFavorites();
        });

        // Trailer modal
        if (dom.trailerModal) {
            dom.trailerModal.addEventListener('click', (e) => {
                if (e.target === dom.trailerModal) Player.closeTrailer();
            });
            const closeBtn = dom.trailerModal.querySelector('.trailer-close');
            if (closeBtn) closeBtn.addEventListener('click', Player.closeTrailer);
        }
    }

    async function init() {
        Shared.init();
        cacheDom();
        Player.init();
        bindEvents();

        // Load all data in parallel
        await Promise.all([
            loadTrending(),
            loadPopularRows()
        ]);
        loadContinueWatching();
        loadFavorites();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);

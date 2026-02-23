/* ============================================
   THMOVIES - Browse Page Controller
   Shared logic for movies.html, tv.html, anime.html
   Reads body[data-browse-type] to determine content type
   ============================================ */

const Browse = (() => {
    let browseType = 'movie';
    let currentPage = 1;
    let totalPages = 1;
    let currentGenre = '';
    let isSearching = false;

    const dom = {};

    function cacheDom() {
        dom.searchInput = document.getElementById('browseSearch');
        dom.clearBtn = document.getElementById('clearSearch');
        dom.resultsGrid = document.getElementById('browseResults');
        dom.genreBar = document.getElementById('genreFilterBar');
        dom.loadMoreBtn = document.getElementById('loadMoreBtn');
        dom.resultCount = document.getElementById('resultCount');
    }

    // Render genre chips
    function renderGenreChips() {
        if (!dom.genreBar) return;
        const genres = CONFIG.GENRES[browseType] || CONFIG.GENRES.tv || [];

        dom.genreBar.innerHTML = '';

        // "All" chip
        const allChip = document.createElement('button');
        allChip.className = 'genre-chip active';
        allChip.textContent = 'Tutti';
        allChip.dataset.genre = '';
        allChip.addEventListener('click', () => selectGenre('', allChip));
        dom.genreBar.appendChild(allChip);

        genres.forEach(g => {
            const chip = document.createElement('button');
            chip.className = 'genre-chip';
            chip.textContent = g.name;
            chip.dataset.genre = g.id;
            chip.addEventListener('click', () => selectGenre(g.id, chip));
            dom.genreBar.appendChild(chip);
        });
    }

    // Select a genre chip
    function selectGenre(genreId, chipEl) {
        currentGenre = genreId;
        currentPage = 1;
        isSearching = false;

        // Update active state
        dom.genreBar.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
        chipEl.classList.add('active');

        // Clear search
        if (dom.searchInput) dom.searchInput.value = '';
        if (dom.clearBtn) dom.clearBtn.classList.remove('visible');

        loadContent(true);
    }

    // Load content (popular or by genre)
    async function loadContent(replace = false) {
        if (replace) {
            dom.resultsGrid.innerHTML = '';
            UI.showSkeletons(dom.resultsGrid, 20);
        }

        const data = currentGenre
            ? await API.getPopularByGenre(browseType, currentGenre, currentPage)
            : await API.getPopular(browseType, currentPage);

        if (!data?.results) {
            if (replace) dom.resultsGrid.innerHTML = '';
            updateResultCount(0);
            return;
        }

        totalPages = data.total_pages || 1;
        updateResultCount(data.total_results || data.results.length);

        if (replace) dom.resultsGrid.innerHTML = '';

        data.results.forEach((item, index) => {
            const isFav = Favorites.isFavorite(item.id, browseType);
            const card = UI.createMediaCard(item, browseType, onCardClick, isFav);
            card.style.animationDelay = `${index * 0.03}s`;
            card.style.opacity = '0';
            card.style.animation = `fadeInUp 0.4s var(--ease-out) ${index * 0.03}s forwards`;
            dom.resultsGrid.appendChild(card);
        });

        // Show/hide load more
        updateLoadMore();
    }

    // Handle search results
    function handleSearchResults(data, type) {
        if (!data) {
            isSearching = false;
            currentPage = 1;
            loadContent(true);
            return;
        }

        isSearching = true;
        dom.resultsGrid.innerHTML = '';
        UI.renderResults(dom.resultsGrid, data, browseType, onCardClick);
        updateResultCount(data.total_results || data.results?.length || 0);

        // Hide load more during search
        if (dom.loadMoreBtn) dom.loadMoreBtn.classList.add('hidden');
    }

    function onCardClick(type, id) {
        Shared.goToDetail(type, id);
    }

    function updateResultCount(count) {
        if (dom.resultCount) {
            dom.resultCount.textContent = count > 0 ? `${count} risultati` : '';
        }
    }

    function updateLoadMore() {
        if (!dom.loadMoreBtn) return;
        if (currentPage >= totalPages || isSearching) {
            dom.loadMoreBtn.classList.add('hidden');
        } else {
            dom.loadMoreBtn.classList.remove('hidden');
        }
    }

    async function loadMore() {
        if (currentPage >= totalPages || isSearching) return;
        currentPage++;
        dom.loadMoreBtn.disabled = true;
        dom.loadMoreBtn.textContent = 'Caricamento...';
        await loadContent(false);
        dom.loadMoreBtn.disabled = false;
        dom.loadMoreBtn.textContent = 'Carica altri';
    }

    function bindEvents() {
        // Search
        if (dom.searchInput) {
            Search.setupSearch(dom.searchInput, dom.clearBtn, browseType, handleSearchResults);
            Search.startTypewriter(dom.searchInput);
        }

        // Load more
        if (dom.loadMoreBtn) {
            dom.loadMoreBtn.addEventListener('click', loadMore);
        }

        // Favorites changed → refresh cards
        document.addEventListener('favoritesChanged', () => {
            // Don't reload, just update fav icons would be complex.
            // Simple approach: if not searching, reload
        });
    }

    async function init() {
        browseType = document.body.dataset.browseType || 'movie';
        Shared.init();
        cacheDom();
        Player.init();
        renderGenreChips();
        bindEvents();
        await loadContent(true);
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', Browse.init);

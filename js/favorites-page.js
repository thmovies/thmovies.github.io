/* ============================================
   THMOVIES - Favorites Page Controller
   Grid display, filter, export/import
   ============================================ */

const FavoritesPage = (() => {
    let currentFilter = 'all';
    const dom = {};

    function cacheDom() {
        dom.grid = document.getElementById('favoritesGrid');
        dom.count = document.getElementById('favCount');
        dom.filterBar = document.getElementById('favFilterBar');
        dom.exportBtn = document.getElementById('exportBtn');
        dom.importBtn = document.getElementById('importBtn');
        dom.importFile = document.getElementById('importFile');
    }

    // Render filter chips
    function renderFilters() {
        if (!dom.filterBar) return;
        const filters = [
            { value: 'all', label: 'Tutti', icon: 'fas fa-th-large' },
            { value: 'movie', label: 'Film', icon: 'fas fa-film' },
            { value: 'tv', label: 'Serie TV', icon: 'fas fa-tv' },
            { value: 'anime', label: 'Anime', icon: 'fas fa-dragon' }
        ];

        dom.filterBar.innerHTML = '';
        filters.forEach(f => {
            const chip = document.createElement('button');
            chip.className = `genre-chip${f.value === currentFilter ? ' active' : ''}`;
            chip.innerHTML = `<i class="${f.icon}"></i> ${f.label}`;
            chip.addEventListener('click', () => {
                currentFilter = f.value;
                dom.filterBar.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                renderFavorites();
            });
            dom.filterBar.appendChild(chip);
        });
    }

    // Render favorites grid
    function renderFavorites() {
        if (!dom.grid) return;

        let favs = Favorites.getAll();

        // Apply filter
        if (currentFilter !== 'all') {
            favs = favs.filter(f => f.type === currentFilter);
        }

        // Update count
        if (dom.count) {
            dom.count.textContent = `(${favs.length})`;
        }

        dom.grid.innerHTML = '';

        if (!favs.length) {
            dom.grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="far fa-heart"></i>
                    <p>${currentFilter === 'all' ? 'Nessun preferito ancora. Aggiungi film e serie!' : 'Nessun preferito in questa categoria.'}</p>
                </div>
            `;
            return;
        }

        favs.forEach((f, index) => {
            const item = {
                id: f.id,
                title: f.title,
                name: f.title,
                poster_path: f.poster,
                release_date: f.date,
                first_air_date: f.date,
                vote_average: null
            };

            const card = UI.createMediaCard(item, f.type, onCardClick, true);
            card.style.animationDelay = `${index * 0.03}s`;
            card.style.opacity = '0';
            card.style.animation = `fadeInUp 0.4s var(--ease-out) ${index * 0.03}s forwards`;
            dom.grid.appendChild(card);
        });
    }

    function onCardClick(type, id) {
        Shared.goToDetail(type, id);
    }

    function bindEvents() {
        // Export
        if (dom.exportBtn) {
            dom.exportBtn.addEventListener('click', () => Favorites.exportJSON());
        }

        // Import button → trigger file input
        if (dom.importBtn && dom.importFile) {
            dom.importBtn.addEventListener('click', () => dom.importFile.click());
            dom.importFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await Favorites.importJSON(file);
                    renderFavorites();
                }
                dom.importFile.value = '';
            });
        }

        // Favorites changed → re-render
        document.addEventListener('favoritesChanged', renderFavorites);
    }

    function init() {
        Shared.init();
        cacheDom();
        Player.init();
        renderFilters();
        bindEvents();
        renderFavorites();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', FavoritesPage.init);

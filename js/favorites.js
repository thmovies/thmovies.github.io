/* ============================================
   THMOVIES - Favorites Module
   ============================================ */

const Favorites = (() => {
    const STORAGE_KEY = 'thm_favorites';

    function getAll() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) return JSON.parse(data);

            // Migrate from old format
            const oldData = localStorage.getItem('favorites');
            if (oldData) {
                const parsed = JSON.parse(oldData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                localStorage.removeItem('favorites');
                return parsed;
            }

            return [];
        } catch {
            return [];
        }
    }

    function save(favs) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    }

    function isFavorite(id, type) {
        return getAll().some(f => f.id === id && f.type === type);
    }

    function toggle(id, type, title, poster, date) {
        let favs = getAll();
        const index = favs.findIndex(f => f.id === id && f.type === type);

        if (index > -1) {
            favs.splice(index, 1);
            Toast.info('Rimosso dai preferiti');
        } else {
            favs.push({ id, type, title, poster, date });
            Toast.success('Aggiunto ai preferiti!');
        }

        save(favs);

        // Dispatch event for UI update
        document.dispatchEvent(new CustomEvent('favoritesChanged'));

        return index === -1; // Returns true if added
    }

    function remove(id, type) {
        let favs = getAll();
        favs = favs.filter(f => !(f.id === id && f.type === type));
        save(favs);
        document.dispatchEvent(new CustomEvent('favoritesChanged'));
    }

    // Render favorites into a container
    function render(container, onSelect) {
        if (!container) return;
        const favs = getAll();
        container.innerHTML = '';

        if (!favs.length) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="far fa-heart"></i>
                    <p>Nessun preferito ancora. Aggiungi film e serie!</p>
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

            const card = UI.createMediaCard(item, f.type, onSelect, true);
            card.style.animation = `fadeInUp 0.4s var(--ease-out) ${index * 0.04}s forwards`;
            card.style.opacity = '0';
            container.appendChild(card);
        });
    }

    // Render as horizontal carousel
    function renderCarousel(container, onSelect) {
        if (!container) return;
        const favs = getAll();
        container.innerHTML = '';

        if (!favs.length) {
            container.innerHTML = '<p class="text-muted" style="padding: var(--space-md);">Nessun preferito</p>';
            return;
        }

        favs.forEach((f) => {
            const item = {
                id: f.id,
                title: f.title,
                name: f.title,
                poster_path: f.poster,
                release_date: f.date,
                first_air_date: f.date,
                vote_average: null
            };

            const card = UI.createMediaCard(item, f.type, onSelect, true);
            card.classList.add('media-card-horizontal');
            container.appendChild(card);
        });
    }

    // Export favorites as JSON
    function exportJSON() {
        const favs = getAll();
        const blob = new Blob([JSON.stringify(favs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'thmovies_favorites.json';
        a.click();
        URL.revokeObjectURL(url);
        Toast.success('Preferiti esportati!');
    }

    // Import favorites from JSON
    function importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (!Array.isArray(imported)) throw new Error('Invalid format');

                    const current = getAll();
                    const merged = [...current];

                    imported.forEach(item => {
                        if (!merged.some(f => f.id === item.id && f.type === item.type)) {
                            merged.push(item);
                        }
                    });

                    save(merged);
                    document.dispatchEvent(new CustomEvent('favoritesChanged'));
                    Toast.success(`Importati ${imported.length} preferiti!`);
                    resolve(merged);
                } catch (err) {
                    Toast.error('File non valido');
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    }

    return {
        getAll,
        isFavorite,
        toggle,
        remove,
        render,
        renderCarousel,
        exportJSON,
        importJSON
    };
})();

/* ============================================
   THMOVIES - Detail Page Controller
   Media info, player, cast, similar titles
   URL params: ?id=123&type=movie|tv|anime
   ============================================ */

const DetailPage = (() => {
    const state = {
        id: null,
        type: null,
        title: null,
        poster: null,
        season: 1,
        episode: 1,
        lang: '',
        trailerKey: null
    };

    const dom = {};

    function cacheDom() {
        dom.backdrop = document.getElementById('detailBackdrop');
        dom.infoGrid = document.getElementById('detailInfoGrid');
        dom.episodeSection = document.getElementById('episodeSelectorSection');
        dom.seasonSelect = document.getElementById('seasonSelect');
        dom.episodeSelect = document.getElementById('episodeSelect');
        dom.langSelect = document.getElementById('langSelect');
        dom.playBtn = document.getElementById('playBtn');
        dom.trailerBtn = document.getElementById('trailerBtn');
        dom.favBtn = document.getElementById('favBtn');
        dom.favBtnText = document.getElementById('favBtnText');
        dom.retryBtn = document.getElementById('retryBtn');
        dom.openTabBtn = document.getElementById('openTabBtn');
        dom.castSection = document.getElementById('castSection');
        dom.castCarousel = document.getElementById('castCarousel');
        dom.similarSection = document.getElementById('similarSection');
        dom.similarGrid = document.getElementById('similarGrid');
        dom.trailerModal = document.getElementById('trailerModal');
    }

    // Read URL params
    function parseParams() {
        const params = new URLSearchParams(window.location.search);
        state.id = params.get('id');
        state.type = params.get('type') || 'movie';

        if (!state.id) {
            Toast.error('Nessun media selezionato');
            setTimeout(() => window.location.href = 'home.html', 1500);
            return false;
        }
        return true;
    }

    // Render main info
    function renderInfo(details) {
        const title = details.title || details.name;
        const date = details.release_date || details.first_air_date || '';
        const year = date ? date.slice(0, 4) : 'N/D';
        const vote = details.vote_average;
        const overview = details.overview || 'Nessuna descrizione disponibile.';
        const posterUrl = API.getPosterUrl(details.poster_path);
        const genres = details.genres || [];
        const runtime = details.runtime
            ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
            : details.number_of_seasons
                ? `${details.number_of_seasons} stagioni`
                : '';

        state.title = title;
        state.poster = details.poster_path;

        // Update page title
        document.title = `${title} - THMovies`;

        // Rating class
        let ratingClass = 'low';
        if (vote >= 7) ratingClass = 'high';
        else if (vote >= 5) ratingClass = 'mid';

        // Backdrop
        if (dom.backdrop && details.backdrop_path) {
            dom.backdrop.style.backgroundImage = `url(${API.getImageUrl(details.backdrop_path, 'w1280')})`;
        }

        // Info grid
        if (dom.infoGrid) {
            const genreTags = genres.map(g => `<span class="detail-genre-tag">${g.name}</span>`).join('');

            dom.infoGrid.innerHTML = `
                <div class="detail-poster">
                    <img src="${posterUrl}" alt="${title}" loading="lazy">
                </div>
                <div class="detail-info">
                    <h1 class="detail-title">${title}</h1>
                    <div class="detail-meta">
                        <span class="rating-badge ${ratingClass}"><i class="fas fa-star"></i> ${vote ? vote.toFixed(1) : 'N/D'}</span>
                        <span>${year}</span>
                        ${runtime ? `<span>${runtime}</span>` : ''}
                    </div>
                    ${genreTags ? `<div class="detail-genres">${genreTags}</div>` : ''}
                    <p class="detail-overview">${overview}</p>
                </div>
            `;
        }
    }

    // Load language options
    function loadLangOptions() {
        if (!dom.langSelect) return;
        const langType = state.type === 'anime' ? 'anime' : (state.type === 'movie' ? 'movie' : 'tv');
        const options = CONFIG.LANG_OPTIONS[langType] || [];

        dom.langSelect.innerHTML = '';
        options.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt.value;
            el.textContent = opt.label;
            dom.langSelect.appendChild(el);
        });
    }

    // Load seasons for TV/anime, show lang selector for all types
    function loadSeasons(details) {
        if (state.type === 'movie') {
            // Show lang selector only for movies (hide season/episode)
            if (dom.episodeSection) dom.episodeSection.classList.remove('hidden');
            if (dom.seasonSelect) dom.seasonSelect.style.display = 'none';
            if (dom.episodeSelect) dom.episodeSelect.style.display = 'none';
            return;
        }

        if (dom.episodeSection) dom.episodeSection.classList.remove('hidden');
        if (dom.seasonSelect) dom.seasonSelect.style.display = '';
        if (dom.episodeSelect) dom.episodeSelect.style.display = '';

        if (!details.seasons || !dom.seasonSelect) return;

        dom.seasonSelect.innerHTML = '<option value="">Stagione...</option>';
        details.seasons
            .filter(s => s.season_number > 0)
            .forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.season_number;
                opt.textContent = `Stagione ${s.season_number} (${s.episode_count} ep.)`;
                dom.seasonSelect.appendChild(opt);
            });
    }

    // Load episodes for selected season
    async function loadEpisodes() {
        const season = dom.seasonSelect?.value;
        if (!season || !dom.episodeSelect) return;

        state.season = parseInt(season, 10);

        const data = await API.getSeasonDetails(state.id, season);
        if (!data?.episodes) return;

        dom.episodeSelect.innerHTML = '<option value="">Episodio...</option>';
        data.episodes.forEach(ep => {
            const opt = document.createElement('option');
            opt.value = ep.episode_number;
            opt.textContent = `Ep. ${ep.episode_number}: ${ep.name || 'Senza titolo'} ${ep.runtime ? `(${ep.runtime}m)` : ''}`;
            dom.episodeSelect.appendChild(opt);
        });

        state.episode = 1;
        dom.episodeSelect.value = 1;
    }

    // Load cast
    async function loadCast() {
        const credits = await API.getCredits(state.type, state.id);
        if (!credits?.cast?.length) return;

        const cast = credits.cast.slice(0, 12);
        if (dom.castSection) dom.castSection.classList.remove('hidden');

        if (dom.castCarousel) {
            dom.castCarousel.innerHTML = cast.map(actor => {
                const photo = actor.profile_path
                    ? API.getImageUrl(actor.profile_path, 'w185')
                    : 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%231a1a1a"><rect width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23555" font-size="12" font-family="sans-serif">?</text></svg>');
                return `
                    <div class="cast-card">
                        <img class="cast-photo" src="${photo}" alt="${actor.name}" loading="lazy">
                        <div class="cast-name">${actor.name}</div>
                        <div class="cast-character">${actor.character || ''}</div>
                    </div>
                `;
            }).join('');
        }
    }

    // Load similar titles
    async function loadSimilar() {
        const data = await API.getSimilar(state.type, state.id);
        if (!data?.results?.length) return;

        if (dom.similarSection) dom.similarSection.classList.remove('hidden');
        if (dom.similarGrid) {
            dom.similarGrid.innerHTML = '';
            data.results.slice(0, 12).forEach((item, index) => {
                const cardType = state.type === 'anime' ? 'anime' : state.type;
                const isFav = Favorites.isFavorite(item.id, cardType);
                const card = UI.createMediaCard(item, cardType, onSimilarClick, isFav);
                card.style.animationDelay = `${index * 0.03}s`;
                card.style.opacity = '0';
                card.style.animation = `fadeInUp 0.4s var(--ease-out) ${index * 0.03}s forwards`;
                dom.similarGrid.appendChild(card);
            });
        }
    }

    function onSimilarClick(type, id) {
        // Navigate to same page with new params
        window.location.href = `detail.html?id=${id}&type=${type}`;
    }

    // Load trailer
    async function loadTrailer() {
        const videos = await API.getVideos(state.type, state.id);
        if (!videos?.results?.length) return;

        const ytVideos = videos.results.filter(v => v.site === 'YouTube');
        const trailer = ytVideos.find(v => v.type === 'Trailer' && v.official === true)
            || ytVideos.find(v => v.type === 'Trailer')
            || ytVideos.find(v => v.type === 'Teaser')
            || ytVideos[0];

        if (trailer) {
            state.trailerKey = trailer.key;
            if (dom.trailerBtn) {
                dom.trailerBtn.classList.remove('hidden');
                dom.trailerBtn.disabled = false;
            }
        }
    }

    // Update favorite button state
    function updateFavBtn() {
        const isFav = Favorites.isFavorite(parseInt(state.id), state.type);
        if (dom.favBtn) {
            const icon = dom.favBtn.querySelector('i');
            if (icon) {
                icon.className = isFav ? 'fas fa-heart' : 'far fa-heart';
            }
        }
        if (dom.favBtnText) {
            dom.favBtnText.textContent = isFav ? 'Rimuovi dai Preferiti' : 'Aggiungi ai Preferiti';
        }
    }

    function bindEvents() {
        // Season select
        if (dom.seasonSelect) {
            dom.seasonSelect.addEventListener('change', loadEpisodes);
        }

        // Episode select
        if (dom.episodeSelect) {
            dom.episodeSelect.addEventListener('change', () => {
                state.episode = parseInt(dom.episodeSelect.value, 10) || 1;
            });
        }

        // Language select - reset provider index when changing language
        if (dom.langSelect) {
            dom.langSelect.addEventListener('change', () => {
                state.lang = dom.langSelect.value;
                Player.resetProviderIndex();

                // Update language info note
                const langNote = document.getElementById('langNote');
                if (langNote) {
                    if (state.lang) {
                        const isAnime = state.type === 'anime';
                        const isDub = state.lang === 'dub' || state.lang === 'en';
                        if (isAnime && (state.lang === 'sub' || state.lang === 'dub')) {
                            langNote.textContent = isDub
                                ? 'I provider compatibili con il doppiaggio inglese verranno provati per primi.'
                                : 'I provider con sottotitoli verranno provati per primi.';
                        } else {
                            langNote.textContent = `I provider verranno ordinati per supporto "${state.lang}".`;
                        }
                        langNote.classList.remove('hidden');
                    } else {
                        langNote.classList.add('hidden');
                    }
                }
            });
        }

        // Play button
        if (dom.playBtn) {
            dom.playBtn.addEventListener('click', async () => {
                Player.resetProviderIndex();
                const success = await Player.load(state);
                if (success) {
                    if (dom.retryBtn) dom.retryBtn.classList.remove('hidden');
                    if (dom.openTabBtn) dom.openTabBtn.classList.remove('hidden');
                }
            });
        }

        // Trailer button
        if (dom.trailerBtn) {
            dom.trailerBtn.addEventListener('click', () => {
                Player.showTrailer(state.trailerKey);
            });
        }

        // Retry button
        if (dom.retryBtn) {
            dom.retryBtn.addEventListener('click', async () => {
                await Player.retry(state);
            });
        }

        // Open in new tab
        if (dom.openTabBtn) {
            dom.openTabBtn.addEventListener('click', () => Player.openInNewTab());
        }

        // Favorite button
        if (dom.favBtn) {
            dom.favBtn.addEventListener('click', () => {
                const date = '';
                Favorites.toggle(parseInt(state.id), state.type, state.title, state.poster, date);
                updateFavBtn();
            });
        }

        // Trailer modal
        if (dom.trailerModal) {
            dom.trailerModal.addEventListener('click', (e) => {
                if (e.target === dom.trailerModal) Player.closeTrailer();
            });
            const closeBtn = dom.trailerModal.querySelector('.trailer-close');
            if (closeBtn) closeBtn.addEventListener('click', Player.closeTrailer);
        }

        // Favorites changed externally
        document.addEventListener('favoritesChanged', updateFavBtn);
    }

    async function init() {
        Shared.init();
        cacheDom();
        Player.init();

        if (!parseParams()) return;

        bindEvents();
        loadLangOptions();

        // Enable play button
        if (dom.playBtn) dom.playBtn.disabled = false;

        // Fetch details
        const details = await API.getDetails(state.type, state.id);
        if (!details) {
            Toast.error('Errore nel caricamento dei dettagli');
            return;
        }

        renderInfo(details);
        loadSeasons(details);
        updateFavBtn();

        // Load extra data in parallel
        await Promise.all([
            loadTrailer(),
            loadCast(),
            loadSimilar()
        ]);

        UI.initScrollReveal();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', DetailPage.init);

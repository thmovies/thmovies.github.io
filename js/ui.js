/* ============================================
   THMOVIES - UI Module
   Skeleton loading, animations, DOM helpers
   ============================================ */

const UI = (() => {
    // Create a media card element
    function createMediaCard(item, type, onClick, isFav = false) {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.dataset.id = item.id;
        card.dataset.type = type;

        const title = item.title || item.name || 'Senza titolo';
        const date = item.release_date || item.first_air_date || '';
        const year = date ? date.slice(0, 4) : 'N/D';
        const vote = item.vote_average;
        const posterUrl = API.getPosterUrl(item.poster_path);

        // Rating class
        let ratingClass = 'low';
        if (vote >= 7) ratingClass = 'high';
        else if (vote >= 5) ratingClass = 'mid';

        card.innerHTML = `
            <img class="media-card-poster" src="${posterUrl}" alt="${title}" loading="lazy">
            <div class="media-card-overlay">
                <div class="rating-badge ${ratingClass}">
                    <i class="fas fa-star"></i> ${vote ? vote.toFixed(1) : 'N/D'}
                </div>
                <h3 class="media-card-title">${title}</h3>
                <div class="media-card-meta">
                    <span>${year}</span>
                </div>
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" aria-label="${isFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
                <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
        `;

        // Click handler for card
        const clickHandler = () => onClick(type, item.id);
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.fav-btn')) {
                clickHandler();
            }
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clickHandler();
            }
        });

        // Favorite button handler
        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Favorites.toggle(item.id, type, title, item.poster_path, date);
        });

        return card;
    }

    // Render search results into a container
    function renderResults(container, data, type, onSelect) {
        container.innerHTML = '';

        if (!data?.results?.length) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-search"></i>
                    <p>Nessun risultato trovato. Prova termini diversi.</p>
                </div>
            `;
            return;
        }

        const sorted = [...data.results]
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, CONFIG.MAX_RESULTS);

        sorted.forEach((item, index) => {
            const isFav = Favorites.isFavorite(item.id, type);
            const card = createMediaCard(item, type, onSelect, isFav);
            card.style.animationDelay = `${index * 0.04}s`;
            card.style.opacity = '0';
            card.style.animation = `fadeInUp 0.4s var(--ease-out) ${index * 0.04}s forwards`;
            container.appendChild(card);
        });
    }

    // Render trending content as horizontal carousel
    function renderCarousel(container, items, type, onSelect) {
        container.innerHTML = '';

        if (!items?.length) return;

        items.slice(0, CONFIG.MAX_TRENDING).forEach((item) => {
            const isFav = Favorites.isFavorite(item.id, type || (item.media_type === 'movie' ? 'movie' : 'tv'));
            const cardType = type || (item.media_type === 'movie' ? 'movie' : 'tv');
            const card = createMediaCard(item, cardType, onSelect, isFav);
            card.classList.add('media-card-horizontal');
            container.appendChild(card);
        });
    }

    // Show skeleton loading cards
    function showSkeletons(container, count = 10) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton skeleton-card';
            skeleton.style.animationDelay = `${i * 0.05}s`;
            container.appendChild(skeleton);
        }
    }

    // Show skeleton for carousel
    function showCarouselSkeletons(container, count = 8) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton skeleton-card media-card-horizontal';
            container.appendChild(skeleton);
        }
    }

    // Initialize Intersection Observer for reveal animations
    function initScrollReveal() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return observer;
    }

    // Combined scroll handler: navbar + scroll-to-top (single rAF listener)
    function initDynamicNavbar() {
        const navbar = document.querySelector('.navbar');
        const scrollBtn = document.querySelector('.scroll-top');

        if (!navbar && !scrollBtn) return;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const y = window.scrollY;
                    if (navbar) navbar.classList.toggle('scrolled', y > 50);
                    if (scrollBtn) scrollBtn.classList.toggle('visible', y > 500);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        if (scrollBtn) {
            scrollBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // Kept for backward compatibility (now a no-op, logic merged into initDynamicNavbar)
    function initScrollToTop() {
        // Merged into initDynamicNavbar for single scroll listener
    }

    // Hide page loader
    function hidePageLoader() {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            setTimeout(() => loader.classList.add('hide'), 300);
        }
    }

    // Render hero section
    function renderHero(item, type) {
        const hero = document.getElementById('hero');
        if (!hero || !item) return;

        const title = item.title || item.name || '';
        const overview = item.overview || '';
        const backdropUrl = item.backdrop_path
            ? API.getImageUrl(item.backdrop_path, 'w1280')
            : '';

        const backdrop = hero.querySelector('.hero-backdrop');
        const content = hero.querySelector('.hero-content');

        if (backdrop && backdropUrl) {
            backdrop.style.backgroundImage = `url(${backdropUrl})`;
        }

        if (content) {
            content.innerHTML = `
                <span class="hero-badge"><i class="fas fa-fire"></i> Trending</span>
                <h1 class="hero-title">${title}</h1>
                <p class="hero-overview">${overview}</p>
                <div class="hero-actions">
                    <button class="hero-btn hero-btn-primary" id="heroPlayBtn">
                        <i class="fas fa-play"></i> Riproduci
                    </button>
                    <button class="hero-btn hero-btn-secondary" id="heroInfoBtn">
                        <i class="fas fa-info-circle"></i> Info
                    </button>
                </div>
            `;

            // Attach hero button events
            const playBtn = document.getElementById('heroPlayBtn');
            const infoBtn = document.getElementById('heroInfoBtn');
            const mediaType = type || (item.media_type === 'movie' ? 'movie' : 'tv');

            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    document.dispatchEvent(new CustomEvent('heroPlay', {
                        detail: { id: item.id, type: mediaType }
                    }));
                });
            }
            if (infoBtn) {
                infoBtn.addEventListener('click', () => {
                    document.dispatchEvent(new CustomEvent('heroInfo', {
                        detail: { id: item.id, type: mediaType }
                    }));
                });
            }
        }
    }

    return {
        createMediaCard,
        renderResults,
        renderCarousel,
        showSkeletons,
        showCarouselSkeletons,
        initScrollReveal,
        initDynamicNavbar,
        initScrollToTop,
        hidePageLoader,
        renderHero
    };
})();

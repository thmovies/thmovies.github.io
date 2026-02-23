/* ============================================
   THMOVIES - TMDB API Module
   ============================================ */

const API = (() => {
    const cache = new Map();
    const headers = {
        Authorization: `Bearer ${CONFIG.TMDB_TOKEN}`,
        'Content-Type': 'application/json;charset=utf-8'
    };

    // Cached fetch with TTL
    async function fetchWithCache(url) {
        const now = Date.now();
        if (cache.has(url)) {
            const cached = cache.get(url);
            if (now - cached.time < CONFIG.CACHE_TTL_MS) {
                return cached.data;
            }
            cache.delete(url);
        }

        try {
            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            cache.set(url, { data, time: now });

            // Clean old cache entries
            if (cache.size > 100) {
                const oldest = [...cache.entries()]
                    .sort((a, b) => a[1].time - b[1].time)
                    .slice(0, 20);
                oldest.forEach(([key]) => cache.delete(key));
            }

            return data;
        } catch (e) {
            console.error('API fetch error:', e);
            return null;
        }
    }

    // Search movies, TV shows, or anime
    async function search(type, query) {
        if (!query.trim()) return null;
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        let extra = '';
        if (type === 'anime') {
            extra = '&with_genres=16&with_keywords=210024&with_original_language=ja';
        }
        const url = `${CONFIG.TMDB_BASE}/search/${endpoint}?query=${encodeURIComponent(query)}&language=${CONFIG.TMDB_LANG}${extra}`;
        return fetchWithCache(url);
    }

    // Search with genre filter
    async function searchWithGenre(type, query, genreId) {
        if (!query.trim()) return null;
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        let extra = genreId ? `&with_genres=${genreId}` : '';
        if (type === 'anime') {
            extra += '&with_genres=16&with_keywords=210024&with_original_language=ja';
        }
        const url = `${CONFIG.TMDB_BASE}/search/${endpoint}?query=${encodeURIComponent(query)}&language=${CONFIG.TMDB_LANG}${extra}`;
        return fetchWithCache(url);
    }

    // Get trending content
    async function getTrending(mediaType = 'all', timeWindow = 'week') {
        const url = `${CONFIG.TMDB_BASE}/trending/${mediaType}/${timeWindow}?language=${CONFIG.TMDB_LANG}`;
        return fetchWithCache(url);
    }

    // Get popular content (with pagination)
    async function getPopular(type, page = 1) {
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        let extra = '';
        if (type === 'anime') {
            extra = '&with_genres=16&with_keywords=210024&with_original_language=ja';
        }
        const url = `${CONFIG.TMDB_BASE}/discover/${endpoint}?language=${CONFIG.TMDB_LANG}&sort_by=popularity.desc&page=${page}${extra}`;
        return fetchWithCache(url);
    }

    // Get media details
    async function getDetails(type, id) {
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        const url = `${CONFIG.TMDB_BASE}/${endpoint}/${id}?language=${CONFIG.TMDB_LANG}`;
        return fetchWithCache(url);
    }

    // Get videos (trailers)
    async function getVideos(type, id) {
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        // Try Italian first, then English
        let url = `${CONFIG.TMDB_BASE}/${endpoint}/${id}/videos?language=${CONFIG.TMDB_LANG}`;
        let data = await fetchWithCache(url);
        if (!data?.results?.length) {
            url = `${CONFIG.TMDB_BASE}/${endpoint}/${id}/videos?language=en-US`;
            data = await fetchWithCache(url);
        }
        return data;
    }

    // Get season details
    async function getSeasonDetails(id, seasonNumber) {
        const url = `${CONFIG.TMDB_BASE}/tv/${id}/season/${seasonNumber}?language=${CONFIG.TMDB_LANG}`;
        return fetchWithCache(url);
    }

    // Get backdrop/poster image URL
    function getImageUrl(path, size = 'w500') {
        if (!path) return null;
        return `${CONFIG.TMDB_IMG}/${size}${path}`;
    }

    // Get poster URL with fallback
    function getPosterUrl(path) {
        return path
            ? `${CONFIG.TMDB_IMG}/w300${path}`
            : 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" fill="%231a1a1a"><rect width="300" height="450"/><text x="150" y="225" text-anchor="middle" fill="%23555" font-size="16" font-family="sans-serif">No Image</text></svg>');
    }

    // Get similar titles
    async function getSimilar(type, id) {
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        const url = `${CONFIG.TMDB_BASE}/${endpoint}/${id}/similar?language=${CONFIG.TMDB_LANG}`;
        return fetchWithCache(url);
    }

    // Get top rated
    async function getTopRated(type) {
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        let extra = '';
        if (type === 'anime') {
            extra = '&with_genres=16&with_keywords=210024&with_original_language=ja';
        }
        const url = `${CONFIG.TMDB_BASE}/${endpoint}/top_rated?language=${CONFIG.TMDB_LANG}${extra}`;
        return fetchWithCache(url);
    }

    // Get popular by genre (with pagination)
    async function getPopularByGenre(type, genreId, page = 1) {
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        let extra = genreId ? `&with_genres=${genreId}` : '';
        if (type === 'anime') {
            extra += '&with_genres=16&with_keywords=210024&with_original_language=ja';
        }
        const url = `${CONFIG.TMDB_BASE}/discover/${endpoint}?language=${CONFIG.TMDB_LANG}&sort_by=popularity.desc&page=${page}${extra}`;
        return fetchWithCache(url);
    }

    // Get cast/credits
    async function getCredits(type, id) {
        const endpoint = type === 'movie' ? 'movie' : 'tv';
        const url = `${CONFIG.TMDB_BASE}/${endpoint}/${id}/credits?language=${CONFIG.TMDB_LANG}`;
        return fetchWithCache(url);
    }

    return {
        search,
        searchWithGenre,
        getTrending,
        getPopular,
        getDetails,
        getVideos,
        getSeasonDetails,
        getSimilar,
        getTopRated,
        getPopularByGenre,
        getCredits,
        getImageUrl,
        getPosterUrl
    };
})();

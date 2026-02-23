/* ============================================
   THMOVIES - Shared Module
   Common functionality for all pages:
   auth guard, navbar, theme, scroll, shortcuts
   ============================================ */

const Shared = (() => {
    function init() {
        // Auth guard
        if (!Auth.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Init UI features
        initActiveNav();
        UI.initDynamicNavbar();
        UI.initScrollToTop();
        UI.initScrollReveal();
        initTheme();
        initLogout();
        initRulesOverlay();
        initKeyboardShortcuts();
        initFirebaseAuthListener();
        UI.hidePageLoader();
    }

    // Listen for Firebase auth state changes
    function initFirebaseAuthListener() {
        if (typeof firebase === 'undefined' || !CONFIG._firebaseReady) return;

        firebase.auth().onAuthStateChanged((user) => {
            const session = Auth.getSession();
            if (!user && session?.authType === 'firebase') {
                // Firebase user signed out but local session still active
                Auth.logout();
                window.location.href = 'index.html';
            }
        });
    }

    // Highlight active nav link based on current page
    function initActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'home.html';

        // Desktop nav tabs
        document.querySelectorAll('.nav-tab[href]').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === currentPage);
        });

        // Mobile nav items
        document.querySelectorAll('.mobile-nav-item[href]').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === currentPage);
        });
    }

    // Theme toggle
    function initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const themeToggleMobile = document.getElementById('themeToggleMobile');

        // Apply saved theme
        const saved = localStorage.getItem('theme');
        if (saved === 'light') {
            document.body.classList.add('light');
        }

        function updateIcons() {
            const isLight = document.body.classList.contains('light');
            const icon = isLight ? 'fa-moon' : 'fa-sun';
            const removeIcon = isLight ? 'fa-sun' : 'fa-moon';

            [themeToggle, themeToggleMobile].forEach(btn => {
                if (!btn) return;
                const i = btn.querySelector('i');
                if (i) {
                    i.classList.remove(removeIcon);
                    i.classList.add(icon);
                }
            });
        }

        updateIcons();

        function toggleTheme() {
            document.body.classList.toggle('light');
            const isLight = document.body.classList.contains('light');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            updateIcons();
        }

        if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
        if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);
    }

    // Logout buttons
    function initLogout() {
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Sicuro di voler effettuare il logout?')) {
                    Auth.logout();
                    window.location.href = 'index.html';
                }
            });
        });
    }

    // Rules overlay
    function initRulesOverlay() {
        const overlay = document.getElementById('rulesOverlay');
        if (!overlay) return;

        const closeBtn = overlay.querySelector('.rules-close-btn');
        function close() {
            overlay.classList.remove('active');
            localStorage.removeItem('showRulesOnLoad');
        }

        if (closeBtn) closeBtn.addEventListener('click', close);
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });

        // Show rules on first load if flagged
        if (localStorage.getItem('showRulesOnLoad') === 'true') {
            setTimeout(() => overlay.classList.add('active'), 500);
        }
    }

    // Global keyboard shortcuts
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Player.closeTrailer();
                const overlay = document.getElementById('rulesOverlay');
                if (overlay) overlay.classList.remove('active');
            }

            // "/" focuses search
            if (e.key === '/' && !e.target.matches('input, textarea, select')) {
                e.preventDefault();
                const searchInput = document.querySelector('.search-bar input');
                if (searchInput) searchInput.focus();
            }
        });
    }

    // Navigate to detail page
    function goToDetail(type, id) {
        window.location.href = `detail.html?id=${id}&type=${type}`;
    }

    return { init, goToDetail };
})();

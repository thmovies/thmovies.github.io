/* ============================================
   THMOVIES - Toast Notifications Module
   ============================================ */

const Toast = (() => {
    let container = null;

    function getContainer() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    const ICONS = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };

    function show(message, type = 'info', duration = CONFIG.TOAST_DURATION_MS) {
        const cont = getContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        toast.innerHTML = `
            <i class="toast-icon ${ICONS[type] || ICONS.info}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Chiudi notifica">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => dismiss(toast));

        cont.appendChild(toast);

        // Auto dismiss
        const timer = setTimeout(() => dismiss(toast), duration);
        toast._timer = timer;

        // Limit visible toasts
        const toasts = cont.querySelectorAll('.toast:not(.removing)');
        if (toasts.length > 5) {
            dismiss(toasts[0]);
        }

        return toast;
    }

    function dismiss(toast) {
        if (!toast || toast.classList.contains('removing')) return;
        clearTimeout(toast._timer);
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }

    function success(message, duration) {
        return show(message, 'success', duration);
    }

    function error(message, duration) {
        return show(message, 'error', duration);
    }

    function info(message, duration) {
        return show(message, 'info', duration);
    }

    function warning(message, duration) {
        return show(message, 'warning', duration);
    }

    return { show, success, error, info, warning, dismiss };
})();

// Executive App Framework (Theme Management, Responsive Sidebar, Quota-Safe Data Manager & Toast System)

(function () {

    // --- Global Utility Helpers ---
    window.escapeHtml = function (str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    };

    // --- Theme Management ---
    function applyTheme(theme) {
        const isDark = theme === 'dark';
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);

        const themeIcons = document.querySelectorAll('.theme-toggle-icon');
        const themeLabels = document.querySelectorAll('.theme-toggle-label');

        themeIcons.forEach(icon => {
            icon.textContent = isDark ? 'light_mode' : 'dark_mode';
            icon.classList.add('theme-icon-animate');
            icon.style.transform = 'scale(1.2) rotate(15deg)';
            setTimeout(() => icon.style.transform = 'scale(1) rotate(0deg)', 250);
        });

        themeLabels.forEach(label => {
            label.textContent = isDark ? 'Light' : 'Dark';
        });

        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark } }));
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            applyTheme('dark');
        }
    }

    function toggleTheme() {
        const currentlyDark = document.documentElement.classList.contains('dark');
        applyTheme(currentlyDark ? 'light' : 'dark');
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTheme();

        const themeBtns = document.querySelectorAll('[aria-label="Toggle Dark Mode"]');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', toggleTheme);
        });

        // Highlight Active Sidebar Navigation Link
        const path = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === path || (path === '/' && href === '/dashboard') || (path === '/dashboard' && href === '/')) {
                link.classList.add('bg-indigo-500/15', 'text-indigo-600', 'dark:text-indigo-400', 'border-r-4', 'border-indigo-500', 'font-semibold');
                link.classList.remove('text-slate-400', 'text-slate-600');
            }
        });

        // "+ New Analysis" button handler
        document.addEventListener('click', (e) => {
            const newAnalysisBtn = e.target.closest('.btn-new-analysis');
            if (newAnalysisBtn) {
                e.preventDefault();
                window.FeedbackAgentData.clear();
                if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
                    window.location.reload();
                } else {
                    window.location.href = '/dashboard';
                }
            }
        });

        initSidebarController();
    });

    // --- Responsive & Cursor-Resizable Sidebar Controller ---
    function initSidebarController() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const resizer = document.getElementById('sidebar-resizer');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

        if (!sidebar) return;

        const savedWidth = localStorage.getItem('sidebar_width');
        if (savedWidth && window.innerWidth >= 1024) {
            applySidebarWidth(parseInt(savedWidth, 10));
        }

        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', () => {
                sidebar.classList.remove('-translate-x-full');
                sidebar.classList.add('translate-x-0');
                if (mobileOverlay) {
                    mobileOverlay.classList.remove('hidden');
                    setTimeout(() => mobileOverlay.classList.add('opacity-100'), 10);
                }
            });
        }

        function closeMobileSidebar() {
            if (window.innerWidth < 1024) {
                sidebar.classList.add('-translate-x-full');
                sidebar.classList.remove('translate-x-0');
            }
            if (mobileOverlay) {
                mobileOverlay.classList.remove('opacity-100');
                setTimeout(() => mobileOverlay.classList.add('hidden'), 300);
            }
        }

        if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
        if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileSidebar);

        if (resizer) {
            let isResizing = false;

            resizer.addEventListener('mousedown', (e) => {
                if (window.innerWidth < 1024) return;
                isResizing = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing || window.innerWidth < 1024) return;
                let newWidth = e.clientX;
                if (newWidth < 80) newWidth = 80;
                if (newWidth > 380) newWidth = 380;
                applySidebarWidth(newWidth);
            });

            document.addEventListener('mouseup', () => {
                if (!isResizing) return;
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                const currentWidth = sidebar.getBoundingClientRect().width;
                localStorage.setItem('sidebar_width', currentWidth);
            });

            resizer.addEventListener('dblclick', () => {
                if (window.innerWidth < 1024) return;
                applySidebarWidth(256);
                localStorage.setItem('sidebar_width', 256);
            });
        }

        function applySidebarWidth(width) {
            if (window.innerWidth < 1024) return;
            sidebar.style.width = `${width}px`;
            if (mainContent) {
                mainContent.style.marginLeft = `${width}px`;
            }
            if (width < 130) {
                sidebar.classList.add('sidebar-compact');
            } else {
                sidebar.classList.remove('sidebar-compact');
            }
        }
    }
})();

// --- Toast Notification Helper ---
window.showToast = function (message, type = 'error') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined text-xl">${type === 'error' ? 'error' : 'check_circle'}</span>
        <div>
            <div class="font-bold text-xs uppercase tracking-wider opacity-90 mb-0.5">${type === 'error' ? 'System Warning' : 'System Notification'}</div>
            <div>${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-15px) scale(0.92)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
};

// --- Quota-Safe Shared Data Manager ---
window.FeedbackAgentData = {
    STORAGE_KEY: 'feedback_agent_dataset',
    MAX_PERSISTED_ROWS: 500,

    save: function (data) {
        if (!data) return;
        try {
            // Cap data set if result list is large to prevent browser storage quota errors
            let payloadToSave = data;
            if (data.results && data.results.length > this.MAX_PERSISTED_ROWS) {
                payloadToSave = {
                    ...data,
                    results: data.results.slice(0, this.MAX_PERSISTED_ROWS),
                    isCapped: true
                };
            }
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(payloadToSave));
            if (data.results && data.results.length > this.MAX_PERSISTED_ROWS) {
                window.showToast(`Large dataset detected (${data.results.length} rows). Stored preview of first ${this.MAX_PERSISTED_ROWS} rows client-side.`, 'error');
            }
        } catch (e) {
            console.error('Failed to save dataset to sessionStorage:', e);
            window.showToast('Browser storage quota exceeded. Storing aggregate stats only.', 'error');
            try {
                // Emergency fallback: store summary stats only
                const summaryOnly = {
                    total_reviews: data.total_reviews,
                    sentiment_counts: data.sentiment_counts,
                    results: (data.results || []).slice(0, 50),
                    isCapped: true
                };
                sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(summaryOnly));
            } catch (fallbackErr) {
                console.error('Fallback storage failed:', fallbackErr);
            }
        }
    },

    get: function () {
        try {
            const raw = sessionStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Failed to read dataset from sessionStorage:', e);
            return null;
        }
    },

    clear: function () {
        try {
            sessionStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('Failed to clear dataset:', e);
        }
    }
};

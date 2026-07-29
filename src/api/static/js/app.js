// Executive App Framework (Dynamic Sun/Moon Theme Toggle, Drag-to-Resize Sidebar, Softened Ambient WebGL Background & Navigation)

(function () {
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
                link.classList.add('bg-primary/15', 'text-primary', 'border-r-4', 'border-primary', 'font-semibold');
                link.classList.remove('text-on-surface-variant', 'text-slate-400');
            }
        });

        // Listen for "+ New Analysis" button clicks to clear dataset session
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

        // Initialize Responsive & Cursor-Resizable Sidebar Controller
        initSidebarController();

        // Initialize WebGL Background Shader
        initShaderBackground();
    });

    // --- Cursor-Resizable Sidebar Controller ---
    function initSidebarController() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('main-content');
        const resizer = document.getElementById('sidebar-resizer');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

        if (!sidebar) return;

        // Restore saved width on desktop (>= 1024px)
        const savedWidth = localStorage.getItem('sidebar_width');
        if (savedWidth && window.innerWidth >= 1024) {
            applySidebarWidth(parseInt(savedWidth, 10));
        }

        // Mobile Hamburger Open
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

        // Mobile Sidebar Close
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

        // Desktop Drag-to-Resize Logic
        if (resizer) {
            let isResizing = false;

            resizer.addEventListener('mousedown', (e) => {
                if (window.innerWidth < 1024) return;
                isResizing = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                let newWidth = e.clientX;
                if (newWidth < 70) newWidth = 70;
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

    // --- Softened Ambient WebGL Background Shader ---
    function initShaderBackground() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) return;

        const vertexShaderSource = `
            attribute vec2 position;
            varying vec2 v_texCoord;
            void main() {
                v_texCoord = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
            precision highp float;
            varying vec2 v_texCoord;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_isDark;

            void main() {
                vec2 uv = v_texCoord;
                vec2 p = uv * 2.0 - 1.0;
                p.x *= u_resolution.x / u_resolution.y;

                float t = u_time * 0.12;

                vec3 darkBase = vec3(0.01, 0.03, 0.08);
                vec3 lightBase = vec3(0.92, 0.94, 0.98);

                vec3 color = mix(lightBase, darkBase, u_isDark);

                for(float i = 1.0; i < 4.0; i++) {
                    p.x += 0.2 / i * sin(i * 2.0 * p.y + t + i * 0.5);
                    p.y += 0.2 / i * cos(i * 2.0 * p.x + t + i * 0.8);

                    float dist = length(p);
                    vec3 darkGlow = mix(vec3(0.2, 0.3, 0.6), vec3(0.1, 0.45, 0.65), sin(t + i) * 0.5 + 0.5);
                    vec3 lightGlow = mix(vec3(0.35, 0.3, 0.7), vec3(0.1, 0.5, 0.65), sin(t + i) * 0.5 + 0.5);

                    float intensity = mix(0.03 / (dist + 0.4), 0.02 / (dist + 0.3), u_isDark);

                    if (u_isDark > 0.5) {
                        color += intensity * darkGlow;
                    } else {
                        color = mix(color, lightGlow, intensity * 1.5);
                    }
                }

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const uTimeLocation = gl.getUniformLocation(program, 'u_time');
        const uResLocation = gl.getUniformLocation(program, 'u_resolution');
        const uDarkLocation = gl.getUniformLocation(program, 'u_isDark');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        window.addEventListener('resize', resize);
        resize();

        function renderBg(time) {
            const isDark = document.documentElement.classList.contains('dark') ? 1.0 : 0.0;
            gl.uniform1f(uTimeLocation, time * 0.001);
            gl.uniform2f(uResLocation, canvas.width, canvas.height);
            gl.uniform1f(uDarkLocation, isDark);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(renderBg);
        }
        requestAnimationFrame(renderBg);
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
            <div class="font-bold text-xs uppercase tracking-wider opacity-90 mb-0.5">${type === 'error' ? 'Analysis Notice' : 'System Notification'}</div>
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

// --- Shared Data Manager ---
window.FeedbackAgentData = {
    STORAGE_KEY: 'feedback_agent_dataset',

    save: function (data) {
        try {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save dataset:', e);
        }
    },

    get: function () {
        try {
            const raw = sessionStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('Failed to read dataset:', e);
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

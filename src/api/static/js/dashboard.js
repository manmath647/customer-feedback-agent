// Dashboard Specific Controller (Three.js Hero, Multi-stage File Upload, SVG Donut Chart & High-contrast Table)

document.addEventListener('DOMContentLoaded', () => {
    initThreeHero();
    initFileUpload();

    // Check if data already exists in session storage and populate UI
    const existingData = window.FeedbackAgentData.get();
    if (existingData) {
        renderDashboardData(existingData);
    }
});

let selectedFile = null;
let threeCoreMaterial = null;

// --- Three.js Hero Scene Setup ---
function initThreeHero() {
    const container = document.getElementById('three-container');
    if (!container || typeof THREE === 'undefined') return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 1.5, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x2dd4bf, 1.2, 100);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Glass Core Geometry
    const geometry = new THREE.IcosahedronGeometry(1.5, 15);
    threeCoreMaterial = new THREE.MeshPhongMaterial({
        color: 0x6366f1,
        emissive: 0x1e1b4b,
        specular: 0xffffff,
        shininess: 100,
        transparent: true,
        opacity: 0.75,
        wireframe: false
    });

    const core = new THREE.Mesh(geometry, threeCoreMaterial);
    scene.add(core);

    // Orbiting Wireframe Shell
    const shellGeo = new THREE.IcosahedronGeometry(1.8, 2);
    const shellMat = new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        wireframe: true,
        transparent: true,
        opacity: 0.25
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shell);

    // Orbiting Floating Particles
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 40;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 8;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
        size: 0.08,
        color: 0x2dd4bf,
        transparent: true,
        opacity: 0.6
    });
    const particleMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particleMesh);

    camera.position.z = 5;

    const animate = () => {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        core.rotation.y += 0.005;
        core.rotation.x += 0.003;
        shell.rotation.y -= 0.003;
        shell.rotation.x -= 0.002;
        particleMesh.rotation.y += 0.001;

        const scale = 1 + Math.sin(time * 1.5) * 0.04;
        core.scale.set(scale, scale, scale);
        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || 400;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // Theme Switch Listener for Three.js Lighting
    window.addEventListener('themeChanged', (e) => {
        const isDark = e.detail.isDark;
        if (threeCoreMaterial) {
            threeCoreMaterial.emissive.setHex(isDark ? 0x1e1b4b : 0xe0e7ff);
            threeCoreMaterial.opacity = isDark ? 0.75 : 0.85;
        }
    });
}

// --- File Upload Controller ---
function initFileUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const fileInfo = document.getElementById('file-info');
    const fileNameSpan = document.getElementById('file-name');
    const fileSizeSpan = document.getElementById('file-size');

    if (!dropZone || !browseBtn || !analyzeBtn || !fileInput) return;

    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files && dt.files.length > 0) {
            handleFileSelect(dt.files[0]);
        }
    });

    function handleFileSelect(file) {
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));

        if (!isValid) {
            window.showToast("Unsupported format! Please select a valid .csv or .xlsx file.", "error");
            return;
        }

        selectedFile = file;

        if (fileInfo && fileNameSpan) {
            fileNameSpan.textContent = file.name;
            if (fileSizeSpan) {
                fileSizeSpan.textContent = formatBytes(file.size);
            }
            fileInfo.classList.remove('hidden');
            fileInfo.classList.add('flex');
        }

        // Enable Analyze Button with Primary Glow Styling
        analyzeBtn.disabled = false;
        analyzeBtn.className = "btn-tactile btn-primary px-8 py-3.5 rounded-full text-white shadow-lg glow-indigo font-semibold cursor-pointer";
    }

    // Trigger POST /analyze on Analyze Button Click
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        setLoadingStage("Uploading feedback dataset...", true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setTimeout(() => setLoadingStage("Running AI Sentiment Analysis...", true), 600);

            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.detail || 'Analysis failed';
                window.showToast(errorMsg, 'error');
                resetAnalyzeBtn();
                return;
            }

            setLoadingStage("Computing sentiment metrics...", true);

            setTimeout(() => {
                window.FeedbackAgentData.save(data);
                renderDashboardData(data);
                resetAnalyzeBtn();
                window.showToast("Feedback dataset successfully analyzed!", "success");
            }, 400);

        } catch (err) {
            console.error('API Error:', err);
            window.showToast("Network error or server connection lost.", "error");
            resetAnalyzeBtn();
        }
    });

    function setLoadingStage(text, isLoading) {
        if (isLoading) {
            analyzeBtn.disabled = true;
            analyzeBtn.className = "btn-tactile bg-primary/40 text-white opacity-80 px-8 py-3.5 rounded-full cursor-not-allowed border border-primary/30 flex items-center gap-2 backdrop-blur-md";
            analyzeBtn.innerHTML = `
                <span class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                <span>${text}</span>
            `;
        }
    }

    function resetAnalyzeBtn() {
        analyzeBtn.disabled = false;
        analyzeBtn.className = "btn-tactile btn-primary px-8 py-3.5 rounded-full text-white shadow-lg glow-indigo font-semibold cursor-pointer";
        analyzeBtn.innerHTML = `
            <span class="material-symbols-outlined text-lg">analytics</span>
            <span>Analyze Dataset</span>
        `;
    }
}

// --- Render Real Data to Dashboard Components ---
function renderDashboardData(data) {
    if (!data) return;

    const total = data.total_reviews || 0;
    const counts = data.sentiment_counts || { positive: 0, neutral: 0, negative: 0 };
    const results = data.results || [];

    const posCount = counts.positive || 0;
    const neuCount = counts.neutral || 0;
    const negCount = counts.negative || 0;

    const posPct = total > 0 ? Math.round((posCount / total) * 100) : 0;
    const neuPct = total > 0 ? Math.round((neuCount / total) * 100) : 0;
    const negPct = total > 0 ? Math.round((negCount / total) * 100) : 0;

    // Stat Cards Update
    const totalElem = document.getElementById('stat-total-reviews');
    if (totalElem) totalElem.textContent = total.toLocaleString();

    const posPctElem = document.getElementById('stat-pos-pct');
    if (posPctElem) posPctElem.textContent = `${posPct}%`;
    const posBar = document.getElementById('stat-pos-bar');
    if (posBar) posBar.style.width = `${posPct}%`;

    const neuPctElem = document.getElementById('stat-neu-pct');
    if (neuPctElem) neuPctElem.textContent = `${neuPct}%`;
    const neuBar = document.getElementById('stat-neu-bar');
    if (neuBar) neuBar.style.width = `${neuPct}%`;

    const negPctElem = document.getElementById('stat-neg-pct');
    if (negPctElem) negPctElem.textContent = `${negPct}%`;
    const negBar = document.getElementById('stat-neg-bar');
    if (negBar) negBar.style.width = `${negPct}%`;

    // High-definition SVG Donut Chart Update
    renderSVGDonutChart(posPct, neuPct, negPct);

    // Populate Recent Feedback Table
    const tbody = document.getElementById('recent-feedback-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        const recentItems = results.slice(0, 6);

        if (recentItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="py-8 text-center text-slate-400 font-medium italic">No reviews processed yet</td>
                </tr>
            `;
            return;
        }

        recentItems.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.className = 'bg-white/5 hover:bg-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] transition-all duration-200 group cursor-pointer rounded-xl overflow-hidden';

            const sentiment = (item.predicted_sentiment || 'neutral').toLowerCase();
            let badgeClass = 'badge-neutral';
            let label = 'Neutral';

            if (sentiment === 'positive') {
                badgeClass = 'badge-positive glow-teal';
                label = 'Positive';
            } else if (sentiment === 'negative') {
                badgeClass = 'badge-negative glow-rose';
                label = 'Negative';
            }

            tr.innerHTML = `
                <td class="py-4 pl-4 text-slate-400 font-mono text-xs font-semibold rounded-l-xl">#${index + 1}</td>
                <td class="py-4 text-main font-medium italic pr-4 max-w-xs md:max-w-md truncate">"${escapeHtml(item.review_text)}"</td>
                <td class="py-4 pr-4 text-right rounded-r-xl">
                    <span class="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold ${badgeClass}">${label}</span>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }
}

// --- Render SVG Donut Chart ---
function renderSVGDonutChart(posPct, neuPct, negPct) {
    const container = document.getElementById('donut-container');
    if (!container) return;

    const size = 220;
    const strokeWidth = 22;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const posOffset = circumference * (1 - posPct / 100);
    const neuOffset = circumference * (1 - neuPct / 100);
    const negOffset = circumference * (1 - negPct / 100);

    const posRotate = 0;
    const neuRotate = (posPct / 100) * 360;
    const negRotate = ((posPct + neuPct) / 100) * 360;

    container.innerHTML = `
        <div class="relative w-56 h-56 flex items-center justify-center">
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="transform -rotate-90">
                <!-- Background Ring -->
                <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="rgba(255,255,255,0.08)" stroke-width="${strokeWidth}" fill="none" />
                
                <!-- Positive Segment (Teal) -->
                <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#2dd4bf" stroke-width="${strokeWidth}" fill="none"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${posOffset}" stroke-linecap="round"
                    style="transform-origin: center; transform: rotate(${posRotate}deg); transition: stroke-dashoffset 1s ease;" />

                <!-- Neutral Segment (Slate/Indigo) -->
                <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#94a3b8" stroke-width="${strokeWidth}" fill="none"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${neuOffset}" stroke-linecap="round"
                    style="transform-origin: center; transform: rotate(${neuRotate}deg); transition: stroke-dashoffset 1s ease;" />

                <!-- Negative Segment (Coral) -->
                <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#fb7185" stroke-width="${strokeWidth}" fill="none"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${negOffset}" stroke-linecap="round"
                    style="transform-origin: center; transform: rotate(${negRotate}deg); transition: stroke-dashoffset 1s ease;" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-4xl font-extrabold text-main font-heading tracking-tight drop-shadow">${posPct}%</span>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Positive</span>
            </div>
        </div>
    `;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

// Analytics Controller (Dynamic Canvas Trend Curve & Interactive Three.js 3D Sentiment Sphere Cluster)

document.addEventListener('DOMContentLoaded', () => {
    const data = window.FeedbackAgentData.get();

    if (!data) {
        showEmptyState();
        return;
    }

    renderAnalytics(data);
    init3DSentimentCluster(data);
});

function showEmptyState() {
    const container = document.getElementById('analytics-content');
    if (container) {
        container.innerHTML = `
            <div class="glass-card rounded-2xl p-12 text-center my-12 max-w-xl mx-auto">
                <span class="material-symbols-outlined text-6xl text-indigo-400 mb-4 animate-bounce">insights</span>
                <h2 class="text-2xl font-bold font-heading text-main mb-2">No Analysis Data Available</h2>
                <p class="text-slate-400 max-w-md mx-auto mb-6 text-sm">
                    Please upload a customer feedback file on the Dashboard page to generate deep visual analytics.
                </p>
                <a href="/dashboard" class="btn-tactile btn-primary px-6 py-3 rounded-full text-sm font-semibold">
                    <span class="material-symbols-outlined text-lg">dashboard</span>
                    <span>Go to Dashboard</span>
                </a>
            </div>
        `;
    }
}

function renderAnalytics(data) {
    const results = data.results || [];
    const counts = data.sentiment_counts || { positive: 0, neutral: 0, negative: 0 };
    const total = data.total_reviews || results.length || 1;

    const posPct = Math.round(((counts.positive || 0) / total) * 100);
    const neuPct = Math.round(((counts.neutral || 0) / total) * 100);
    const negPct = Math.round(((counts.negative || 0) / total) * 100);

    const totalElem = document.getElementById('an-total-reviews');
    if (totalElem) totalElem.textContent = total.toLocaleString();

    const posElem = document.getElementById('an-pos-pct');
    if (posElem) posElem.textContent = `${posPct}%`;

    const neuElem = document.getElementById('an-neu-pct');
    if (neuElem) neuElem.textContent = `${neuPct}%`;

    const negElem = document.getElementById('an-neg-pct');
    if (negElem) negElem.textContent = `${negPct}%`;

    renderTrendChart(results);

    window.addEventListener('themeChanged', () => {
        renderTrendChart(results);
    });
}

// Render Smooth Canvas Curve
function renderTrendChart(results) {
    const canvas = document.getElementById('trend-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 800;
    const height = 300;

    canvas.width = width;
    canvas.height = height;

    if (results.length === 0) return;

    const isDark = document.documentElement.classList.contains('dark');

    // Scores array: Positive = +1, Neutral = 0, Negative = -1
    const points = [];
    let runningSum = 0;
    results.forEach((item, idx) => {
        const s = (item.predicted_sentiment || 'neutral').toLowerCase();
        const score = s === 'positive' ? 1 : (s === 'negative' ? -1 : 0);
        runningSum += score;
        const avg = runningSum / (idx + 1);
        points.push(avg);
    });

    const padding = 45;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    // Gridlines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // Baseline (0 point)
    const midY = padding + chartH / 2;
    ctx.strokeStyle = isDark ? 'rgba(129, 140, 248, 0.3)' : 'rgba(79, 70, 229, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, midY);
    ctx.lineTo(width - padding, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve Gradient Fill
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, '#2dd4bf');
    gradient.addColorStop(0.5, '#818cf8');
    gradient.addColorStop(1, '#fb7185');

    ctx.beginPath();
    points.forEach((val, i) => {
        const x = padding + (i / (points.length - 1 || 1)) * chartW;
        const y = midY - (val * (chartH / 2));
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = isDark ? 12 : 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing Data Nodes
    points.forEach((val, i) => {
        const x = padding + (i / (points.length - 1 || 1)) * chartW;
        const y = midY - (val * (chartH / 2));

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = val > 0 ? '#2dd4bf' : (val < 0 ? '#fb7185' : '#94a3b8');
        ctx.fill();
        ctx.strokeStyle = isDark ? '#020b18' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// --- Interactive 3D Three.js Sentiment Sphere Cluster ---
function init3DSentimentCluster(data) {
    const container = document.getElementById('analytics-3d-scene');
    if (!container || typeof THREE === 'undefined') return;

    const counts = data.sentiment_counts || { positive: 0, neutral: 0, negative: 0 };
    const total = data.total_reviews || 1;

    const width = container.clientWidth || 800;
    const height = 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const group = new THREE.Group();

    // Positive Glass Sphere
    const posGeo = new THREE.SphereGeometry(Math.max(0.8, (counts.positive / total) * 2), 32, 32);
    const posMat = new THREE.MeshPhongMaterial({
        color: 0x2dd4bf,
        emissive: 0x0f766e,
        transparent: true,
        opacity: 0.8,
        shininess: 90
    });
    const posMesh = new THREE.Mesh(posGeo, posMat);
    posMesh.position.set(-2.2, 0, 0);
    group.add(posMesh);

    // Neutral Glass Sphere
    const neuGeo = new THREE.SphereGeometry(Math.max(0.8, (counts.neutral / total) * 2), 32, 32);
    const neuMat = new THREE.MeshPhongMaterial({
        color: 0x94a3b8,
        emissive: 0x334155,
        transparent: true,
        opacity: 0.8,
        shininess: 90
    });
    const neuMesh = new THREE.Mesh(neuGeo, neuMat);
    neuMesh.position.set(0, 0, 0);
    group.add(neuMesh);

    // Negative Glass Sphere
    const negGeo = new THREE.SphereGeometry(Math.max(0.8, (counts.negative / total) * 2), 32, 32);
    const negMat = new THREE.MeshPhongMaterial({
        color: 0xfb7185,
        emissive: 0x9f1239,
        transparent: true,
        opacity: 0.8,
        shininess: 90
    });
    const negMesh = new THREE.Mesh(negGeo, negMat);
    negMesh.position.set(2.2, 0, 0);
    group.add(negMesh);

    scene.add(group);
    camera.position.set(0, 0, 6.5);

    const animate = () => {
        requestAnimationFrame(animate);
        group.rotation.y += 0.006;
        group.rotation.x += 0.002;
        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 360;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

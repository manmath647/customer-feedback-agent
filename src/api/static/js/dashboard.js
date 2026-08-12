// Dashboard Specific Controller (Multi-stage File Upload, Optimized SVG Donut Chart & High-contrast Accessible Table)

document.addEventListener('DOMContentLoaded', () => {
    initFileUpload();

    // Check if data already exists in session storage and populate UI
    const existingData = window.FeedbackAgentData.get();
    if (existingData) {
        renderDashboardData(existingData);
    }
});

let selectedFile = null;

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

        // Enable Analyze Button with Primary Styling
        analyzeBtn.disabled = false;
        analyzeBtn.className = "btn-tactile btn-primary px-8 py-3.5 rounded-full text-white shadow-lg font-semibold cursor-pointer";
    }

    // Trigger POST /analyze on Analyze Button Click
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        setLoadingStage("Uploading feedback dataset...", true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setTimeout(() => setLoadingStage("Running AI Sentiment Analysis...", true), 400);

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

            setLoadingStage("Computing metrics...", true);

            setTimeout(() => {
                window.FeedbackAgentData.save(data);
                renderDashboardData(data);
                resetAnalyzeBtn();
                window.showToast("Feedback dataset successfully analyzed!", "success");
            }, 300);

        } catch (err) {
            console.error('API Error:', err);
            window.showToast("Network error or server connection lost.", "error");
            resetAnalyzeBtn();
        }
    });

    function setLoadingStage(text, isLoading) {
        if (isLoading) {
            analyzeBtn.disabled = true;
            analyzeBtn.className = "btn-tactile bg-indigo-500/40 text-white opacity-80 px-8 py-3.5 rounded-full cursor-not-allowed border border-indigo-500/30 flex items-center gap-2";
            analyzeBtn.innerHTML = `
                <span class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                <span>${text}</span>
            `;
        }
    }

    function resetAnalyzeBtn() {
        analyzeBtn.disabled = false;
        analyzeBtn.className = "btn-tactile btn-primary px-8 py-3.5 rounded-full text-white shadow-lg font-semibold cursor-pointer";
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

    // SVG Donut Chart Update
    renderSVGDonutChart(posPct, neuPct, negPct);

    // Populate Recent Feedback Table with Accessibility Icons & Labels
    const tbody = document.getElementById('recent-feedback-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        const recentItems = results.slice(0, 6);

        if (recentItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-8 text-center text-slate-400 font-medium italic">No reviews processed yet</td>
                </tr>
            `;
            return;
        }

        recentItems.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.className = 'bg-slate-100/50 hover:bg-slate-200/50 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] transition-all duration-200 cursor-pointer rounded-xl overflow-hidden';

            const sentiment = (item.predicted_sentiment || 'neutral').toLowerCase();
            let badgeClass = 'badge-neutral';
            let label = 'Neutral';
            let icon = 'sentiment_neutral';

            if (sentiment === 'positive') {
                badgeClass = 'badge-positive';
                label = 'Positive';
                icon = 'sentiment_satisfied';
            } else if (sentiment === 'negative') {
                badgeClass = 'badge-negative';
                label = 'Negative';
                icon = 'sentiment_dissatisfied';
            } else if (sentiment === 'insufficient_text') {
                badgeClass = 'badge-neutral';
                label = 'Insufficient Text';
                icon = 'help_outline';
            }

            const confidenceStr = item.confidence !== undefined ? ` (${Math.round(item.confidence * 100)}%)` : '';

            tr.innerHTML = `
                <td class="py-4 pl-4 text-slate-400 font-mono text-xs font-semibold rounded-l-xl">#${index + 1}</td>
                <td class="py-4 text-main font-medium italic pr-4 max-w-xs md:max-w-md truncate">"${window.escapeHtml(item.review_text)}"</td>
                <td class="py-4 pr-4 text-right rounded-r-xl">
                    <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
                        <span class="material-symbols-outlined text-sm">${icon}</span>
                        <span>${label}${confidenceStr}</span>
                    </span>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }
}

// --- Render SVG Donut Chart (Refactored for DOM Re-use & 0% Edge Cases) ---
function renderSVGDonutChart(posPct, neuPct, negPct) {
    const container = document.getElementById('donut-container');
    if (!container) return;

    const size = 220;
    const strokeWidth = 22;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Check if SVG DOM elements already exist in container
    let svgWrapper = container.querySelector('.donut-svg-wrapper');
    if (!svgWrapper) {
        container.innerHTML = `
            <div class="donut-svg-wrapper relative w-56 h-56 flex items-center justify-center">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="transform -rotate-90">
                    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="rgba(148, 163, 184, 0.15)" stroke-width="${strokeWidth}" fill="none" />
                    <circle id="donut-pos-seg" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#2dd4bf" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" style="transform-origin: center; transition: all 0.8s ease;" />
                    <circle id="donut-neu-seg" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#818cf8" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" style="transform-origin: center; transition: all 0.8s ease;" />
                    <circle id="donut-neg-seg" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke="#fb7185" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" style="transform-origin: center; transition: all 0.8s ease;" />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span id="donut-center-pct" class="text-4xl font-extrabold text-main font-heading tracking-tight drop-shadow">${posPct}%</span>
                    <span id="donut-center-label" class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Positive</span>
                </div>
            </div>
        `;
    }

    const posCircle = document.getElementById('donut-pos-seg');
    const neuCircle = document.getElementById('donut-neu-seg');
    const negCircle = document.getElementById('donut-neg-seg');
    const centerPct = document.getElementById('donut-center-pct');

    if (centerPct) centerPct.textContent = `${posPct}%`;

    // Helper to update segment attributes cleanly
    function updateSegment(circleEl, pct, rotateDeg) {
        if (!circleEl) return;
        if (pct <= 0) {
            circleEl.setAttribute('stroke-dasharray', `0 ${circumference}`);
            circleEl.setAttribute('stroke-dashoffset', '0');
            circleEl.style.opacity = '0';
        } else {
            const visibleDash = (pct / 100) * circumference;
            circleEl.setAttribute('stroke-dasharray', `${visibleDash} ${circumference}`);
            circleEl.setAttribute('stroke-dashoffset', '0');
            circleEl.style.transform = `rotate(${rotateDeg}deg)`;
            circleEl.style.opacity = '1';
        }
    }

    const posRotate = 0;
    const neuRotate = (posPct / 100) * 360;
    const negRotate = ((posPct + neuPct) / 100) * 360;

    updateSegment(posCircle, posPct, posRotate);
    updateSegment(neuCircle, neuPct, neuRotate);
    updateSegment(negCircle, negPct, negRotate);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

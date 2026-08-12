// Analytics Controller (Dynamic Canvas Trend Curve, SVG Pie Chart & Rich Visual Insights)

const SAMPLE_DEMO_DATA = {
    total_reviews: 120,
    sentiment_counts: {
        positive: 68,
        neutral: 32,
        negative: 20
    },
    results: [
        { review_text: "Extremely intuitive UI and lightning-fast sentiment analysis accuracy!", predicted_sentiment: "positive", confidence: 0.96 },
        { review_text: "Great dashboard layout with real-time NLP trend charts and visual insights.", predicted_sentiment: "positive", confidence: 0.94 },
        { review_text: "Love the interactive pie chart and instant feedback highlights.", predicted_sentiment: "positive", confidence: 0.91 },
        { review_text: "Customer support was fast, helpful, and resolved my issue immediately.", predicted_sentiment: "positive", confidence: 0.95 },
        { review_text: "Standard performance, meets basic expectations for report generation.", predicted_sentiment: "neutral", confidence: 0.82 },
        { review_text: "CSV upload worked fine after setting column headers properly.", predicted_sentiment: "neutral", confidence: 0.88 },
        { review_text: "Would like to see more custom theme options in future updates.", predicted_sentiment: "neutral", confidence: 0.79 },
        { review_text: "Slow response time during large batch processing of 10,000+ rows.", predicted_sentiment: "negative", confidence: 0.93 },
        { review_text: "File parsing error when uploading unsupported file format.", predicted_sentiment: "negative", confidence: 0.89 }
    ],
    isDemo: true
};

let _currentAnalyticsResults = [];

document.addEventListener('DOMContentLoaded', () => {
    let data = window.FeedbackAgentData ? window.FeedbackAgentData.get() : null;

    const rawCounts = data ? (data.sentiment_counts || {}) : {};
    const totalCount = (rawCounts.positive || 0) + (rawCounts.neutral || 0) + (rawCounts.negative || 0);

    if (!data || totalCount === 0 || !data.results || data.results.length === 0) {
        data = SAMPLE_DEMO_DATA;
    }

    _currentAnalyticsResults = data.results || [];

    renderAnalytics(data);
    initInteractivePieChart(data);
    renderKeywordBarChart(data);
    renderReviewLengthChart(data);

    // Register theme listener ONCE to prevent listener leaks
    window.addEventListener('themeChanged', () => {
        if (_currentAnalyticsResults.length > 0) {
            renderTrendChart(_currentAnalyticsResults);
        }
    });
});

function renderAnalytics(data) {
    const results = data.results || [];
    const counts = data.sentiment_counts || { positive: 0, neutral: 0, negative: 0 };
    const total = data.total_reviews || (counts.positive + counts.neutral + counts.negative) || 1;

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

    if (!results || results.length === 0) return;

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
    ctx.stroke();

    // Data Nodes
    points.forEach((val, i) => {
        const x = padding + (i / (points.length - 1 || 1)) * chartW;
        const y = midY - (val * (chartH / 2));

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = val > 0 ? '#2dd4bf' : (val < 0 ? '#fb7185' : '#818cf8');
        ctx.fill();
        ctx.strokeStyle = isDark ? '#020b18' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// --- Interactive Modern Responsive SVG Donut / Pie Chart ---
function polarToCartesian(centerX, centerY, radius, angleInRadians) {
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeDonutSegment(x, y, innerRadius, outerRadius, startAngle, endAngle) {
    const angleDiff = endAngle - startAngle;
    if (angleDiff <= 0.001) return "";

    const isFullCircle = angleDiff >= (2 * Math.PI - 0.0001);
    if (isFullCircle) {
        endAngle = startAngle + 2 * Math.PI - 0.0001;
    }
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, startAngle);
    const endInner = polarToCartesian(x, y, innerRadius, endAngle);

    const largeArcFlag = (endAngle - startAngle) <= Math.PI ? "0" : "1";

    return [
        "M", startOuter.x, startOuter.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        "L", startInner.x, startInner.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, endInner.x, endInner.y,
        "Z"
    ].join(" ");
}

function initInteractivePieChart(data) {
    const slicesGroup = document.getElementById('pie-slices-group');
    const legendContainer = document.getElementById('pie-legend');
    const detailsCard = document.getElementById('pie-details-card');
    const centerLabel = document.getElementById('pie-center-label');
    const centerValue = document.getElementById('pie-center-value');
    const centerSub = document.getElementById('pie-center-sub');

    if (!slicesGroup || !legendContainer || !detailsCard) return;

    const counts = data.sentiment_counts || { positive: 0, neutral: 0, negative: 0 };
    const total = data.total_reviews || (counts.positive + counts.neutral + counts.negative) || 1;

    const categories = [
        {
            key: 'positive',
            label: 'Positive Sentiment',
            shortLabel: 'Positive',
            count: counts.positive || 0,
            color: '#2dd4bf',
            gradientId: 'grad-positive',
            icon: 'sentiment_satisfied',
            badgeBg: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40'
        },
        {
            key: 'neutral',
            label: 'Neutral Sentiment',
            shortLabel: 'Neutral',
            count: counts.neutral || 0,
            color: '#818cf8',
            gradientId: 'grad-neutral',
            icon: 'sentiment_neutral',
            badgeBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40'
        },
        {
            key: 'negative',
            label: 'Negative Sentiment',
            shortLabel: 'Negative',
            count: counts.negative || 0,
            color: '#fb7185',
            gradientId: 'grad-negative',
            icon: 'sentiment_dissatisfied',
            badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40'
        }
    ];

    categories.forEach(cat => {
        cat.pct = Math.round((cat.count / total) * 100);
    });

    let maxCat = categories.reduce((max, c) => (c.count > max.count ? c : max), categories[0]);
    let activeKey = maxCat.key;
    let isPinned = false;

    slicesGroup.innerHTML = '';
    legendContainer.innerHTML = '';

    const innerR = 64;
    const outerR = 98;
    const explodeDist = 12;

    let currentAngle = -Math.PI / 2;
    const sliceElements = {};
    const legendElements = {};

    categories.forEach(cat => {
        const angleSpan = total > 0 ? (cat.count / total) * 2 * Math.PI : 0;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angleSpan;
        const midAngle = (startAngle + endAngle) / 2;
        currentAngle = endAngle;

        cat.dx = Math.cos(midAngle) * explodeDist;
        cat.dy = Math.sin(midAngle) * explodeDist;

        if (cat.count > 0 && angleSpan > 0.005) {
            const pathString = describeDonutSegment(0, 0, innerR, outerR, startAngle, endAngle);
            if (pathString) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathString);
                path.setAttribute('fill', `url(#${cat.gradientId})`);
                path.setAttribute('stroke', 'rgba(255,255,255,0.2)');
                path.setAttribute('stroke-width', '1.5');
                path.style.transition = 'transform 0.3s ease, opacity 0.2s ease';
                path.style.transformOrigin = '0px 0px';
                path.style.cursor = 'pointer';

                path.addEventListener('mouseenter', () => {
                    if (!isPinned || activeKey !== cat.key) {
                        activateCategory(cat.key, false);
                    }
                });

                path.addEventListener('click', () => {
                    isPinned = !(isPinned && activeKey === cat.key);
                    activateCategory(cat.key, true);
                });

                slicesGroup.appendChild(path);
                sliceElements[cat.key] = path;
            }
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `px-3.5 py-1.5 rounded-full border text-xs font-mono font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-white/10 bg-white/70 dark:bg-white/5`;
        btn.innerHTML = `
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${cat.color}"></span>
            <span class="material-symbols-outlined text-sm">${cat.icon}</span>
            <span>${cat.shortLabel}</span>
            <span class="opacity-75 font-bold">(${cat.pct}%)</span>
        `;

        btn.addEventListener('click', () => {
            isPinned = !(isPinned && activeKey === cat.key);
            activateCategory(cat.key, true);
        });

        legendContainer.appendChild(btn);
        legendElements[cat.key] = btn;
    });

    function activateCategory(key, userClicked = false) {
        activeKey = key;
        const targetCat = categories.find(c => c.key === key) || maxCat;

        if (centerLabel) centerLabel.textContent = targetCat.shortLabel;
        if (centerValue) {
            centerValue.textContent = `${targetCat.pct}%`;
            centerValue.style.color = targetCat.color;
        }
        if (centerSub) centerSub.textContent = `${targetCat.count.toLocaleString()} reviews`;

        categories.forEach(c => {
            const pathEl = sliceElements[c.key];
            const legendEl = legendElements[c.key];

            if (c.key === key) {
                if (pathEl) {
                    pathEl.style.transform = `translate(${c.dx}px, ${c.dy}px) scale(1.04)`;
                    pathEl.style.opacity = '1';
                }
                if (legendEl) {
                    legendEl.style.borderColor = c.color;
                    legendEl.style.color = c.color;
                }
            } else {
                if (pathEl) {
                    pathEl.style.transform = 'translate(0px, 0px) scale(1)';
                    pathEl.style.opacity = '0.75';
                }
                if (legendEl) {
                    legendEl.style.borderColor = '';
                    legendEl.style.color = '';
                }
            }
        });

        renderDetailsCard(targetCat, data, total, isPinned);
    }

    activateCategory(maxCat.key, false);
}

function renderDetailsCard(cat, data, total, isPinned) {
    const card = document.getElementById('pie-details-card');
    if (!card) return;

    const isDark = document.documentElement.classList.contains('dark');
    const results = data.results || [];
    const sentimentResults = results.filter(r => (r.predicted_sentiment || '').toLowerCase() === cat.key);

    const textColorMain = isDark ? '#f8fafc' : '#0f172a';
    const textColorSub = isDark ? '#cbd5e1' : '#334155';
    const cardBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc';
    const cardBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';

    const stopWords = new Set(['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us','is','are','was','were','been','has','had','having']);

    const wordCounts = {};
    sentimentResults.forEach(item => {
        const text = (item.review_text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
        const tokens = text.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
        tokens.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
    });

    const topKeywords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(entry => entry[0]);

    const defaultKeywords = {
        positive: ['UI Quality', 'Performance', 'Accuracy', 'Support', 'Fast', 'Usability'],
        neutral: ['Formatting', 'Headers', 'Standard', 'Batching', 'Average'],
        negative: ['Response Time', 'File Error', 'Parsing', 'Timeout', 'Bugs']
    };

    const keywordsList = topKeywords.length > 0 ? topKeywords : (defaultKeywords[cat.key] || ['Quality', 'Performance']);
    const sampleReviews = sentimentResults.slice(0, 2);

    card.innerHTML = `
        <div>
            <div class="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-white/10">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm" style="background-color: ${cat.color}20; border-color: ${cat.color}50; color: ${cat.color}">
                        <span class="material-symbols-outlined text-2xl">${cat.icon}</span>
                    </div>
                    <div>
                        <h4 class="text-lg font-extrabold font-heading tracking-tight" style="color: ${textColorMain}">${cat.label}</h4>
                        <p class="text-xs font-mono font-bold" style="color: ${textColorSub}">${cat.count.toLocaleString()} of ${total.toLocaleString()} total customer reviews</p>
                    </div>
                </div>

                <span class="px-3 py-1 rounded-full text-xs font-mono font-extrabold border" style="background-color: ${cat.color}20; color: ${cat.color}; border-color: ${cat.color}40">
                    ${cat.pct}% Share
                </span>
            </div>

            <div class="mb-5">
                <div class="flex justify-between items-center text-xs font-mono mb-1.5">
                    <span class="font-extrabold uppercase tracking-wider" style="color: ${textColorMain}">Volume Distribution</span>
                    <span class="font-extrabold text-sm" style="color: ${cat.color}">${cat.pct}%</span>
                </div>
                <div class="w-full h-3 rounded-full overflow-hidden border bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-transparent">
                    <div class="h-full rounded-full transition-all duration-500 ease-out" style="width: ${cat.pct}%; background-color: ${cat.color}"></div>
                </div>
            </div>

            <div class="mb-5">
                <div class="text-xs font-mono font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5" style="color: ${textColorMain}">
                    <span class="material-symbols-outlined text-base" style="color: ${cat.color}">label</span>
                    <span>Top Keywords</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${keywordsList.map(kw => `
                        <span class="px-3 py-1 rounded-lg text-xs font-extrabold capitalize flex items-center gap-1.5 shadow-sm border" style="background-color: ${cardBg}; color: ${textColorMain}; border-color: ${cardBorder}">
                            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${cat.color}"></span>
                            <span>${kw}</span>
                        </span>
                    `).join('')}
                </div>
            </div>

            <div>
                <div class="text-xs font-mono font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5" style="color: ${textColorMain}">
                    <span class="material-symbols-outlined text-base" style="color: ${cat.color}">rate_review</span>
                    <span>Sample Reviews</span>
                </div>
                <div class="space-y-2">
                    ${sampleReviews.length > 0 ? sampleReviews.map(r => `
                        <div class="p-3 rounded-xl border text-xs font-semibold italic flex items-start gap-2 shadow-sm" style="background-color: ${cardBg}; color: ${textColorMain}; border-color: ${cardBorder}">
                            <span class="material-symbols-outlined text-base shrink-0 mt-0.5" style="color: ${cat.color}">format_quote</span>
                            <span class="line-clamp-2 leading-relaxed">${window.escapeHtml(r.review_text)}</span>
                        </div>
                    `).join('') : `
                        <div class="p-3 rounded-xl text-xs italic font-semibold border" style="background-color: ${cardBg}; color: ${textColorSub}; border-color: ${cardBorder}">
                            No feedback samples found for this category.
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

// Render Top Keywords Horizontal Bar Chart
function renderKeywordBarChart(data) {
    const container = document.getElementById('keyword-chart-container');
    if (!container) return;

    const results = data.results || [];
    const stopWords = new Set(['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us','is','are','was','were','been','has','had','having']);

    const wordCounts = {};
    results.forEach(item => {
        const text = (item.review_text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
        const tokens = text.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
        tokens.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
    });

    const topPairs = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (topPairs.length === 0) {
        container.innerHTML = `<div class="text-slate-400 text-xs italic text-center py-6">Insufficient keywords detected</div>`;
        return;
    }

    const maxVal = topPairs[0][1] || 1;

    container.innerHTML = topPairs.map(([word, count]) => {
        const pct = Math.round((count / maxVal) * 100);
        return `
            <div class="space-y-1">
                <div class="flex justify-between items-center text-xs font-mono">
                    <span class="font-bold capitalize text-main">${window.escapeHtml(word)}</span>
                    <span class="text-slate-400 font-semibold">${count} mentions</span>
                </div>
                <div class="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Review Length vs Sentiment Distribution Chart
function renderReviewLengthChart(data) {
    const container = document.getElementById('length-chart-container');
    if (!container) return;

    const results = data.results || [];
    if (results.length === 0) return;

    let shortCount = { pos: 0, neu: 0, neg: 0 };  // < 50 chars
    let mediumCount = { pos: 0, neu: 0, neg: 0 }; // 50-150 chars
    let longCount = { pos: 0, neu: 0, neg: 0 };   // > 150 chars

    results.forEach(item => {
        const len = (item.review_text || '').length;
        const s = (item.predicted_sentiment || 'neutral').toLowerCase();
        const target = len < 50 ? shortCount : (len <= 150 ? mediumCount : longCount);
        if (s === 'positive') target.pos++;
        else if (s === 'negative') target.neg++;
        else target.neu++;
    });

    const groups = [
        { label: 'Short (<50 chars)', data: shortCount },
        { label: 'Medium (50-150 chars)', data: mediumCount },
        { label: 'Long (>150 chars)', data: longCount }
    ];

    container.innerHTML = groups.map(g => {
        const totalG = g.data.pos + g.data.neu + g.data.neg || 1;
        const posP = Math.round((g.data.pos / totalG) * 100);
        const neuP = Math.round((g.data.neu / totalG) * 100);
        const negP = Math.round((g.data.neg / totalG) * 100);

        return `
            <div class="space-y-1.5">
                <div class="flex justify-between items-center text-xs font-mono">
                    <span class="font-bold text-main">${g.label}</span>
                    <span class="text-slate-400 font-semibold">${totalG} reviews</span>
                </div>
                <div class="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-white/10">
                    <div class="h-full bg-teal-400" style="width: ${posP}%" title="Positive ${posP}%"></div>
                    <div class="h-full bg-indigo-400" style="width: ${neuP}%" title="Neutral ${neuP}%"></div>
                    <div class="h-full bg-rose-400" style="width: ${negP}%" title="Negative ${negP}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

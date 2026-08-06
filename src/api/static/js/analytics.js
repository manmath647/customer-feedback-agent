// Analytics Controller (Dynamic Canvas Trend Curve & Interactive Responsive Pie Chart)

const SAMPLE_DEMO_DATA = {
    total_reviews: 120,
    sentiment_counts: {
        positive: 68,
        neutral: 32,
        negative: 20
    },
    results: [
        { review_text: "Extremely intuitive UI and lightning-fast sentiment analysis accuracy!", predicted_sentiment: "positive" },
        { review_text: "Great dashboard layout with real-time NLP trend charts and visual insights.", predicted_sentiment: "positive" },
        { review_text: "Love the interactive pie chart and instant feedback highlights.", predicted_sentiment: "positive" },
        { review_text: "Customer support was fast, helpful, and resolved my issue immediately.", predicted_sentiment: "positive" },
        { review_text: "Standard performance, meets basic expectations for report generation.", predicted_sentiment: "neutral" },
        { review_text: "CSV upload worked fine after setting column headers properly.", predicted_sentiment: "neutral" },
        { review_text: "Would like to see more custom theme options in future updates.", predicted_sentiment: "neutral" },
        { review_text: "Slow response time during large batch processing of 10,000+ rows.", predicted_sentiment: "negative" },
        { review_text: "File parsing error when uploading unsupported file format.", predicted_sentiment: "negative" }
    ],
    isDemo: true
};

document.addEventListener('DOMContentLoaded', () => {
    let data = window.FeedbackAgentData ? window.FeedbackAgentData.get() : null;

    const rawCounts = data ? (data.sentiment_counts || {}) : {};
    const totalCount = (rawCounts.positive || 0) + (rawCounts.neutral || 0) + (rawCounts.negative || 0);

    if (!data || totalCount === 0 || !data.results || data.results.length === 0) {
        data = SAMPLE_DEMO_DATA;
    }

    renderAnalytics(data);
    initInteractivePieChart(data);
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

// --- Interactive Modern Responsive SVG Donut / Pie Chart ---
function polarToCartesian(centerX, centerY, radius, angleInRadians) {
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeDonutSegment(x, y, innerRadius, outerRadius, startAngle, endAngle) {
    const isFullCircle = (endAngle - startAngle) >= (2 * Math.PI - 0.0001);
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
            glowColor: 'rgba(45, 212, 191, 0.6)',
            icon: 'sentiment_very_satisfied',
            badgeBg: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/40'
        },
        {
            key: 'neutral',
            label: 'Neutral Sentiment',
            shortLabel: 'Neutral',
            count: counts.neutral || 0,
            color: '#818cf8',
            gradientId: 'grad-neutral',
            glowColor: 'rgba(129, 140, 248, 0.6)',
            icon: 'sentiment_neutral',
            badgeBg: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/40'
        },
        {
            key: 'negative',
            label: 'Negative Sentiment',
            shortLabel: 'Negative',
            count: counts.negative || 0,
            color: '#fb7185',
            gradientId: 'grad-negative',
            glowColor: 'rgba(251, 113, 133, 0.6)',
            icon: 'sentiment_very_dissatisfied',
            badgeBg: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'
        }
    ];

    categories.forEach(cat => {
        cat.pct = Math.round((cat.count / total) * 100);
    });

    // Find default active category (max count)
    let maxCat = categories.reduce((max, c) => (c.count > max.count ? c : max), categories[0]);
    let activeKey = maxCat.key;
    let isPinned = false;

    // Clear SVG and Legend
    slicesGroup.innerHTML = '';
    legendContainer.innerHTML = '';

    const innerR = 64;
    const outerR = 98;
    const explodeDist = 14;

    let currentAngle = -Math.PI / 2;
    const sliceElements = {};
    const legendElements = {};

    categories.forEach(cat => {
        // Calculate angle span even for small counts
        const angleSpan = total > 0 ? (cat.count / total) * 2 * Math.PI : 0;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angleSpan;
        const midAngle = (startAngle + endAngle) / 2;
        currentAngle = endAngle;

        const dx = Math.cos(midAngle) * explodeDist;
        const dy = Math.sin(midAngle) * explodeDist;

        cat.dx = dx;
        cat.dy = dy;

        // Render SVG slice path if count > 0
        if (cat.count > 0 && angleSpan > 0.001) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', describeDonutSegment(0, 0, innerR, outerR, startAngle, endAngle));
            path.setAttribute('fill', `url(#${cat.gradientId})`);
            path.setAttribute('stroke', 'rgba(255,255,255,0.2)');
            path.setAttribute('stroke-width', '1.5');
            path.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.35s ease, opacity 0.25s ease';
            path.style.transformOrigin = '0px 0px';
            path.style.cursor = 'pointer';

            path.addEventListener('mouseenter', () => {
                if (!isPinned || activeKey !== cat.key) {
                    activateCategory(cat.key, false);
                }
            });

            path.addEventListener('click', () => {
                if (isPinned && activeKey === cat.key) {
                    isPinned = false;
                } else {
                    isPinned = true;
                    activateCategory(cat.key, true);
                }
            });

            slicesGroup.appendChild(path);
            sliceElements[cat.key] = path;
        }

        // Legend Button (rendered for all categories)
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `px-3.5 py-1.5 rounded-full border text-xs font-mono font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-white/10 bg-white/60 dark:bg-white/5`;
        btn.innerHTML = `
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${cat.color}"></span>
            <span>${cat.shortLabel}</span>
            <span class="opacity-75 font-bold">(${cat.pct}%)</span>
        `;

        btn.addEventListener('mouseenter', () => {
            if (!isPinned || activeKey !== cat.key) {
                activateCategory(cat.key, false);
            }
        });

        btn.addEventListener('click', () => {
            if (isPinned && activeKey === cat.key) {
                isPinned = false;
            } else {
                isPinned = true;
                activateCategory(cat.key, true);
            }
        });

        legendContainer.appendChild(btn);
        legendElements[cat.key] = btn;
    });

    const svgChart = document.getElementById('pie-chart-svg');
    if (svgChart) {
        svgChart.addEventListener('mouseleave', () => {
            if (!isPinned) {
                activateCategory(maxCat.key, false);
            }
        });
    }

    function activateCategory(key, userClicked = false) {
        activeKey = key;
        const targetCat = categories.find(c => c.key === key) || maxCat;

        // Center overlay update
        if (centerLabel) centerLabel.textContent = targetCat.shortLabel;
        if (centerValue) {
            centerValue.textContent = `${targetCat.pct}%`;
            centerValue.style.color = targetCat.color;
        }
        if (centerSub) centerSub.textContent = `${targetCat.count.toLocaleString()} reviews`;

        // Update Slice explosion transform
        categories.forEach(c => {
            const pathEl = sliceElements[c.key];
            const legendEl = legendElements[c.key];

            if (c.key === key) {
                if (pathEl) {
                    pathEl.style.transform = `translate(${c.dx}px, ${c.dy}px) scale(1.04)`;
                    pathEl.style.filter = `drop-shadow(0 0 16px ${c.glowColor})`;
                    pathEl.style.opacity = '1';
                }

                if (legendEl) {
                    legendEl.style.borderColor = c.color;
                    legendEl.style.backgroundColor = `${c.color}25`;
                    legendEl.style.color = c.color;
                    legendEl.style.transform = 'scale(1.05)';
                    legendEl.style.boxShadow = `0 0 12px ${c.glowColor}`;
                }
            } else {
                if (pathEl) {
                    pathEl.style.transform = 'translate(0px, 0px) scale(1)';
                    pathEl.style.filter = 'none';
                    pathEl.style.opacity = '0.7';
                }

                if (legendEl) {
                    const isDarkTheme = document.documentElement.classList.contains('dark');
                    legendEl.style.borderColor = isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1';
                    legendEl.style.backgroundColor = isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
                    legendEl.style.color = isDarkTheme ? '#cbd5e1' : '#0f172a';
                    legendEl.style.transform = 'scale(1)';
                    legendEl.style.boxShadow = 'none';
                }
            }
        });

        // Render Right Info Card
        renderDetailsCard(targetCat, data, total, isPinned);
    }

    // Initial activation
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
    const cardBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9';
    const cardBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1';

    const catColors = {
        positive: {
            barColor: isDark ? '#2dd4bf' : '#0d9488',
            badgeBg: isDark ? 'rgba(45, 212, 191, 0.2)' : '#ccfbf1',
            badgeText: isDark ? '#2dd4bf' : '#0f766e',
            badgeBorder: isDark ? 'rgba(45, 212, 191, 0.4)' : '#5eead4',
            iconColor: isDark ? '#2dd4bf' : '#0d9488',
            quoteIcon: isDark ? '#2dd4bf' : '#0f766e'
        },
        neutral: {
            barColor: isDark ? '#818cf8' : '#4f46e5',
            badgeBg: isDark ? 'rgba(129, 140, 248, 0.2)' : '#e0e7ff',
            badgeText: isDark ? '#818cf8' : '#4338ca',
            badgeBorder: isDark ? 'rgba(129, 140, 248, 0.4)' : '#a5b4fc',
            iconColor: isDark ? '#818cf8' : '#4f46e5',
            quoteIcon: isDark ? '#818cf8' : '#4338ca'
        },
        negative: {
            barColor: isDark ? '#fb7185' : '#e11d48',
            badgeBg: isDark ? 'rgba(251, 113, 133, 0.2)' : '#ffe4e6',
            badgeText: isDark ? '#fb7185' : '#be123c',
            badgeBorder: isDark ? 'rgba(251, 113, 133, 0.4)' : '#fda4af',
            iconColor: isDark ? '#fb7185' : '#e11d48',
            quoteIcon: isDark ? '#fb7185' : '#be123c'
        }
    };

    const currentTheme = catColors[cat.key] || catColors.positive;

    // Extract Keywords
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

    const keywordsList = topKeywords.length > 0
        ? topKeywords
        : (defaultKeywords[cat.key] || ['Quality', 'Performance', 'Usability']);

    // Pick Sample Reviews
    const sampleReviews = sentimentResults.slice(0, 2);

    card.innerHTML = `
        <div>
            <!-- Top Header & Demo Indicator -->
            <div class="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-300 dark:border-white/10">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm" style="background-color: ${cat.color}25; border-color: ${cat.color}60; color: ${currentTheme.iconColor}">
                        <span class="material-symbols-outlined text-2xl">${cat.icon}</span>
                    </div>
                    <div>
                        <h4 class="text-lg font-extrabold font-heading tracking-tight" style="color: ${textColorMain}">${cat.label}</h4>
                        <p class="text-xs font-mono font-bold" style="color: ${textColorSub}">${cat.count.toLocaleString()} of ${total.toLocaleString()} total customer reviews</p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    ${data.isDemo ? `
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold" style="background-color: ${isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7'}; color: ${isDark ? '#fbbf24' : '#92400e'}; border: 1px solid ${isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde68a'}">
                            Demo Data
                        </span>
                    ` : ''}
                    <span class="px-3 py-1 rounded-full text-xs font-mono font-extrabold border" style="background-color: ${currentTheme.badgeBg}; color: ${currentTheme.badgeText}; border-color: ${currentTheme.badgeBorder}">
                        ${cat.pct}% Volume
                    </span>
                </div>
            </div>

            <!-- Percentage Fill Progress Bar -->
            <div class="mb-5">
                <div class="flex justify-between items-center text-xs font-mono mb-1.5">
                    <span class="font-extrabold uppercase tracking-wider" style="color: ${textColorMain}">Category Share</span>
                    <span class="font-extrabold text-sm" style="color: ${currentTheme.barColor}">${cat.pct}%</span>
                </div>
                <div class="w-full h-3 rounded-full overflow-hidden border" style="background-color: ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1'}; border-color: ${isDark ? 'transparent' : '#94a3b8'}">
                    <div class="h-full rounded-full transition-all duration-500 ease-out" style="width: ${cat.pct}%; background-color: ${currentTheme.barColor}"></div>
                </div>
            </div>

            <!-- Extracted Keywords Tags -->
            <div class="mb-5">
                <div class="text-xs font-mono font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5" style="color: ${textColorMain}">
                    <span class="material-symbols-outlined text-base" style="color: ${currentTheme.barColor}">label</span>
                    <span>Top Mentioned Key Topics</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${keywordsList.map(kw => `
                        <span class="px-3 py-1 rounded-lg text-xs font-extrabold capitalize flex items-center gap-1.5 shadow-sm border" style="background-color: ${cardBg}; color: ${textColorMain}; border-color: ${cardBorder}">
                            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${currentTheme.barColor}"></span>
                            <span>${kw}</span>
                        </span>
                    `).join('')}
                </div>
            </div>

            <!-- Representative Review Samples -->
            <div>
                <div class="text-xs font-mono font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5" style="color: ${textColorMain}">
                    <span class="material-symbols-outlined text-base" style="color: ${currentTheme.barColor}">rate_review</span>
                    <span>Sample Customer Feedback</span>
                </div>
                <div class="space-y-2.5">
                    ${sampleReviews.length > 0 ? sampleReviews.map(r => `
                        <div class="p-3.5 rounded-xl border text-xs font-semibold italic flex items-start gap-2.5 shadow-sm" style="background-color: ${cardBg}; color: ${textColorMain}; border-color: ${cardBorder}">
                            <span class="material-symbols-outlined text-base shrink-0 mt-0.5" style="color: ${currentTheme.quoteIcon}">format_quote</span>
                            <span class="line-clamp-2 leading-relaxed" style="color: ${textColorMain}">${escapeHtml(r.review_text)}</span>
                        </div>
                    `).join('') : `
                        <div class="p-3.5 rounded-xl text-xs italic font-semibold border" style="background-color: ${cardBg}; color: ${textColorSub}; border-color: ${cardBorder}">
                            No feedback samples found for this category.
                        </div>
                    `}
                </div>
            </div>
        </div>

        <div class="mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono font-bold" style="border-color: ${cardBorder}; color: ${textColorSub}">
            <span>Hover/Click slice or legend to interact</span>
            <span class="flex items-center gap-1 font-extrabold" style="color: ${currentTheme.barColor}">
                <span class="material-symbols-outlined text-sm">info</span>
                <span>Real-time NLP breakdown</span>
            </span>
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Reports Controller (Search, Filter, Client-side Pagination & CSV Export)

document.addEventListener('DOMContentLoaded', () => {
    const data = window.FeedbackAgentData.get();

    if (!data || !data.results || data.results.length === 0) {
        showEmptyState();
        return;
    }

    initReportsTable(data.results);
});

let currentResults = [];
let filteredResults = [];
let currentPage = 1;
let pageSize = 25;

function showEmptyState() {
    const container = document.getElementById('reports-content');
    if (container) {
        container.innerHTML = `
            <div class="glass-card rounded-2xl p-12 text-center my-12 max-w-xl mx-auto">
                <span class="material-symbols-outlined text-6xl text-indigo-400 mb-4 animate-bounce">description</span>
                <h2 class="text-2xl font-bold font-heading text-main mb-2">No Report Data Available</h2>
                <p class="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 text-sm">
                    Please upload a customer feedback dataset on the Dashboard page to generate exportable reports.
                </p>
                <a href="/dashboard" class="btn-tactile btn-primary px-6 py-3 rounded-full text-sm font-semibold">
                    <span class="material-symbols-outlined text-lg">dashboard</span>
                    <span>Go to Dashboard</span>
                </a>
            </div>
        `;
    }
}

function initReportsTable(results) {
    currentResults = results;
    filteredResults = [...results];

    const searchInput = document.getElementById('search-input');
    const sentimentFilter = document.getElementById('sentiment-filter');
    const downloadBtn = document.getElementById('download-csv-btn');

    renderTable();

    if (searchInput) {
        searchInput.addEventListener('input', () => applyFilters());
    }

    if (sentimentFilter) {
        sentimentFilter.addEventListener('change', () => applyFilters());
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => downloadCSV());
    }
}

function applyFilters() {
    const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase();
    const filterVal = (document.getElementById('sentiment-filter')?.value || 'all').toLowerCase();

    filteredResults = currentResults.filter(item => {
        const textMatch = (item.review_text || '').toLowerCase().includes(searchVal);
        const sentimentMatch = filterVal === 'all' || (item.predicted_sentiment || '').toLowerCase() === filterVal;
        return textMatch && sentimentMatch;
    });

    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('reports-tbody');
    const countSpan = document.getElementById('result-count');
    const paginationContainer = document.getElementById('pagination-controls');

    const totalCount = filteredResults.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    if (countSpan) {
        const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endIdx = Math.min(currentPage * pageSize, totalCount);
        countSpan.textContent = `Showing ${startIdx}-${endIdx} of ${totalCount} records (Page ${currentPage}/${totalPages})`;
    }

    if (!tbody) return;

    tbody.innerHTML = '';

    if (totalCount === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="py-10 text-center text-slate-500 dark:text-slate-400 italic">
                    No matching review records found.
                </td>
            </tr>
        `;
        renderPaginationControls(0, 1);
        return;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const pageItems = filteredResults.slice(startIndex, startIndex + pageSize);

    pageItems.forEach((item, index) => {
        const globalIndex = startIndex + index + 1;
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
            <td class="py-4 pl-4 text-slate-400 font-mono text-xs font-semibold rounded-l-xl">#${globalIndex}</td>
            <td class="py-4 text-main font-medium italic pr-4">${window.escapeHtml(item.review_text)}</td>
            <td class="py-4 pr-4 text-right rounded-r-xl">
                <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold ${badgeClass}">
                    <span class="material-symbols-outlined text-sm">${icon}</span>
                    <span>${label}${confidenceStr}</span>
                </span>
            </td>
        `;

        tbody.appendChild(tr);
    });

    renderPaginationControls(totalPages, currentPage);
}

function renderPaginationControls(totalPages, activePage) {
    let container = document.getElementById('pagination-controls');
    if (!container) {
        const tableCard = document.querySelector('#reports-content section.glass-card:last-child');
        if (tableCard) {
            container = document.createElement('div');
            container.id = 'pagination-controls';
            container.className = 'mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-white/10 text-xs font-mono';
            tableCard.appendChild(container);
        }
    }

    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span>Rows per page:</span>
            <select id="page-size-select" class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-main cursor-pointer">
                <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
                <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
            </select>
        </div>

        <div class="flex items-center gap-1.5">
            <button id="btn-prev-page" ${activePage <= 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 text-main font-bold hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">chevron_left</span>
                <span>Prev</span>
            </button>
            <span class="px-3 py-1.5 font-bold text-main">Page ${activePage} of ${totalPages}</span>
            <button id="btn-next-page" ${activePage >= totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 text-main font-bold hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1">
                <span>Next</span>
                <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
        </div>
    `;

    const sizeSelect = document.getElementById('page-size-select');
    if (sizeSelect) {
        sizeSelect.addEventListener('change', (e) => {
            pageSize = parseInt(e.target.value, 10);
            currentPage = 1;
            renderTable();
        });
    }

    const prevBtn = document.getElementById('btn-prev-page');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    const nextBtn = document.getElementById('btn-next-page');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
    }
}

function downloadCSV() {
    if (filteredResults.length === 0) {
        window.showToast("No records available to export.", "error");
        return;
    }

    let csv = 'review_text,predicted_sentiment,confidence\n';
    filteredResults.forEach(item => {
        const text = `"${(item.review_text || '').replace(/"/g, '""')}"`;
        const sentiment = `"${item.predicted_sentiment || ''}"`;
        const confidence = item.confidence !== undefined ? item.confidence : '';
        csv += `${text},${sentiment},${confidence}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_analysis_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.showToast(`Exported ${filteredResults.length} feedback records to CSV`, "success");
}

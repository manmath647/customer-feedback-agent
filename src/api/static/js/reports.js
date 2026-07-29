// Reports Controller (Search, Sentiment Filter, Client-side CSV Download & High-contrast Table)

document.addEventListener('DOMContentLoaded', () => {
    const data = window.FeedbackAgentData.get();

    if (!data || !data.results || data.results.length === 0) {
        showEmptyState();
        return;
    }

    initReportsTable(data.results);
});

let currentResults = [];

function showEmptyState() {
    const container = document.getElementById('reports-content');
    if (container) {
        container.innerHTML = `
            <div class="glass-card rounded-2xl p-12 text-center my-12 max-w-xl mx-auto">
                <span class="material-symbols-outlined text-6xl text-indigo-400 mb-4 animate-bounce">description</span>
                <h2 class="text-2xl font-bold font-heading text-main mb-2">No Report Data Available</h2>
                <p class="text-slate-400 max-w-md mx-auto mb-6 text-sm">
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

    const searchInput = document.getElementById('search-input');
    const sentimentFilter = document.getElementById('sentiment-filter');
    const downloadBtn = document.getElementById('download-csv-btn');

    renderTable(currentResults);

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

    const filtered = currentResults.filter(item => {
        const textMatch = (item.review_text || '').toLowerCase().includes(searchVal);
        const sentimentMatch = filterVal === 'all' || (item.predicted_sentiment || '').toLowerCase() === filterVal;
        return textMatch && sentimentMatch;
    });

    renderTable(filtered);
}

function renderTable(results) {
    const tbody = document.getElementById('reports-tbody');
    const countSpan = document.getElementById('result-count');

    if (countSpan) {
        countSpan.textContent = `Showing ${results.length} of ${currentResults.length} records`;
    }

    if (!tbody) return;

    tbody.innerHTML = '';

    if (results.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="py-10 text-center text-slate-400 italic">
                    No matching review records found.
                </td>
            </tr>
        `;
        return;
    }

    results.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = 'bg-white/5 hover:bg-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] transition-all duration-200 group rounded-xl overflow-hidden';

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
            <td class="py-4 text-main font-medium italic pr-4">${escapeHtml(item.review_text)}</td>
            <td class="py-4 pr-4 text-right rounded-r-xl">
                <span class="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold ${badgeClass}">${label}</span>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function downloadCSV() {
    const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase();
    const filterVal = (document.getElementById('sentiment-filter')?.value || 'all').toLowerCase();

    const itemsToExport = currentResults.filter(item => {
        const textMatch = (item.review_text || '').toLowerCase().includes(searchVal);
        const sentimentMatch = filterVal === 'all' || (item.predicted_sentiment || '').toLowerCase() === filterVal;
        return textMatch && sentimentMatch;
    });

    if (itemsToExport.length === 0) {
        window.showToast("No records available to export.", "error");
        return;
    }

    let csv = 'review_text,predicted_sentiment\n';
    itemsToExport.forEach(item => {
        const text = `"${(item.review_text || '').replace(/"/g, '""')}"`;
        const sentiment = `"${item.predicted_sentiment || ''}"`;
        csv += `${text},${sentiment}\n`;
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

    window.showToast(`Exported ${itemsToExport.length} feedback records to CSV`, "success");
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

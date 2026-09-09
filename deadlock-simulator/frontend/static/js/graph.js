// ============================================================
// graph.js - Cytoscape.js Graph Visualization & Deadlock Detection
// ============================================================

const API_ROOT = (typeof API_BASE !== 'undefined') ? API_BASE : 'http://localhost:5000/api';

let cyRAG = null;
let cyWFG = null;

const GRAPH_COLORS = {
    primary:   '#0088ff',
    secondary: '#00c6ff',
    cycle:     '#ff3366',
    cycleBg:   'rgba(255, 51, 102, 0.26)',
    cycleBorder: '#ff3366',
    text:      '#e8eaf0',
    panelBg:   '#07080f'
};

function getRAGStylesheet() {
    return [
        {
            selector: 'node[type = "process"]',
            style: {
                'shape': 'ellipse',
                'width': 54,
                'height': 54,
                'background-color': 'rgba(0,136,255,0.18)',
                'border-width': 2,
                'border-color': GRAPH_COLORS.primary,
                'label': 'data(label)',
                'color': GRAPH_COLORS.text,
                'font-size': 12,
                'font-family': 'Inter, sans-serif',
                'font-weight': 600,
                'text-valign': 'center',
                'text-halign': 'center'
            }
        },
        {
            selector: 'node[type = "resource"]',
            style: {
                'shape': 'rectangle',
                'width': 70,
                'height': 44,
                'background-color': 'rgba(0,198,255,0.14)',
                'border-width': 2,
                'border-color': GRAPH_COLORS.secondary,
                'border-radius': 6,
                'label': 'data(label)',
                'color': GRAPH_COLORS.text,
                'font-size': 11,
                'font-family': 'Inter, sans-serif',
                'font-weight': 600,
                'text-valign': 'center',
                'text-halign': 'center'
            }
        },
        {
            selector: 'node[?cycle], node.cycle-highlight',
            style: {
                'background-color': GRAPH_COLORS.cycleBg,
                'border-color': GRAPH_COLORS.cycleBorder,
                'border-width': 3,
                'color': '#ff8fa3'
            }
        },
        {
            selector: 'edge[edgeType = "allocation"]',
            style: {
                'line-color': GRAPH_COLORS.primary,
                'target-arrow-color': GRAPH_COLORS.primary,
                'target-arrow-shape': 'triangle',
                'arrow-scale': 1.2,
                'curve-style': 'bezier',
                'width': 1.8,
                'line-style': 'solid',
                'label': 'data(label)',
                'font-size': 10,
                'color': GRAPH_COLORS.text,
                'text-background-color': GRAPH_COLORS.panelBg,
                'text-background-opacity': 0.8,
                'text-background-padding': 2
            }
        },
        {
            selector: 'edge[edgeType = "request"]',
            style: {
                'line-color': GRAPH_COLORS.secondary,
                'target-arrow-color': GRAPH_COLORS.secondary,
                'target-arrow-shape': 'triangle',
                'arrow-scale': 1.2,
                'curve-style': 'bezier',
                'width': 1.8,
                'line-style': 'dashed',
                'line-dash-pattern': [7, 4],
                'label': 'data(label)',
                'font-size': 10,
                'color': GRAPH_COLORS.text,
                'text-background-color': GRAPH_COLORS.panelBg,
                'text-background-opacity': 0.8,
                'text-background-padding': 2
            }
        },
        {
            selector: 'edge[?cycle], edge.cycle-highlight',
            style: {
                'line-color': GRAPH_COLORS.cycle,
                'target-arrow-color': GRAPH_COLORS.cycle,
                'width': 2.8
            }
        },
        {
            selector: ':selected',
            style: {
                'border-width': 3,
                'border-color': '#ffffff'
            }
        }
    ];
}

function getWFGStylesheet() {
    return [
        {
            selector: 'node',
            style: {
                'shape': 'ellipse',
                'width': 56,
                'height': 56,
                'background-color': 'rgba(0,136,255,0.18)',
                'border-width': 2,
                'border-color': GRAPH_COLORS.primary,
                'label': 'data(label)',
                'color': GRAPH_COLORS.text,
                'font-size': 13,
                'font-family': 'Inter, sans-serif',
                'font-weight': 600,
                'text-valign': 'center',
                'text-halign': 'center'
            }
        },
        {
            selector: 'node[?cycle], node.cycle-highlight',
            style: {
                'background-color': 'rgba(255,51,102,0.28)',
                'border-color': GRAPH_COLORS.cycle,
                'border-width': 3,
                'color': '#ff8fa3'
            }
        },
        {
            selector: 'edge',
            style: {
                'line-color': GRAPH_COLORS.primary,
                'target-arrow-color': GRAPH_COLORS.primary,
                'target-arrow-shape': 'triangle',
                'arrow-scale': 1.2,
                'curve-style': 'bezier',
                'width': 1.8,
                'line-style': 'solid',
                'label': 'data(resource)',
                'font-size': 10,
                'color': GRAPH_COLORS.secondary,
                'text-background-color': GRAPH_COLORS.panelBg,
                'text-background-opacity': 0.85,
                'text-background-padding': 2
            }
        },
        {
            selector: 'edge[?cycle], edge.cycle-highlight',
            style: {
                'line-color': GRAPH_COLORS.cycle,
                'target-arrow-color': GRAPH_COLORS.cycle,
                'width': 2.8
            }
        }
    ];
}

async function loadRAG() {
    const container = document.getElementById('cy-rag');
    const emptyEl = document.getElementById('rag-empty');
    if (!container) return;

    try {
        const res = await fetch(`${API_ROOT}/rag`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.nodes || data.nodes.length === 0) {
            if (emptyEl) emptyEl.style.display = 'flex';
            if (cyRAG) { cyRAG.destroy(); cyRAG = null; }
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (cyRAG) {
            try { cyRAG.destroy(); } catch (e) {}
            cyRAG = null;
        }
        Array.from(container.children).forEach(child => {
            if (child.tagName === 'CANVAS' || child.getAttribute('data-id')?.startsWith('layer')) {
                child.remove();
            }
        });

        cyRAG = cytoscape({
            container: container,
            elements: [...data.nodes, ...data.edges],
            style: getRAGStylesheet(),
            layout: {
                name: 'cose',
                padding: 45,
                nodeRepulsion: 7000,
                idealEdgeLength: 110,
                animate: true,
                animationDuration: 400,
                randomize: false
            },
            wheelSensitivity: 0.3
        });
    } catch (err) {
        console.error('Error loading RAG:', err);
    }
}

async function loadWFG() {
    const container = document.getElementById('cy-wfg');
    const emptyEl = document.getElementById('wfg-empty');
    const badgeEl = document.getElementById('cycle-badge');
    if (!container) return;

    try {
        const res = await fetch(`${API_ROOT}/wait-for-graph`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (badgeEl) {
            badgeEl.classList.toggle('hidden', !data.has_cycle);
        }

        if (!data.edges || data.edges.length === 0) {
            if (emptyEl) emptyEl.style.display = 'flex';
            if (cyWFG) { cyWFG.destroy(); cyWFG = null; }
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (cyWFG) {
            try { cyWFG.destroy(); } catch (e) {}
            cyWFG = null;
        }
        Array.from(container.children).forEach(child => {
            if (child.tagName === 'CANVAS' || child.getAttribute('data-id')?.startsWith('layer')) {
                child.remove();
            }
        });

        cyWFG = cytoscape({
            container: container,
            elements: [...data.nodes, ...data.edges],
            style: getWFGStylesheet(),
            layout: {
                name: 'circle',
                padding: 50,
                animate: true,
                animationDuration: 400
            },
            wheelSensitivity: 0.3
        });
    } catch (err) {
        console.error('Error loading WFG:', err);
    }
}

function loadGraphs() {
    loadRAG();
    loadWFG();
}

/**
 * Highlight detected cycle nodes and edges in both WFG and RAG.
 */
function highlightCycleInGraphs(deadlockedProcesses, cycles) {
    const processSet = new Set(deadlockedProcesses || []);
    const cycleEdgePairs = new Set();

    (cycles || []).forEach(cycle => {
        if (!cycle || cycle.length === 0) return;
        for (let i = 0; i < cycle.length; i++) {
            const u = cycle[i];
            const v = cycle[(i + 1) % cycle.length];
            cycleEdgePairs.add(`${u}->${v}`);
        }
    });

    // 1. Highlight in WFG
    if (cyWFG) {
        cyWFG.nodes().forEach(node => {
            if (processSet.has(node.id())) {
                node.addClass('cycle-highlight');
            } else {
                node.removeClass('cycle-highlight');
            }
        });

        cyWFG.edges().forEach(edge => {
            const pair = `${edge.data('source')}->${edge.data('target')}`;
            if (cycleEdgePairs.has(pair) || edge.data('cycle')) {
                edge.addClass('cycle-highlight');
            } else {
                edge.removeClass('cycle-highlight');
            }
        });
    }

    // 2. Highlight in RAG
    if (cyRAG) {
        cyRAG.nodes().forEach(node => {
            const isDeadlocked = processSet.has(node.id());
            if (isDeadlocked) {
                node.addClass('cycle-highlight');
            } else if (!node.data('cycle')) {
                node.removeClass('cycle-highlight');
            }
        });

        cyRAG.edges().forEach(edge => {
            const src = edge.data('source');
            const tgt = edge.data('target');
            const isCycleEdge = edge.data('cycle') || (processSet.has(src) && processSet.has(tgt));
            if (isCycleEdge) {
                edge.addClass('cycle-highlight');
            }
        });
    }
}

/**
 * Call GET /api/detect and render the Detect Deadlock panel.
 */
async function detectDeadlock() {
    const resultBody = document.getElementById('deadlock-result-body');
    if (!resultBody) return;

    try {
        const [detectRes, wfgRes] = await Promise.all([
            fetch(`${API_ROOT}/detect`),
            fetch(`${API_ROOT}/wait-for-graph`)
        ]);

        if (!detectRes.ok) throw new Error(`Detect HTTP ${detectRes.status}`);
        const detectData = await detectRes.json();

        let wfgEdges = [];
        if (wfgRes.ok) {
            const wfgData = await wfgRes.json();
            wfgEdges = (wfgData.edges || []).map(e => e.data || e);
        }

        const isDeadlock = Boolean(detectData.deadlock);
        const deadlockedProcesses = detectData.deadlocked_processes || [];
        const cycles = detectData.cycles || [];

        if (isDeadlock) {
            // Format deadlocked processes: "P1, P2"
            const procString = deadlockedProcesses.length > 0
                ? deadlockedProcesses.join(', ')
                : 'None listed';

            // Format cycles: each on its own line "P1 → P2 → P1"
            let cycleHtml = '';
            if (cycles.length > 0) {
                cycleHtml = cycles.map(c => {
                    if (!Array.isArray(c) || c.length === 0) return '';
                    const fullCyclePath = [...c, c[0]];
                    return `<span class="deadlock-cycle-text">${fullCyclePath.join(' &rarr; ')}</span>`;
                }).join('');
            } else {
                cycleHtml = `<span class="deadlock-cycle-text">Cycle detected in resource allocation</span>`;
            }

            resultBody.innerHTML = `
                <div class="deadlock-status-badge deadlock-detected">
                    &#9888; DEADLOCK DETECTED
                </div>
                <div class="deadlock-section-group">
                    <div class="deadlock-section-title">Deadlocked processes:</div>
                    <div class="deadlock-section-content deadlock-processes-list">${procString}</div>
                </div>
                <div class="deadlock-section-group">
                    <div class="deadlock-section-title">Cycle:</div>
                    <div class="deadlock-section-content">${cycleHtml}</div>
                </div>
            `;

            highlightCycleInGraphs(deadlockedProcesses, cycles);

        } else {
            let waitSentencesHtml = '';
            if (wfgEdges.length > 0) {
                const sentences = wfgEdges.map(edge => {
                    const proc = edge.source;
                    const holder = edge.target;
                    const res = edge.resource ? ` ${edge.resource}` : ' the resource';
                    return `<span class="deadlock-wait-sentence">${proc} is waiting for ${holder} to release${res}.</span>`;
                });
                waitSentencesHtml = sentences.join('');
            } else {
                waitSentencesHtml = `<span class="deadlock-wait-sentence" style="color: var(--text-secondary);">No processes are waiting.</span>`;
            }

            resultBody.innerHTML = `
                <div class="deadlock-status-badge no-deadlock">
                    &#10003; NO DEADLOCK
                </div>
                <div class="deadlock-section-group">
                    <div class="deadlock-section-content">${waitSentencesHtml}</div>
                </div>
            `;

            highlightCycleInGraphs([], []);
        }

    } catch (err) {
        console.error('Error in detectDeadlock:', err);
        resultBody.innerHTML = `
            <div style="color: var(--error); font-size: 0.9rem;">
                Failed to detect deadlock: ${err.message}
            </div>
        `;
    }
// Global exports for browser scripts
window.loadRAG = loadRAG;
window.loadWFG = loadWFG;
window.loadGraphs = loadGraphs;
window.detectDeadlock = detectDeadlock;
window.highlightCycleInGraphs = highlightCycleInGraphs;

// Wire smooth scroll and manual buttons after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const scrollBtn = document.getElementById('btn-scroll-graph');
    if (scrollBtn) {
        scrollBtn.addEventListener('click', () => {
            const section = document.getElementById('graph-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    const refreshBtn = document.getElementById('btn-refresh-graphs');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadGraphs();
            detectDeadlock();
            if (typeof showToast === 'function') {
                showToast('Graphs refreshed');
            }
        });
    }

    const detectBtn = document.getElementById('btn-detect-deadlock');
    if (detectBtn) {
        detectBtn.addEventListener('click', async () => {
            await detectDeadlock();
            if (typeof showToast === 'function') {
                showToast('Deadlock detection run completed');
            }
        });
    }
});

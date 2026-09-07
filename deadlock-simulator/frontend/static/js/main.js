const API_BASE = 'http://localhost:5000/api';

let processes = [];
let resources = [];
let allocations = [];
let requests = [];

document.addEventListener('DOMContentLoaded', () => {
    // Attach form handlers
    document.getElementById('form-add-process').addEventListener('submit', handleAddProcess);
    document.getElementById('form-add-resource').addEventListener('submit', handleAddResource);
    document.getElementById('form-add-allocation').addEventListener('submit', handleAddAllocation);
    document.getElementById('form-add-request').addEventListener('submit', handleAddRequest);

    // Initial fetch
    fetchAll();
});

// Toast System
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Fetch State
async function fetchAll() {
    try {
        const response = await fetch(`${API_BASE}/state`);
        if (!response.ok) throw new Error('Failed to fetch state');
        const data = await response.json();
        
        processes = data.processes || [];
        resources = data.resources || [];
        allocations = data.allocations || [];
        requests = data.requests || [];

        renderAll();
    } catch (error) {
        showToast('Error loading data', 'error');
        console.error(error);
    }
}

function renderAll() {
    renderProcesses();
    renderResources();
    renderAllocations();
    renderRequests();
    
    populateAllocationDropdowns();
    populateRequestDropdowns();
    
    updateStats();
}

// Process Management
async function handleAddProcess(e) {
    e.preventDefault();
    const name = document.getElementById('process-name').value;
    const priority = document.getElementById('process-priority').value;

    try {
        const res = await fetch(`${API_BASE}/processes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, priority })
        });
        if (!res.ok) throw new Error('Failed to add process');
        
        e.target.reset();
        showToast('Process added successfully');
        fetchAll();
    } catch (error) {
        showToast('Error adding process', 'error');
    }
}

async function handleDeleteProcess(id) {
    try {
        const res = await fetch(`${API_BASE}/processes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete process');
        
        showToast('Process deleted');
        fetchAll();
    } catch (error) {
        showToast('Error deleting process', 'error');
    }
}

function renderProcesses() {
    const tbody = document.getElementById('processes-tbody');
    if (processes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>No processes found</p>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = processes.map(p => `
        <tr>
            <td><span class="badge-id">P${p.id}</span></td>
            <td>${p.name}</td>
            <td><span class="badge-priority priority-${p.priority.toLowerCase()}">${p.priority}</span></td>
            <td>
                <button class="btn-delete" onclick="handleDeleteProcess(${p.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// Resource Management
async function handleAddResource(e) {
    e.preventDefault();
    const name = document.getElementById('resource-name').value;
    const instances = parseInt(document.getElementById('resource-instances').value);

    try {
        const res = await fetch(`${API_BASE}/resources`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, instances })
        });
        if (!res.ok) throw new Error('Failed to add resource');
        
        e.target.reset();
        showToast('Resource added successfully');
        fetchAll();
    } catch (error) {
        showToast('Error adding resource', 'error');
    }
}

async function handleDeleteResource(id) {
    try {
        const res = await fetch(`${API_BASE}/resources/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete resource');
        
        showToast('Resource deleted');
        fetchAll();
    } catch (error) {
        showToast('Error deleting resource', 'error');
    }
}

function renderResources() {
    const tbody = document.getElementById('resources-tbody');
    if (resources.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>No resources found</p>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = resources.map(r => `
        <tr>
            <td><span class="badge-id">R${r.id}</span></td>
            <td>${r.name}</td>
            <td><span class="badge-instance">${r.instances}</span></td>
            <td>
                <button class="btn-delete" onclick="handleDeleteResource(${r.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// Allocation Management
async function handleAddAllocation(e) {
    e.preventDefault();
    const process_id = parseInt(document.getElementById('alloc-process').value);
    const resource_id = parseInt(document.getElementById('alloc-resource').value);
    const amount = parseInt(document.getElementById('alloc-amount').value);

    try {
        const res = await fetch(`${API_BASE}/allocations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ process_id, resource_id, amount })
        });
        if (!res.ok) throw new Error('Failed to add allocation');
        
        e.target.reset();
        showToast('Allocation added successfully');
        fetchAll();
    } catch (error) {
        showToast('Error adding allocation', 'error');
    }
}

async function handleDeleteAllocation(id) {
    try {
        const res = await fetch(`${API_BASE}/allocations/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete allocation');
        
        showToast('Allocation deleted');
        fetchAll();
    } catch (error) {
        showToast('Error deleting allocation', 'error');
    }
}

function renderAllocations() {
    const tbody = document.getElementById('allocations-tbody');
    if (allocations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>No allocations found</p>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = allocations.map(a => {
        const p = processes.find(px => px.id == a.process_id) || {name: `P${a.process_id}`};
        const r = resources.find(rx => rx.id == a.resource_id) || {name: `R${a.resource_id}`};
        return `
        <tr>
            <td>${p.name}</td>
            <td>${r.name}</td>
            <td>${a.amount}</td>
            <td>
                <button class="btn-delete" onclick="handleDeleteAllocation(${a.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function populateAllocationDropdowns() {
    const pSelect = document.getElementById('alloc-process');
    const rSelect = document.getElementById('alloc-resource');
    
    pSelect.innerHTML = processes.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    rSelect.innerHTML = resources.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
}

// Request Management
async function handleAddRequest(e) {
    e.preventDefault();
    const process_id = parseInt(document.getElementById('req-process').value);
    const resource_id = parseInt(document.getElementById('req-resource').value);
    const amount = parseInt(document.getElementById('req-amount').value);

    try {
        const res = await fetch(`${API_BASE}/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ process_id, resource_id, amount })
        });
        if (!res.ok) throw new Error('Failed to add request');
        
        e.target.reset();
        showToast('Request added successfully');
        fetchAll();
    } catch (error) {
        showToast('Error adding request', 'error');
    }
}

async function handleDeleteRequest(id) {
    try {
        const res = await fetch(`${API_BASE}/requests/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete request');
        
        showToast('Request deleted');
        fetchAll();
    } catch (error) {
        showToast('Error deleting request', 'error');
    }
}

function renderRequests() {
    const tbody = document.getElementById('requests-tbody');
    if (requests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p>No requests found</p>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = requests.map(req => {
        const p = processes.find(px => px.id == req.process_id) || {name: `P${req.process_id}`};
        const r = resources.find(rx => rx.id == req.resource_id) || {name: `R${req.resource_id}`};
        return `
        <tr>
            <td>${p.name}</td>
            <td>${r.name}</td>
            <td>${req.amount}</td>
            <td>
                <button class="btn-delete" onclick="handleDeleteRequest(${req.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function populateRequestDropdowns() {
    const pSelect = document.getElementById('req-process');
    const rSelect = document.getElementById('req-resource');
    
    pSelect.innerHTML = processes.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    rSelect.innerHTML = resources.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
}

// Stats Update
function updateStats() {
    document.getElementById('stat-processes').textContent = processes.length;
    document.getElementById('stat-resources').textContent = resources.length;
    document.getElementById('stat-allocations').textContent = allocations.length;
    document.getElementById('stat-requests').textContent = requests.length;
}

// Tab Switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    document.getElementById(`tab-btn-${tabName}`).classList.add('active');
    document.getElementById(`panel-${tabName}`).classList.add('active');
}

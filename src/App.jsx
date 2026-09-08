import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [processes, setProcesses] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [processForm, setProcessForm] = useState({ name: '', priority: 'Medium' });
  const [resourceForm, setResourceForm] = useState({ name: '', instances: 1 });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const [nextProcessId, setNextProcessId] = useState(1);
  const [nextResourceId, setNextResourceId] = useState(1);

  useEffect(() => {
    let timer;
    if (toast.show) {
      timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const handleAddProcess = (e) => {
    e.preventDefault();
    if (!processForm.name.trim()) {
      showToast('Process name is required', 'error');
      return;
    }
    if (processes.some(p => p.name.toLowerCase() === processForm.name.trim().toLowerCase())) {
      showToast('Process name must be unique', 'error');
      return;
    }
    
    const newProcess = {
      id: `P${nextProcessId}`,
      name: processForm.name.trim(),
      priority: processForm.priority
    };
    
    setProcesses([...processes, newProcess]);
    setNextProcessId(nextProcessId + 1);
    setProcessForm({ name: '', priority: 'Medium' });
    showToast(`Process ${newProcess.id} created successfully`, 'success');
  };

  const handleAddResource = (e) => {
    e.preventDefault();
    if (!resourceForm.name.trim()) {
      showToast('Resource name is required', 'error');
      return;
    }
    if (resourceForm.instances < 1) {
      showToast('Instances must be at least 1', 'error');
      return;
    }
    if (resources.some(r => r.name.toLowerCase() === resourceForm.name.trim().toLowerCase())) {
      showToast('Resource name must be unique', 'error');
      return;
    }
    
    const newResource = {
      id: `R${nextResourceId}`,
      name: resourceForm.name.trim(),
      instances: parseInt(resourceForm.instances, 10)
    };
    
    setResources([...resources, newResource]);
    setNextResourceId(nextResourceId + 1);
    setResourceForm({ name: '', instances: 1 });
    showToast(`Resource ${newResource.id} created successfully`, 'success');
  };

  const handleDeleteProcess = (id) => {
    setProcesses(processes.filter(p => p.id !== id));
    showToast(`Process ${id} deleted`, 'success');
  };

  const handleDeleteResource = (id) => {
    setResources(resources.filter(r => r.id !== id));
    showToast(`Resource ${id} deleted`, 'success');
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0088ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
            <line x1="12" y1="22" x2="12" y2="15.5"></line>
            <polyline points="22 8.5 12 15.5 2 8.5"></polyline>
            <polyline points="2 15.5 12 8.5 22 15.5"></polyline>
            <line x1="12" y1="2" x2="12" y2="8.5"></line>
          </svg>
          <div>
            <h1 className="navbar-title">Resource Allocation Graph</h1>
            <p className="navbar-subtitle">Deadlock Detection & Recovery System</p>
          </div>
        </div>
      </nav>

      <div className="stats-bar">
        <div className="stat-pill">
          <span className="stat-dot"></span>
          Processes <span className="stat-value">{processes.length}</span>
        </div>
        <div className="stat-pill">
          <span className="stat-dot"></span>
          Resources <span className="stat-value">{resources.length}</span>
        </div>
      </div>

      <div className="content-area">
        <div className="cards-row">
          <div className="card">
            <div className="card-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <h2>Create Process</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddProcess}>
                <div className="form-group">
                  <label htmlFor="processName" className="form-label">Process Name</label>
                  <input
                    id="processName"
                    type="text"
                    className="form-input"
                    value={processForm.name}
                    onChange={(e) => setProcessForm({ ...processForm, name: e.target.value })}
                    placeholder="Enter process name"
                    aria-label="Process Name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="processPriority" className="form-label">Priority</label>
                  <select
                    id="processPriority"
                    className="form-select"
                    value={processForm.priority}
                    onChange={(e) => setProcessForm({ ...processForm, priority: e.target.value })}
                    aria-label="Process Priority"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Process
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <h2>Create Resource</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddResource}>
                <div className="form-group">
                  <label htmlFor="resourceName" className="form-label">Resource Name</label>
                  <input
                    id="resourceName"
                    type="text"
                    className="form-input"
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                    placeholder="Enter resource name"
                    aria-label="Resource Name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="resourceInstances" className="form-label">Number of Instances</label>
                  <input
                    id="resourceInstances"
                    type="number"
                    className="form-input"
                    value={resourceForm.instances}
                    onChange={(e) => setResourceForm({ ...resourceForm, instances: e.target.value })}
                    min="1"
                    max="99"
                    aria-label="Number of Instances"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Resource
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="tables-section">
          <h2 className="section-title">Active Elements</h2>
          
          <div className="cards-row">
            <div className="table-container">
              <h3 className="table-title">Processes</h3>
              {processes.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '10px' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p>No processes created yet</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map(process => (
                      <tr key={process.id} className="table-row">
                        <td><span className="badge">{process.id}</span></td>
                        <td>{process.name}</td>
                        <td><span className={`priority-${process.priority.toLowerCase()}`}>{process.priority}</span></td>
                        <td>
                          <button type="button" className="delete-btn" onClick={() => handleDeleteProcess(process.id)} aria-label="Delete Process">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="table-container">
              <h3 className="table-title">Resources</h3>
              {resources.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: '10px' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p>No resources created yet</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Instances</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(resource => (
                      <tr key={resource.id} className="table-row">
                        <td><span className="badge">{resource.id}</span></td>
                        <td>{resource.name}</td>
                        <td><span className="instances-badge">{resource.instances}</span></td>
                        <td>
                          <button type="button" className="delete-btn" onClick={() => handleDeleteResource(resource.id)} aria-label="Delete Resource">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className={`toast-notification ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;

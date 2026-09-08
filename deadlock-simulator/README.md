# Deadlock Simulator

A deadlock detection and recovery system using Resource Allocation Graphs (RAG).
Built with a **Flask** REST API backend and a static **HTML/CSS/JS** frontend.

## Project Structure

```
deadlock-simulator/
├── backend/
│   ├── app.py                  # Flask application & API routes
│   ├── models.py               # SQLAlchemy models (Process, ResourceType, Allocation, Request)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── graph.py            # RAG/WFG construction & cycle detection (stub)
│   │   └── recovery.py         # Deadlock recovery strategies (stub)
│   ├── requirements.txt
│   └── database.db             # SQLite database (auto-created on first run)
├── frontend/
│   ├── index.html              # Main UI
│   └── static/
│       ├── css/style.css       # Dark-themed design system
│       └── js/main.js          # API calls & DOM rendering
└── README.md
```

## Prerequisites

- **Python 3.9+**
- **pip** (Python package manager)
- A modern web browser

## Setup & Run

### 1. Backend

```bash
cd deadlock-simulator/backend

# Create a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

The API server starts at **http://localhost:5000**.

### 2. Frontend

Open `frontend/index.html` directly in your browser, or serve it with any static file server:

```bash
cd deadlock-simulator/frontend

# Option A: Python's built-in server
python -m http.server 8080

# Then open http://localhost:8080 in your browser
```

> **Note**: The frontend calls the Flask API at `http://localhost:5000/api`.
> CORS is enabled on the backend, so cross-origin requests from the frontend work out of the box.

## API Endpoints

| Method   | Endpoint               | Description                          |
| -------- | ---------------------- | ------------------------------------ |
| `GET`    | `/api/health`          | Health check                         |
| `GET`    | `/api/state`           | Full system state (all entities)     |
| `GET`    | `/api/processes`       | List all processes                   |
| `POST`   | `/api/processes`       | Create a process `{name, priority}`  |
| `DELETE` | `/api/processes/<id>`  | Delete a process                     |
| `GET`    | `/api/resources`       | List all resource types              |
| `POST`   | `/api/resources`       | Create a resource `{name, instances}`|
| `DELETE` | `/api/resources/<id>`  | Delete a resource                    |
| `GET`    | `/api/allocations`     | List all allocations                 |
| `POST`   | `/api/allocations`     | Create allocation `{process_id, resource_id, amount}` |
| `DELETE` | `/api/allocations/<id>`| Delete an allocation                 |
| `GET`    | `/api/requests`        | List all requests                    |
| `POST`   | `/api/requests`        | Create request `{process_id, resource_id, amount}` |
| `DELETE` | `/api/requests/<id>`   | Delete a request                     |

## Data Models

- **Process**: `id`, `name` (unique), `priority` (Low/Medium/High/Critical)
- **ResourceType**: `id`, `name` (unique), `instances` (number of available units)
- **Allocation**: `process_id`, `resource_id`, `amount` — represents a process **holding** a resource
- **Request**: `process_id`, `resource_id`, `amount` — represents a process **waiting for** a resource

## Next Steps

- Implement RAG/WFG graph construction in `core/graph.py`
- Implement cycle detection (DFS-based) for deadlock identification
- Add recovery strategies in `core/recovery.py` (termination, preemption, rollback)
- Add graph visualization to the frontend (e.g., Cytoscape.js or D3.js)

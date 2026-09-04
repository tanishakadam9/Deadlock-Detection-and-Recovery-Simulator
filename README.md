Project Structure
deadlock-simulator/
│
├── app.py
├── requirements.txt
│
├── backend/
│   ├── simulation.py
│   ├── rag.py
│   ├── wait_for_graph.py
│   ├── detection.py
│   ├── recovery.py
│   ├── metrics.py
│   └── ai_prediction.py
│
├── models/
│   └── deadlock_model.pkl
│
├── database/
│   └── simulator.db
│
├── templates/
│   └── index.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── rag.js
│       ├── charts.js
│       └── dashboard.js
│
└── README.md

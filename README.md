# 💡 LumiGuard /ˈluː.mi.ɡɑːrd/

**LumiGuard** is a real-time monitoring and management platform for industrial tower lights and OEE (Overall Equipment Effectiveness) performance calculation. Built with **ESP32** microcontrollers, it communicates via **MQTT (EMQX broker)** and features a powerful backend with **Node.js** and a modern frontend using **React (Vite + TypeScript)**.

> **LumiGuard** - Illuminating your production efficiency with intelligent monitoring.  
> A smart, scalable solution for tracking equipment status and calculating OEE metrics.

---

## ⚙️ Prerequisites

-   **Node.js (v18+)**
-   **EMQX Broker (MQTT)**
-   **Redis**
-   **PostgreSQL**

---

## 📦 Tech Stack

### 🔌 IoT & Communication
-   **ESP32** microcontrollers
-   **MQTT protocol** via **EMQX** broker
-   **Industrial tower lights** integration

### 🛠️ Backend
-   **Node.js** + **Express.js**
-   **Knex.js** (SQL query builder)
-   **PostgreSQL** (relational database)
-   **Socket.IO** (WebSocket for real-time data)
-   **Redis** (caching & fast data access)

### 💻 Frontend
-   **React** (Vite + TypeScript)
-   **TailwindCSS** + **ShadCN UI**
-   **Socket.IO Client** for real-time updates

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/lumiguard.git
cd lumiguard
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables

Edit the environment configuration file `.env` under the `backend/` path:

```env
# --- Server ---
PORT=3000                        # App/server port

# --- Database ---
DB_CLIENT=pg                     # DB driver: pg (PostgreSQL)
DB_HOST=localhost                # DB server address
DB_USER=yourusername             # DB username
DB_PASSWORD=yourpassword         # DB password
DB_NAME=lumiguard_db             # DB name
DB_PORT=5432                     # DB port (PostgreSQL default: 5432)

# --- MQTT Broker ---
MQTT_BROKER=mqtt://localhost:1883  # Broker URL (e.g. EMQX, Mosquitto)
MQTT_TOPIC=lumiguard/tower-light   # Topic to publish/subscribe
MQTT_QOS=1                         # QoS level: 0, 1, or 2
```

---

### 4. Setup the Database

Run the following commands to apply migrations and seed initial data:

```bash
npx knex migrate:latest --knexfile ./database/knexConfig.js
npx knex seed:run --knexfile ./database/knexConfig.js
```

---

### 5. Run the Application

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend
```bash
cd ../frontend
npm run dev
```

Open your browser and go to `http://localhost:5173` to access the monitoring dashboard.

---

## ✨ Features

-   💡 Real-time tower light status monitoring
-   📊 OEE (Overall Equipment Effectiveness) calculation
-   📈 Equipment availability tracking
-   🔧 MQTT-based device communication (EMQX)
-   ⏱️ Downtime logging and analysis
-   🗃️ Historical data storage (PostgreSQL)
-   🔌 Fast WebSocket communication with Socket.IO
-   📱 Ready for industrial & scalable deployment

---

## 📊 OEE & Availability

LumiGuard calculates key production metrics:

### OEE (Overall Equipment Effectiveness)
Measures overall equipment performance combining availability, performance, and quality factors.

**OEE = Availability × Performance × Quality**

### Availability
Tracks the percentage of planned production time that equipment is actually operating.

**Availability = (Operating Time / Planned Production Time) × 100%**

Example: Machine scheduled for 8 hours, downtime 1 hour → Availability = 87.5%

---

## 🗂 Project Structure

```
lumiguard/
├── backend/          # API, MQTT client, database handlers
│   ├── index.js
│   ├── routes/
│   ├── mqtt/
│   ├── database/
│   └── ...
├── frontend/         # Web UI (React + Vite)
│   ├── src/
│   ├── public/
│   └── ...
├── README.md
```

---

## 📷 Screenshots

> ASAP

---

## 📃 License

This project is licensed under the **MIT License**.  
Feel free to use, modify, and distribute as needed.

---

## 🤝 Contribution

Contributions are welcome!  
Feel free to open issues, fork the repo, and submit pull requests.

---

## 📬 Contact

For questions or support, please open an issue or contact [debugmeAI](https://github.com/debugmeAI)

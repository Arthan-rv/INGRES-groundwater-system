# INGRES — Groundwater Monitoring System

## 🧠 About

INGRES (Integrated Groundwater Resource Information System) is a comprehensive groundwater data management and monitoring platform designed for **Tamil Nadu**.  
It provides a centralized system to **collect, analyze, visualize, and explore groundwater availability and quality** using interactive dashboards, maps, and a multilingual chatbot.

The system consists of:
- A **Node.js + Express backend** for data processing and APIs
- A **React (Vite) frontend** for visualization and user interaction
- Structured groundwater datasets representing all 38 districts of Tamil Nadu

> ⚠️ **Note**  
> This project is a **prototype / academic system** built for learning and demonstration purposes.  
> It uses curated datasets to simulate real-world groundwater monitoring and does **not** represent live government infrastructure.

### Key Features
- 📊 Real-time-style groundwater monitoring across **all 38 Tamil Nadu districts**
- 💬 Multilingual chatbot (English, Tamil, Hindi, Telugu)
- 🗺️ Interactive map visualization with risk indicators
- 📈 Comprehensive water quality analysis (TDS, Fluoride, Nitrate, etc.)
- 🔐 Role-based access control (Admin, Staff, Common User, Guest)
- 📱 Responsive dashboard interface

---

## 🚀 Quick Start

### Prerequisites
- Node.js **v16 or higher**
- npm or yarn

---

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

---

### 2. Configure Environment Variables (Optional)

Defaults are provided, so configuration is optional for local development.

#### Backend
```bash
cd backend
PORT=4000
NODE_ENV=development
```

#### Frontend
```bash
cd frontend
VITE_API_BASE_URL=http://localhost:4000
```

---

### 3. Start the Backend Server

```bash
cd backend
npm run dev
```

Backend runs at:
```
http://localhost:4000
```

#### Available API Endpoints
- `GET /health` — Health check
- `POST /api/auth/login` — User login
- `POST /api/auth/guest` — Guest access
- `GET /api/data/overview` — Dashboard summary
- `GET /api/data/groundwater` — Groundwater records
- `GET /api/data/map` — Map visualization data
- `POST /api/chatbot` — Chatbot queries
- `POST /api/admin/upload-csv` — CSV upload (Admin only)

---

### 4. Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend runs at:
```
http://localhost:5173
```

---

## 📋 Default Login Credentials

> ⚠️ **For demonstration purposes only**

| Role | Email | Password | Access Level |
|------|------|----------|--------------|
| Admin | admin@ingres.gov | Admin@123 | Full system access, CSV upload |
| Staff | staff@ingres.gov | Staff@123 | Monitoring & limited operations |
| Common User | observer@ingres.gov | User@123 | Dashboard view & chatbot |
| Guest | — | — | Chat-only access |

---

## 📊 Data Structure

The system uses structured groundwater datasets covering **all 38 Tamil Nadu districts**.

### Water Quality Parameters
- TDS (Total Dissolved Solids)
- pH, Electrical Conductivity
- Hardness, Alkalinity
- Nitrate, Fluoride, Chloride, Sulfate
- Iron, Arsenic

### Well Information
- Well Type (Borewell, Open Well, Tube Well)
- Usage Type (Domestic, Agricultural, Industrial)
- Ownership (Government, Community, Private)
- Water Source (Unconfined / Confined / Fractured Rock Aquifer)
- Water Quality Grade (A / B / C / D)
- Suitability (Drinking, Irrigation)

### Location & Status
- Geographic coordinates (Latitude / Longitude)
- District, Region, Aquifer
- Water level, depth, yield
- Contamination risk, recharge trend
- Last inspection date

---

## 💬 Chatbot Features

The chatbot supports queries in **English, Tamil, Hindi, and Telugu**.

### Example Queries
- “Show me TDS levels”
- “Which wells are safe for drinking?”
- “Fluoride contamination in Madurai”
- “High risk areas”

---

## 🗺️ Map Features

- Visualization of wells across Tamil Nadu
- Risk-based color coding (Red / Yellow / Green)
- District-level filtering
- Detailed well information popups

---

## 📁 Project Structure

```
INGRES/
├── backend/
├── frontend/
└── README.md
```

---

## 🔮 Future Enhancements

- Real-time IoT sensor integration
- PostgreSQL / PostGIS migration
- Predictive groundwater analytics
- Cloud deployment

---

## 📄 License

This project is an **academic prototype** intended for learning and demonstration purposes only.

---

## 🙏 Acknowledgments

- Tamil Nadu Water Supply & Drainage Board
- State Groundwater Authority
- Tamil Nadu Pollution Control Board
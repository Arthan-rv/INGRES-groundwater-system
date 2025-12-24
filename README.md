# INGRES — Groundwater Monitoring System

## 🧠 About
INGRES is a comprehensive groundwater data management and monitoring system for Tamil Nadu.  
It includes a Node.js + Express backend and a React (Vite) frontend with multilingual chatbot support.

**Features:**
- 📊 Real-time groundwater data monitoring across all 38 Tamil Nadu districts
- 💬 Multilingual chatbot (English, Tamil, Hindi, Telugu)
- 🗺️ Interactive map visualization
- 📈 Comprehensive water quality analysis (TDS, Fluoride, Nitrate, etc.)
- 🔐 Role-based access (Admin, Staff, Common User, Guest)
- 📱 Responsive dashboard interface

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (optional - defaults are provided):
```bash
cd backend
# Create .env file if needed (optional)
# PORT=4000
# NODE_ENV=development
```

**Frontend** (optional):
```bash
cd frontend
# Create .env file if needed (optional)
# VITE_API_BASE_URL=http://localhost:4000
```

### 3. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:4000`

**Available endpoints:**
- `GET /health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/guest` - Guest access
- `GET /api/data/overview` - Dashboard overview
- `GET /api/data/groundwater` - All groundwater records
- `GET /api/data/map` - Map data
- `POST /api/chatbot` - Chatbot query
- `POST /api/admin/upload-csv` - CSV upload (Admin only)

### 4. Start the Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

---

## 📋 Default Login Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@ingres.gov | Admin@123 | Full system access, CSV upload |
| **Staff** | staff@ingres.gov | Staff@123 | Monitoring & limited edits |
| **Common User** | observer@ingres.gov | User@123 | Chat & view summary |
| **Guest** | - | - | Chat-only access (click "Continue as Guest") |

---

## 📊 Data Structure

The system uses comprehensive groundwater data covering all 38 Tamil Nadu districts with enhanced attributes:

**Water Quality Parameters:**
- TDS (Total Dissolved Solids)
- pH, Conductivity
- Hardness, Alkalinity
- Nitrate, Fluoride, Chloride, Sulfate
- Iron, Arsenic

**Well Information:**
- Well Type (Borewell, Open Well, Tube Well)
- Usage Type (Domestic, Agricultural, Industrial)
- Ownership (Government, Community, Private)
- Water Source (Unconfined/Confined/Fractured Rock Aquifer)
- Water Quality Grade (A/B/C/D)
- Suitability (Drinking, Irrigation)

**Location & Status:**
- Coordinates (lat/lon)
- District, Region, Aquifer
- Water Level, Depth, Yield
- Contamination Risk, Recharge Trend
- Last Inspection Date

---

## 💬 Chatbot Features

The chatbot supports queries in **English, Tamil, Hindi, and Telugu**:

**Example Queries:**
- "Show me TDS levels"
- "Which wells are safe for drinking?"
- "Fluoride contamination in Madurai"
- "Nitrate levels"
- "Irrigation suitability"
- "Give me an overview"
- "High risk areas"
- "Contact support"

**Supported Topics:**
- TDS/Water Quality
- pH Levels
- Well Yields
- Water Levels
- Risk Assessment
- District Data
- Specific Wells
- Contact Support
- Fluoride Analysis
- Nitrate Analysis
- Drinking Water Suitability
- Irrigation Suitability

---

## 🗺️ Map Features

The interactive map displays:
- All wells across Tamil Nadu
- Color-coded markers by risk level:
  - 🔴 Red: High Risk
  - 🟡 Yellow: Moderate Risk
  - 🟢 Green: Low Risk
- Filter by risk level
- District-wise statistics
- Detailed popup information with enhanced attributes

---

## 📁 Project Structure

```
INGRES/
├── backend/
│   ├── src/
│   │   └── server.js          # Main backend server
│   ├── data/
│   │   ├── groundwaterData.json    # Comprehensive dataset (200+ wells)
│   │   ├── sample_groundwater.csv  # CSV data source
│   │   └── sampleWells.json        # Additional well data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React contexts (Auth, Theme)
│   │   ├── services/        # API services
│   │   └── styles/          # CSS files
│   └── package.json
└── README.md
```

---

## 🔧 Development Commands

**Backend:**
```bash
cd backend
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

**Frontend:**
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 📝 Data Management

**Adding New Data:**
1. **Via CSV Upload (Admin):**
   - Login as Admin
   - Go to Admin Dashboard
   - Upload CSV file with required columns

2. **Via JSON File:**
   - Edit `backend/data/groundwaterData.json`
   - Restart backend server

**CSV Format:**
The CSV should include columns: `site_id`, `name`, `lat`, `lon`, `district`, `state`, `region`, `aquifer`, `survey_date`, `depth_m`, `static_water_level_m`, `yield_lph`, `tds`, `pH`, `conductivity`, `hardness`, `alkalinity`, `nitrate`, `fluoride`, `chloride`, `sulfate`, `iron`, `arsenic`, `contaminationRisk`, `rechargeTrend`, `status`, `wellType`, `usageType`, `ownership`, `waterSource`, `waterQualityGrade`, `suitableForDrinking`, `suitableForIrrigation`, `nearbyLandUse`, `seasonalVariation`, `infrastructure`, `notes`

---

## 🌐 API Documentation

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/guest` - Get guest access token
- `POST /api/auth/logout` - Logout (requires auth token)
- `GET /api/auth/me` - Get current user info

### Data Endpoints
- `GET /api/data/overview` - Dashboard statistics
- `GET /api/data/groundwater` - All groundwater records
- `GET /api/data/well/:id` - Single well details
- `GET /api/data/district/:district` - Wells by district
- `GET /api/data/region/:region` - Wells by region
- `GET /api/data/map` - Map data with statistics
- `GET /api/data/contacts` - Municipality contacts

### Chatbot
- `POST /api/chatbot` - Send message to chatbot
  ```json
  {
    "message": "Show me TDS levels",
    "language": "en" // optional: en, ta, hi, te
  }
  ```

### Admin Endpoints (Admin only)
- `POST /api/admin/reload-data` - Reload data from files
- `POST /api/admin/upload-csv` - Upload CSV file (multipart/form-data)

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 4000 is available
- Verify Node.js version (v16+)
- Run `npm install` in backend directory

**Frontend won't start:**
- Check if backend is running
- Verify API URL in `.env` file
- Clear browser cache

**Map not loading:**
- Check browser console for errors
- Verify Leaflet CDN is accessible
- Check if wells data is loaded

**Chatbot not responding:**
- Verify backend is running
- Check authentication token
- Review browser console for errors

---

## 📞 Support Contacts

The system includes contact information for all 38 Tamil Nadu districts and state-level helplines. Access via chatbot: "Show contact support" or "Contact [District Name]"

---

## 📄 License

This is a prototype system for demonstration purposes.

---

## 🙏 Acknowledgments

- Tamil Nadu Water Supply & Drainage Board
- State Groundwater Authority
- TN Pollution Control Board

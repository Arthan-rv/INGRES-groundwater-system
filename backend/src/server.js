const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');



// Configuration
const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'ingres-default-secret-change-in-production',
  sessionExpiryHours: parseInt(process.env.SESSION_EXPIRY_HOURS) || 24
};

// File paths
const DATA_FILE = path.join(__dirname, '..', 'data', 'groundwaterData.json');
const WELLS_FILE = path.join(__dirname, '..', 'data', 'sampleWells.json');
const CSV_FILE = path.join(__dirname, '..', 'data', 'sample_groundwater.csv');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny')); // Log every request

// ⏱️ Rate limiting: 60 requests per minute per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}));


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel'];
    if (allowed.includes(file.mimetype) || /\.csv$/i.test(file.originalname)) cb(null, true);
    else cb(new Error('Only CSV files allowed'));
  }
});


// User configuration
const users = [
  {
    id: 'admin-001',
    name: process.env.ADMIN_NAME || 'INGRES Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@ingres.gov',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
    tagline: 'Full system access'
  },
  {
    id: 'staff-014',
    name: process.env.STAFF_NAME || 'Hydro Staff Desk',
    email: process.env.STAFF_EMAIL || 'staff@ingres.gov',
    password: process.env.STAFF_PASSWORD || 'Staff@123',
    role: 'staff',
    tagline: 'Monitoring & limited edits'
  },
  {
    id: 'user-101',
    name: process.env.USER_NAME || 'Field Observer',
    email: process.env.USER_EMAIL || 'observer@ingres.gov',
    password: process.env.USER_PASSWORD || 'User@123',
    role: 'common',
    tagline: 'Read-only conversational access'
  }
];

const sessions = new Map();

// ==================== MUNICIPALITY CONTACT DATA ====================
const municipalityContacts = {
  'Chennai': { phone: '044-2538-4520', email: 'ccmc@tn.gov.in', helpline: '1913', office: 'Greater Chennai Corporation' },
  'Coimbatore': { phone: '0422-239-0261', email: 'coimbatore.corp@tn.gov.in', helpline: '0422-2301100', office: 'Coimbatore City Municipal Corporation' },
  'Madurai': { phone: '0452-253-1212', email: 'madurai.corp@tn.gov.in', helpline: '0452-2531234', office: 'Madurai City Municipal Corporation' },
  'Tiruchirappalli': { phone: '0431-246-0525', email: 'trichy.corp@tn.gov.in', helpline: '0431-2460500', office: 'Tiruchirappalli City Corporation' },
  'Salem': { phone: '0427-231-5566', email: 'salem.corp@tn.gov.in', helpline: '0427-2315500', office: 'Salem City Municipal Corporation' },
  'Tiruppur': { phone: '0421-222-0222', email: 'tiruppur.corp@tn.gov.in', helpline: '0421-2220200', office: 'Tiruppur City Municipal Corporation' },
  'Erode': { phone: '0424-225-6666', email: 'erode.muni@tn.gov.in', helpline: '0424-2256600', office: 'Erode Municipal Corporation' },
  'Vellore': { phone: '0416-222-1234', email: 'vellore.corp@tn.gov.in', helpline: '0416-2221200', office: 'Vellore City Municipal Corporation' },
  'Thanjavur': { phone: '04362-231-555', email: 'thanjavur.muni@tn.gov.in', helpline: '04362-231500', office: 'Thanjavur Municipal Corporation' },
  'Dindigul': { phone: '0451-243-0123', email: 'dindigul.muni@tn.gov.in', helpline: '0451-2430100', office: 'Dindigul Municipal Corporation' },
  'Tirunelveli': { phone: '0462-250-1234', email: 'tirunelveli.corp@tn.gov.in', helpline: '0462-2501200', office: 'Tirunelveli City Municipal Corporation' },
  'Kanyakumari': { phone: '04652-247-123', email: 'kanyakumari.muni@tn.gov.in', helpline: '04652-247100', office: 'Nagercoil Municipality' },
  'Thoothukudi': { phone: '0461-232-1234', email: 'tuticorin.corp@tn.gov.in', helpline: '0461-2321200', office: 'Thoothukudi Corporation' },
  'Nagapattinam': { phone: '04365-242-123', email: 'nagapattinam.muni@tn.gov.in', helpline: '04365-242100', office: 'Nagapattinam Municipality' },
  'Cuddalore': { phone: '04142-236-123', email: 'cuddalore.muni@tn.gov.in', helpline: '04142-236100', office: 'Cuddalore Municipality' },
  'Karur': { phone: '04324-241-123', email: 'karur.muni@tn.gov.in', helpline: '04324-241100', office: 'Karur Municipality' },
  'Namakkal': { phone: '04286-222-123', email: 'namakkal.muni@tn.gov.in', helpline: '04286-222100', office: 'Namakkal Municipality' },
  'Theni': { phone: '04546-252-123', email: 'theni.muni@tn.gov.in', helpline: '04546-252100', office: 'Theni Municipality' },
  'Nilgiris': { phone: '0423-244-2233', email: 'ooty.muni@tn.gov.in', helpline: '0423-2442200', office: 'Udhagamandalam Municipality' },
  'Krishnagiri': { phone: '04343-232-123', email: 'krishnagiri.muni@tn.gov.in', helpline: '04343-232100', office: 'Krishnagiri Municipality' },
  'Dharmapuri': { phone: '04342-230-123', email: 'dharmapuri.muni@tn.gov.in', helpline: '04342-230100', office: 'Dharmapuri Municipality' },
  'Villupuram': { phone: '04146-222-123', email: 'villupuram.muni@tn.gov.in', helpline: '04146-222100', office: 'Villupuram Municipality' },
  'Ramanathapuram': { phone: '04567-220-123', email: 'ramanathapuram.muni@tn.gov.in', helpline: '04567-220100', office: 'Ramanathapuram Municipality' },
  'Sivaganga': { phone: '04575-241-123', email: 'sivaganga.muni@tn.gov.in', helpline: '04575-241100', office: 'Sivaganga Municipality' },
  'Virudhunagar': { phone: '04562-243-123', email: 'virudhunagar.muni@tn.gov.in', helpline: '04562-243100', office: 'Virudhunagar Municipality' },
  'Ariyalur': { phone: '04329-222-123', email: 'ariyalur.muni@tn.gov.in', helpline: '04329-222100', office: 'Ariyalur Municipality' },
  'Perambalur': { phone: '04328-222-123', email: 'perambalur.muni@tn.gov.in', helpline: '04328-222100', office: 'Perambalur Municipality' },
  'Pudukkottai': { phone: '04322-220-123', email: 'pudukkottai.muni@tn.gov.in', helpline: '04322-220100', office: 'Pudukkottai Municipality' },
  'Thiruvarur': { phone: '04366-220-123', email: 'thiruvarur.muni@tn.gov.in', helpline: '04366-220100', office: 'Thiruvarur Municipality' },
  'Tiruvannamalai': { phone: '04175-222-123', email: 'tiruvannamalai.muni@tn.gov.in', helpline: '04175-222100', office: 'Tiruvannamalai Municipality' },
  'Kancheepuram': { phone: '044-2722-2123', email: 'kancheepuram.muni@tn.gov.in', helpline: '044-27222100', office: 'Kancheepuram Municipality' },
  'Chengalpattu': { phone: '044-2742-2123', email: 'chengalpattu.muni@tn.gov.in', helpline: '044-27422100', office: 'Chengalpattu Municipality' },
  'Tiruvallur': { phone: '044-2766-2123', email: 'tiruvallur.muni@tn.gov.in', helpline: '044-27662100', office: 'Tiruvallur Municipality' },
  'Ranipet': { phone: '04172-222-123', email: 'ranipet.muni@tn.gov.in', helpline: '04172-222100', office: 'Ranipet Municipality' },
  'Tirupattur': { phone: '04179-222-123', email: 'tirupattur.muni@tn.gov.in', helpline: '04179-222100', office: 'Tirupattur Municipality' },
  'Kallakurichi': { phone: '04151-222-123', email: 'kallakurichi.muni@tn.gov.in', helpline: '04151-222100', office: 'Kallakurichi Municipality' },
  'Tenkasi': { phone: '04633-222-123', email: 'tenkasi.muni@tn.gov.in', helpline: '04633-222100', office: 'Tenkasi Municipality' },
  'Mayiladuthurai': { phone: '04364-222-123', email: 'mayiladuthurai.muni@tn.gov.in', helpline: '04364-222100', office: 'Mayiladuthurai Municipality' }
};

// State-level emergency contacts
const stateContacts = {
  tnWaterBoard: { name: 'TN Water Supply & Drainage Board', phone: '044-2536-0855', helpline: '1916' },
  groundwaterAuth: { name: 'State Groundwater Authority', phone: '044-2567-8900', email: 'sgwa@tn.gov.in' },
  pollutionBoard: { name: 'TN Pollution Control Board', phone: '044-2235-1788', helpline: '1800-425-5665' },
  disasterMgmt: { name: 'State Disaster Management', phone: '044-2852-1204', helpline: '1070' }
};

// Get municipality contact for a district
const getMunicipalityContact = (district) => {
  return municipalityContacts[district] || {
    phone: '1916',
    email: 'water.tn.gov.in',
    helpline: '1916',
    office: 'District Water Supply Office'
  };
};

// ==================== MULTILINGUAL SUPPORT ====================
const translations = {
  en: {
    greeting: "Hey there! 👋 I'm your INGRES groundwater assistant.",
    dataLoaded: "Got data on {count} wells across Tamil Nadu.",
    askAbout: "What would you like to know?",
    notSure: "I'm not quite sure what you're asking about.",
    tryAsking: "Try asking about TDS, water quality, specific wells, or districts.",
    thanks: "You're welcome! Happy to help. Anything else?",
    help: "I can help you with:",
    helpTopics: ["TDS/Water Quality", "pH Levels", "Well Yields", "Water Levels", "Risk Assessment", "District Data", "Specific Wells", "Contact Support"],
    contactSupport: "Contact Support",
    municipalityInfo: "Municipality Contact",
    stateHelplines: "State Helplines"
  },
  ta: {
    greeting: "வணக்கம்! 👋 நான் உங்கள் INGRES நிலத்தடி நீர் உதவியாளர்.",
    dataLoaded: "தமிழ்நாடு முழுவதும் {count} கிணறுகளின் தரவு உள்ளது.",
    askAbout: "என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?",
    notSure: "நீங்கள் என்ன கேட்கிறீர்கள் என்று எனக்கு உறுதியாக தெரியவில்லை.",
    tryAsking: "TDS, நீர் தரம், குறிப்பிட்ட கிணறுகள் அல்லது மாவட்டங்களைப் பற்றி கேளுங்கள்.",
    thanks: "நன்றி! உதவ மகிழ்ச்சி. வேறு ஏதாவது?",
    help: "நான் உதவ முடியும்:",
    helpTopics: ["TDS/நீர் தரம்", "pH அளவுகள்", "கிணறு விளைச்சல்", "நீர் மட்டங்கள்", "ஆபத்து மதிப்பீடு", "மாவட்ட தரவு", "குறிப்பிட்ட கிணறுகள்", "தொடர்பு ஆதரவு"],
    contactSupport: "தொடர்பு ஆதரவு",
    municipalityInfo: "நகராட்சி தொடர்பு",
    stateHelplines: "மாநில உதவி எண்கள்"
  },
  hi: {
    greeting: "नमस्ते! 👋 मैं आपका INGRES भूजल सहायक हूं।",
    dataLoaded: "तमिलनाडु में {count} कुओं का डेटा है।",
    askAbout: "आप क्या जानना चाहते हैं?",
    notSure: "मुझे समझ नहीं आया आप क्या पूछ रहे हैं।",
    tryAsking: "TDS, जल गुणवत्ता, विशिष्ट कुओं या जिलों के बारे में पूछें।",
    thanks: "आपका स्वागत है! मदद करके खुशी हुई। कुछ और?",
    help: "मैं मदद कर सकता हूं:",
    helpTopics: ["TDS/जल गुणवत्ता", "pH स्तर", "कुआं उपज", "जल स्तर", "जोखिम मूल्यांकन", "जिला डेटा", "विशिष्ट कुएं", "संपर्क सहायता"],
    contactSupport: "संपर्क सहायता",
    municipalityInfo: "नगर पालिका संपर्क",
    stateHelplines: "राज्य हेल्पलाइन"
  },
  te: {
    greeting: "నమస్కారం! 👋 నేను మీ INGRES భూగర్భజల సహాయకుడిని.",
    dataLoaded: "తమిళనాడు అంతటా {count} బావుల డేటా ఉంది.",
    askAbout: "మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
    notSure: "మీరు ఏమి అడుగుతున్నారో నాకు అర్థం కాలేదు.",
    tryAsking: "TDS, నీటి నాణ్యత, నిర్దిష్ట బావులు లేదా జిల్లాల గురించి అడగండి.",
    thanks: "స్వాగతం! సహాయం చేయడం సంతోషం. మరేదైనా?",
    help: "నేను సహాయం చేయగలను:",
    helpTopics: ["TDS/నీటి నాణ్యత", "pH స్థాయిలు", "బావి దిగుబడి", "నీటి స్థాయిలు", "ప్రమాద అంచనా", "జిల్లా డేటా", "నిర్దిష్ట బావులు", "సంప్రదింపు మద్దతు"],
    contactSupport: "సంప్రదింపు మద్దతు",
    municipalityInfo: "మున్సిపాలిటీ సంప్రదింపు",
    stateHelplines: "రాష్ట్ర హెల్ప్‌లైన్‌లు"
  }
};

// Language detection from message
const detectLanguage = (message) => {
  const tamilChars = /[\u0B80-\u0BFF]/;
  const hindiChars = /[\u0900-\u097F]/;
  const teluguChars = /[\u0C00-\u0C7F]/;
  
  if (tamilChars.test(message)) return 'ta';
  if (hindiChars.test(message)) return 'hi';
  if (teluguChars.test(message)) return 'te';
  return 'en';
};

// Get translation with variable substitution
const t = (lang, key, vars = {}) => {
  const template = translations[lang]?.[key] || translations.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '');
};

// ==================== DATA LOADING ====================

const loadFromCSV = () => {
  try {
    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const rows = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    return rows.map((row) => {
      const tds = Number(row.tds || row.tdsLevel || 0);
      let risk = row.contaminationRisk || 'Low';
      if (!risk || risk === 'Low' || risk === 'Moderate' || risk === 'High') {
        if (tds >= 600) risk = 'High';
        else if (tds >= 500) risk = 'Moderate';
        else risk = 'Low';
      }
      
      const yieldLph = Number(row.yield_lph || row.yieldLph || 0);
      let trend = row.rechargeTrend || 'Stable';
      if (!trend || trend === 'Stable' || trend === 'Rising' || trend === 'Declining') {
        if (yieldLph < 1000) trend = 'Declining';
        else if (yieldLph > 1800) trend = 'Rising';
        else trend = 'Stable';
      }
      
      // Calculate water quality grade if not provided
      let grade = row.waterQualityGrade;
      if (!grade) {
        const nitrate = Number(row.nitrate || 0);
        const fluoride = Number(row.fluoride || 0);
        if (tds < 400 && nitrate < 40 && fluoride < 0.8) grade = 'A';
        else if (tds < 500 && nitrate < 50) grade = 'B';
        else if (tds < 600) grade = 'C';
        else grade = 'D';
      }
      
      // Determine suitability
      const nitrate = Number(row.nitrate || 0);
      const fluoride = Number(row.fluoride || 0);
      const arsenic = Number(row.arsenic || 0);
      const suitableDrinking = row.suitableForDrinking !== undefined ? 
        (row.suitableForDrinking === 'true' || row.suitableForDrinking === true) :
        (tds < 500 && nitrate < 45 && fluoride < 1.0 && arsenic < 0.01);
      const suitableIrrigation = row.suitableForIrrigation !== undefined ?
        (row.suitableForIrrigation === 'true' || row.suitableForIrrigation === true) :
        (tds < 900);
      
      return {
        id: row.site_id || row.id || `SITE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: row.name || 'Unknown Well',
        region: row.region || row.district || 'Unknown Region',
        district: row.district || 'Unknown',
        state: row.state || 'Tamil Nadu',
        lat: Number(row.lat || 0),
        lon: Number(row.lon || 0),
        aquifer: row.aquifer || `${row.district || 'Unknown'} Basin`,
        tdsLevel: tds,
        pH: Number(row.pH || row.ph || 7.0),
        conductivity: Number(row.conductivity || tds * 1.8),
        hardness: Number(row.hardness || 0),
        alkalinity: Number(row.alkalinity || 0),
        nitrate: nitrate,
        fluoride: Number(row.fluoride || 0),
        chloride: Number(row.chloride || 0),
        sulfate: Number(row.sulfate || 0),
        iron: Number(row.iron || 0),
        arsenic: arsenic,
        contaminationRisk: risk,
        waterLevelMeters: Number(row.static_water_level_m || row.waterLevelMeters || row.depth_m || 0),
        depthMeters: Number(row.depth_m || row.depthMeters || 0),
        yieldLph: yieldLph,
        rechargeTrend: trend,
        status: row.status || 'active',
        lastInspection: row.survey_date || row.lastInspection || new Date().toISOString().slice(0, 10),
        wellType: row.wellType || row.well_type || 'Borewell',
        usageType: row.usageType || row.usage_type || 'Domestic',
        ownership: row.ownership || 'Government',
        waterSource: row.waterSource || row.water_source || 'Unconfined Aquifer',
        waterQualityGrade: grade,
        suitableForDrinking: suitableDrinking,
        suitableForIrrigation: suitableIrrigation,
        nearbyLandUse: row.nearbyLandUse || row.nearby_land_use || 'Unknown',
        seasonalVariation: row.seasonalVariation || row.seasonal_variation || 'Moderate',
        infrastructure: row.infrastructure || 'Pump installed',
        notes: row.notes || ''
      };
    });
  } catch (err) {
    console.warn('Unable to load CSV data:', err.message);
    return [];
  }
};

const loadJSONData = (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(buffer);
    return Array.isArray(jsonData) ? jsonData : [];
  } catch (err) {
    console.warn(`Unable to load JSON from ${filePath}:`, err.message);
    return [];
  }
};

const mergeDataSources = () => {
  const dataMap = new Map();
  
  const primaryData = loadJSONData(DATA_FILE);
  primaryData.forEach(record => {
    if (record.id) dataMap.set(record.id, record);
  });
  console.log(`✅ Loaded ${primaryData.length} records from primary data file (${DATA_FILE})`);
  
  const wellsData = loadJSONData(WELLS_FILE);
  wellsData.forEach(record => {
    if (record.id && !dataMap.has(record.id)) {
      dataMap.set(record.id, record);
    }
  });
  if (wellsData.length > 0) {
    console.log(`✅ Loaded ${wellsData.length} additional records from wells data file`);
  }
  
  if (dataMap.size === 0) {
    console.log(`⚠️  No data found in JSON files, loading from CSV...`);
    const csvData = loadFromCSV();
    csvData.forEach(record => {
      if (record.id) dataMap.set(record.id, record);
    });
    console.log(`✅ Loaded ${csvData.length} records from CSV file`);
  }
  
  const totalRecords = Array.from(dataMap.values());
  const districts = [...new Set(totalRecords.map(r => r.district).filter(Boolean))];
  console.log(`📊 Total records loaded: ${totalRecords.length}`);
  console.log(`📍 Districts covered: ${districts.length} (${districts.slice(0, 5).join(', ')}${districts.length > 5 ? '...' : ''})`);
  
  return totalRecords;
};

let groundwaterData = mergeDataSources();

const persistData = (data) => {
  groundwaterData = data;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// ==================== AUTH MIDDLEWARE ====================

const auth = (roles = [], allowGuest = false) => (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer', '').trim();

  if (allowGuest && (!token || token === 'guest')) {
    req.user = {
      id: 'guest',
      name: 'Guest User',
      role: 'guest',
      isGuest: true
    };
    return next();
  }

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = sessions.get(token);
  
  const expiryMs = config.sessionExpiryHours * 60 * 60 * 1000;
  if (Date.now() - session.issuedAt > expiryMs) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }
  
  if (roles.length && !roles.includes(session.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  req.user = session;
  next();
};

// ==================== STATISTICS ====================

const calculateOverview = (data) => {
  if (!data.length) {
    return {
      totalSites: 0, activeSites: 0, maintenanceSites: 0,
      avgTds: 0, avgPH: 0, avgConductivity: 0,
      highRiskSites: 0, moderateRiskSites: 0, safeSites: 0,
      shallowWaterAlerts: 0, avgYield: 0, avgDepth: 0, avgWaterLevel: 0,
      risingSites: 0, decliningSites: 0, stableSites: 0,
      latestInspection: null, districts: [], regions: []
    };
  }

  const totalSites = data.length;
  const activeSites = data.filter(row => row.status === 'active').length;
  const maintenanceSites = data.filter(row => row.status === 'maintenance').length;
  
  const avgTds = Number((data.reduce((sum, row) => sum + Number(row.tdsLevel || 0), 0) / totalSites).toFixed(1));
  const avgPH = Number((data.reduce((sum, row) => sum + Number(row.pH || 7.0), 0) / totalSites).toFixed(2));
  const avgConductivity = Number((data.reduce((sum, row) => sum + Number(row.conductivity || 0), 0) / totalSites).toFixed(0));
  const avgYield = Number((data.reduce((sum, row) => sum + Number(row.yieldLph || 0), 0) / totalSites).toFixed(0));
  const avgDepth = Number((data.reduce((sum, row) => sum + Number(row.depthMeters || 0), 0) / totalSites).toFixed(1));
  const avgWaterLevel = Number((data.reduce((sum, row) => sum + Number(row.waterLevelMeters || 0), 0) / totalSites).toFixed(1));
  
  const highRiskSites = data.filter(row => String(row.contaminationRisk || '').toLowerCase() === 'high').length;
  const moderateRiskSites = data.filter(row => String(row.contaminationRisk || '').toLowerCase() === 'moderate').length;
  const safeSites = data.filter(row => Number(row.tdsLevel || 0) < 500).length;
  const shallowWaterAlerts = data.filter(row => Number(row.waterLevelMeters || 0) < 5).length;
  
  const risingSites = data.filter(row => row.rechargeTrend?.toLowerCase() === 'rising').length;
  const decliningSites = data.filter(row => row.rechargeTrend?.toLowerCase() === 'declining').length;
  const stableSites = data.filter(row => row.rechargeTrend?.toLowerCase() === 'stable').length;
  
  const latestInspection = data
    .map(row => new Date(row.lastInspection))
    .filter(d => !Number.isNaN(d.getTime()))
    .sort((a, b) => b - a)[0];
    
  const districts = [...new Set(data.map(row => row.district).filter(Boolean))];
  const regions = [...new Set(data.map(row => row.region).filter(Boolean))];

  return {
    totalSites, activeSites, maintenanceSites,
    avgTds, avgPH, avgConductivity, avgYield, avgDepth, avgWaterLevel,
    highRiskSites, moderateRiskSites, safeSites, shallowWaterAlerts,
    risingSites, decliningSites, stableSites,
    latestInspection: latestInspection ? latestInspection.toISOString().slice(0, 10) : null,
    districts, regions
  };
};

// ==================== CHATBOT HELPERS ====================

const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const findSiteMention = (message) => {
  const normalized = message.toLowerCase();
  return groundwaterData.find((row) => {
    const name = String(row.name || '').toLowerCase();
    const region = String(row.region || '').toLowerCase();
    const district = String(row.district || '').toLowerCase();
    const siteId = String(row.id || '').toLowerCase();
    
    return normalized.includes(name) || 
           normalized.includes(region) || 
           normalized.includes(district) ||
           normalized.includes(siteId);
  });
};

const findSitesByDistrict = (message) => {
  const normalized = message.toLowerCase();
  const districts = [...new Set(groundwaterData.map(row => row.district?.toLowerCase()))];
  const matchedDistrict = districts.find(d => d && normalized.includes(d));
  
  if (matchedDistrict) {
    return groundwaterData.filter(row => row.district?.toLowerCase() === matchedDistrict);
  }
  return [];
};

// Format response with proper line breaks
const formatWellResponse = (site, lang = 'en') => {
  const riskEmoji = site.contaminationRisk?.toLowerCase() === 'high' ? '⚠️' : 
                    site.contaminationRisk?.toLowerCase() === 'moderate' ? '🟡' : '✅';
  const statusEmoji = site.status === 'maintenance' ? '🔧' : '🟢';
  
  const contact = getMunicipalityContact(site.district);
  
  // Translations for well response
  const labels = {
    en: {
      waterQuality: 'Water Quality',
      wellInfo: 'Well Information',
      status: 'Status',
      suitability: 'Suitability',
      notes: 'Notes',
      localSupport: 'Local Support',
      office: 'Office',
      phone: 'Phone',
      helpline: 'Helpline',
      riskLevel: 'Risk Level',
      trend: 'Trend',
      lastSurvey: 'Last Survey',
      drinking: 'Drinking',
      irrigation: 'Irrigation',
      suitable: 'Suitable',
      notSuitable: 'Not Suitable',
      waterLevel: 'Water Level',
      depth: 'Depth',
      yield: 'Yield',
      wellType: 'Well Type',
      usage: 'Usage',
      source: 'Source',
      qualityGrade: 'Quality Grade'
    },
    ta: {
      waterQuality: 'நீர் தரம்',
      wellInfo: 'கிணறு தகவல்',
      status: 'நிலை',
      suitability: 'பயன்பாட்டிற்கு ஏற்றது',
      notes: 'குறிப்புகள்',
      localSupport: 'உள்ளூர் ஆதரவு',
      office: 'அலுவலகம்',
      phone: 'தொலைபேசி',
      helpline: 'உதவி எண்',
      riskLevel: 'ஆபத்து நிலை',
      trend: 'போக்கு',
      lastSurvey: 'கடைசி ஆய்வு',
      drinking: 'குடிக்க',
      irrigation: 'பாசனம்',
      suitable: 'பயன்பாட்டிற்கு ஏற்றது',
      notSuitable: 'பயன்பாட்டிற்கு ஏற்றதல்ல',
      waterLevel: 'நீர் மட்டம்',
      depth: 'ஆழம்',
      yield: 'விளைச்சல்',
      wellType: 'கிணறு வகை',
      usage: 'பயன்பாடு',
      source: 'மூலம்',
      qualityGrade: 'தரம்'
    },
    hi: {
      waterQuality: 'जल गुणवत्ता',
      wellInfo: 'कुआं जानकारी',
      status: 'स्थिति',
      suitability: 'उपयुक्तता',
      notes: 'टिप्पणियाँ',
      localSupport: 'स्थानीय सहायता',
      office: 'कार्यालय',
      phone: 'फोन',
      helpline: 'हेल्पलाइन',
      riskLevel: 'जोखिम स्तर',
      trend: 'रुझान',
      lastSurvey: 'अंतिम सर्वेक्षण',
      drinking: 'पीने',
      irrigation: 'सिंचाई',
      suitable: 'उपयुक्त',
      notSuitable: 'अनुपयुक्त',
      waterLevel: 'जल स्तर',
      depth: 'गहराई',
      yield: 'उपज',
      wellType: 'कुआं प्रकार',
      usage: 'उपयोग',
      source: 'स्रोत',
      qualityGrade: 'गुणवत्ता ग्रेड'
    },
    te: {
      waterQuality: 'నీటి నాణ్యత',
      wellInfo: 'బావి సమాచారం',
      status: 'స్థితి',
      suitability: 'అనుకూలత',
      notes: 'గమనికలు',
      localSupport: 'స్థానిక మద్దతు',
      office: 'కార్యాలయం',
      phone: 'ఫోన్',
      helpline: 'హెల్ప్‌లైన్',
      riskLevel: 'ప్రమాద స్థాయి',
      trend: 'ప్రవృత్తి',
      lastSurvey: 'చివరి సర్వే',
      drinking: 'త్రాగడం',
      irrigation: 'నీటిపారుదల',
      suitable: 'అనుకూలం',
      notSuitable: 'అననుకూలం',
      waterLevel: 'నీటి స్థాయి',
      depth: 'లోతు',
      yield: 'దిగుబడి',
      wellType: 'బావి రకం',
      usage: 'వినియోగం',
      source: 'మూలం',
      qualityGrade: 'నాణ్యత గ్రేడ్'
    }
  };
  
  const l = labels[lang] || labels.en;
  
  const lines = [
    `📍 **${site.name}**`,
    `   ${site.district}, ${site.region}`,
    ``,
    `📊 **${l.waterQuality}:**`,
    `   • TDS: ${site.tdsLevel} mg/L`,
    `   • pH: ${site.pH}`,
    `   • Conductivity: ${site.conductivity} µS/cm`,
    ...(site.hardness ? [`   • Hardness: ${site.hardness} mg/L`] : []),
    ...(site.nitrate ? [`   • Nitrate: ${site.nitrate} mg/L`] : []),
    ...(site.fluoride ? [`   • Fluoride: ${site.fluoride} mg/L`] : []),
    ...(site.chloride ? [`   • Chloride: ${site.chloride} mg/L`] : []),
    ...(site.waterQualityGrade ? [`   • ${l.qualityGrade}: ${site.waterQualityGrade}`] : []),
    ``,
    `💧 **${l.wellInfo}:**`,
    `   • ${l.waterLevel}: ${site.waterLevelMeters}m`,
    `   • ${l.depth}: ${site.depthMeters}m`,
    `   • ${l.yield}: ${site.yieldLph} LPH`,
    ...(site.wellType ? [`   • ${l.wellType}: ${site.wellType}`] : []),
    ...(site.usageType ? [`   • ${l.usage}: ${site.usageType}`] : []),
    ...(site.waterSource ? [`   • ${l.source}: ${site.waterSource}`] : []),
    ``,
    `📈 **${l.status}:**`,
    `   • ${l.riskLevel}: ${site.contaminationRisk} ${riskEmoji}`,
    `   • ${l.trend}: ${site.rechargeTrend}`,
    `   • Status: ${site.status} ${statusEmoji}`,
    `   • ${l.lastSurvey}: ${site.lastInspection}`,
    ...(site.suitableForDrinking !== undefined ? [
      ``,
      `✅ **${l.suitability}:**`,
      `   • ${l.drinking}: ${site.suitableForDrinking ? `✅ ${l.suitable}` : `❌ ${l.notSuitable}`}`,
      `   • ${l.irrigation}: ${site.suitableForIrrigation !== false ? `✅ ${l.suitable}` : `❌ ${l.notSuitable}`}`
    ] : []),
  ];
  
  if (site.notes) {
    lines.push(``, `📝 **${l.notes}:** ${site.notes}`);
  }
  
  lines.push(
    ``,
    `📞 **${l.localSupport} (${site.district}):**`,
    `   • ${l.office}: ${contact.office}`,
    `   • ${l.phone}: ${contact.phone}`,
    `   • ${l.helpline}: ${contact.helpline}`
  );
  
  return lines.join('\n');
};

const formatOverviewResponse = (data, lang = 'en') => {
  const s = calculateOverview(data);
  
  const labels = {
    en: {
      title: 'Groundwater Overview',
      networkStats: 'Network Statistics',
      totalWells: 'Total Wells',
      active: 'Active',
      maintenance: 'Under Maintenance',
      districtsCovered: 'Districts Covered',
      waterQuality: 'Water Quality',
      avgTDS: 'Average TDS',
      avgPH: 'Average pH',
      avgYield: 'Average Yield',
      riskAssessment: 'Risk Assessment',
      highRisk: 'High Risk',
      moderateRisk: 'Moderate Risk',
      safe: 'Safe (TDS < 500)',
      wells: 'wells',
      rechargeTrends: 'Recharge Trends',
      rising: 'Rising',
      stable: 'Stable',
      declining: 'Declining',
      lastSurvey: 'Last Survey',
      stateHelplines: 'State Helplines',
      waterBoard: 'Water Board',
      groundwaterAuth: 'Groundwater Authority',
      pollutionControl: 'Pollution Control'
    },
    ta: {
      title: 'நிலத்தடி நீர் கண்ணோட்டம்',
      networkStats: 'வலைப்பின்னல் புள்ளிவிவரங்கள்',
      totalWells: 'மொத்த கிணறுகள்',
      active: 'செயலில்',
      maintenance: 'பராமரிப்பில்',
      districtsCovered: 'மாவட்டங்கள்',
      waterQuality: 'நீர் தரம்',
      avgTDS: 'சராசரி TDS',
      avgPH: 'சராசரி pH',
      avgYield: 'சராசரி விளைச்சல்',
      riskAssessment: 'ஆபத்து மதிப்பீடு',
      highRisk: 'உயர் ஆபத்து',
      moderateRisk: 'மிதமான ஆபத்து',
      safe: 'பாதுகாப்பான (TDS < 500)',
      wells: 'கிணறுகள்',
      rechargeTrends: 'ரீசார்ஜ் போக்குகள்',
      rising: 'அதிகரிக்கும்',
      stable: 'நிலையான',
      declining: 'குறையும்',
      lastSurvey: 'கடைசி ஆய்வு',
      stateHelplines: 'மாநில உதவி எண்கள்',
      waterBoard: 'நீர் வாரியம்',
      groundwaterAuth: 'நிலத்தடி நீர் அதிகாரம்',
      pollutionControl: 'மாசு கட்டுப்பாடு'
    },
    hi: {
      title: 'भूजल अवलोकन',
      networkStats: 'नेटवर्क आंकड़े',
      totalWells: 'कुल कुएं',
      active: 'सक्रिय',
      maintenance: 'रखरखाव में',
      districtsCovered: 'जिले कवर',
      waterQuality: 'जल गुणवत्ता',
      avgTDS: 'औसत TDS',
      avgPH: 'औसत pH',
      avgYield: 'औसत उपज',
      riskAssessment: 'जोखिम मूल्यांकन',
      highRisk: 'उच्च जोखिम',
      moderateRisk: 'मध्यम जोखिम',
      safe: 'सुरक्षित (TDS < 500)',
      wells: 'कुएं',
      rechargeTrends: 'रिचार्ज रुझान',
      rising: 'बढ़ रहा',
      stable: 'स्थिर',
      declining: 'गिर रहा',
      lastSurvey: 'अंतिम सर्वेक्षण',
      stateHelplines: 'राज्य हेल्पलाइन',
      waterBoard: 'जल बोर्ड',
      groundwaterAuth: 'भूजल प्राधिकरण',
      pollutionControl: 'प्रदूषण नियंत्रण'
    },
    te: {
      title: 'భూగర్భజల అవలోకనం',
      networkStats: 'నెట్‌వర్క్ గణాంకాలు',
      totalWells: 'మొత్తం బావులు',
      active: 'సక్రియ',
      maintenance: 'నిర్వహణలో',
      districtsCovered: 'జిల్లాలు',
      waterQuality: 'నీటి నాణ్యత',
      avgTDS: 'సగటు TDS',
      avgPH: 'సగటు pH',
      avgYield: 'సగటు దిగుబడి',
      riskAssessment: 'ప్రమాద అంచనా',
      highRisk: 'అధిక ప్రమాదం',
      moderateRisk: 'మధ్యస్థ ప్రమాదం',
      safe: 'సురక్షితం (TDS < 500)',
      wells: 'బావులు',
      rechargeTrends: 'రీఛార్జ్ ప్రవృత్తులు',
      rising: 'పెరుగుతున్న',
      stable: 'స్థిరమైన',
      declining: 'తగ్గుతున్న',
      lastSurvey: 'చివరి సర్వే',
      stateHelplines: 'రాష్ట్ర హెల్ప్‌లైన్‌లు',
      waterBoard: 'నీటి బోర్డు',
      groundwaterAuth: 'భూగర్భజల అధికారం',
      pollutionControl: 'కాలుష్య నియంత్రణ'
    }
  };
  
  const l = labels[lang] || labels.en;
  
  const lines = [
    `📊 **${l.title}**`,
    ``,
    `🔢 **${l.networkStats}:**`,
    `   • ${l.totalWells}: ${s.totalSites}`,
    `   • ${l.active}: ${s.activeSites}`,
    `   • ${l.maintenance}: ${s.maintenanceSites}`,
    `   • ${l.districtsCovered}: ${s.districts.length}`,
    ``,
    `💧 **${l.waterQuality}:**`,
    `   • ${l.avgTDS}: ${s.avgTds} mg/L`,
    `   • ${l.avgPH}: ${s.avgPH}`,
    `   • ${l.avgYield}: ${s.avgYield} LPH`,
    ``,
    `⚠️ **${l.riskAssessment}:**`,
    `   • ${l.highRisk}: ${s.highRiskSites} ${l.wells}`,
    `   • ${l.moderateRisk}: ${s.moderateRiskSites} ${l.wells}`,
    `   • ${l.safe}: ${s.safeSites} ${l.wells}`,
    ``,
    `📈 **${l.rechargeTrends}:**`,
    `   • ${l.rising}: ${s.risingSites}`,
    `   • ${l.stable}: ${s.stableSites}`,
    `   • ${l.declining}: ${s.decliningSites}`,
    ``,
    `📅 **${l.lastSurvey}:** ${s.latestInspection || t(lang, 'notSure')}`,
    ``,
    `📞 **${l.stateHelplines}:**`,
    `   • ${l.waterBoard}: ${stateContacts.tnWaterBoard.helpline}`,
    `   • ${l.groundwaterAuth}: ${stateContacts.groundwaterAuth.phone}`,
    `   • ${l.pollutionControl}: ${stateContacts.pollutionBoard.helpline}`
  ];
  
  return lines.join('\n');
};

const formatTDSResponse = (data, lang = 'en') => {
  const { avgTds, safeSites, totalSites } = calculateOverview(data);
  const highTdsSites = data.filter(row => row.tdsLevel >= 500).slice(0, 5);
  
  const labels = {
    en: { title: 'TDS Analysis', stats: 'Overall Statistics', avgTDS: 'Average TDS', safeWells: 'Safe Wells (< 500 mg/L)', safetyRate: 'Safety Rate', highTDS: 'High TDS Wells (≥ 500 mg/L)', guidelines: 'TDS Guidelines', excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', reportIssues: 'Report Issues' },
    ta: { title: 'TDS பகுப்பாய்வு', stats: 'மொத்த புள்ளிவிவரங்கள்', avgTDS: 'சராசரி TDS', safeWells: 'பாதுகாப்பான கிணறுகள் (< 500 mg/L)', safetyRate: 'பாதுகாப்பு விகிதம்', highTDS: 'உயர் TDS கிணறுகள் (≥ 500 mg/L)', guidelines: 'TDS வழிகாட்டிகள்', excellent: 'சிறந்தது', good: 'நல்லது', fair: 'நடுத்தரம்', poor: 'மோசமானது', reportIssues: 'பிரச்சினைகளை அறிவிக்க' },
    hi: { title: 'TDS विश्लेषण', stats: 'समग्र आंकड़े', avgTDS: 'औसत TDS', safeWells: 'सुरक्षित कुएं (< 500 mg/L)', safetyRate: 'सुरक्षा दर', highTDS: 'उच्च TDS कुएं (≥ 500 mg/L)', guidelines: 'TDS दिशानिर्देश', excellent: 'उत्कृष्ट', good: 'अच्छा', fair: 'उचित', poor: 'खराब', reportIssues: 'मुद्दों की रिपोर्ट करें' },
    te: { title: 'TDS విశ్లేషణ', stats: 'మొత్తం గణాంకాలు', avgTDS: 'సగటు TDS', safeWells: 'సురక్షిత బావులు (< 500 mg/L)', safetyRate: 'భద్రత రేటు', highTDS: 'అధిక TDS బావులు (≥ 500 mg/L)', guidelines: 'TDS మార్గదర్శకాలు', excellent: 'అద్భుతమైన', good: 'మంచిది', fair: 'న్యాయమైన', poor: 'చెడ్డ', reportIssues: 'సమస్యలను నివేదించండి' }
  };
  
  const l = labels[lang] || labels.en;
  
  const lines = [
    `💧 **${l.title}**`,
    ``,
    `📊 **${l.stats}:**`,
    `   • ${l.avgTDS}: ${avgTds} mg/L`,
    `   • ${l.safeWells}: ${safeSites} of ${totalSites}`,
    `   • ${l.safetyRate}: ${((safeSites/totalSites)*100).toFixed(1)}%`,
  ];
  
  if (highTdsSites.length > 0) {
    lines.push(
      ``,
      `⚠️ **${l.highTDS}:**`
    );
    highTdsSites.forEach(site => {
      lines.push(`   • ${site.name}: ${site.tdsLevel} mg/L (${site.district})`);
    });
  }
  
  lines.push(
    ``,
    `ℹ️ **${l.guidelines}:**`,
    `   • < 300 mg/L: ${l.excellent}`,
    `   • 300-500 mg/L: ${l.good}`,
    `   • 500-900 mg/L: ${l.fair}`,
    `   • > 900 mg/L: ${l.poor}`,
    ``,
    `📞 **${l.reportIssues}:** ${stateContacts.tnWaterBoard.helpline}`
  );
  
  return lines.join('\n');
};

const formatRiskResponse = (data, lang = 'en') => {
  const { highRiskSites, moderateRiskSites, safeSites, totalSites } = calculateOverview(data);
  const highRiskWells = data.filter(row => row.contaminationRisk?.toLowerCase() === 'high').slice(0, 5);
  
  const labels = {
    en: { title: 'Risk Assessment Report', distribution: 'Risk Distribution', highRisk: 'High Risk', moderateRisk: 'Moderate Risk', lowRisk: 'Low Risk', safeWells: 'Safe Wells (TDS < 500)', highRiskWells: 'High Risk Wells', district: 'District', contact: 'Contact', emergencyContacts: 'Emergency Contacts', waterBoard: 'Water Board', pollutionBoard: 'Pollution Board' },
    ta: { title: 'ஆபத்து மதிப்பீட்டு அறிக்கை', distribution: 'ஆபத்து பரவல்', highRisk: 'உயர் ஆபத்து', moderateRisk: 'மிதமான ஆபத்து', lowRisk: 'குறைந்த ஆபத்து', safeWells: 'பாதுகாப்பான கிணறுகள் (TDS < 500)', highRiskWells: 'உயர் ஆபத்து கிணறுகள்', district: 'மாவட்டம்', contact: 'தொடர்பு', emergencyContacts: 'அவசர தொடர்புகள்', waterBoard: 'நீர் வாரியம்', pollutionBoard: 'மாசு வாரியம்' },
    hi: { title: 'जोखिम मूल्यांकन रिपोर्ट', distribution: 'जोखिम वितरण', highRisk: 'उच्च जोखिम', moderateRisk: 'मध्यम जोखिम', lowRisk: 'कम जोखिम', safeWells: 'सुरक्षित कुएं (TDS < 500)', highRiskWells: 'उच्च जोखिम कुएं', district: 'जिला', contact: 'संपर्क', emergencyContacts: 'आपातकालीन संपर्क', waterBoard: 'जल बोर्ड', pollutionBoard: 'प्रदूषण बोर्ड' },
    te: { title: 'ప్రమాద అంచనా నివేదిక', distribution: 'ప్రమాద పంపిణీ', highRisk: 'అధిక ప్రమాదం', moderateRisk: 'మధ్యస్థ ప్రమాదం', lowRisk: 'తక్కువ ప్రమాదం', safeWells: 'సురక్షిత బావులు (TDS < 500)', highRiskWells: 'అధిక ప్రమాద బావులు', district: 'జిల్లా', contact: 'సంప్రదింపు', emergencyContacts: 'అత్యవసర సంప్రదింపులు', waterBoard: 'నీటి బోర్డు', pollutionBoard: 'కాలుష్య బోర్డు' }
  };
  
  const l = labels[lang] || labels.en;
  
  const lines = [
    `⚠️ **${l.title}**`,
    ``,
    `📊 **${l.distribution}:**`,
    `   • 🔴 ${l.highRisk}: ${highRiskSites} wells`,
    `   • 🟡 ${l.moderateRisk}: ${moderateRiskSites} wells`,
    `   • 🟢 ${l.lowRisk}: ${totalSites - highRiskSites - moderateRiskSites} wells`,
    ``,
    `✅ **${l.safeWells}:** ${safeSites}`,
  ];
  
  if (highRiskWells.length > 0) {
    lines.push(
      ``,
      `🚨 **${l.highRiskWells}:**`
    );
    highRiskWells.forEach(site => {
      const contact = getMunicipalityContact(site.district);
      lines.push(
        `   • ${site.name}`,
        `     ${l.district}: ${site.district}`,
        `     TDS: ${site.tdsLevel} mg/L`,
        `     ${l.contact}: ${contact.helpline}`
      );
    });
  }
  
  lines.push(
    ``,
    `📞 **${l.emergencyContacts}:**`,
    `   • ${l.waterBoard}: ${stateContacts.tnWaterBoard.helpline}`,
    `   • ${l.pollutionBoard}: ${stateContacts.pollutionBoard.helpline}`
  );
  
  return lines.join('\n');
};

const formatYieldResponse = (data, lang = 'en') => {
  const { avgYield, totalSites } = calculateOverview(data);
  const highYieldSites = data.filter(row => row.yieldLph >= 1800).slice(0, 5);
  const lowYieldSites = data.filter(row => row.yieldLph < 1000).slice(0, 5);
  
  const lines = [
    `💧 **Yield Analysis**`,
    ``,
    `📊 **Statistics:**`,
    `   • Average Yield: ${avgYield} LPH`,
    `   • High Yield (≥1800 LPH): ${highYieldSites.length} wells`,
    `   • Low Yield (<1000 LPH): ${lowYieldSites.length} wells`,
  ];
  
  if (highYieldSites.length > 0) {
    lines.push(``, `🏆 **Top Performers:**`);
    highYieldSites.forEach(site => {
      lines.push(`   • ${site.name}: ${site.yieldLph} LPH (${site.district})`);
    });
  }
  
  if (lowYieldSites.length > 0) {
    lines.push(``, `⚠️ **Low Yield Wells (Need Attention):**`);
    lowYieldSites.forEach(site => {
      lines.push(`   • ${site.name}: ${site.yieldLph} LPH (${site.district})`);
    });
  }
  
  return lines.join('\n');
};

const formatContactResponse = (district = null, lang = 'en') => {
  const lines = [
    `📞 **Contact Support**`,
    ``
  ];
  
  if (district && municipalityContacts[district]) {
    const contact = municipalityContacts[district];
    lines.push(
      `🏛️ **${district} Municipality:**`,
      `   • Office: ${contact.office}`,
      `   • Phone: ${contact.phone}`,
      `   • Email: ${contact.email}`,
      `   • Helpline: ${contact.helpline}`,
      ``
    );
  }
  
  lines.push(
    `🏛️ **State Level Contacts:**`,
    ``,
    `💧 **TN Water Supply & Drainage Board:**`,
    `   • Helpline: ${stateContacts.tnWaterBoard.helpline}`,
    `   • Phone: ${stateContacts.tnWaterBoard.phone}`,
    ``,
    `🌊 **State Groundwater Authority:**`,
    `   • Phone: ${stateContacts.groundwaterAuth.phone}`,
    `   • Email: ${stateContacts.groundwaterAuth.email}`,
    ``,
    `🏭 **TN Pollution Control Board:**`,
    `   • Helpline: ${stateContacts.pollutionBoard.helpline}`,
    `   • Phone: ${stateContacts.pollutionBoard.phone}`,
    ``,
    `🚨 **Disaster Management:**`,
    `   • Emergency: ${stateContacts.disasterMgmt.helpline}`,
    `   • Phone: ${stateContacts.disasterMgmt.phone}`
  );
  
  return lines.join('\n');
};

const formatDistrictResponse = (districtSites, lang = 'en') => {
  if (!districtSites.length) return null;
  
  const district = districtSites[0].district;
  const avgTds = (districtSites.reduce((sum, s) => sum + s.tdsLevel, 0) / districtSites.length).toFixed(0);
  const avgYield = (districtSites.reduce((sum, s) => sum + s.yieldLph, 0) / districtSites.length).toFixed(0);
  const highRisk = districtSites.filter(s => s.contaminationRisk === 'High').length;
  const contact = getMunicipalityContact(district);
  
  const lines = [
    `📍 **${district} District Report**`,
    ``,
    `📊 **Statistics:**`,
    `   • Total Wells: ${districtSites.length}`,
    `   • Average TDS: ${avgTds} mg/L`,
    `   • Average Yield: ${avgYield} LPH`,
    `   • High Risk Wells: ${highRisk}`,
    ``,
    `🔍 **Wells in ${district}:**`
  ];
  
  districtSites.slice(0, 5).forEach(site => {
    const riskEmoji = site.contaminationRisk === 'High' ? '🔴' : site.contaminationRisk === 'Moderate' ? '🟡' : '🟢';
    lines.push(`   ${riskEmoji} ${site.name} - TDS: ${site.tdsLevel}, Yield: ${site.yieldLph} LPH`);
  });
  
  if (districtSites.length > 5) {
    lines.push(`   ... and ${districtSites.length - 5} more wells`);
  }
  
  lines.push(
    ``,
    `📞 **Local Support:**`,
    `   • Office: ${contact.office}`,
    `   • Phone: ${contact.phone}`,
    `   • Helpline: ${contact.helpline}`
  );
  
  return lines.join('\n');
};

const formatFluorideResponse = (data, lang = 'en') => {
  const wellsWithFluoride = data.filter(w => w.fluoride !== undefined && w.fluoride > 0);
  const highFluoride = wellsWithFluoride.filter(w => w.fluoride >= 1.0);
  const moderateFluoride = wellsWithFluoride.filter(w => w.fluoride >= 0.7 && w.fluoride < 1.0);
  const avgFluoride = wellsWithFluoride.length > 0 ? 
    (wellsWithFluoride.reduce((sum, w) => sum + w.fluoride, 0) / wellsWithFluoride.length).toFixed(2) : 0;
  
  const lines = [
    `💧 **Fluoride Analysis**`,
    ``,
    `📊 **Statistics:**`,
    `   • Average Fluoride: ${avgFluoride} mg/L`,
    `   • High Fluoride (≥1.0 mg/L): ${highFluoride.length} wells`,
    `   • Moderate (0.7-1.0 mg/L): ${moderateFluoride.length} wells`,
    `   • Safe (<0.7 mg/L): ${wellsWithFluoride.length - highFluoride.length - moderateFluoride.length} wells`,
  ];
  
  if (highFluoride.length > 0) {
    lines.push(``, `⚠️ **High Fluoride Wells (Require Defluoridation):**`);
    highFluoride.slice(0, 5).forEach(site => {
      lines.push(`   • ${site.name}: ${site.fluoride} mg/L (${site.district})`);
    });
  }
  
  lines.push(
    ``,
    `ℹ️ **Fluoride Guidelines:**`,
    `   • < 0.7 mg/L: Safe`,
    `   • 0.7-1.0 mg/L: Moderate (dental fluorosis risk)`,
    `   • 1.0-1.5 mg/L: High (skeletal fluorosis risk)`,
    `   • > 1.5 mg/L: Very High (severe health risk)`,
    ``,
    `📞 **Treatment Support:** ${stateContacts.groundwaterAuth.phone}`
  );
  
  return lines.join('\n');
};

const formatNitrateResponse = (data, lang = 'en') => {
  const wellsWithNitrate = data.filter(w => w.nitrate !== undefined && w.nitrate > 0);
  const highNitrate = wellsWithNitrate.filter(w => w.nitrate >= 45);
  const moderateNitrate = wellsWithNitrate.filter(w => w.nitrate >= 30 && w.nitrate < 45);
  const avgNitrate = wellsWithNitrate.length > 0 ?
    (wellsWithNitrate.reduce((sum, w) => sum + w.nitrate, 0) / wellsWithNitrate.length).toFixed(1) : 0;
  
  const lines = [
    `💧 **Nitrate Analysis**`,
    ``,
    `📊 **Statistics:**`,
    `   • Average Nitrate: ${avgNitrate} mg/L`,
    `   • High Nitrate (≥45 mg/L): ${highNitrate.length} wells`,
    `   • Moderate (30-45 mg/L): ${moderateNitrate.length} wells`,
    `   • Safe (<30 mg/L): ${wellsWithNitrate.length - highNitrate.length - moderateNitrate.length} wells`,
  ];
  
  if (highNitrate.length > 0) {
    lines.push(``, `⚠️ **High Nitrate Wells:**`);
    highNitrate.slice(0, 5).forEach(site => {
      lines.push(`   • ${site.name}: ${site.nitrate} mg/L (${site.district})`);
    });
  }
  
  lines.push(
    ``,
    `ℹ️ **Nitrate Guidelines:**`,
    `   • < 30 mg/L: Safe for drinking`,
    `   • 30-45 mg/L: Acceptable (infants at risk)`,
    `   • 45-100 mg/L: High (methemoglobinemia risk)`,
    `   • > 100 mg/L: Very High (severe health risk)`,
    ``,
    `📞 **Report Issues:** ${stateContacts.pollutionBoard.helpline}`
  );
  
  return lines.join('\n');
};

const formatDrinkingWaterResponse = (data, lang = 'en') => {
  const suitableWells = data.filter(w => w.suitableForDrinking === true);
  const unsuitableWells = data.filter(w => w.suitableForDrinking === false);
  const totalWells = data.length;
  
  const lines = [
    `💧 **Drinking Water Suitability Report**`,
    ``,
    `📊 **Statistics:**`,
    `   • Suitable for Drinking: ${suitableWells.length} wells (${((suitableWells.length/totalWells)*100).toFixed(1)}%)`,
    `   • Not Suitable: ${unsuitableWells.length} wells (${((unsuitableWells.length/totalWells)*100).toFixed(1)}%)`,
  ];
  
  if (unsuitableWells.length > 0) {
    lines.push(``, `⚠️ **Wells Not Suitable for Drinking:**`);
    unsuitableWells.slice(0, 5).forEach(site => {
      const reasons = [];
      if (site.tdsLevel >= 500) reasons.push('High TDS');
      if (site.nitrate >= 45) reasons.push('High Nitrate');
      if (site.fluoride >= 1.0) reasons.push('High Fluoride');
      if (site.arsenic >= 0.01) reasons.push('High Arsenic');
      lines.push(`   • ${site.name} (${site.district}): ${reasons.join(', ')}`);
    });
  }
  
  if (suitableWells.length > 0) {
    lines.push(``, `✅ **Wells Suitable for Drinking:**`);
    suitableWells.slice(0, 5).forEach(site => {
      lines.push(`   • ${site.name} (${site.district}) - TDS: ${site.tdsLevel} mg/L`);
    });
  }
  
  lines.push(
    ``,
    `ℹ️ **Drinking Water Criteria:**`,
    `   • TDS < 500 mg/L`,
    `   • Nitrate < 45 mg/L`,
    `   • Fluoride < 1.0 mg/L`,
    `   • Arsenic < 0.01 mg/L`,
    ``,
    `📞 **Water Quality Testing:** ${stateContacts.tnWaterBoard.helpline}`
  );
  
  return lines.join('\n');
};

const formatIrrigationResponse = (data, lang = 'en') => {
  const suitableWells = data.filter(w => w.suitableForIrrigation !== false);
  const unsuitableWells = data.filter(w => w.suitableForIrrigation === false);
  const totalWells = data.length;
  
  const lines = [
    `💧 **Irrigation Water Suitability Report**`,
    ``,
    `📊 **Statistics:**`,
    `   • Suitable for Irrigation: ${suitableWells.length} wells (${((suitableWells.length/totalWells)*100).toFixed(1)}%)`,
    `   • Not Suitable: ${unsuitableWells.length} wells`,
  ];
  
  if (suitableWells.length > 0) {
    lines.push(``, `✅ **Wells Suitable for Irrigation:**`);
    suitableWells.slice(0, 8).forEach(site => {
      lines.push(`   • ${site.name} (${site.district}) - TDS: ${site.tdsLevel} mg/L, Yield: ${site.yieldLph} LPH`);
    });
  }
  
  lines.push(
    ``,
    `ℹ️ **Irrigation Water Criteria:**`,
    `   • TDS < 900 mg/L: Suitable`,
    `   • TDS 900-2000 mg/L: Moderate (saline sensitive crops)`,
    `   • TDS > 2000 mg/L: Not Suitable`,
    ``,
    `📞 **Agricultural Support:** ${stateContacts.tnWaterBoard.helpline}`
  );
  
  return lines.join('\n');
};

// Main chat response builder
const buildChatReply = (message, user, lang = 'en') => {
  const normalized = message.toLowerCase();
  
  // Check for contact/support queries
  if (normalized.includes('contact') || normalized.includes('support') || normalized.includes('helpline') || 
      normalized.includes('phone') || normalized.includes('call') || normalized.includes('municipality') ||
      normalized.includes('தொடர்பு') || normalized.includes('संपर्क') || normalized.includes('సంప్రదింపు')) {
    
    // Check if asking about specific district
    const districtSites = findSitesByDistrict(normalized);
    const district = districtSites.length > 0 ? districtSites[0].district : null;
    return formatContactResponse(district, lang);
  }
  
  // Check for specific site mention
  const site = findSiteMention(normalized);
  if (site) {
    return formatWellResponse(site, lang);
  }
  
  // Check for district-level queries
  const districtSites = findSitesByDistrict(normalized);
  if (districtSites.length > 0) {
    return formatDistrictResponse(districtSites, lang);
  }
  
  // Check for TDS queries
  if (normalized.includes('tds') || normalized.includes('salinity') || normalized.includes('dissolved')) {
    return formatTDSResponse(groundwaterData, lang);
  }
  
  // Check for risk queries
  if (normalized.includes('risk') || normalized.includes('contamination') || normalized.includes('danger') || 
      normalized.includes('safe') || normalized.includes('unsafe')) {
    return formatRiskResponse(groundwaterData, lang);
  }
  
  // Check for yield queries
  if (normalized.includes('yield') || normalized.includes('production') || normalized.includes('output') || 
      normalized.includes('lph') || normalized.includes('liters')) {
    return formatYieldResponse(groundwaterData, lang);
  }
  
  // Check for fluoride queries
  if (normalized.includes('fluoride') || normalized.includes('fluorosis') || normalized.includes('ஃப்ளோரைடு')) {
    return formatFluorideResponse(groundwaterData, lang);
  }
  
  // Check for nitrate queries
  if (normalized.includes('nitrate') || normalized.includes('nitrogen') || normalized.includes('நைட்ரேட்')) {
    return formatNitrateResponse(groundwaterData, lang);
  }
  
  // Check for drinking water suitability queries
  if (normalized.includes('drinking') || normalized.includes('potable') || normalized.includes('safe to drink') ||
      normalized.includes('குடிக்க') || normalized.includes('पीने योग्य')) {
    return formatDrinkingWaterResponse(groundwaterData, lang);
  }
  
  // Check for irrigation suitability queries
  if (normalized.includes('irrigation') || normalized.includes('farming') || normalized.includes('agriculture') ||
      normalized.includes('பாசனம்') || normalized.includes('सिंचाई')) {
    return formatIrrigationResponse(groundwaterData, lang);
  }
  
  // Check for overview queries
  if (normalized.includes('overview') || normalized.includes('summary') || normalized.includes('overall') || 
      normalized.includes('report') || normalized.includes('status')) {
    return formatOverviewResponse(groundwaterData, lang);
  }
  
  // Greeting
  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey') ||
      normalized.includes('வணக்கம்') || normalized.includes('नमस्ते') || normalized.includes('హలో')) {
    return `${t(lang, 'greeting')}\n\n${t(lang, 'dataLoaded', { count: groundwaterData.length })}\n\n${t(lang, 'askAbout')}`;
  }
  
  // Thanks
  if (normalized.includes('thank') || normalized.includes('நன்றி') || normalized.includes('धन्यवाद') || normalized.includes('ధన్యవాదాలు')) {
    return t(lang, 'thanks');
  }
  
  // Help
  if (normalized.includes('help') || normalized.includes('உதவி') || normalized.includes('मदद') || normalized.includes('సహాయం')) {
    const topics = translations[lang]?.helpTopics || translations.en.helpTopics;
    return `${t(lang, 'help')}\n\n${topics.map(topic => `• ${topic}`).join('\n')}\n\n📞 **Quick Support:** ${stateContacts.tnWaterBoard.helpline}`;
  }

  // Default response
  return `${t(lang, 'notSure')}\n\n${t(lang, 'tryAsking')}\n\n📞 **Need Help?** Call ${stateContacts.tnWaterBoard.helpline}`;
};

// Dynamic suggestions based on context
const generateSuggestions = (message, lang = 'en') => {
  const normalized = message.toLowerCase();
  const suggestions = {
    en: {
      tds: ['Show high-risk sites', 'Yield analysis', 'Contact support', 'District comparison'],
      risk: ['TDS breakdown', 'Show declining wells', 'Contact municipality', 'Best performing wells'],
      yield: ['Low yield wells', 'High performers', 'Contact support', 'Water quality'],
      district: ['Overall summary', 'Risk assessment', 'Contact local office', 'TDS analysis'],
      contact: ['Show overview', 'High risk areas', 'Check my district', 'Water quality'],
      default: ['Give me an overview', 'Show TDS levels', 'High risk areas', 'Contact support', 'Help']
    },
    ta: {
      default: ['கண்ணோட்டம்', 'TDS நிலை', 'ஆபத்து பகுதிகள்', 'தொடர்பு ஆதரவு', 'உதவி']
    },
    hi: {
      default: ['अवलोकन दें', 'TDS स्तर', 'उच्च जोखिम क्षेत्र', 'संपर्क सहायता', 'मदद']
    },
    te: {
      default: ['అవలోకనం', 'TDS స్థాయిలు', 'అధిక ప్రమాద ప్రాంతాలు', 'సంప్రదింపు మద్దతు', 'సహాయం']
    }
  };
  
  const langSuggestions = suggestions[lang] || suggestions.en;
  
  if (normalized.includes('tds') || normalized.includes('quality')) {
    return langSuggestions.tds || langSuggestions.default;
  } else if (normalized.includes('risk') || normalized.includes('contamination')) {
    return langSuggestions.risk || langSuggestions.default;
  } else if (normalized.includes('yield') || normalized.includes('production')) {
    return langSuggestions.yield || langSuggestions.default;
  } else if (normalized.includes('district') || normalized.includes('region')) {
    return langSuggestions.district || langSuggestions.default;
  } else if (normalized.includes('contact') || normalized.includes('support')) {
    return langSuggestions.contact || langSuggestions.default;
  }
  
  return langSuggestions.default;
};

// ==================== ROUTES ====================

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'INGRES backend',
    environment: config.nodeEnv,
    wellsLoaded: groundwaterData.length,
    languages: ['en', 'ta', 'hi', 'te']
  });
});

app.post('/api/auth/guest', (req, res) => {
  const token = `guest-${uuidv4()}`;
  const session = {
    token,
    id: 'guest',
    name: 'Guest User',
    email: 'guest@ingres.gov',
    role: 'guest',
    tagline: 'Chat-only access',
    isGuest: true,
    issuedAt: Date.now()
  };

  sessions.set(token, session);
  res.json({ message: 'Guest access granted', user: session });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = uuidv4();
  const session = {
    token,
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tagline: user.tagline,
    issuedAt: Date.now()
  };

  sessions.set(token, session);
  res.json({ message: 'Login successful', user: session });
});

app.post('/api/auth/logout', auth(), (req, res) => {
  sessions.delete(req.user.token);
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', auth(), (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/data/overview', auth(['admin', 'staff', 'common', 'guest'], true), (_req, res) => {
  res.json({ overview: calculateOverview(groundwaterData) });
});

app.get('/api/data/groundwater', auth(['admin', 'staff', 'common', 'guest'], true), (_req, res) => {
  res.json({ records: groundwaterData });
});

app.get('/api/data/well/:id', auth(['admin', 'staff', 'common', 'guest'], true), (req, res) => {
  const well = groundwaterData.find(w => w.id === req.params.id);
  if (!well) {
    return res.status(404).json({ error: 'Well not found' });
  }
  res.json({ well });
});

app.get('/api/data/district/:district', auth(['admin', 'staff', 'common', 'guest'], true), (req, res) => {
  const wells = groundwaterData.filter(
    w => w.district?.toLowerCase() === req.params.district.toLowerCase()
  );
  res.json({ district: req.params.district, count: wells.length, wells });
});

app.get('/api/data/region/:region', auth(['admin', 'staff', 'common', 'guest'], true), (req, res) => {
  const wells = groundwaterData.filter(
    w => w.region?.toLowerCase().includes(req.params.region.toLowerCase())
  );
  res.json({ region: req.params.region, count: wells.length, wells });
});

app.get('/api/data/map', auth(['admin', 'staff', 'common', 'guest'], true), (_req, res) => {
  const mapData = groundwaterData.map(well => ({
    id: well.id,
    name: well.name,
    lat: well.lat,
    lon: well.lon,
    district: well.district,
    region: well.region,
    tdsLevel: well.tdsLevel,
    pH: well.pH,
    conductivity: well.conductivity,
    hardness: well.hardness,
    nitrate: well.nitrate,
    fluoride: well.fluoride,
    chloride: well.chloride,
    sulfate: well.sulfate,
    iron: well.iron,
    arsenic: well.arsenic,
    contaminationRisk: well.contaminationRisk,
    yieldLph: well.yieldLph,
    waterLevelMeters: well.waterLevelMeters,
    depthMeters: well.depthMeters,
    rechargeTrend: well.rechargeTrend,
    status: well.status,
    wellType: well.wellType,
    usageType: well.usageType,
    ownership: well.ownership,
    waterSource: well.waterSource,
    waterQualityGrade: well.waterQualityGrade,
    suitableForDrinking: well.suitableForDrinking,
    suitableForIrrigation: well.suitableForIrrigation,
    nearbyLandUse: well.nearbyLandUse,
    seasonalVariation: well.seasonalVariation,
    infrastructure: well.infrastructure,
    lastInspection: well.lastInspection,
    notes: well.notes
  }));
  
  const stats = {
    total: mapData.length,
    byRisk: {
      high: mapData.filter(w => w.contaminationRisk === 'High').length,
      moderate: mapData.filter(w => w.contaminationRisk === 'Moderate').length,
      low: mapData.filter(w => w.contaminationRisk === 'Low').length
    },
    byDistrict: [...new Set(mapData.map(w => w.district))].map(d => ({
      name: d,
      count: mapData.filter(w => w.district === d).length
    }))
  };
  
  res.json({ wells: mapData, stats });
});

// Contacts endpoint
app.get('/api/data/contacts', auth(['admin', 'staff', 'common', 'guest'], true), (req, res) => {
  const { district } = req.query;
  
  if (district) {
    const contact = getMunicipalityContact(district);
    return res.json({ district, contact, stateContacts });
  }
  
  res.json({ municipalities: municipalityContacts, stateContacts });
});

app.post('/api/admin/reload-data', auth(['admin']), (_req, res) => {
  console.log('🔄 Admin requested data reload...');
  groundwaterData = mergeDataSources();
  const overview = calculateOverview(groundwaterData);
  console.log(`✅ Data reload complete: ${groundwaterData.length} wells loaded`);
  res.json({
    message: `Successfully reloaded ${groundwaterData.length} records from data files`,
    overview: overview,
    totalWells: groundwaterData.length,
    districts: [...new Set(groundwaterData.map(w => w.district).filter(Boolean))].length
  });
});

app.post('/api/admin/upload-csv', auth(['admin']), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }

  try {
    const rows = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const normalized = rows.map((row, idx) => {
      const tds = Number(row.tds || row.tdsLevel || row.TDS || 0);
      let risk = 'Low';
      if (tds >= 600) risk = 'High';
      else if (tds >= 500) risk = 'Moderate';
      
      const yieldLph = Number(row.yield_lph || row.yieldLph || 0);
      let trend = 'Stable';
      if (yieldLph < 1000) trend = 'Declining';
      else if (yieldLph > 1800) trend = 'Rising';
      
      return {
        id: row.site_id || row.id || row.ID || `CSV-${Date.now()}-${idx + 1}`,
        name: row.name || row.Name || `Well ${idx + 1}`,
        region: row.region || row.Region || row.district || `Region ${idx + 1}`,
        district: row.district || row.District || 'Unknown',
        state: row.state || row.State || 'Tamil Nadu',
        lat: Number(row.lat || 0),
        lon: Number(row.lon || 0),
        aquifer: row.aquifer || row.Aquifer || `${row.district || 'Unknown'} Basin`,
        tdsLevel: tds,
        pH: Number(row.pH || row.ph || 7.0),
        conductivity: Number(row.conductivity || row.Conductivity || tds * 1.8),
        contaminationRisk: row.contaminationRisk || row.Risk || risk,
        waterLevelMeters: Number(row.static_water_level_m || row.waterLevelMeters || row.depth || 0),
        depthMeters: Number(row.depth_m || row.depthMeters || 0),
        yieldLph: yieldLph,
        rechargeTrend: row.rechargeTrend || row.Trend || trend,
        status: row.status || row.Status || 'active',
        lastInspection: row.survey_date || row.lastInspection || row.InspectionDate || new Date().toISOString().slice(0, 10),
        notes: row.notes || ''
      };
    });

    persistData(normalized);

    res.json({
      message: `Uploaded ${normalized.length} records`,
      overview: calculateOverview(normalized)
    });
  } catch (error) {
    console.error('CSV parse error', error);
    res.status(400).json({ error: 'Unable to parse CSV. Please verify the headers.' });
  }
});

// Chatbot endpoint with multilingual support
app.post('/api/chatbot', auth(['admin', 'staff', 'common', 'guest'], true), (req, res) => {
  const { message, language } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Prioritize explicit language selection over auto-detection
  const lang = language && ['en', 'ta', 'hi', 'te'].includes(language) 
    ? language 
    : detectLanguage(message);
  
  const reply = buildChatReply(message, req.user, lang);
  const suggestions = generateSuggestions(message, lang);

  res.json({
    reply,
    suggestions,
    language: lang,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});


app.listen(config.port, () => {
  console.log(`\n🌊 INGRES Groundwater Monitoring System`);
  console.log(`📡 Backend listening on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`💧 Loaded ${groundwaterData.length} groundwater records`);
  console.log(`📍 Districts: ${[...new Set(groundwaterData.map(w => w.district))].length}`);
  console.log(`🗺️  Regions: ${[...new Set(groundwaterData.map(w => w.region))].length}`);
  console.log(`🌐 Languages: English, Tamil, Hindi, Telugu`);
  console.log(`📞 Support contacts for ${Object.keys(municipalityContacts).length} municipalities\n`);
});

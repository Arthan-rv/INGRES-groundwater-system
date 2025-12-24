const fs = require('fs');

// Tamil Nadu districts with coordinates and characteristics
const districtsData = [
  {name: "Chennai", lat: 13.0827, lon: 80.2707, region: "Chennai Metropolitan", aquifer: "Coastal Alluvial", coastal: true},
  {name: "Coimbatore", lat: 11.0168, lon: 76.9558, region: "Kongu Region", aquifer: "Hard Rock", coastal: false},
  {name: "Madurai", lat: 9.9252, lon: 78.1198, region: "Southern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Tiruchirappalli", lat: 10.7905, lon: 78.7047, region: "Central Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Salem", lat: 11.6643, lon: 78.1460, region: "Salem Plateau", aquifer: "Hard Rock", coastal: false},
  {name: "Tiruppur", lat: 11.1085, lon: 77.3411, region: "Kongu Region", aquifer: "Hard Rock", coastal: false},
  {name: "Erode", lat: 11.3410, lon: 77.7172, region: "Kongu Region", aquifer: "Alluvial", coastal: false},
  {name: "Thanjavur", lat: 10.7865, lon: 79.1378, region: "Cauvery Delta", aquifer: "Deltaic Alluvial", coastal: false},
  {name: "Thiruvarur", lat: 10.7725, lon: 79.6370, region: "Cauvery Delta", aquifer: "Deltaic Alluvial", coastal: false},
  {name: "Nagapattinam", lat: 10.7672, lon: 79.8449, region: "Coastal Tamil Nadu", aquifer: "Coastal Alluvial", coastal: true},
  {name: "Cuddalore", lat: 11.7480, lon: 79.7714, region: "Coastal Tamil Nadu", aquifer: "Coastal Alluvial", coastal: true},
  {name: "Karur", lat: 10.9601, lon: 78.0766, region: "Kongu Region", aquifer: "Hard Rock", coastal: false},
  {name: "Dindigul", lat: 10.3650, lon: 77.9800, region: "Southern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Theni", lat: 10.0104, lon: 77.4768, region: "Western Ghats", aquifer: "Hard Rock", coastal: false},
  {name: "Vellore", lat: 12.9165, lon: 79.1325, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Kancheepuram", lat: 12.8342, lon: 79.7036, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Tiruvallur", lat: 13.1442, lon: 79.9084, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Chengalpattu", lat: 12.6819, lon: 80.0169, region: "Northern Tamil Nadu", aquifer: "Coastal Alluvial", coastal: true},
  {name: "Ranipet", lat: 12.9279, lon: 79.3316, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Tirupattur", lat: 12.4970, lon: 78.5629, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Kallakurichi", lat: 11.7404, lon: 78.9592, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Villupuram", lat: 11.9394, lon: 79.4924, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Dharmapuri", lat: 12.1210, lon: 78.1582, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Krishnagiri", lat: 12.5196, lon: 78.2138, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Namakkal", lat: 11.2213, lon: 78.1674, region: "Salem Plateau", aquifer: "Hard Rock", coastal: false},
  {name: "Tenkasi", lat: 8.9606, lon: 77.3152, region: "Western Ghats", aquifer: "Hard Rock", coastal: false},
  {name: "Tirunelveli", lat: 8.7139, lon: 77.7567, region: "Southern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Thoothukudi", lat: 8.7642, lon: 78.1348, region: "Coastal Tamil Nadu", aquifer: "Coastal Alluvial", coastal: true},
  {name: "Kanyakumari", lat: 8.0883, lon: 77.5385, region: "Coastal Tamil Nadu", aquifer: "Coastal Alluvial", coastal: true},
  {name: "Ramanathapuram", lat: 9.3151, lon: 78.8307, region: "Coastal Tamil Nadu", aquifer: "Coastal Alluvial", coastal: true},
  {name: "Sivaganga", lat: 9.8432, lon: 78.4808, region: "Southern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Virudhunagar", lat: 9.5852, lon: 77.9608, region: "Southern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Ariyalur", lat: 11.1375, lon: 79.0758, region: "Central Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Perambalur", lat: 11.2340, lon: 78.8832, region: "Central Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Pudukkottai", lat: 10.3803, lon: 78.8204, region: "Central Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Tiruvannamalai", lat: 12.2319, lon: 79.0676, region: "Northern Tamil Nadu", aquifer: "Hard Rock", coastal: false},
  {name: "Mayiladuthurai", lat: 11.1035, lon: 79.6550, region: "Cauvery Delta", aquifer: "Deltaic Alluvial", coastal: false},
  {name: "Nilgiris", lat: 11.4102, lon: 76.6950, region: "Western Ghats", aquifer: "Hard Rock", coastal: false}
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateWellData(districtInfo, wellNum) {
  const district = districtInfo.name;
  const isCoastal = districtInfo.coastal;
  const isDelta = districtInfo.region.includes("Delta");
  const isHilly = districtInfo.region.includes("Ghats") || district === "Nilgiris" || district === "Theni";
  
  // Base TDS varies by region
  let baseTds;
  if (isCoastal) {
    baseTds = randomInt(650, 950);
  } else if (isDelta) {
    baseTds = randomInt(380, 480);
  } else if (isHilly) {
    baseTds = randomInt(280, 380);
  } else {
    baseTds = randomInt(420, 680);
  }
  
  const tds = baseTds + randomInt(-30, 30);
  
  // Risk assessment
  let risk;
  if (tds >= 600) {
    risk = "High";
  } else if (tds >= 500) {
    risk = "Moderate";
  } else {
    risk = "Low";
  }
  
  // pH varies slightly
  const pH = isCoastal ? randomBetween(7.7, 8.0) : randomBetween(6.9, 7.6);
  
  // Conductivity correlates with TDS
  const conductivity = Math.round(tds * 1.9 + randomInt(-50, 50));
  
  // Hardness (mg/L as CaCO3)
  const hardness = Math.round(tds * 0.38 + randomInt(-20, 20));
  
  // Alkalinity (mg/L)
  const alkalinity = Math.round(hardness * 0.6 + randomInt(-15, 15));
  
  // Nitrate (mg/L)
  const nitrate = randomInt(18, 75);
  
  // Fluoride (mg/L)
  let fluoride;
  if (["Madurai", "Dindigul", "Theni"].includes(district)) {
    fluoride = randomBetween(0.8, 1.5);
  } else {
    fluoride = randomBetween(0.4, 1.0);
  }
  
  // Chloride (mg/L)
  const chloride = isCoastal ? randomInt(300, 450) : randomInt(120, 300);
  
  // Sulfate (mg/L)
  const sulfate = Math.round(chloride * 0.45 + randomInt(-20, 20));
  
  // Iron (mg/L)
  const iron = randomBetween(0.12, 0.4);
  
  // Arsenic (mg/L)
  const arsenic = randomBetween(0.002, 0.018);
  
  // Water level and depth
  let waterLevel, depth;
  if (isHilly) {
    waterLevel = randomBetween(3.0, 6.0);
    depth = randomInt(18, 28);
  } else if (isDelta) {
    waterLevel = randomBetween(5.0, 8.0);
    depth = randomInt(22, 32);
  } else {
    waterLevel = randomBetween(8.0, 22.0);
    depth = randomInt(30, 55);
  }
  
  // Yield (LPH)
  let yieldLph;
  if (isHilly) {
    yieldLph = randomInt(2800, 3800);
  } else if (isDelta) {
    yieldLph = randomInt(2800, 3200);
  } else {
    yieldLph = randomInt(1100, 2200);
  }
  
  // Recharge trend
  let trend;
  if (yieldLph < 1000) {
    trend = "Declining";
  } else if (yieldLph > 1800) {
    trend = "Rising";
  } else {
    trend = "Stable";
  }
  
  // Water quality grade
  let grade;
  if (tds < 400 && nitrate < 40 && fluoride < 0.8) {
    grade = "A";
  } else if (tds < 500 && nitrate < 50) {
    grade = "B";
  } else if (tds < 600) {
    grade = "C";
  } else {
    grade = "D";
  }
  
  // Suitable for drinking
  const suitableDrinking = tds < 500 && nitrate < 45 && fluoride < 1.0 && arsenic < 0.01;
  
  // Suitable for irrigation
  const suitableIrrigation = tds < 900;
  
  // Well type
  const wellType = isDelta ? "Open Well" : (randomInt(0, 1) ? "Borewell" : "Tube Well");
  
  // Usage type
  let usageType;
  if (["Tiruppur", "Erode", "Salem", "Ariyalur"].includes(district)) {
    usageType = randomInt(0, 1) ? "Industrial" : "Agricultural";
  } else if (isDelta || ["Krishnagiri", "Dharmapuri"].includes(district)) {
    usageType = "Agricultural";
  } else {
    usageType = randomInt(0, 1) ? "Domestic" : "Agricultural";
  }
  
  // Ownership
  const ownerships = ["Government", "Community", "Private"];
  const ownership = ownerships[randomInt(0, 2)];
  
  // Water source
  const waterSource = districtInfo.aquifer.includes("Alluvial") ? "Unconfined Aquifer" : "Fractured Rock Aquifer";
  
  // Nearby land use
  let landUse;
  if (isCoastal) {
    landUse = "Coastal";
  } else if (["Chennai", "Coimbatore", "Madurai", "Salem"].includes(district)) {
    landUse = "Urban";
  } else if (isDelta) {
    landUse = "Agricultural Paddy";
  } else if (isHilly) {
    landUse = "Hilly";
  } else {
    const landUses = ["Rural", "Agricultural", "Urban"];
    landUse = landUses[randomInt(0, 2)];
  }
  
  // Seasonal variation
  const seasonal = (isDelta || isHilly) ? "High" : (randomInt(0, 1) ? "Moderate" : "Low");
  
  // Infrastructure
  let infrastructure;
  if (usageType === "Industrial") {
    infrastructure = "Industrial pump";
  } else if (isHilly) {
    infrastructure = "Gravity flow";
  } else {
    const infrastructures = ["Submersible pump", "Electric pump", "Hand pump"];
    infrastructure = infrastructures[randomInt(0, 2)];
  }
  
  // Last inspection date (within last 6 months)
  const daysAgo = randomInt(5, 180);
  const lastInspection = new Date();
  lastInspection.setDate(lastInspection.getDate() - daysAgo);
  const inspectionDate = lastInspection.toISOString().split('T')[0];
  
  // Notes
  const notes = [];
  if (tds >= 600) notes.push("High TDS. Requires treatment.");
  if (fluoride >= 1.0) notes.push("High fluoride. Requires defluoridation.");
  if (isCoastal) notes.push("Seawater intrusion risk.");
  if (nitrate >= 50) notes.push("Elevated nitrate levels.");
  if (!suitableDrinking) notes.push("Not suitable for drinking without treatment.");
  const notesStr = notes.length > 0 ? notes.join(" ") : "Stable water quality.";
  
  return {
    id: `TN-${district.substring(0, 3).toUpperCase()}-${String(wellNum).padStart(3, '0')}`,
    name: `${district} Well ${wellNum}`,
    region: districtInfo.region,
    district: district,
    state: "Tamil Nadu",
    lat: parseFloat((districtInfo.lat + randomBetween(-0.2, 0.2)).toFixed(4)),
    lon: parseFloat((districtInfo.lon + randomBetween(-0.2, 0.2)).toFixed(4)),
    aquifer: `${districtInfo.aquifer} Aquifer`,
    tdsLevel: tds,
    pH: parseFloat(pH.toFixed(1)),
    conductivity: conductivity,
    hardness: hardness,
    alkalinity: alkalinity,
    nitrate: nitrate,
    fluoride: parseFloat(fluoride.toFixed(2)),
    chloride: chloride,
    sulfate: sulfate,
    iron: parseFloat(iron.toFixed(2)),
    arsenic: parseFloat(arsenic.toFixed(3)),
    contaminationRisk: risk,
    waterLevelMeters: parseFloat(waterLevel.toFixed(1)),
    depthMeters: depth,
    yieldLph: yieldLph,
    rechargeTrend: trend,
    status: "active",
    lastInspection: inspectionDate,
    wellType: wellType,
    usageType: usageType,
    ownership: ownership,
    waterSource: waterSource,
    waterQualityGrade: grade,
    suitableForDrinking: suitableDrinking,
    suitableForIrrigation: suitableIrrigation,
    nearbyLandUse: landUse,
    seasonalVariation: seasonal,
    infrastructure: infrastructure,
    notes: notesStr
  };
}

// Generate 5-8 wells per district
const allWells = [];
districtsData.forEach(districtInfo => {
  const numWells = randomInt(5, 8);
  for (let i = 1; i <= numWells; i++) {
    allWells.push(generateWellData(districtInfo, i));
  }
});

// Sort by district and well number
allWells.sort((a, b) => {
  if (a.district !== b.district) {
    return a.district.localeCompare(b.district);
  }
  return a.id.localeCompare(b.id);
});

// Write to JSON file
fs.writeFileSync('groundwaterData.json', JSON.stringify(allWells, null, 2), 'utf8');

console.log(`Generated ${allWells.length} wells across ${districtsData.length} districts`);


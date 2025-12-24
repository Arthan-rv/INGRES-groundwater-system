import json
import random
from datetime import datetime, timedelta

# Tamil Nadu districts with coordinates and characteristics
districts_data = [
    {"name": "Chennai", "lat": 13.0827, "lon": 80.2707, "region": "Chennai Metropolitan", "aquifer": "Coastal Alluvial", "coastal": True},
    {"name": "Coimbatore", "lat": 11.0168, "lon": 76.9558, "region": "Kongu Region", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Madurai", "lat": 9.9252, "lon": 78.1198, "region": "Southern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Tiruchirappalli", "lat": 10.7905, "lon": 78.7047, "region": "Central Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Salem", "lat": 11.6643, "lon": 78.1460, "region": "Salem Plateau", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Tiruppur", "lat": 11.1085, "lon": 77.3411, "region": "Kongu Region", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Erode", "lat": 11.3410, "lon": 77.7172, "region": "Kongu Region", "aquifer": "Alluvial", "coastal": False},
    {"name": "Thanjavur", "lat": 10.7865, "lon": 79.1378, "region": "Cauvery Delta", "aquifer": "Deltaic Alluvial", "coastal": False},
    {"name": "Thiruvarur", "lat": 10.7725, "lon": 79.6370, "region": "Cauvery Delta", "aquifer": "Deltaic Alluvial", "coastal": False},
    {"name": "Nagapattinam", "lat": 10.7672, "lon": 79.8449, "region": "Coastal Tamil Nadu", "aquifer": "Coastal Alluvial", "coastal": True},
    {"name": "Cuddalore", "lat": 11.7480, "lon": 79.7714, "region": "Coastal Tamil Nadu", "aquifer": "Coastal Alluvial", "coastal": True},
    {"name": "Karur", "lat": 10.9601, "lon": 78.0766, "region": "Kongu Region", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Dindigul", "lat": 10.3650, "lon": 77.9800, "region": "Southern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Theni", "lat": 10.0104, "lon": 77.4768, "region": "Western Ghats", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Vellore", "lat": 12.9165, "lon": 79.1325, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Kancheepuram", "lat": 12.8342, "lon": 79.7036, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Tiruvallur", "lat": 13.1442, "lon": 79.9084, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Chengalpattu", "lat": 12.6819, "lon": 80.0169, "region": "Northern Tamil Nadu", "aquifer": "Coastal Alluvial", "coastal": True},
    {"name": "Ranipet", "lat": 12.9279, "lon": 79.3316, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Tirupattur", "lat": 12.4970, "lon": 78.5629, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Kallakurichi", "lat": 11.7404, "lon": 78.9592, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Villupuram", "lat": 11.9394, "lon": 79.4924, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Dharmapuri", "lat": 12.1210, "lon": 78.1582, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Krishnagiri", "lat": 12.5196, "lon": 78.2138, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Namakkal", "lat": 11.2213, "lon": 78.1674, "region": "Salem Plateau", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Tenkasi", "lat": 8.9606, "lon": 77.3152, "region": "Western Ghats", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Tirunelveli", "lat": 8.7139, "lon": 77.7567, "region": "Southern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Thoothukudi", "lat": 8.7642, "lon": 78.1348, "region": "Coastal Tamil Nadu", "aquifer": "Coastal Alluvial", "coastal": True},
    {"name": "Kanyakumari", "lat": 8.0883, "lon": 77.5385, "region": "Coastal Tamil Nadu", "aquifer": "Coastal Alluvial", "coastal": True},
    {"name": "Ramanathapuram", "lat": 9.3151, "lon": 78.8307, "region": "Coastal Tamil Nadu", "aquifer": "Coastal Alluvial", "coastal": True},
    {"name": "Sivaganga", "lat": 9.8432, "lon": 78.4808, "region": "Southern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Virudhunagar", "lat": 9.5852, "lon": 77.9608, "region": "Southern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Ariyalur", "lat": 11.1375, "lon": 79.0758, "region": "Central Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Perambalur", "lat": 11.2340, "lon": 78.8832, "region": "Central Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Pudukkottai", "lat": 10.3803, "lon": 78.8204, "region": "Central Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Tiruvannamalai", "lat": 12.2319, "lon": 79.0676, "region": "Northern Tamil Nadu", "aquifer": "Hard Rock", "coastal": False},
    {"name": "Mayiladuthurai", "lat": 11.1035, "lon": 79.6550, "region": "Cauvery Delta", "aquifer": "Deltaic Alluvial", "coastal": False},
    {"name": "Nilgiris", "lat": 11.4102, "lon": 76.6950, "region": "Western Ghats", "aquifer": "Hard Rock", "coastal": False}
]

def generate_well_data(district_info, well_num):
    """Generate realistic groundwater data for a well"""
    district = district_info["name"]
    is_coastal = district_info["coastal"]
    is_delta = "Delta" in district_info["region"]
    is_hilly = "Ghats" in district_info["region"] or district == "Nilgiris" or district == "Theni"
    
    # Base TDS varies by region
    if is_coastal:
        base_tds = random.randint(650, 950)
    elif is_delta:
        base_tds = random.randint(380, 480)
    elif is_hilly:
        base_tds = random.randint(280, 380)
    else:
        base_tds = random.randint(420, 680)
    
    tds = base_tds + random.randint(-30, 30)
    
    # Risk assessment
    if tds >= 600:
        risk = "High"
    elif tds >= 500:
        risk = "Moderate"
    else:
        risk = "Low"
    
    # pH varies slightly
    if is_coastal:
        pH = round(random.uniform(7.7, 8.0), 1)
    else:
        pH = round(random.uniform(6.9, 7.6), 1)
    
    # Conductivity correlates with TDS
    conductivity = int(tds * 1.9 + random.randint(-50, 50))
    
    # Hardness (mg/L as CaCO3)
    hardness = int(tds * 0.38 + random.randint(-20, 20))
    
    # Alkalinity (mg/L)
    alkalinity = int(hardness * 0.6 + random.randint(-15, 15))
    
    # Nitrate (mg/L) - higher in agricultural/industrial areas
    nitrate = random.randint(18, 75)
    
    # Fluoride (mg/L) - varies by region
    if district in ["Madurai", "Dindigul", "Theni"]:
        fluoride = round(random.uniform(0.8, 1.5), 2)
    else:
        fluoride = round(random.uniform(0.4, 1.0), 2)
    
    # Chloride (mg/L) - higher in coastal areas
    if is_coastal:
        chloride = random.randint(300, 450)
    else:
        chloride = random.randint(120, 300)
    
    # Sulfate (mg/L)
    sulfate = int(chloride * 0.45 + random.randint(-20, 20))
    
    # Iron (mg/L)
    iron = round(random.uniform(0.12, 0.4), 2)
    
    # Arsenic (mg/L) - trace amounts
    arsenic = round(random.uniform(0.002, 0.018), 3)
    
    # Water level and depth
    if is_hilly:
        water_level = round(random.uniform(3.0, 6.0), 1)
        depth = random.randint(18, 28)
    elif is_delta:
        water_level = round(random.uniform(5.0, 8.0), 1)
        depth = random.randint(22, 32)
    else:
        water_level = round(random.uniform(8.0, 22.0), 1)
        depth = random.randint(30, 55)
    
    # Yield (LPH)
    if is_hilly:
        yield_lph = random.randint(2800, 3800)
    elif is_delta:
        yield_lph = random.randint(2800, 3200)
    else:
        yield_lph = random.randint(1100, 2200)
    
    # Recharge trend
    if yield_lph < 1000:
        trend = "Declining"
    elif yield_lph > 1800:
        trend = "Rising"
    else:
        trend = "Stable"
    
    # Water quality grade
    if tds < 400 and nitrate < 40 and fluoride < 0.8:
        grade = "A"
    elif tds < 500 and nitrate < 50:
        grade = "B"
    elif tds < 600:
        grade = "C"
    else:
        grade = "D"
    
    # Suitable for drinking
    suitable_drinking = tds < 500 and nitrate < 45 and fluoride < 1.0 and arsenic < 0.01
    
    # Suitable for irrigation
    suitable_irrigation = tds < 900
    
    # Well type
    well_types = ["Borewell", "Open Well", "Tube Well"]
    if is_delta:
        well_type = "Open Well"
    else:
        well_type = random.choice(["Borewell", "Tube Well"])
    
    # Usage type
    usage_types = ["Domestic", "Agricultural", "Industrial"]
    if district in ["Tiruppur", "Erode", "Salem", "Ariyalur"]:
        usage_type = random.choice(["Industrial", "Agricultural"])
    elif is_delta or district in ["Krishnagiri", "Dharmapuri"]:
        usage_type = "Agricultural"
    else:
        usage_type = random.choice(["Domestic", "Agricultural"])
    
    # Ownership
    ownership = random.choice(["Government", "Community", "Private"])
    
    # Water source
    if "Alluvial" in district_info["aquifer"]:
        water_source = "Unconfined Aquifer"
    else:
        water_source = "Fractured Rock Aquifer"
    
    # Nearby land use
    if is_coastal:
        land_use = "Coastal"
    elif district in ["Chennai", "Coimbatore", "Madurai", "Salem"]:
        land_use = "Urban"
    elif is_delta:
        land_use = "Agricultural Paddy"
    elif is_hilly:
        land_use = "Hilly"
    else:
        land_use = random.choice(["Rural", "Agricultural", "Urban"])
    
    # Seasonal variation
    if is_delta or is_hilly:
        seasonal = "High"
    else:
        seasonal = random.choice(["Moderate", "Low"])
    
    # Infrastructure
    infrastructures = ["Submersible pump", "Hand pump", "Electric pump", "Gravity flow", "Industrial pump"]
    if usage_type == "Industrial":
        infrastructure = "Industrial pump"
    elif is_hilly:
        infrastructure = "Gravity flow"
    else:
        infrastructure = random.choice(["Submersible pump", "Electric pump", "Hand pump"])
    
    # Last inspection date (within last 6 months)
    days_ago = random.randint(5, 180)
    last_inspection = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
    
    # Notes
    notes = []
    if tds >= 600:
        notes.append("High TDS. Requires treatment.")
    if fluoride >= 1.0:
        notes.append("High fluoride. Requires defluoridation.")
    if is_coastal:
        notes.append("Seawater intrusion risk.")
    if nitrate >= 50:
        notes.append("Elevated nitrate levels.")
    if not suitable_drinking:
        notes.append("Not suitable for drinking without treatment.")
    
    notes_str = " ".join(notes) if notes else "Stable water quality."
    
    return {
        "id": f"TN-{district[:3].upper()}-{well_num:03d}",
        "name": f"{district} Well {well_num}",
        "region": district_info["region"],
        "district": district,
        "state": "Tamil Nadu",
        "lat": round(district_info["lat"] + random.uniform(-0.2, 0.2), 4),
        "lon": round(district_info["lon"] + random.uniform(-0.2, 0.2), 4),
        "aquifer": f"{district_info['aquifer']} Aquifer",
        "tdsLevel": tds,
        "pH": pH,
        "conductivity": conductivity,
        "hardness": hardness,
        "alkalinity": alkalinity,
        "nitrate": nitrate,
        "fluoride": fluoride,
        "chloride": chloride,
        "sulfate": sulfate,
        "iron": iron,
        "arsenic": arsenic,
        "contaminationRisk": risk,
        "waterLevelMeters": water_level,
        "depthMeters": depth,
        "yieldLph": yield_lph,
        "rechargeTrend": trend,
        "status": "active",
        "lastInspection": last_inspection,
        "wellType": well_type,
        "usageType": usage_type,
        "ownership": ownership,
        "waterSource": water_source,
        "waterQualityGrade": grade,
        "suitableForDrinking": suitable_drinking,
        "suitableForIrrigation": suitable_irrigation,
        "nearbyLandUse": land_use,
        "seasonalVariation": seasonal,
        "infrastructure": infrastructure,
        "notes": notes_str
    }

# Generate 5-8 wells per district
all_wells = []
for district_info in districts_data:
    num_wells = random.randint(5, 8)
    for i in range(1, num_wells + 1):
        well_data = generate_well_data(district_info, i)
        all_wells.append(well_data)

# Sort by district and well number
all_wells.sort(key=lambda x: (x["district"], x["id"]))

# Write to JSON file
with open("groundwaterData.json", "w", encoding="utf-8") as f:
    json.dump(all_wells, f, indent=2, ensure_ascii=False)

print(f"Generated {len(all_wells)} wells across {len(districts_data)} districts")


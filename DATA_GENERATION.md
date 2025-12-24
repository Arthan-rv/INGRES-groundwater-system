# Data Generation Guide

## Current Status

The `groundwaterData.json` file currently contains **41 wells**. To generate a comprehensive dataset with **200+ wells covering all 38 Tamil Nadu districts**, follow these steps:

## Option 1: Using Node.js Script (Recommended)

1. **Navigate to the data directory:**
   ```bash
   cd backend/data
   ```

2. **Run the data generation script:**
   ```bash
   node generate_data.js
   ```

   This will generate 5-8 wells per district (200+ total wells) with all enhanced attributes.

3. **Restart the backend server** or click "🔄 Reload Data" button in Admin Dashboard.

## Option 2: Using Python Script

1. **Navigate to the data directory:**
   ```bash
   cd backend/data
   ```

2. **Run the Python script:**
   ```bash
   python generate_data.py
   ```

   Note: Requires Python 3.x

## Option 3: Convert JSON to CSV

If you want to convert the comprehensive JSON to CSV format:

1. **From project root:**
   ```bash
   node convert_json_to_csv.js
   ```

   This will create/update `backend/data/sample_groundwater.csv` with all attributes.

## Verifying Data Load

After generating data:

1. **Check backend console** - You should see:
   ```
   ✅ Loaded XXX records from primary data file
   📊 Total records loaded: XXX
   📍 Districts covered: 38 (Chennai, Coimbatore, Madurai...)
   ```

2. **In Admin Dashboard:**
   - Click "🔄 Reload Data" button
   - Check "Total observation wells" card - should show 200+
   - Check "Districts covered" card - should show 38

3. **In Map:**
   - Should display all wells across Tamil Nadu
   - Filter buttons should show correct counts

## Troubleshooting

**If wells count is still low:**
1. Verify `backend/data/groundwaterData.json` has the comprehensive data
2. Check backend console for loading messages
3. Click "🔄 Reload Data" in Admin Dashboard
4. Refresh the browser page

**If map doesn't update:**
1. Click "🔄 Reload Data" button
2. Refresh the browser page
3. Check browser console for errors

## Data Structure

Each well includes:
- **Basic Info:** id, name, district, region, coordinates
- **Water Quality:** TDS, pH, conductivity, hardness, alkalinity, nitrate, fluoride, chloride, sulfate, iron, arsenic
- **Well Details:** type, usage, ownership, water source, depth, water level, yield
- **Status:** contamination risk, recharge trend, quality grade, suitability
- **Metadata:** last inspection, infrastructure, nearby land use, seasonal variation

## Expected Results

After generating comprehensive data:
- **Total Wells:** 200-300+ (5-8 per district × 38 districts)
- **Districts:** All 38 Tamil Nadu districts
- **Regions:** Chennai Metropolitan, Kongu Region, Cauvery Delta, Coastal Tamil Nadu, etc.
- **Map Markers:** Color-coded by risk level across Tamil Nadu


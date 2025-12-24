const fs = require('fs');
const path = require('path');

// Read JSON file
const jsonPath = path.join(__dirname, 'groundwaterData.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// CSV headers with all attributes
const headers = [
  'site_id', 'name', 'lat', 'lon', 'district', 'state', 'region', 'aquifer',
  'survey_date', 'depth_m', 'static_water_level_m', 'yield_lph', 'tds', 'pH', 'conductivity',
  'hardness', 'alkalinity', 'nitrate', 'fluoride', 'chloride', 'sulfate', 'iron', 'arsenic',
  'contaminationRisk', 'rechargeTrend', 'status', 'wellType', 'usageType', 'ownership',
  'waterSource', 'waterQualityGrade', 'suitableForDrinking', 'suitableForIrrigation',
  'nearbyLandUse', 'seasonalVariation', 'infrastructure', 'notes'
];

// Convert to CSV rows
const csvRows = [headers.join(',')];

data.forEach(well => {
  const row = headers.map(header => {
    let value = '';
    
    switch(header) {
      case 'site_id': value = well.id || ''; break;
      case 'name': value = well.name || ''; break;
      case 'lat': value = well.lat || ''; break;
      case 'lon': value = well.lon || ''; break;
      case 'district': value = well.district || ''; break;
      case 'state': value = well.state || ''; break;
      case 'region': value = well.region || ''; break;
      case 'aquifer': value = well.aquifer || ''; break;
      case 'survey_date': value = well.lastInspection || ''; break;
      case 'depth_m': value = well.depthMeters || ''; break;
      case 'static_water_level_m': value = well.waterLevelMeters || ''; break;
      case 'yield_lph': value = well.yieldLph || ''; break;
      case 'tds': value = well.tdsLevel || ''; break;
      case 'pH': value = well.pH || ''; break;
      case 'conductivity': value = well.conductivity || ''; break;
      case 'hardness': value = well.hardness || ''; break;
      case 'alkalinity': value = well.alkalinity || ''; break;
      case 'nitrate': value = well.nitrate || ''; break;
      case 'fluoride': value = well.fluoride || ''; break;
      case 'chloride': value = well.chloride || ''; break;
      case 'sulfate': value = well.sulfate || ''; break;
      case 'iron': value = well.iron || ''; break;
      case 'arsenic': value = well.arsenic || ''; break;
      case 'contaminationRisk': value = well.contaminationRisk || ''; break;
      case 'rechargeTrend': value = well.rechargeTrend || ''; break;
      case 'status': value = well.status || ''; break;
      case 'wellType': value = well.wellType || ''; break;
      case 'usageType': value = well.usageType || ''; break;
      case 'ownership': value = well.ownership || ''; break;
      case 'waterSource': value = well.waterSource || ''; break;
      case 'waterQualityGrade': value = well.waterQualityGrade || ''; break;
      case 'suitableForDrinking': value = well.suitableForDrinking !== undefined ? well.suitableForDrinking : ''; break;
      case 'suitableForIrrigation': value = well.suitableForIrrigation !== undefined ? well.suitableForIrrigation : ''; break;
      case 'nearbyLandUse': value = well.nearbyLandUse || ''; break;
      case 'seasonalVariation': value = well.seasonalVariation || ''; break;
      case 'infrastructure': value = well.infrastructure || ''; break;
      case 'notes': value = (well.notes || '').replace(/,/g, ';').replace(/"/g, "'"); break;
      default: value = well[header] || '';
    }
    
    // Escape commas and quotes in CSV
    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
      value = `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  });
  
  csvRows.push(row.join(','));
});

// Write CSV file
const csvPath = path.join(__dirname, 'sample_groundwater.csv');
fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');

console.log(`Converted ${data.length} wells to CSV`);
console.log(`CSV file written to: ${csvPath}`);


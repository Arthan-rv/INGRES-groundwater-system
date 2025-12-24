import { useState, useEffect } from 'react';
import { fetchMapData } from '../services/api.js';

const WellsMap = ({ token, onWellSelect, refreshTrigger }) => {
  const [wells, setWells] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedWell, setSelectedWell] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [mapLoaded, setMapLoaded] = useState(false);

  const loadMapData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMapData(token);
      setWells(data.wells || []);
      setStats(data.stats || null);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load map data');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, [token, refreshTrigger]);

  // Load Leaflet CSS dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize map after Leaflet loads
  useEffect(() => {
    if (!mapLoaded || loading || !wells.length) return;

    const L = window.L;
    if (!L) return;

    // Check if map already exists
    const container = document.getElementById('wells-map');
    if (!container) return;
    
    // Clear existing map
    container.innerHTML = '';

    // Tamil Nadu center coordinates
    const map = L.map('wells-map').setView([10.8505, 78.0000], 7);

    // Add tile layer (OpenStreetMap - default map view)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Custom marker icons based on risk
    const createIcon = (risk) => {
      const colors = {
        High: '#ef4444',
        Moderate: '#f59e0b',
        Low: '#10b981'
      };
      
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${colors[risk] || '#6366f1'};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        ">💧</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    };

    // Filter wells based on selection
    const filteredWells = filter === 'all' 
      ? wells 
      : wells.filter(w => w.contaminationRisk === filter);

    // Add markers for each well
    filteredWells.forEach(well => {
      if (!well.lat || !well.lon) return;

      const marker = L.marker([well.lat, well.lon], {
        icon: createIcon(well.contaminationRisk)
      }).addTo(map);

      // Create popup content with enhanced attributes
      const popupContent = `
        <div style="min-width: 220px; font-family: system-ui;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">${well.name}</h4>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;">
            📍 ${well.district}, ${well.region}
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 8px; font-size: 11px;">
            <div><strong>TDS:</strong> ${well.tdsLevel} mg/L</div>
            <div><strong>pH:</strong> ${well.pH || 'N/A'}</div>
            <div><strong>Yield:</strong> ${well.yieldLph} LPH</div>
            <div><strong>Water Level:</strong> ${well.waterLevelMeters}m</div>
            ${well.fluoride ? `<div><strong>Fluoride:</strong> ${well.fluoride} mg/L</div>` : ''}
            ${well.nitrate ? `<div><strong>Nitrate:</strong> ${well.nitrate} mg/L</div>` : ''}
            ${well.waterQualityGrade ? `<div><strong>Grade:</strong> ${well.waterQualityGrade}</div>` : ''}
            ${well.suitableForDrinking !== undefined ? `<div><strong>Drinking:</strong> ${well.suitableForDrinking ? '✅' : '❌'}</div>` : ''}
          </div>
          <div style="margin-top: 8px; padding: 4px 8px; border-radius: 4px; text-align: center; font-size: 11px; font-weight: 600;
            background: ${well.contaminationRisk === 'High' ? '#fef2f2' : well.contaminationRisk === 'Moderate' ? '#fffbeb' : '#f0fdf4'};
            color: ${well.contaminationRisk === 'High' ? '#dc2626' : well.contaminationRisk === 'Moderate' ? '#d97706' : '#16a34a'};">
            ${well.contaminationRisk} Risk
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      marker.on('click', () => {
        setSelectedWell(well);
        if (onWellSelect) onWellSelect(well);
      });
    });

    // Cleanup
    return () => {
      map.remove();
    };
  }, [mapLoaded, wells, loading, filter, onWellSelect]);

  if (loading) {
    return (
      <div className="map-container loading">
        <div className="map-loader">
          <div className="spinner"></div>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container error">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <div className="map-header">
        <div className="map-title">
          <h3>🗺️ Wells Map</h3>
          <span className="map-subtitle">{wells.length} wells across Tamil Nadu</span>
        </div>
        <div className="map-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({stats?.total || 0})
          </button>
          <button 
            className={`filter-btn high ${filter === 'High' ? 'active' : ''}`}
            onClick={() => setFilter('High')}
          >
            High Risk ({stats?.byRisk?.high || 0})
          </button>
          <button 
            className={`filter-btn moderate ${filter === 'Moderate' ? 'active' : ''}`}
            onClick={() => setFilter('Moderate')}
          >
            Moderate ({stats?.byRisk?.moderate || 0})
          </button>
          <button 
            className={`filter-btn low ${filter === 'Low' ? 'active' : ''}`}
            onClick={() => setFilter('Low')}
          >
            Low Risk ({stats?.byRisk?.low || 0})
          </button>
        </div>
      </div>
      
      <div id="wells-map" className="map-container"></div>
      
      {selectedWell && (
        <div className="selected-well-card">
          <button className="close-btn" onClick={() => setSelectedWell(null)}>×</button>
          <h4>{selectedWell.name}</h4>
          <p className="well-location">📍 {selectedWell.district}, {selectedWell.region}</p>
          <div className="well-stats">
            <div className="stat">
              <span className="label">TDS</span>
              <span className="value">{selectedWell.tdsLevel} mg/L</span>
            </div>
            <div className="stat">
              <span className="label">pH</span>
              <span className="value">{selectedWell.pH || 'N/A'}</span>
            </div>
            <div className="stat">
              <span className="label">Yield</span>
              <span className="value">{selectedWell.yieldLph} LPH</span>
            </div>
            <div className="stat">
              <span className="label">Water Level</span>
              <span className="value">{selectedWell.waterLevelMeters}m</span>
            </div>
            {selectedWell.fluoride && (
              <div className="stat">
                <span className="label">Fluoride</span>
                <span className="value">{selectedWell.fluoride} mg/L</span>
              </div>
            )}
            {selectedWell.nitrate && (
              <div className="stat">
                <span className="label">Nitrate</span>
                <span className="value">{selectedWell.nitrate} mg/L</span>
              </div>
            )}
            {selectedWell.waterQualityGrade && (
              <div className="stat">
                <span className="label">Quality Grade</span>
                <span className="value">{selectedWell.waterQualityGrade}</span>
              </div>
            )}
            {selectedWell.suitableForDrinking !== undefined && (
              <div className="stat">
                <span className="label">Drinking</span>
                <span className="value">{selectedWell.suitableForDrinking ? '✅ Suitable' : '❌ Not Suitable'}</span>
              </div>
            )}
            {selectedWell.usageType && (
              <div className="stat">
                <span className="label">Usage</span>
                <span className="value">{selectedWell.usageType}</span>
              </div>
            )}
          </div>
          <div className={`risk-badge ${selectedWell.contaminationRisk.toLowerCase()}`}>
            {selectedWell.contaminationRisk} Risk
          </div>
        </div>
      )}

      {stats && (
        <div className="map-legend">
          <h4>Districts</h4>
          <div className="legend-items">
            {stats.byDistrict?.slice(0, 8).map(d => (
              <div key={d.name} className="legend-item">
                <span className="legend-name">{d.name}</span>
                <span className="legend-count">{d.count}</span>
              </div>
            ))}
            {stats.byDistrict?.length > 8 && (
              <div className="legend-item more">
                +{stats.byDistrict.length - 8} more districts
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WellsMap;


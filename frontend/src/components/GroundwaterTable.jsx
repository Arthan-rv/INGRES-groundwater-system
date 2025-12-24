import { useMemo, useState } from 'react';

const columns = [
  { key: 'region', label: 'Region' },
  { key: 'aquifer', label: 'Aquifer type' },
  { key: 'tdsLevel', label: 'TDS (mg/L)' },
  { key: 'contaminationRisk', label: 'Risk' },
  { key: 'waterLevelMeters', label: 'Water level (m bgl)' },
  { key: 'rechargeTrend', label: 'Recharge trend' },
  { key: 'lastInspection', label: 'Last inspection' }
];

const GroundwaterTable = ({ records = [], isLoading }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return records;
    const term = query.toLowerCase();
    return records.filter(
      (row) =>
        row.region.toLowerCase().includes(term) ||
        row.aquifer.toLowerCase().includes(term) ||
        row.contaminationRisk.toLowerCase().includes(term)
    );
  }, [records, query]);

  return (
    <section className="table-card">
      <header>
        <div>
          <h3>Groundwater cells</h3>
          <p className="muted">Live feed from the latest uploaded CSV</p>
        </div>
        <input
          type="search"
          placeholder="Search region or risk"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>
      {isLoading ? (
        <div className="table-empty">Loading dataset…</div>
      ) : filtered.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id || row.region}>
                  {columns.map((col) => (
                    <td key={col.key}>{row[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-empty">No records found for "{query}".</div>
      )}
    </section>
  );
};

export default GroundwaterTable;


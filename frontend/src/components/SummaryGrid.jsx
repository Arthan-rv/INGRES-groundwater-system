const formatMetric = (value, fallback = '—') => {
  if (value === null || value === undefined) return fallback;
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString() : value;
};

const SummaryGrid = ({ overview }) => {
  if (!overview) {
    return (
      <div className="summary-grid empty" style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontStyle: 'italic',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5, animation: 'float 3s ease-in-out infinite' }}>📈</div>
        <div>No telemetry available yet.</div>
      </div>
    );
  }

  const cards = [
    { label: 'Total observation wells', value: formatMetric(overview.totalSites || 0), accent: 'primary' },
    { label: 'Active wells', value: formatMetric(overview.activeSites || 0), accent: 'primary' },
    { label: 'Average TDS (mg/L)', value: formatMetric(overview.avgTds), accent: 'amber' },
    { label: 'High risk cells', value: formatMetric(overview.highRiskSites || 0), accent: 'danger' },
    { label: 'Moderate risk cells', value: formatMetric(overview.moderateRiskSites || 0), accent: 'warning' },
    { label: 'Safe TDS (<500 mg/L)', value: formatMetric(overview.safeSites || 0), accent: 'success' },
    { label: 'Districts covered', value: formatMetric(overview.districts?.length || 0), accent: 'secondary' },
    { label: 'Latest inspection', value: overview.latestInspection || 'Not recorded', accent: 'secondary' }
  ];

  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <article key={card.label} className={`summary-card ${card.accent}`}>
          <p>{card.label}</p>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  );
};

export default SummaryGrid;


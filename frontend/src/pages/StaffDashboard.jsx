import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import SummaryGrid from '../components/SummaryGrid.jsx';
import GroundwaterTable from '../components/GroundwaterTable.jsx';
import { fetchOverview, fetchRecords } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const StaffDashboard = () => {
  const { user, token, logout } = useAuth();
  const [overview, setOverview] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewResponse, recordResponse] = await Promise.all([
        fetchOverview(token),
        fetchRecords(token)
      ]);
      setOverview(overviewResponse.overview);
      setRecords(recordResponse.records);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <DashboardLayout
      user={user}
      title="Staff monitoring console"
      subtitle="Track TDS, contamination, and water-level alerts. Uploads are limited to admin."
      onLogout={logout}
    >
      {error && <div className="form-error">{error}</div>}
      <SummaryGrid overview={overview} />
      <section className="status-card">
        <h3>What you can do</h3>
        <ul>
          <li>Watch live groundwater metrics</li>
          <li>Use the chatbot for site-specific answers</li>
          <li>Flag anomalies to administrators</li>
        </ul>
        <p className="muted">CSV uploads remain restricted to admin accounts.</p>
      </section>
      <GroundwaterTable records={records} isLoading={loading} />
    </DashboardLayout>
  );
};

export default StaffDashboard;


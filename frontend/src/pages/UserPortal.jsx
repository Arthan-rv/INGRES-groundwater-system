import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import SummaryGrid from '../components/SummaryGrid.jsx';
import { fetchOverview } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const UserPortal = () => {
  const { user, token, logout } = useAuth();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchOverview(token);
        setOverview(response.overview);
      } catch (err) {
        setError(err.message || 'Unable to fetch overview');
      }
    };
    load();
  }, [token]);

  return (
    <DashboardLayout
      user={user}
      title="Observer workspace"
      subtitle="Get a high-level snapshot and converse with the groundwater assistant."
      onLogout={logout}
    >
      {error && <div className="form-error">{error}</div>}
      <SummaryGrid overview={overview} />
      <section className="status-card">
        <h3>Why this view is limited</h3>
        <p>
          To protect sensitive hydrogeological data, only summary metrics are exposed here. Use the
          chatbot for contextual answers that are safe for field circulation.
        </p>
      </section>
    </DashboardLayout>
  );
};

export default UserPortal;


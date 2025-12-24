import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import SummaryGrid from '../components/SummaryGrid.jsx';
import GroundwaterTable from '../components/GroundwaterTable.jsx';
import AdminUpload from '../components/AdminUpload.jsx';
import { fetchOverview, fetchRecords, uploadCsv, reloadData } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const [overview, setOverview] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const handleUpload = async (file) => {
    setUploading(true);
    setError('');
    try {
      const response = await uploadCsv(file, token);
      setNotice(response.message);
      await loadData();
    } catch (err) {
      setError(err.message || 'CSV upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setNotice(''), 4000);
    }
  };

  const handleReloadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await reloadData(token);
      setNotice(`✅ ${response.message} - ${response.totalWells} wells across ${response.districts} districts`);
      await loadData();
      // Trigger map refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err.message || 'Failed to reload data');
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 6000);
    }
  };

  return (
    <DashboardLayout
      user={user}
      title="Administrator dashboard"
      subtitle="Add new groundwater CSVs, monitor system health, and talk to the assistant."
      onLogout={logout}
      actions={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleReloadData} 
            disabled={loading}
            className="reload-btn"
            style={{
              padding: '10px 20px',
              background: loading 
                ? 'var(--color-text-muted)' 
                : 'linear-gradient(135deg, var(--color-accent) 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              letterSpacing: '0.01em'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
              }
            }}
          >
            <span style={{ 
              display: 'inline-block',
              animation: loading ? 'spin 1s linear infinite' : 'none'
            }}>
              🔄
            </span>
            {loading ? 'Reloading...' : 'Reload Data'}
          </button>
          {notice && (
            <div className="toast success" style={{ animation: 'slideInRight 0.4s ease-out' }}>
              <span>{notice}</span>
            </div>
          )}
        </div>
      }
    >
      {error && <div className="form-error">{error}</div>}
      <SummaryGrid overview={overview} />
      <AdminUpload onUpload={handleUpload} isUploading={uploading} />
      <GroundwaterTable records={records} isLoading={loading} />
    </DashboardLayout>
  );
};

export default AdminDashboard;


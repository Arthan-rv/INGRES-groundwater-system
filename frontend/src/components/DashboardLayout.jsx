import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

const roleLabels = {
  admin: 'Administrator',
  staff: 'Monitoring Staff',
  common: 'Observer'
};

const DashboardLayout = ({ user, title, subtitle, actions, children, onLogout }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">INGRES • Groundwater Console</p>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="user-chip">
          <button 
            type="button" 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          <div>
            <strong>{user?.name}</strong>
            <span>{roleLabels[user?.role] || user?.role}</span>
          </div>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>
      {actions && <div className="dashboard-actions">{actions}</div>}
      <div className="dashboard-actions">
        <Link to="/chat" className="chat-link-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Chat with Assistant
        </Link>
      </div>
      <main className="dashboard-content">{children}</main>
    </div>
  );
};

export default DashboardLayout;

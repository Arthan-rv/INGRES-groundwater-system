import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAuth } from './context/AuthContext.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import StaffDashboard from './pages/StaffDashboard.jsx';
import UserPortal from './pages/UserPortal.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChatbotPage from './pages/ChatbotPage.jsx';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Guest users go to chat
    if (user.role === 'guest') {
      return <Navigate to="/chat" replace />;
    }
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated && user ? (
            user.role === 'guest' || user.role === 'common' ? (
              <Navigate to="/chat" replace />
            ) : (
              <Navigate to={`/${user.role}`} replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={isAuthenticated && user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />}
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/common"
        element={
          <ProtectedRoute allowedRoles={['common']}>
            <UserPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute allowedRoles={['admin', 'staff', 'common', 'guest']}>
            <ChatbotPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guest"
        element={
          <ProtectedRoute allowedRoles={['guest']}>
            <ChatbotPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

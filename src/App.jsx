import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  getSession, 
  checkAdminStatus, 
  onAuthStateChange 
} from './api/auth';

// Components
import LoadingSpinner from './components/LoadingSpinner';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Pages
import AuthScreen from './pages/AuthScreen';
import DashboardOverview from './pages/DashboardOverview';
import EventRegistry from './pages/EventRegistry';
import OperatorManifest from './pages/OperatorManifest';
import GateControl from './pages/GateControl';
import GuestListPortal from './pages/GuestListPortal';
import EventAnalytics from './pages/EventAnalytics';

const AppRoutes = ({ user, isAdmin, isVolunteer, isActive, loading }) => {
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  const isAuthorized = (isAdmin || isVolunteer) && isActive;
  const userRole = isAdmin ? 'admin' : 'volunteer';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-green-500/30 selection:text-slate-950 italic">
      <Routes>
        {/* Public Route */}
        <Route 
          path="/login" 
          element={
            !user ? (
              <AuthScreen />
            ) : (
              <Navigate to={location.state?.from?.pathname || "/events"} replace />
            )
          } 
        />

        {/* Protected Routes wrapped in AppLayout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute user={user} isAdmin={isAuthorized} loading={loading}>
              <AppLayout userRole={userRole}>
                <DashboardOverview userRole={userRole} />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/events" 
          element={
            <ProtectedRoute user={user} isAdmin={isAuthorized} loading={loading}>
              <AppLayout userRole={userRole}>
                <EventRegistry userRole={userRole} />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/operators" 
          element={
            <ProtectedRoute user={user} isAdmin={isAdmin && isActive} loading={loading}>
              <AppLayout userRole={userRole}>
                <OperatorManifest />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Event Specific Routes (can also be wrapped or kept standalone) */}
        <Route 
          path="/event/:id/gate" 
          element={
            <ProtectedRoute user={user} isAdmin={isAuthorized} loading={loading}>
              <AppLayout userRole={userRole}>
                <GateControl />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/event/:id/guests" 
          element={
            <ProtectedRoute user={user} isAdmin={isAuthorized} loading={loading}>
              <AppLayout userRole={userRole}>
                <GuestListPortal />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/event/:id/analytics" 
          element={
            <ProtectedRoute user={user} isAdmin={isAdmin && isActive} loading={loading}>
              <AppLayout userRole={userRole}>
                <EventAnalytics />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'volunteer'
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Memoize the admin check to prevent unnecessary re-runs
  const verifyUserRole = useCallback(async (email) => {
    if (!email) return { role: null, active: false };
    try {
      const { data, error } = await checkAdminStatus(email);
      if (error) {
        console.error("User verification error:", error);
        return { role: null, active: false };
      }
      return { role: data?.role || null, active: data?.is_active || false };
    } catch (err) {
      console.error("Critical User Check Fault:", err);
      return { role: null, active: false };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authListener = null;

    const initAuth = async () => {
      try {
        const { data: { session } } = await getSession();
        
        if (session && isMounted) {
          setUser(session.user);
          const { role, active } = await verifyUserRole(session.user.email);
          if (isMounted) {
            setUserRole(role);
            setIsActive(active);
          }
        }
      } catch (err) {
        console.error("Session recovery failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }

      const { data: { subscription } } = onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (session) {
          setUser(session.user);
          const { role, active } = await verifyUserRole(session.user.email);
          if (isMounted) {
            setUserRole(role);
            setIsActive(active);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setUserRole(null);
            setIsActive(false);
            setLoading(false);
          }
        }
      });
      authListener = subscription;
    };

    initAuth();

    return () => {
      isMounted = false;
      if (authListener) authListener.unsubscribe();
    };
  }, [verifyUserRole]);

  return (
    <BrowserRouter>
      <AppRoutes 
        user={user} 
        isAdmin={userRole === 'admin'} 
        isVolunteer={userRole === 'volunteer'} 
        isActive={isActive}
        loading={loading} 
      />
    </BrowserRouter>
  );
}

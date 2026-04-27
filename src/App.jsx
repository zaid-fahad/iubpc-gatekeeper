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

// Pages
import AuthScreen from './pages/AuthScreen';
import AdminDashboard from './pages/AdminDashboard';
import GateControl from './pages/GateControl';
import GuestListPortal from './pages/GuestListPortal';
import EventAnalytics from './pages/EventAnalytics';

const AppRoutes = ({ user, isAdmin, loading }) => {
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-green-500/30 selection:text-slate-950 italic">
      <Routes>
        {/* Public Route */}
        <Route 
          path="/login" 
          element={
            !user ? (
              <AuthScreen />
            ) : (
              // Redirect back to the page they were trying to access, or dashboard
              <Navigate to={location.state?.from?.pathname || "/"} replace />
            )
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute user={user} isAdmin={isAdmin} loading={loading}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/event/:id/gate" 
          element={
            <ProtectedRoute user={user} isAdmin={isAdmin} loading={loading}>
              <GateControl />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/event/:id/guests" 
          element={
            <ProtectedRoute user={user} isAdmin={isAdmin} loading={loading}>
              <GuestListPortal />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/event/:id/analytics" 
          element={
            <ProtectedRoute user={user} isAdmin={isAdmin} loading={loading}>
              <EventAnalytics />
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Memoize the admin check to prevent unnecessary re-runs
  const verifyAdmin = useCallback(async (email) => {
    if (!email) return false;
    try {
      const { data, error } = await checkAdminStatus(email);
      if (error) {
        console.error("Admin verification error:", error);
        return false;
      }
      return !!data;
    } catch (err) {
      console.error("Critical Admin Check Fault:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authListener = null;

    const initAuth = async () => {
      try {
        // 1. Initial Session Check (Sync-like recovery from LocalStorage)
        const { data: { session } } = await getSession();
        
        if (session && isMounted) {
          setUser(session.user);
          const adminStatus = await verifyAdmin(session.user.email);
          if (isMounted) {
            setIsAdmin(adminStatus);
          }
        }
      } catch (err) {
        console.error("Session recovery failed:", err);
      } finally {
        // Only release loading if we finished the initial check 
        // AND haven't been unmounted.
        if (isMounted) setLoading(false);
      }

      // 2. Setup long-running listener for all auth changes
      const { data: { subscription } } = onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (session) {
          setUser(session.user);
          const adminStatus = await verifyAdmin(session.user.email);
          if (isMounted) {
            setIsAdmin(adminStatus);
            setLoading(false);
          }
        } else {
          // Explicit logout or session expiry
          if (isMounted) {
            setUser(null);
            setIsAdmin(false);
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
  }, [verifyAdmin]);

  return (
    <BrowserRouter>
      <AppRoutes user={user} isAdmin={isAdmin} loading={loading} />
    </BrowserRouter>
  );
}

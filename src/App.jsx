import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
        try {
            const { data: { session } } = await getSession();
            if (session && isMounted) {
                const email = session.user.email || "";
                setUser(session.user);
                
                const { data: adminCheck } = await checkAdminStatus(email);
                if (isMounted) setIsAdmin(!!adminCheck);
            }
        } catch (err) {
            console.error("Critical Auth Fault:", err);
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    initialize();

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session) {
        setUser(session.user);
        const email = session.user.email || "";
        const { data: adminCheck } = await checkAdminStatus(email);
        if (isMounted) {
          setIsAdmin(!!adminCheck);
          setLoading(false);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    });

    const safety = setTimeout(() => { if (isMounted) setLoading(false); }, 5000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safety);
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-green-500/30 selection:text-slate-950 italic">
        <Routes>
          {/* Public Route */}
          <Route 
            path="/login" 
            element={!user ? <AuthScreen /> : <Navigate to="/" replace />} 
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
    </BrowserRouter>
  );
}

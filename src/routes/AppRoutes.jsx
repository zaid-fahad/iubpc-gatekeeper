import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner, ProtectedRoute } from '../components';
import AppLayout from '../layouts/AppLayout';
import { 
  AuthScreen, DashboardOverview, EventRegistry, OperatorManifest, 
  GateControl, GuestListPortal, EventAnalytics, SelfEntryKiosk,
  CertificateDesigner, PublicCertificateVerification, CertificatesModule
} from '../pages';

const AppRoutes = ({ user, isAdmin, isVolunteer, isActive, loading }) => {
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  const isAuthorized = (isAdmin || isVolunteer) && isActive;
  const userRole = isAdmin ? 'admin' : 'volunteer';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-green-500/30 selection:text-slate-950 italic">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Authentication & Certificate Verification Routes */}
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

          <Route 
            path="/verify" 
            element={<PublicCertificateVerification />} 
          />
          <Route 
            path="/verify/:certificateNumber" 
            element={<PublicCertificateVerification />} 
          />
          <Route 
            path="/certificate/:certificateNumber" 
            element={<PublicCertificateVerification />} 
          />

          {/* Protected Main App Multi-Page Routes Wrapped in Layout */}
          <Route 
            element={
              <ProtectedRoute user={user} isAdmin={isAuthorized} loading={loading}>
                <AppLayout userRole={userRole} />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardOverview userRole={userRole} />} />
            <Route path="/events" element={<EventRegistry userRole={userRole} />} />
            <Route 
              path="/certificates" 
              element={
                <ProtectedRoute user={user} isAdmin={isAdmin && isActive} loading={loading}>
                  <CertificatesModule userRole={userRole} />
                </ProtectedRoute>
              } 
            />
            
            {/* Staff Management Route */}
            <Route 
              path="/operators" 
              element={
                <ProtectedRoute user={user} isAdmin={isAdmin && isActive} loading={loading}>
                  <OperatorManifest />
                </ProtectedRoute>
              } 
            />

            {/* Event Portal Multi-Page Routes */}
            <Route path="/events/:id/gate" element={<GateControl userRole={userRole} />} />
            <Route path="/events/:id/guests" element={<GuestListPortal userRole={userRole} />} />
            <Route path="/events/:id/guest" element={<GuestListPortal userRole={userRole} />} />
            <Route 
              path="/events/:id/analytics" 
              element={
                <ProtectedRoute user={user} isAdmin={isAdmin && isActive} loading={loading}>
                  <EventAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route path="/events/:id/certificate-designer" element={<CertificateDesigner />} />
            <Route path="/events/:id" element={<Navigate to="gate" replace />} />
          </Route>

          {/* Standalone Full-Screen Kiosk Route */}
          <Route 
            path="/events/:id/kiosk" 
            element={
              <ProtectedRoute user={user} isAdmin={isAuthorized} loading={loading}>
                <SelfEntryKiosk />
              </ProtectedRoute>
            } 
          />

          {/* Backward Compatibility Redirects */}
          <Route path="/event/:id/gate" element={<Navigate to="/events/:id/gate" replace />} />
          <Route path="/event/:id/guests" element={<Navigate to="/events/:id/guests" replace />} />
          <Route path="/event/:id/analytics" element={<Navigate to="/events/:id/analytics" replace />} />
          <Route path="/event/:id/kiosk" element={<Navigate to="/events/:id/kiosk" replace />} />

          {/* Fallback Catch-All Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default AppRoutes;

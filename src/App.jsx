import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { getSession, checkAdminStatus, onAuthStateChange } from './api/auth';
import { AppRoutes } from './routes';
import { applyPortalSettings } from './utils/portalSettings';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'volunteer'
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Apply saved theme settings on mount & listen for live setting changes
  useEffect(() => {
    applyPortalSettings();
    const handleSettingsChange = () => {
      applyPortalSettings();
    };
    window.addEventListener('portal_settings_changed', handleSettingsChange);
    return () => {
      window.removeEventListener('portal_settings_changed', handleSettingsChange);
    };
  }, []);

  // Memoize admin check to prevent unnecessary re-runs
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
          setUser(prevUser => {
            if (prevUser?.id !== session.user.id || event === 'SIGNED_IN') {
              verifyUserRole(session.user.email).then(({ role, active }) => {
                if (isMounted) {
                  setUserRole(role);
                  setIsActive(active);
                }
              });
            }
            return session.user;
          });
        } else {
          setUser(null);
          setUserRole(null);
          setIsActive(false);
        }
        
        if (isMounted) setLoading(false);
      });
      
      if (!isMounted) {
        subscription.unsubscribe();
      } else {
        authListener = subscription;
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
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

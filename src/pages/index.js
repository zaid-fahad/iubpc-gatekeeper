import { lazy } from 'react';

// Dynamic Code-Splitting for Multi-Page Performance
export const AuthScreen = lazy(() => import('./AuthScreen'));
export const DashboardOverview = lazy(() => import('./DashboardOverview'));
export const EventRegistry = lazy(() => import('./EventRegistry'));
export const OperatorManifest = lazy(() => import('./OperatorManifest'));
export const GateControl = lazy(() => import('./GateControl'));
export const GuestListPortal = lazy(() => import('./GuestListPortal'));
export const EventAnalytics = lazy(() => import('./EventAnalytics'));
export const SelfEntryKiosk = lazy(() => import('./SelfEntryKiosk'));
export const CertificateDesigner = lazy(() => import('./CertificateDesigner'));
export const PublicCertificateVerification = lazy(() => import('./PublicCertificateVerification'));
export const CertificatesModule = lazy(() => import('./CertificatesModule'));
export const CreateEditEventPage = lazy(() => import('./CreateEditEventPage'));
export const PublicEventRegistrationPage = lazy(() => import('./PublicEventRegistrationPage'));
export const PortalSettingsPage = lazy(() => import('./PortalSettingsPage'));

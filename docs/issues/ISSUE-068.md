# Issue #68: Codebase Architecture Deepening & Optimization

## Goal
Refactor `PublicEventRegistrationPage.jsx` into a deep custom hook (`usePublicRegistration`) and modular subcomponents, and unify portal theme synchronization via `PortalThemeProvider`.

## Technical Scope
1. **`usePublicRegistration` Hook**: Encapsulates event fetching, base64 photo encoding, fallback guest ID generation (`GUEST-XXXX`), payload validation, and submission logic.
2. **`PortalThemeProvider`**: Unified React Context providing reactive theme state (`isLightMode`, `settings`) across all components, replacing scattered window event listeners and direct DOM queries.
3. **Clean Component Architecture**: Streamlines `PublicEventRegistrationPage.jsx` from 710 lines down to a concise, readable layout.

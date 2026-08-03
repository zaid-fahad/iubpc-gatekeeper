# Issue #021: Add IRAS API Configuration Page & Automated Token Auth Lifecycle

## Type
Feature (`feature/issue-21-iras-api-auth-config`)

## Status
In Progress

## GitHub Link
https://github.com/zaid-fahad/iubpc-gatekeeper/issues/21

## Description
Build IRAS API Configuration management and automated token authentication lifecycle for Student API lookup.

Key features:
- Dedicated configuration module `src/api/iras.js` handling `https://irastools.pages.dev/api/login`.
- IRAS Config Page (`src/pages/IrasApiConfig.jsx`) accessible to Admins under `/settings/iras`.
- Secure credential persistence and cached `access_token` expiration management.
- Injection of `Authorization` headers when calling `https://irastools.pages.dev/api/student/:id`.

## Deliverables
- `src/api/iras.js`
- `src/pages/IrasApiConfig.jsx`
- Route `/settings/iras` in `src/App.jsx`
- Navigation link in `AppLayout.jsx`
- Verified build `npm run build`.

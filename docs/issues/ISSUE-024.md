# Issue #024: Remove IRAS API Integration & Revert External Student Lookup

## Type
Refactor (`feature/issue-24-remove-iras-api`)

## Status
In Progress

## GitHub Link
https://github.com/zaid-fahad/iubpc-gatekeeper/issues/24

## Description
Completely remove the IRAS API integration, external student lookup, and API config pages from the application codebase, while retaining the core Self-Entry Kiosk screen for event check-ins.

Key changes:
- Delete `src/api/iras.js` and `src/pages/IrasApiConfig.jsx`.
- Clean up `src/api/attendees.js` to remove `fetchStudentInfoFromExternalApi`.
- Remove `/settings/iras` route from `src/App.jsx`.
- Remove IRAS API navigation link from `src/components/AppLayout.jsx`.
- Clean up `src/pages/SelfEntryKiosk.jsx` to remove external API lookups.

## Deliverables
- `docs/issues/ISSUE-024.md`
- Clean `npm run build` verification
- PR merged into `develop`.

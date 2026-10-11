# Issue 58: Event Creation Registration Mode Lock, Google Form Sync Preview & CSV Mapping Wizard

## Goal
Lock registration intake mode when editing existing events, add live preview & column header mapper modal for Google Form responses, and integrate CSV mapping wizard into event setup.

## Key Changes
- Locked `registration_type` when `isEditing` is true in `CreateEditEventPage.jsx`.
- Added Google Form response inspection preview & header mapping grid in `CreateEditEventPage.jsx`.
- Embedded `CsvFieldMapperModal.jsx` into event creation flow.
- Added deterministic guest ID generation (`GUEST-${normName}`) and dual-check deduplication in `src/api/attendees.js`.

## Verification
- Verified build with `npm run build` (vite build completed with 0 errors).

# Issue 59: CSV Import Automatic Deduplication & Legacy Attendee Portal Cleanup

## Goal
Enforce automatic deduplication across all CSV attendee imports, display duplicate skipped counts in import completion popups, and remove legacy CSV upload/template code from GuestListPortal.

## Key Changes
- Enhanced `bulkInsertAttendees` in `src/api/attendees.js` to fetch existing event records and deduplicate incoming records by `student_id` & `full_name`.
- Added duplicate skipped count feedback in `CsvFieldMapperModal.jsx`.
- Cleaned up legacy `handleCsvUpload`, `downloadTemplate`, and `Import CSV` button from `GuestListPortal.jsx`.

## Verification
- Verified build with `npm run build` (vite build completed with 0 errors).

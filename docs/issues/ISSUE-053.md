# Issue #53: Pass Generator Modal, On-Spot Registration & Multi-line PDF Pass Export

## Objectives
1. **Unified On-Spot / Add Attendee Registration Modal**:
   - Standalone `AddAttendeeModal.jsx` component used across both Attendee Portal and Gate Control Check-In Portal.
   - Dynamic binding of `event.form_schema` questions (select, radio, checkbox, textarea, text, number) with 100% isolated state.
   - Student / Member vs Guest / Visitor mode selector with mandatory Reference Person rules for Guests.
   - Drag-and-Drop profile photo uploader (`FileReader`) with max 5MB validation and preview thumbnail.
   - Contextual `isOnSpot` status flag (disabled & unchecked for Attendee Portal; disabled & checked for Gate Control Portal).

2. **Pass Generator Modal & PDF Export**:
   - Dedicated `PassGeneratorModal.jsx` supporting multi-page PDF batch exports and ZIP archives.
   - 95mm x 145mm Lanyard Pass with punch slot, vector silhouette avatar fallback, and contrast header.
   - 2-line wrapped participant names via `splitTextToSize` with dynamic vertical offsets for Student ID and Reference fields.

3. **Shared Layout Footer**:
   - Standalone `Footer.jsx` component rendering IUBPC Gatekeeper credits across application and public registration portals.

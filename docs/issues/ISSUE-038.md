# Issue #038: Admin Features: Edit Event Details, Kiosk On-Spot Toggle, and Edit/Remove Attendee

## Type
Feature (`feature/issue-38-admin-edit-event-kiosk-toggle-attendee-management`)

## Status
In Progress

## GitHub Link
https://github.com/zaid-fahad/iubpc-gatekeeper/issues/38

## Description
Implement key Admin management capabilities across event registry and attendee portals.

Key features:
1. **Edit Event Details**: Admin modal/form to update event title, date/time, and gate active status.
2. **Kiosk On-Spot Guest Reg Toggle**: Event configuration toggle (`allow_on_spot` / `allow_on_spot_guest`) that enables or disables on-spot registration in `SelfEntryKiosk.jsx`.
3. **Edit & Remove Attendee**: Admin controls in `GateControl.jsx` and `GuestListPortal.jsx` to modify attendee details or delete attendee records.

## Deliverables
- `docs/issues/ISSUE-038.md`
- API functions in `src/api/events.js` (`updateEvent`) and `src/api/attendees.js` (`updateAttendee`, `deleteAttendee`).
- UI updates in `EventRegistry.jsx`, `GateControl.jsx`, `GuestListPortal.jsx`, and `SelfEntryKiosk.jsx`.
- Verified `npm run build`.

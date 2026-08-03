# Issue #020: Add Self-Entry Kiosk Screen for Event Check-In

## Type
Feature (`feature/issue-20-self-entry-kiosk`)

## Status
In Progress

## GitHub Link
https://github.com/zaid-fahad/iubpc-gatekeeper/issues/20

## Description
Build a self-entry kiosk mode screen (`src/pages/SelfEntryKiosk.jsx`) designed for self-serve attendee check-ins at event entrances.

Key features:
- Dedicated route `/event/:id/kiosk`.
- Student ID input with auto-focus.
- Automatic check-in status update upon valid Student ID entry.
- Prominent attendee info card displaying Name, Student ID, and Check-In Confirmation.
- 5-second auto-reset timer clearing the screen for the next attendee.
- Direct Kiosk launcher buttons on `GateControl.jsx` and `EventRegistry.jsx`.

## Deliverables
- New `src/pages/SelfEntryKiosk.jsx`.
- Route registration in `src/App.jsx`.
- Kiosk launch triggers on `GateControl.jsx` and `EventRegistry.jsx`.
- Verified build `npm run build`.

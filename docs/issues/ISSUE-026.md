# Issue #026: Add On-Spot Self Registration with Student & Guest Modes in Kiosk

## Type
Feature (`feature/issue-26-kiosk-onspot-reg-toggle`)

## Status
In Progress

## GitHub Link
https://github.com/zaid-fahad/iubpc-gatekeeper/issues/26

## Description
Add On-Spot Self-Registration capability to the Self-Entry Kiosk screen when an attendee ID is not found.

Key features:
- Toggle for On-Spot Self-Registration when attendee is not in event registry.
- **Student On-Spot Mode**: Collects Student ID and Full Name.
- **Guest On-Spot Mode**: Collects Guest Full Name and Reference / Host Name (auto-generates GUEST-XXXXXX ID).
- Auto-completes registration, marks checked in (`checked_in_1: true`), inserts entry log, and displays confirmation card.

## Deliverables
- `docs/issues/ISSUE-026.md`
- Updated `src/pages/SelfEntryKiosk.jsx`
- Verified `npm run build`
- PR merged into `develop`.

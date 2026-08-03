# Issue #032: Redesign Gate Control Layout with Top-Right Stats, Search Bar Actions, and Bottom Drawer

## Type
Feature (`feature/issue-32-gate-control-layout-redesign`)

## Status
In Progress

## GitHub Link
https://github.com/zaid-fahad/iubpc-gatekeeper/issues/32

## Description
Redesign the Event Check-In page (`GateControl.jsx`) layout to optimize operator efficiency.

Key layout updates:
- **Header**: Retained existing header bar.
- **Top Right Section**: Compact Quick Stats analytics block positioned on the top right side.
- **Left Side Section**: Search bar with `Scan QR` and `On-Spot Reg` buttons directly beside it, with the attendee list below.
- **Bottom Drawer**: Clicking an attendee list item opens a smooth bottom drawer split into:
  - **Left Half**: Attendee details (Avatar, Name, Student ID, Email, Phone, Info).
  - **Right Half**: Check-in and status checkboxes.

## Deliverables
- `docs/issues/ISSUE-032.md`
- Redesigned `src/pages/GateControl.jsx`
- Verified `npm run build`
- PR merged to `develop` after user approval.

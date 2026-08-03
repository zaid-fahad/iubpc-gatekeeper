# Issue #035: Upgrade Create Event Modal with Desktop Typography, Single DatePicker, and Time Field

## Type
Feature (`feature/issue-35-create-event-modal-typography-time`)

## Status
In Progress

## GitHub Link
https://github.com/zaid-fahad/iubpc-gatekeeper/issues/35

## Description
Upgrade the Create Event Modal in `EventRegistry.jsx` for better desktop readability and time control.

Key features:
- **Desktop Typography**: Increased font size on desktop for modal header, labels, inputs, and buttons (`sm:text-sm`, `sm:text-base`, `sm:text-xl`).
- **Single DatePicker**: Removed duplicate right date input; retained a single, clean DatePicker button/input.
- **Event Start Time Field**: Added a dedicated Time input field (`type="time"` or formatted time selector).

## Deliverables
- `docs/issues/ISSUE-035.md`
- Updated `src/pages/EventRegistry.jsx`
- Verified `npm run build`
- PR merged to `develop` after user confirmation.

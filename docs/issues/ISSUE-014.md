# Issue #014: Upgrade Create Event Modal UI/UX with Live Preview & Event Templates

## Type
Feature (`feature/issue-14-create-event-modal-ux`)

## Status
In Progress

## GitHub Link
https://github.com/zaid-fahad/iubpc-gatekeeper/issues/14

## Description
Upgrade the Create Event Modal in `src/pages/EventRegistry.jsx` utilizing `tasteful` human-crafted design guidelines.

Key improvements:
- **Event Template Chips**: Quick 1-tap preset templates (`Programming Contest`, `Orientation`, `Hackathon`, `Iftar Party`, `Workshop`) to populate event title.
- **Live Event Card Preview**: Real-time visual card preview reflecting title, date, and gate status before submitting.
- **Initial Status Switch**: Toggle event status as `Active Gate` (live immediately) or `Offline / Draft`.
- **Keyboard & Mobile UX**: Keyboard `ESC` key support, touch targets $\ge 44\text{px}$, auto-dismissing toast notifications.

## Deliverables
- Refactored `src/pages/EventRegistry.jsx`.
- Verified build `npm run build`.
- GitHub PR linked with `Closes #14`.

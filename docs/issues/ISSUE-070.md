# Issue #70: QR Scanner Hardware Engine & Gate Check-In Seam Deepening

## Goal
Extract a deep `useQrScanner` hook to hide `Html5Qrcode` camera lifecycle and permission error handling, and a `useGateCheckIn` hook to unify attendee check-in mutations and audit logging across `GateControl.jsx` and `SelfEntryKiosk.jsx`.

## Technical Scope
1. **`useQrScanner` Custom Hook**: Encapsulates `Html5Qrcode` camera element binding, start/stop scanning, camera selection, frame rates, and cleanup.
2. **`useGateCheckIn` Custom Hook**: Encapsulates atomic attendee status updates (`checked_in_1`), entry log insertion (`insertEntryLog`), and operator email auditing.
3. **Component Refactoring**: Streamlines `GateControl.jsx` (900L) and `SelfEntryKiosk.jsx` (655L) by eliminating duplicated scanner initialization and transaction logic.

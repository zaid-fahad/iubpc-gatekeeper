# On-Spot Registration Design (2026-05-01)

## Objective
Add an "On-Spot Registration" button to the Gate Control page to allow operators to quickly register and optionally check in new attendees who are not on the manifest.

## Architecture & UI Integration
*   **Location:** A new `UserPlus` icon button added next to the QR scanner button in the Left Panel of `GateControl.jsx`.
*   **Registration Modal:** A centered overlay form with fields for Full Name, Email, and Student ID. Uses a purple color scheme to distinguish from the scanner.
*   **Prompt Modal:** After registration, a secondary confirmation dialog asks: "Unit registered. Authorize immediate gate entry?" with "Yes, Check-in" and "Not Now" options.

## Data Flow & Logic
1.  **Registration:**
    *   Submits data using `insertAttendee` (updated to include `.select()` for immediate feedback).
    *   On success, the new attendee is added to the local manifest state.
    *   Transitions to the Prompt Modal.
2.  **Post-Registration Prompt:**
    *   **Yes, Authorize:** Triggers `checked_in_1` status update, logs the entry, and selects the member in the detail view.
    *   **Not Now:** Simply selects the member in the detail view without checking them in.

## Verification
*   Validated via successful build and lint.
*   API updated to ensure returned data availability for UI state synchronization.
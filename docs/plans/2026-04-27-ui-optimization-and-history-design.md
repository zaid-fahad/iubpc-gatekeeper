# Design Doc: Desktop UI Optimization & Persistent History

## Overview
This document outlines the architectural and UI changes to optimize the IUBPC Gatekeeper application for desktop usage and implement a robust, database-backed history system.

## 1. UI Architecture & Desktop Optimization
Transition from a mobile-first stack to a responsive **Master-Detail** and **Table-driven** architecture.

### Guest List Portal
- **Mobile View:** Remains a card-based grid for vertical scrolling.
- **Desktop View (lg screens):** 
    - Implements a comprehensive HTML table.
    - **Columns:** Avatar, Name, Student ID, Email, Check-in 1 Status, Token Status, Check-in 2 Status.
    - Uses Tailwind's responsive utilities (`hidden lg:table-cell`) for layout switching.

### Gate Control
- **Desktop View:** Split-screen layout (`grid-cols-12`).
    - **Master Panel (Left, 5 cols):** Search bar and scrollable list of all attendees.
    - **Detail Panel (Right, 7 cols):** Selected attendee profile, large status toggle buttons, and per-attendee activity logs.

## 2. Smart Local Search
- **Data Strategy:** Fetch the entire attendee manifest for the event on initial load to `attendees` state.
- **Filtering Logic:** A single input field that filters the local array by checking `full_name`, `student_id`, and `email` using case-insensitive partial matching.
- **Benefits:** Instant search results without repeated database round-trips.

## 3. Persistent History System
Transition from volatile session-based logs to a permanent database audit trail.

### Database Schema (`entry_logs` table)
- `id`: UUID (PK)
- `attendee_id`: UUID (FK to `attendees`)
- `event_id`: UUID (FK to `events`)
- `action_type`: String (e.g., 'checked_in_1', 'token_given', 'checked_in_2')
- `status`: Boolean (True for activation, False for reversal)
- `created_by`: UUID (FK to `auth.users`)
- `created_at`: Timestamp (Default: now())

### Interaction Logic
- Every status toggle in the UI will trigger a Supabase transaction or parallel call:
    1. Update `attendees` table status.
    2. Insert record into `entry_logs` with current admin's ID.
- **Dual Visibility:**
    - **Global Feed:** Real-time stream of latest logs on the dashboard.
    - **Timeline View:** chronological list of actions for the specific selected attendee.

## 4. Implementation Steps
1. Create the `entry_logs` table and set up RLS policies.
2. Update `attendees.js` API to handle log inserts and bulk fetching.
3. Refactor `GuestListPortal.jsx` to include the Desktop Table view.
4. Refactor `GateControl.jsx` for the Master-Detail layout and persistent logging.

# Issue #72: Event Management & Dynamic Form Schema Builder Deepening

## Goal
Extract a deep `useEventForm` hook to handle event creation/editing state, banner photo uploads, dynamic question schema array mutations, and save actions. Extract `FormSchemaBuilder` to handle interactive custom questionnaire field editing.

## Technical Scope
1. **`useEventForm` Custom Hook**: Encapsulates event metadata state, date/time inputs, banner base64 encoding, dynamic `form_schema` array mutation (add, edit, delete question), validation, and save API calls.
2. **`FormSchemaBuilder` Component**: Reusable component managing custom question fields, select/radio option chips, and field ordering.
3. **Component Refactoring**: Streamlines `CreateEditEventPage.jsx` from 1000 lines down to a clean, readable layout.

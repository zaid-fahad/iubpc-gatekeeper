# Issue #44: Refactor API Service Layer with Domain-Driven Modules and Unified Client

## Problem Statement
Previously, Supabase queries were exported as loose raw functions without a unified client wrapper, error handling helper, or structured domain service modules.

## Proposed Solution
- Create `src/api/client.js` with `handleApiResponse` helper for standardized error logging and Supabase response formatting.
- Refactor `src/api/auth.js` into `authService`.
- Refactor `src/api/events.js` into `eventService`.
- Refactor `src/api/attendees.js` into `attendeeService` and `logService`.
- Preserve named function exports for 100% backwards compatibility with existing component imports.
- Update `src/api/index.js` barrel export.

## Verification Plan
- Run `npm run build` to verify clean compilation with 0 errors.

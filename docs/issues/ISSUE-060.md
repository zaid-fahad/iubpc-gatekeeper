# Issue 60: Create/Edit Event Single-Page Layout & Intake Visual Customizer Restriction

## Goal
Refactor Create/Edit Event Page from tabbed interface into a clean single-page multi-section layout and restrict the Visual Theme Customizer section strictly to custom form registration mode.

## Key Changes
- Converted `CreateEditEventPage.jsx` into 3 sequential sections: Event Schedule, Registration Intake, and Visual Theme Customizer.
- Restricted Visual Theme Customizer section rendering to `registration_type === 'custom_form'`.
- Added sticky bottom save action bar to save event configurations at any point.

## Verification
- Verified build with `npm run build` (vite build completed with 0 errors).

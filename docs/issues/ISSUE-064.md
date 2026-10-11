# Issue 64: System Settings Page for Portal Organization Name, Logo, Color Palette, and Dark/Light Mode

## Goal
Add a dedicated Portal Settings page allowing administrators to customize the organization name, logo URL, brand color palette (Primary, Secondary, Accent), and light/dark theme preference across the portal.

## Proposed Changes
- **New Settings Page ([PortalSettingsPage.jsx](file:///Users/gm-ict/Documents/iubpc-gatekeeper/src/pages/PortalSettingsPage.jsx))**:
  - Organization Branding (Org Name, Subtitle, Logo Image URL).
  - Brand Palette Customizer (Primary Accent, Secondary Color, Surface Glow).
  - Appearance Mode Toggle (Dark Mode vs Light Mode).
  - Save & Reset Default buttons with localStorage persistence.
- **Routing & Navigation ([AppRoutes.jsx](file:///Users/gm-ict/Documents/iubpc-gatekeeper/src/routes/AppRoutes.jsx) & [AppLayout.jsx](file:///Users/gm-ict/Documents/iubpc-gatekeeper/src/layouts/AppLayout.jsx))**:
  - Add route `/settings` protected for admin/staff.
  - Add Settings link to sidebar/top navigation with `<Settings />` icon.
- **Global Theme & Branding State ([settings.js](file:///Users/gm-ict/Documents/iubpc-gatekeeper/src/utils/settings.js))**:
  - Utility to load, save, and apply organization branding and light/dark mode CSS classes (`dark` vs `light`) dynamically on `document.documentElement`.

## Verification Plan
- Build and verify with `npm run build`.
- Verify settings persistence and mode toggling in UI.

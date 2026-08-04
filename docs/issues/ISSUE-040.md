# ISSUE-040: Fix Reset Password Email Link & Add Admin Direct Password Reset Option

## Goal
1. Fix reset password email link redirection by using dynamic site origin / `VITE_SITE_URL` and support password recovery flow in `AuthScreen.jsx`.
2. Add a "Forgot Password?" trigger on the login page for users.
3. Add a direct "Set New Password" feature in `OperatorManifest.jsx` allowing Admins to directly set/reset passwords for staff members via `admin_set_user_password` RPC.

## Tasks
- [x] Create GitHub Issue #40 and tracking doc `docs/issues/ISSUE-040.md`
- [ ] Create branch `fix/issue-40-reset-password-fix-and-admin-direct-reset` off `develop`
- [ ] Create Supabase migration `20260805000000_admin_set_user_password.sql` for `admin_set_user_password` RPC
- [ ] Update `src/api/auth.js`:
  - Enhance `resetPassword` to use `VITE_SITE_URL` or `window.location.origin` cleanly.
  - Add `adminSetUserPassword(email, newPassword)` helper function calling the RPC.
  - Add `updateUserPassword(newPassword)` helper calling `supabase.auth.updateUser`.
- [ ] Update `src/pages/AuthScreen.jsx`:
  - Add "Forgot Password?" modal/tab so users can request a password reset email.
  - Add "Set New Password" screen when arriving with a password recovery token (`#type=recovery` or `type=recovery`).
- [ ] Update `src/pages/OperatorManifest.jsx`:
  - Add "Set New Password" button and inline form/modal for Admins to directly change a staff member's password.
- [ ] Verify build with `npm run build`.
- [ ] Ask user confirmation before PR.
- [ ] PR to `develop`, merge, close issue #40, and clean up branch.

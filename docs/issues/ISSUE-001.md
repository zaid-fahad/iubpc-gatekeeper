# Issue #001: Redesign Staff/Operator Manifest with Table Layouts & Inline Pending Authorization

## Type
Feature (`feature/issue-1-staff-pending-table-ui`)

## Status
In Progress

## Description
Currently, adding new staff members and authorizing registered users in the Staff Operator page (`OperatorManifest.jsx`) uses a modal popup (`showUserModal`). 

This issue addresses the following UI & UX enhancements:
1. Remove the modal overlay.
2. Render pending registered users directly on the Staff page as a dedicated **Pending Users Table List**.
3. Upgrade the active staff members display into a high-density, interactive **Active Staff Table List**.
4. Maintain full administrative functionality (role selection, active toggles, reset password, manual user addition, staff deletion, search & filter).

## SDLC Compliance
- **Issue**: Issue #001
- **Branch**: `feature/issue-1-staff-pending-table-ui`
- **Target Base**: `develop`
- **Deliverables**: Updated `OperatorManifest.jsx`, Issue Documentation, Pull Request Summary.

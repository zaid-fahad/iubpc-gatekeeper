# Issue #46: Visual Certificate Designer, Generator, Batch PDF/ZIP Export, and Public Verification

## User Requirements & Scope
1. **Event Association**: Each event can create, edit, and store its own certificate template layout.
2. **Visual Designer Canvas (`src/pages/CertificateDesigner.jsx`)**:
   - Upload background template (Image PNG/JPEG/SVG or PDF).
   - Drag-and-drop dynamic placeholders (`Full Name`, `Student ID`, `Certificate ID`, `Issue Date`, `Event Name`, `Dynamic QR Code`).
   - Customize element positions (X, Y %), dimensions, typography (font family, size, weight, color, alignment).
3. **Generation & Public Verification**:
   - Unique Certificate ID generation (`CERT-YYYY-XXXX`).
   - Dynamic QR Code linking to public verification page `/certificate/:certificateNumber`.
   - Public Verification Page (`src/pages/PublicCertificateVerification.jsx`) showing authentic badge, student details, event metadata, and PDF download button.
4. **Distribution & Batch Export**:
   - Single PDF download.
   - Batch PDF / ZIP bundle export (`jszip` + `file-saver`).
   - Filter by checked-in status, manual selection, or all attendees.

## Database Schema Additions
- Migration: `supabase/migrations/20260820000000_create_certificate_tables.sql`
  - `certificate_templates` table
  - `certificates` table
  - Storage bucket setup for `certificate-templates`

## Implementation Steps
- Create migration script `20260820000000_create_certificate_tables.sql`.
- Create API service `src/api/certificates.js`.
- Install required packages: `qrcode` and `jszip`.
- Create `CertificateDesigner.jsx` (Visual Designer page).
- Create `PublicCertificateVerification.jsx` (Public Verification page).
- Create `CertificateGeneratorModal.jsx` (Batch rendering & export modal).
- Integrate toolbar into `GuestListPortal.jsx` & `EventRegistry.jsx`.
- Update `AppRoutes.jsx` with `/certificate/:certificateNumber` and `/events/:id/certificate-designer`.
- Verify with `npm run build`.

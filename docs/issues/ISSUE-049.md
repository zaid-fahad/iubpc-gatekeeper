# Issue #49: Create & Edit Event Page with Registration System

## Objectives
1. **Dedicated Create / Edit Event Page**:
   - Replace legacy event modal with full-page navigation at `/events/new` and `/events/:id/edit`.
2. **Registration Mode Selector**:
   - **Option A**: Custom Registration Form (Visual form builder + custom theme styling + JSON import/export).
   - **Option B**: Connect Google Form (Embed/Sync link).
   - **Option C**: Upload CSV with Dynamic Field Mapping (Mandatory Name, Student ID, Ref mapping wizard).
3. **Public Event Registration Portal**:
   - Public-facing registration route at `/register/:eventId` rendering themed forms.

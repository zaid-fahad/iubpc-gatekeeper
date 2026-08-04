# ISSUE-042: Housekeeping & Filename Normalization

## Goal
1. Rename `src/components/GateActBtn.jsx` to `src/components/GateActionButton.jsx` following proper React component naming conventions.
2. Update component import in `src/pages/GateControl.jsx`.
3. Remove redundant `.keep` files in `src/api/`, `src/components/`, and `src/pages/`.

## Tasks
- [x] Create GitHub Issue #42 and tracking doc `docs/issues/ISSUE-042.md`
- [ ] Create branch `refactor/issue-42-filename-housekeeping` off `develop`
- [ ] Rename `GateActBtn.jsx` to `GateActionButton.jsx`
- [ ] Update import in `GateControl.jsx`
- [ ] Remove redundant `.keep` files
- [ ] Verify build with `npm run build`
- [ ] Prompt user confirmation before PR
- [ ] PR to `develop`, merge, close issue #42, and clean up branch.

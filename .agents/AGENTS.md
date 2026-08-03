# AGENTS Rules & Workflow Guidelines

## Mandatory GitHub SDLC Workflow Execution Rules

When performing software development tasks, you MUST strictly follow this 7-step sequence:

1. **Create Issue First**: Create a GitHub issue via `gh issue create` before making code changes or branches. Document in `docs/issues/ISSUE-XXX.md`.
2. **Create Branch Against Issue**: Branch off `develop` using `feature/issue-N-desc`, `fix/issue-N-desc`, or `refactor/issue-N-desc`.
3. **Build & Verify**: Implement code and verify with `npm run build`.
4. **Prompt User for Completion**: Ask the user if the implementation is complete and satisfactory BEFORE creating any PR.
5. **PR to `develop`**: Upon user confirmation, push branch and create PR targeting `develop` (`--base develop`).
6. **Merge & Clean Up**: Merge PR into `develop`, close the GitHub Issue (`gh issue close`), and delete the feature branch (`--delete-branch` & local branch delete).
7. **Prompt User for `main` Merge**: Ask the user if they want to merge `develop` into `main` and publish a release. If confirmed, merge to `main`, create GitHub release (`gh release create vX.Y.Z`), and optionally archive branch (`archive/vX.Y.Z`).

See full details in [docs/GITHUB_WORKFLOW.md](file:///Users/gm-ict/Documents/iubpc-gatekeeper/docs/GITHUB_WORKFLOW.md).

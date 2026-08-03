---
name: tasteful
description: Principles, design tokens, human-crafted design guidelines, responsive table layouts, and UX guidelines for Antigravity and Gemini. Trigger whenever designing, updating, or reviewing web UI/UX components.
---

# Tasteful & Human-Crafted Web UI Guidelines

This skill defines essential principles for engineering **clean, professional, modern, and human-crafted web interfaces**.

---

## Core Aesthetic Principles

### 1. Avoid AI Clutter & Futuristic Buzzwords
- **No Over-The-Top Buzzwords**: Avoid artificial HUD labels like `SYSTEM MANIFEST ONLINE`, `AUTH DB CONNECTED`, `ID: ACTIVE`, `SUPABASE AUTH`, or `SYSTEM PRIVILEGES`.
- **Natural Casing**: Use standard Title Case or Sentence case for headers (`Staff Management`, `Pending Registrations`, `Add Staff Member`). Avoid excessive all-caps and italicized titles.
- **Monospace Usage**: Reserve monospaced fonts (`font-mono`) strictly for email addresses, code snippets, timestamps, or hashes.

### 2. Refined Color System & Surfaces
- **Background Base**: `bg-slate-950`
- **Surface Cards & Sections**: `bg-slate-900/40 border border-slate-800 rounded-xl`
- **Subtle Status Badges**:
  - Admin: `bg-green-500/10 text-green-400 border border-green-500/20`
  - Volunteer / General: `bg-blue-500/10 text-blue-400 border border-blue-500/20`
  - Pending: `bg-amber-500/10 text-amber-400 border border-amber-500/20`

### 3. High-Density Clean Tables
- Render collection items in responsive tables with clean column headers (`Name`, `Email`, `Role`, `Status`, `Settings`).
- Provide 1-click sortable headers (`ArrowUpDown` indicator).
- Use initials avatar badges for users (`bg-slate-800 text-slate-300`).
- Consolidate row action buttons into a single `Manage` button that opens a clean modal.

---

## Modal UX & Overlay Standards

1. **Backdrop**: `fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200`
2. **Card Structure**: `bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col`
3. **Card Groups**: Enclose modal sections in dark inset boxes (`bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2`).
4. **Keyboard Shortcuts**: Always support the `Escape` key (`ESC`) to dismiss open modals.

---

## Interactive Micro-Interactions

- Add subtle hover transitions on table rows (`hover:bg-slate-800/30 transition-colors`).
- Use auto-dismissing toast notifications (`3.5s` duration) for instant feedback on user actions.
- Provide smooth button transitions (`transition-all active:scale-95`).

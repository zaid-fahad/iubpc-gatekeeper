---
name: tasteful
description: Principles, design tokens, glassmorphism patterns, micro-interactions, responsive table layouts, and UX guidelines for crafting tasteful, state-of-the-art web interfaces in Antigravity and Gemini. Trigger whenever designing, updating, or reviewing web UI/UX components.
---

# Tasteful Web UI & Design System Skill

This skill defines essential principles and reusable patterns for engineering **tasteful, high-impact, modern web interfaces**. Use these guidelines whenever creating or modifying front-end components, pages, forms, tables, and interactive overlays.

---

## Core Aesthetic Principles

### 1. Curated Color Palettes (No Plain Defaults)
- Avoid default, uncalibrated primary colors (e.g., pure `#0000FF` or `#FF0000`).
- Use cohesive, rich HSL / Tailwind slate dark tones:
  - **Background Base**: `bg-slate-950` / `bg-slate-900`
  - **Borders & Dividers**: `border-slate-800` / `border-slate-700/50`
  - **Accents**: Neon glow highlights with opacity layering (`bg-blue-500/10 border-blue-500/20 text-blue-400`, `bg-green-500/10 border-green-500/20 text-green-400`, `bg-amber-500/10 border-amber-500/20 text-amber-400`).

### 2. Glassmorphism & Depth
- Layer surfaces using subtle background blurs (`backdrop-blur-md`, `backdrop-blur-xl`).
- Use multi-layer drop shadows (`shadow-2xl`, `shadow-[0_0_15px_rgba(59,130,246,0.1)]`).
- Apply subtle radial gradient glows for focal points.

### 3. Typography & Hierarchy
- **Headings**: Uppercase, heavy weights (`font-black`), tracking adjustments (`tracking-tighter` or `tracking-tight`), italicized accents.
- **Subheaders & Labels**: Micro font sizes (`text-[9px]` or `text-[10px]`), uppercase, wide letter spacing (`tracking-widest` or `tracking-[0.2em]`), muted text colors (`text-slate-400` / `text-slate-500`).
- **Code & IDs**: Use monospaced fonts (`font-mono`) for emails, hashes, timestamps, and database IDs.

---

## Responsive Table List Standards

When displaying collections of items (users, events, logs, manifest items), implement a **High-Density Responsive Table List**:

1. **Table Container**:
   ```jsx
   <div className="overflow-x-auto rounded-xl border border-slate-800">
     <table className="w-full text-left border-collapse">
       ...
     </table>
   </div>
   ```
2. **Table Header**:
   - Background: `bg-slate-950/80 border-b border-slate-800`
   - Labels: `text-[9px] font-black uppercase tracking-widest text-slate-400`
3. **Table Body Rows**:
   - Hover state: `hover:bg-slate-800/40 transition-colors`
   - Disabled/Inactive state: `opacity-60 bg-slate-950/20`
   - Actions Column: Consolidate complex row actions into a single `Manage` button that triggers a dedicated management modal rather than cluttering rows with inline action buttons.

---

## Modal UX & Overlay Standards

For complex actions, item configuration, or forms:
1. **Backdrop**: `fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300`
2. **Card Structure**:
   - Outer: `bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col`
   - Header: Gradient accent background (`bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900`), Avatar icon, Title, Subtitle, Close button (`X`).
   - Navigation Tabs: Clean tab bar for separating general options vs. destructive actions (e.g. `General Management` vs. `Danger Zone`).
   - Action Cards: Group related settings into dark inset containers (`bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl`).

---

## Interactive Feedback & Micro-Animations

- **Active States**: Add scale feedback (`active:scale-95`).
- **Loading States**: Replace action icons with animated spinners (`RefreshCw className="animate-spin"`).
- **Status Dots**: Use animated pulsing dots for live active states (`bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse`).

---

## Supporting Resources & References

- See [design_system.md](file://references/design_system.md) for detailed CSS variables and Tailwind class mappings.
- See [glass_modal.jsx](file://examples/glass_modal.jsx) for a reference React glassmorphism modal implementation.

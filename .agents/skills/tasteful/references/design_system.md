# Tasteful Design System Reference

## Color System Mappings

| Role | Tailwind Classes | Hex / RGB Equivalent |
| :--- | :--- | :--- |
| **Page Background** | `bg-slate-950` | `#020617` |
| **Surface Card** | `bg-slate-900/60 border border-slate-800` | `#0f172a` (60% opacity) |
| **Header Accent** | `bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900` | Gradient overlay |
| **Primary Button** | `bg-blue-500 text-slate-950 hover:bg-blue-400 font-black` | `#3b82f6` -> `#60a5fa` |
| **Success Status** | `bg-green-500/10 border-green-500/20 text-green-400` | `#22c55e` |
| **Warning Status** | `bg-amber-500/10 border-amber-500/20 text-amber-400` | `#f59e0b` |
| **Danger Zone** | `bg-red-500/10 border-red-500/20 text-red-400` | `#ef4444` |

---

## Component Layout Checklists

### 1. Stats Summary Bar
- Use 2 to 4 equal-width grid cards (`grid grid-cols-2 md:grid-cols-4 gap-4`).
- Display numeric metric, uppercase label, icon badge, and background color tint.

### 2. Search & Filter Bar
- Left side: Full-width / max-width search input with absolute icon offset.
- Right side: Role or category filter pills (`bg-slate-950 p-1 rounded-xl border border-slate-800`).

### 3. Management Modals
- Modal overlay with `backdrop-blur-md` and `bg-slate-950/85`.
- Tabbed controls separating routine configurations from permanent/destructive actions.

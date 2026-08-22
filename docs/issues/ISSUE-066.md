# Issue #66: Refactor Loading Screen with Dynamic Theme Adaptation & Glassmorphic Pulse

## Overview
Refactor `LoadingSpinner.jsx` into a high-performance, ultra-modern glassmorphic loading screen featuring:
- Dynamic dark/light mode canvas adaptation (`bg-slate-950` in Dark Mode, pure translucent glass pane backdrop in Light Mode).
- Glowing dual HSL brand ring pulse animations with Lucide brand logo watermark.
- Customizable message and subtext prop support (`message = "Loading Portal..."`).
- Soft blur backdrops (`backdrop-blur-2xl`) and high-contrast typography.

## Acceptance Criteria
1. `LoadingSpinner` adapts seamlessly to Light Mode and Dark Mode.
2. Micro-animation glowing rings with centered brand icon and glowing pulse.
3. Clean prop interfaces for full-screen loading screens vs inline component loaders.
4. `npm run build` compiles cleanly with 0 errors.

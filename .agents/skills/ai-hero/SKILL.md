---
name: ai-hero
description: Prevents over-engineering, code bloat, anti-defense wrapping, and artificial HUD clutter. Enforces clean, production-grade, human-crafted code and streamlined agentic workflows. Trigger whenever building, refactoring, or optimizing codebase components.
---

# AI Hero Guidelines & Contract

This skill defines the **AI Hero** principles for engineering clean, maintainable, production-grade software without over-engineering or speculative anti-pattern clutter.

---

## 1. Zero Over-Engineering & Zero Code Bloat
- **Direct Implementations**: Implement exact user specifications without introducing speculative fallback loops, dead code branches, or unnecessary abstraction layers.
- **No Defensive Swallowing**: Never wrap code in silent `try/catch` fallbacks that mask underlying schema or runtime issues.
- **No Artificial HUD Clutter**: Avoid sci-fi AI buzzwords, artificial status overlays, or superfluous HUD text in UI components.

## 2. Tasteful & Human-Crafted Architecture
- **Clean Component Scoping**: Keep components modular, cohesive, and easy to read.
- **Consistent Design Tokens**: Use predefined color variables and utility tokens across all Light and Dark mode states.
- **Performance First**: Ensure fast render times, minimal DOM re-renders, and smooth CSS transitions.

## 3. High-Quality Engineering Workflow
- **Empirical Verification**: Always verify code changes with clean `npm run build` or automated test suites before declaring tasks complete.
- **Git SDLC Discipline**: Follow strict branch management, issue tracking, and clean pull request workflows.

# Design: Analytics Export Redesign (PDF & XLSX)

**Date:** 2026-05-01  
**Status:** Validated  
**Topic:** Fixing PDF Export and implementing advanced XLSX Export with ExcelJS.

## Overview
The current PDF export is failing due to plugin attachment issues, and the CSV export needs to be upgraded to a professional XLSX format that includes interactive elements and summary data.

## 1. Architecture & Dependencies
- **jsPDF + jspdf-autotable:** Use explicit `autoTable` imports to resolve prototype inheritance issues in the Vite/ESM environment.
- **ExcelJS:** Add as a dependency to generate rich `.xlsx` workbooks.
- **File-Saver:** Add to handle browser-side file downloads of Blobs/Buffers.

## 2. Implementation Details

### PDF Fix
- Import `{ autoTable }` from `jspdf-autotable`.
- Replace `doc.autoTable(...)` with `autoTable(doc, { ... })`.

### XLSX Export (ExcelJS)
- **Summary Section (Rows 1-8):**
    - Event Title & Date.
    - Metrics Table: Total Manifest, Pre-Reg vs On-Spot, Entry 1/Token/Entry 2 success counts and percentages.
    - Styling: Bold headers, Slate-900 background colors for headers to match UI.
- **Detailed Manifest (Rows 10+):**
    - Columns: Full Name, Student ID, Email, Phone, Type, Reference, E1, Token, E2.
    - **Interactive Checkboxes:** Implemented via **Data Validation (List)** in Excel for E1, Token, and E2 columns (options: "YES", "NO").
    - **Conditional Formatting:** Cells turn green when value is "YES".

## 3. Verification Plan
- **PDF Test:** Trigger export and verify table rendering and summary block visibility.
- **XLSX Test:** 
    - Verify file opens in Excel/Google Sheets.
    - Verify summary data matches dashboard stats.
    - Verify check-in columns have dropdown toggles and conditional formatting.

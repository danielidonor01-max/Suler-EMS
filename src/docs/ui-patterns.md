# Suler EMS: UI Patterns & Standards

This document serves as the internal enterprise design system guide for Suler EMS. All new components must adhere strictly to these principles.

## 1. Enterprise Density Philosophy
**Rule:** EMS software must feel operational, dense, and information-efficient.
- **Avoid:** Oversized padding, airy cards, consumer-app aesthetics (e.g. Dribbble landing pages).
- **Target Aesthetic:** Linear, Retool, Notion Admin, ERP dashboards.
- **Card Spacing:** Use `var(--space-md)` (16px) internal padding for cards and `var(--space-lg)` (24px) for page content boundaries.

## 2. Table Standards (DataTable)
Tables are the core of data operations software.
- **Structure:** Tables must be headless-ready. Do not write monolithic components. Separate the generic `DataTable` engine from business tables (e.g., `EmployeeTable`).
- **Typography:** Column headers must be uppercase, `font-bold`, `text-xs`, tracking `0.06em`. Data rows must be `13px` for maximum density. Numeric columns must use `tabular-nums`.
- **Actions:** Row actions should be aligned right and typically housed within a dropdown or subtle action buttons.

## 3. Empty State Philosophy
Empty states should never feel like a broken interface.
- **Icon:** A muted `opacity-50` icon sized at `48px`.
- **Spacing:** Generous padding (`var(--space-2xl) var(--space-xl)`).
- **Tone:** Neutral and descriptive (e.g. "No employees found matching these filters").
- **CTA:** If an action is available, use a primary button to guide the user.

## 4. Modal Standards
Modals must feel like a native application layer.
- **Width Variants:** 
  - `sm`: 400px (Confirmations, deletes)
  - `md`: 520px (Standard forms)
  - `lg`: 800px (Complex multi-step processes)
- **Overlay:** Black backdrop with 40% opacity (`rgba(0,0,0,0.4)`).
- **Keyboard & Click Support:** Always support Escape key to close and backdrop click to dismiss.
- **Layering:** Support scalable z-index to allow nested dialogs and workflows.

## 5. Form Standards
Forms must be validation-ready for future `React Hook Form` and `Zod` integration.
- **Structure:** All inputs must be wrapped in a `FormField` component that handles labels, descriptions, and error texts consistently.
- **Inputs:** Base height `38px`, `border-color` transitions, focus rings matching primary brand color with 10% opacity.
- **Labels:** `font-semibold`, `text-xs`, `color-text-secondary`.

## 6. Action Hierarchy (ActionBar)
Toolbar actions above tables or lists.
- **Primary Action:** E.g., "Add Employee" (Primary Button).
- **Secondary Actions:** Filters, exports, sorting (Secondary Buttons or Native Selects).
- **Search:** Input with a left-aligned icon.

## 7. Badges
- **Success:** Green background/text (`badge-success`).
- **Warning:** Yellow background/text (`badge-warning`).
- **Danger:** Red background/text (`badge-danger`).
- **Info:** Blue background/text (`badge-info`).

*Do NOT add new arbitrary colors. Stick strictly to the defined CSS variables.*

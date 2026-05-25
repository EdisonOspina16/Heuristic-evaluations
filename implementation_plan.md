# Implementation Plan

## Goal Description
Add several new functionalities to the Heuristic Evaluations platform:
- Admin can assign evaluators to specific projects and define which evaluation types they will handle.
- Ability to filter evaluation types, assign UI‑only evaluators, and view most recurrent evaluation types.
- Persist heuristic evaluation progress so users can resume incomplete evaluations.
- Implement a dark/light theme toggle respecting user preferences.
- Update `requisitos.md` with every new feature as it is implemented.
- Ensure the system can be tested by logging in as `evaluador1@gmail.com` (password `Edison#101`) and as the admin `edison100ospina@gmail.com` (password `Edison#101`).

## User Review Required
- Confirm the UI/UX for the admin assignment screen (modal, page, or inline).
- Approve the database schema changes (new tables/fields for evaluator‑project assignments and evaluation progress).
- Choose a color palette for dark and light modes.
- Validate the approach for persisting progress (e.g., storing partial results in the database vs local storage).

## Open Questions
[!IMPORTANT]
> **Database choice:** Should we extend the existing PostgreSQL models (`models.py`) with new tables, or use a separate JSONB column for progress?

[!IMPORTANT]
> **Theme design:** Do you prefer a glassmorphism style with gradient backgrounds, or a more classic flat dark theme?

[!IMPORTANT]
> **Assignment UI location:** Add a new "Project Settings" page under the admin dashboard, or a modal accessible from the project list?

## Proposed Changes
---
### Backend
- **[MODIFY]** `backend/src/infrastructure/models.py`
  - Add `EvaluatorProjectAssignment` model with fields: `id`, `evaluator_id`, `project_id`, `allowed_evaluation_types` (array), `role` (e.g., UI, UX).
  - Add `EvaluationProgress` model with fields: `id`, `evaluation_id`, `heuristic_id`, `status`, `saved_state` (JSON).
- **[MODIFY]** `backend/src/application/services/evaluacion_service.py`
  - Add methods to save partial progress and retrieve it.
- **[MODIFY]** `backend/src/interfaces/api/evaluaciones.py`
  - New endpoints: `POST /assignments`, `GET /assignments/{project_id}`, `PATCH /progress/{evaluation_id}`.

### Frontend
- **[NEW]** `frontend/src/app/admin/project/[id]/assignments/page.tsx`
  - UI for admin to assign evaluators and set allowed evaluation types.
- **[MODIFY]** `frontend/src/app/evaluacion/[id]/page.tsx`
  - Load saved progress and allow resume.
- **[NEW]** `frontend/src/components/ThemeToggle.tsx`
  - Toggle button to switch dark/light mode, store preference in `localStorage` and persist via backend user settings.
- **[MODIFY]** `frontend/src/app/layout.tsx` (or root layout) to apply CSS variables for themes.
- **[MODIFY]** `frontend/src/app/dashboard/page.tsx`
  - Show most recurrent evaluation types using analytics data.

### Requirements Document
- **[MODIFY]** `requisitos.md`
  - Append each new feature description as it is completed.

## Verification Plan
### Automated Tests
- Unit tests for new backend models and service methods.
- Integration tests for assignment API endpoints.
- Frontend component tests for ThemeToggle and assignment form.
### Manual Verification
- Log in as `evaluador1@gmail.com` and ensure you can resume an incomplete evaluation.
- Log in as admin and assign an evaluator to a project, then verify the evaluator sees only the allowed types.
- Switch theme and refresh to confirm persistence.
- Check `requisitos.md` contains entries for each feature.

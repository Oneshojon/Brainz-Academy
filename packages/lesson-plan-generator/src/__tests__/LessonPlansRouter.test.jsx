import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LessonPlansRouter from '../LessonPlansRouter';
import { listLessonPlans, listSubjects, getLessonPlan } from '../api';
import { invalidateResource } from '@brainz/shared-ui';

vi.mock('../api', () => ({
  listLessonPlans: vi.fn(),
  createLessonPlan: vi.fn(),
  getLessonPlan: vi.fn(),
  deleteLessonPlan: vi.fn(),
  generateLessonPlan: vi.fn(),
  listSubjects: vi.fn(),
  downloadLessonPlan: vi.fn(),
}));

function renderNested(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/school-plan/portal/teacher/lesson-plans/*"
          element={
            <LessonPlansRouter
              logoTo="/school-plan/portal/"
              backLinks={[{ label: '← Teacher Portal', to: '/school-plan/portal/' }]}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LessonPlansRouter — nested mount depth', () => {
  beforeEach(() => {
    // Clears useApiResource's module-level cache (keyed 'lesson-plans' /
    // 'lesson-plan:<id>') between tests -- without this, the first test's
    // resolved value gets cached and silently reused by every later test
    // in this file, no matter what a later test's mock is set to return.
    invalidateResource('lesson-plan');
    listLessonPlans.mockResolvedValue([]);
    listSubjects.mockResolvedValue([]);
  });

  it('renders the list page at the nested mount path', async () => {
    renderNested('/school-plan/portal/teacher/lesson-plans/');
    expect(await screen.findByText(/lesson plan generator/i)).toBeInTheDocument();
  });

  it('"+ New Plan" navigates to the nested "new" path, not the app root', async () => {
    const user = userEvent.setup();
    renderNested('/school-plan/portal/teacher/lesson-plans/');

    const newPlanLink = await screen.findByRole('link', { name: /\+ new plan/i });
    expect(newPlanLink).toHaveAttribute(
      'href',
      '/school-plan/portal/teacher/lesson-plans/new',
    );

    await user.click(newPlanLink);
    expect(await screen.findByRole('heading', { name: /new lesson plan/i })).toBeInTheDocument();
  });

  it('the logo link points at the host-supplied portal root, not the SPA root', async () => {
    renderNested('/school-plan/portal/teacher/lesson-plans/');
    const logoLink = screen.getByRole('link', { name: /brainz academy/i });
    expect(logoLink).toHaveAttribute('href', '/school-plan/portal/');
  });

  it('clicking a plan in the list navigates to its nested detail path, not the app root', async () => {
    const user = userEvent.setup();
    listLessonPlans.mockResolvedValue([
      { id: 5, short_title: 'Physics — Momentum', curriculum: 'NIGERIAN', class_level: 'SS2', duration_minutes: 40, is_generated: false },
    ]);
    getLessonPlan.mockResolvedValue({
      id: 5, short_title: 'Physics — Momentum', curriculum: 'NIGERIAN', class_level: 'SS2',
      duration_minutes: 40, class_size: null, effective_school_name: 'Test School',
      coverage: 'Momentum', additional_notes: '', is_generated: false,
      objectives: '', activities: '', timing_breakdown: '', assessment: '',
    });
    renderNested('/school-plan/portal/teacher/lesson-plans/');

    const planLink = await screen.findByRole('link', { name: /momentum/i });
    expect(planLink).toHaveAttribute('href', '/school-plan/portal/teacher/lesson-plans/5');

    await user.click(planLink);
    expect(await screen.findByRole('button', { name: /generate lesson plan/i })).toBeInTheDocument();
  });
});
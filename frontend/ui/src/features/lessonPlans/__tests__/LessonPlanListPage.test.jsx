import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api', () => ({
  listLessonPlans: vi.fn(),
}));

import { listLessonPlans } from '../api';
import { invalidateResource } from '../../../shared/useApiResource';
import LessonPlanListPage from '../LessonPlanListPage';

beforeEach(() => {
  invalidateResource('lesson-plan');
  listLessonPlans.mockReset();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LessonPlanListPage />
    </MemoryRouter>
  );
}

describe('LessonPlanListPage', () => {
  it('shows an empty state when the teacher has no plans yet', async () => {
    listLessonPlans.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/no lesson plans yet/i)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /create a lesson plan/i })).toBeInTheDocument();
  });

  it('lists existing plans with their generated/draft status', async () => {
    listLessonPlans.mockResolvedValue([
      { id: 1, short_title: "Physics — Hooke's Law", curriculum: 'NIGERIAN', class_level: 'SS2', duration_minutes: 40, is_generated: true },
      { id: 2, short_title: 'Physics — Waves', curriculum: 'IGCSE', class_level: 'YEAR9', duration_minutes: 35, is_generated: false },
    ]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/Hooke's Law/)).toBeInTheDocument());
    expect(screen.getByText('Generated')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows an error banner with retry when the list fails to load', async () => {
    listLessonPlans.mockRejectedValue({ message: 'Could not reach the server. Check your connection and try again.', status: 0 });
    renderPage();
    await waitFor(() => expect(screen.getByText(/could not reach the server/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
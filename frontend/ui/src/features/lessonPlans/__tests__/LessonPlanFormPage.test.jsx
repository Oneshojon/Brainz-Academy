import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../api', () => ({
  createLessonPlan: vi.fn(),
  listSubjects: vi.fn(),
}));

import { createLessonPlan, listSubjects } from '../api';
import { invalidateResource } from '../../../shared/useApiResource';
import LessonPlanFormPage from '../LessonPlanFormPage';

beforeEach(() => {
  invalidateResource('lesson-plan');
  mockNavigate.mockReset();
  createLessonPlan.mockReset();
  listSubjects.mockReset();
  listSubjects.mockResolvedValue([{ id: 1, name: 'Physics' }, { id: 2, name: 'Biology' }]);
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LessonPlanFormPage />
    </MemoryRouter>
  );
}

describe('LessonPlanFormPage', () => {
  it('loads subjects into the dropdown', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('option', { name: 'Physics' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'Biology' })).toBeInTheDocument();
  });

  it('switches the class level options when curriculum changes to IGCSE', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('option', { name: 'Physics' })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/curriculum/i), { target: { value: 'IGCSE' } });
    expect(screen.getByRole('option', { name: 'Year 9' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'JSS2' })).not.toBeInTheDocument();
  });

  it('creates a draft and navigates to its detail page', async () => {
    createLessonPlan.mockResolvedValue({ id: 42, is_generated: false });
    renderPage();
    await waitFor(() => expect(screen.getByRole('option', { name: 'Physics' })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/class level/i), { target: { value: 'SS2' } });
    fireEvent.change(screen.getByLabelText(/what does this lesson cover/i), { target: { value: "Hooke's Law" } });
    fireEvent.click(screen.getByRole('button', { name: /create draft/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/lesson-plans/42'));
  });

  it('shows field-level errors from a 400 response', async () => {
    createLessonPlan.mockRejectedValue({
      message: 'Please fix the highlighted fields.',
      status: 400,
      fieldErrors: { duration_minutes: ['Duration must be between 1 and 300 minutes.'] },
    });
    renderPage();
    await waitFor(() => expect(screen.getByRole('option', { name: 'Physics' })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/class level/i), { target: { value: 'SS2' } });
    fireEvent.change(screen.getByLabelText(/what does this lesson cover/i), { target: { value: "Hooke's Law" } });
    fireEvent.click(screen.getByRole('button', { name: /create draft/i }));

    await waitFor(() => expect(screen.getByText(/300 minutes/)).toBeInTheDocument());
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../api', () => ({
  getLessonPlan: vi.fn(),
  generateLessonPlan: vi.fn(),
  deleteLessonPlan: vi.fn(),
  downloadLessonPlan: vi.fn(),
}));

import { getLessonPlan, generateLessonPlan, deleteLessonPlan, downloadLessonPlan } from '../api';
import { invalidateResource } from '../../../shared/useApiResource';
import LessonPlanDetailPage from '../LessonPlanDetailPage';

const DRAFT_PLAN = {
  id: 7, short_title: "Physics — Hooke's Law", curriculum: 'NIGERIAN', class_level: 'SS2',
  duration_minutes: 40, class_size: 35, effective_school_name: 'Brainz Academy',
  coverage: "Hooke's Law", additional_notes: '', is_generated: false,
  objectives: '', activities: '', timing_breakdown: '', assessment: '',
};

const GENERATED_PLAN = {
  ...DRAFT_PLAN,
  is_generated: true,
  objectives: "Students will state Hooke's Law.",
  activities: '1. Recap. 2. Demo.',
  timing_breakdown: '10/20/10 minutes.',
  assessment: 'Exit ticket.',
};

beforeEach(() => {
  invalidateResource('lesson-plan');
  getLessonPlan.mockReset();
  generateLessonPlan.mockReset();
  deleteLessonPlan.mockReset();
  downloadLessonPlan.mockReset();
});

function renderPage(id = '7') {
  return render(
    <MemoryRouter initialEntries={[`/${id}`]}>
      <Routes>
        <Route path="/:id" element={<LessonPlanDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LessonPlanDetailPage', () => {
  it('shows the Generate button for a draft plan', async () => {
    getLessonPlan.mockResolvedValue(DRAFT_PLAN);
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /generate lesson plan/i })).toBeInTheDocument());
  });

  it('shows the four section cards once generated', async () => {
    getLessonPlan.mockResolvedValue(GENERATED_PLAN);
    renderPage();
    await waitFor(() => expect(screen.getByText('Objectives')).toBeInTheDocument());
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Timing Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Assessment')).toBeInTheDocument();
    expect(screen.getByText(/Hooke's Law\./)).toBeInTheDocument();
  });

  it('shows upsell messaging on a 403 (not entitled)', async () => {
    getLessonPlan.mockResolvedValue(DRAFT_PLAN);
    generateLessonPlan.mockRejectedValue({
      status: 403,
      message: 'Lesson Plan Generator requires an active Teacher Pro subscription, or your school must have been granted access to this feature.',
    });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /generate lesson plan/i }));
    fireEvent.click(screen.getByRole('button', { name: /generate lesson plan/i }));
    await waitFor(() => expect(screen.getByText(/teacher pro subscription/i)).toBeInTheDocument());
  });

  it('shows a retry affordance on a 503 (AI unavailable)', async () => {
    getLessonPlan.mockResolvedValue(DRAFT_PLAN);
    generateLessonPlan.mockRejectedValue({
      status: 503,
      message: 'AI lesson plan generation is temporarily unavailable. Please try again in a few minutes.',
    });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /generate lesson plan/i }));
    fireEvent.click(screen.getByRole('button', { name: /generate lesson plan/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument());
  });

  it('shows the admin-disabled message with a Contact link on the flag-off 404', async () => {
    getLessonPlan.mockResolvedValue(DRAFT_PLAN);
    generateLessonPlan.mockRejectedValue({
      status: 404,
      message: 'The Lesson Plan Generator is currently disabled by the admin.',
    });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /generate lesson plan/i }));
    fireEvent.click(screen.getByRole('button', { name: /generate lesson plan/i }));
    await waitFor(() => expect(screen.getByRole('link', { name: /contact us/i })).toBeInTheDocument());
  });

  it('calls generate and shows the sections on success', async () => {
    getLessonPlan.mockResolvedValueOnce(DRAFT_PLAN).mockResolvedValueOnce(GENERATED_PLAN);
    generateLessonPlan.mockResolvedValue({ ...GENERATED_PLAN, cached: false });
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /generate lesson plan/i }));
    fireEvent.click(screen.getByRole('button', { name: /generate lesson plan/i }));
    await waitFor(() => expect(screen.getByText('Objectives')).toBeInTheDocument());
  });

    it('triggers a PDF download when the Download PDF button is clicked', async () => {
    getLessonPlan.mockResolvedValue(GENERATED_PLAN);
    const fakeBlob = new Blob(['%PDF-fake'], { type: 'application/pdf' });
    downloadLessonPlan.mockResolvedValue(fakeBlob);

    const createObjectURL = vi.fn(() => 'blob:fake-url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));

    await waitFor(() => expect(downloadLessonPlan).toHaveBeenCalledWith('7', 'pdf'));
    expect(createObjectURL).toHaveBeenCalledWith(fakeBlob);
  });

  it('shows an error banner when download fails', async () => {
    getLessonPlan.mockResolvedValue(GENERATED_PLAN);
    downloadLessonPlan.mockRejectedValue({ response: undefined });

    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));

    await waitFor(() => expect(screen.getByText(/download failed/i)).toBeInTheDocument());
  });

  it('renders markdown sections with real formatting, not raw asterisks', async () => {
    getLessonPlan.mockResolvedValue({ ...GENERATED_PLAN, objectives: '**Bold objective**' });
    renderPage();
    await waitFor(() => expect(screen.getByText('Objectives')).toBeInTheDocument());
    expect(document.querySelector('.lp-section-body strong')).toHaveTextContent('Bold objective');
  });
});
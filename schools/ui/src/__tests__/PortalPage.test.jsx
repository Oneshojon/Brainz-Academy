import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PortalPage } from '../pages/PortalPage';
import * as schoolsApi from '../api/schoolsApi';
import { invalidateResource } from '@brainz/shared-ui';

vi.mock('../api/schoolsApi');

beforeEach(() => {
  invalidateResource('');
});

function renderPage() {
  return render(<PortalPage />, { wrapper: MemoryRouter });
}

describe('PortalPage', () => {
  it('shows a loading state before /schools/me/ resolves', () => {
    schoolsApi.getMe.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an error message when the user has no School Plan involvement', async () => {
    schoolsApi.getMe.mockRejectedValue({ message: "You're not currently part of a School Plan school." });
    renderPage();
    await waitFor(() => expect(screen.getByText(/not currently part of a school plan/i)).toBeInTheDocument());
  });

  it('renders TeacherPortal for an active staff member', async () => {
    schoolsApi.getMe.mockResolvedValue({
      school_name: 'Bright Future Academy', is_staff: true, is_student: false,
      school_role: 'TEACHER', position: null,
    });
    renderPage();
    await waitFor(() => expect(screen.getByRole('heading', { name: /teacher portal/i })).toBeInTheDocument());
    expect(screen.getByText('Bright Future Academy')).toBeInTheDocument();
  });

  it('renders StudentPortal for an enrolled student', async () => {
    schoolsApi.getMe.mockResolvedValue({
      school_name: 'Riverside Secondary', is_staff: false, is_student: true,
      school_role: null, position: null,
    });
    renderPage();
    await waitFor(() => expect(screen.getByText(/learning companion is coming soon/i)).toBeInTheDocument());
    expect(screen.getByText('Riverside Secondary')).toBeInTheDocument();
  });
});
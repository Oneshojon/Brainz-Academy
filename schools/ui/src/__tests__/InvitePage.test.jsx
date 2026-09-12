import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InvitePage } from '../pages/InvitePage';
import * as schoolsApi from '../api/schoolsApi';
import { ApiError, invalidateResource } from '@brainz/shared-ui';

vi.mock('../api/schoolsApi');

function renderAtToken(token = 'abc123') {
  return render(
    <MemoryRouter initialEntries={[`/invite/${token}`]}>
      <Routes>
        <Route path="/invite/:token" element={<InvitePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InvitePage', () => {
  beforeEach(() => {
    invalidateResource(''); // clear useApiResource's cross-test cache
    window.IS_AUTHENTICATED = false;
  });

  it('shows a checking-your-invite spinner before the preview resolves', () => {
    schoolsApi.previewInvite.mockReturnValue(new Promise(() => {})); // never resolves
    renderAtToken();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/checking your invite/i)).toBeInTheDocument();
  });

  it('shows a clear message for an unknown token', async () => {
    schoolsApi.previewInvite.mockRejectedValue(new ApiError('Invalid invite link.', { status: 404 }));
    renderAtToken();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid invite link.'));
    expect(screen.getByRole('heading', { name: /isn't valid/i })).toBeInTheDocument();
  });

  it('shows a clear message for an expired or exhausted invite', async () => {
    schoolsApi.previewInvite.mockRejectedValue(
      new ApiError('This invite has expired or been fully used.', { status: 400 }),
    );
    renderAtToken();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('This invite has expired or been fully used.'),
    );
    expect(screen.getByRole('heading', { name: /can't be used/i })).toBeInTheDocument();
  });

  it('shows a not-self-service message for a STUDENT invite, with no login prompt', async () => {
    schoolsApi.previewInvite.mockResolvedValue({ school_name: 'Bright Future College', role: 'STUDENT' });
    renderAtToken();
    await waitFor(() =>
      expect(screen.getByText(/aren't self-service yet/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
    expect(schoolsApi.redeemInvite).not.toHaveBeenCalled();
  });

  it('shows a login link carrying ?next= back to this invite when not authenticated', async () => {
    window.IS_AUTHENTICATED = false;
    schoolsApi.previewInvite.mockResolvedValue({ school_name: 'Bright Future College', role: 'TEACHER' });
    renderAtToken('xyz789');

    await waitFor(() => expect(screen.getByText(/you've been invited/i)).toBeInTheDocument());
    expect(screen.getByText('Bright Future College')).toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /sign in to accept/i });
    expect(link.getAttribute('href')).toBe(
      `/get-otp/?next=${encodeURIComponent('/invite/xyz789')}`,
    );
    expect(schoolsApi.redeemInvite).not.toHaveBeenCalled();
  });

  it('automatically redeems and shows a confirmation panel when authenticated', async () => {
    window.IS_AUTHENTICATED = true;
    schoolsApi.previewInvite.mockResolvedValue({ school_name: 'Bright Future College', role: 'TEACHER' });
    schoolsApi.redeemInvite.mockResolvedValue({ school_id: 7, role: 'TEACHER' });

    renderAtToken('xyz789');

    await waitFor(() => expect(schoolsApi.redeemInvite).toHaveBeenCalledWith('xyz789'));
    await waitFor(() => expect(screen.getByRole('heading', { name: /you're in/i })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /go to your portal/i })).toHaveAttribute(
      'href', '/school-plan/portal/',
    );
  });

  it('shows a spinner while the automatic redeem call is in flight', async () => {
    window.IS_AUTHENTICATED = true;
    schoolsApi.previewInvite.mockResolvedValue({ school_name: 'Bright Future College', role: 'TEACHER' });
    schoolsApi.redeemInvite.mockReturnValue(new Promise(() => {})); // never resolves

    renderAtToken();

    await waitFor(() => expect(screen.getByText(/joining bright future college/i)).toBeInTheDocument());
  });

  it('surfaces the exact redeem error when already on a school, with a portal link', async () => {
    window.IS_AUTHENTICATED = true;
    schoolsApi.previewInvite.mockResolvedValue({ school_name: 'Bright Future College', role: 'TEACHER' });
    schoolsApi.redeemInvite.mockRejectedValue(
      new ApiError("You're already part of a school.", { status: 400 }),
    );

    renderAtToken();

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent("You're already part of a school."));
    expect(screen.getByRole('link', { name: /go to your portal/i })).toHaveAttribute(
      'href', '/school-plan/portal/',
    );
  });

  it('surfaces a race-condition redeem failure (expired between preview and redeem) without a portal link', async () => {
    window.IS_AUTHENTICATED = true;
    schoolsApi.previewInvite.mockResolvedValue({ school_name: 'Bright Future College', role: 'TEACHER' });
    schoolsApi.redeemInvite.mockRejectedValue(
      new ApiError('This invite has expired or been fully used.', { status: 400 }),
    );

    renderAtToken();

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('This invite has expired or been fully used.'),
    );
    expect(screen.queryByRole('link', { name: /go to your portal/i })).not.toBeInTheDocument();
  });
});
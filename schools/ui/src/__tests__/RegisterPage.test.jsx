import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '../pages/RegisterPage';
import * as schoolsApi from '../api/schoolsApi';
import { ApiError } from '@brainz/shared-ui';

vi.mock('../api/schoolsApi');

async function fillForm() {
  // contact_email is no longer typed into -- it's pre-filled read-only
  // from window.USER_EMAIL (see beforeEach). Only the editable fields
  // are filled here.
  await userEvent.type(screen.getByLabelText(/school name/i), 'Bright Future College');
  await userEvent.type(screen.getByLabelText(/state/i), 'Lagos');
  await userEvent.type(screen.getByLabelText(/plan id/i), '1');
  await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }));
}

describe('RegisterPage', () => {
  beforeEach(() => {
    window.IS_AUTHENTICATED = true;
    window.USER_EMAIL = 'principal@brightfuture.example.com';
    delete window.location;
    window.location = { href: '', pathname: '/school-plan/register', search: '' };
  });

  it('shows a login prompt pointed at the real login page when not authenticated', () => {
    window.IS_AUTHENTICATED = false;
    render(<RegisterPage />, { wrapper: MemoryRouter });
    const link = screen.getByRole('link', { name: /go to login/i });
    expect(link).toBeInTheDocument();
    // Regression guard: this used to point at "/" (the homepage), which
    // has no OTP form and, at the time, didn't honor ?next= either.
    expect(link.getAttribute('href')).toMatch(/^\/get-otp\/\?next=/);
    expect(screen.queryByLabelText(/school name/i)).not.toBeInTheDocument();
  });

  it('pre-fills contact_email from the logged-in account and does not allow editing it', () => {
    render(<RegisterPage />, { wrapper: MemoryRouter });
    const emailField = screen.getByLabelText(/contact email/i);
    expect(emailField).toHaveValue('principal@brightfuture.example.com');
    expect(emailField).toBeDisabled();
  });

  it('shows field-specific errors from a 400 response, not a generic banner', async () => {
    schoolsApi.registerSchool.mockRejectedValue(
      new ApiError('Please fix the highlighted fields.', {
        status: 400,
        fieldErrors: { name: ['This field is required.'] },
      }),
    );

    render(<RegisterPage />, { wrapper: MemoryRouter });
    await fillForm();

    await waitFor(() => expect(screen.getByText('This field is required.')).toBeInTheDocument());
    expect(screen.queryByText(/please fix the highlighted fields/i)).not.toBeInTheDocument();
  });

  it('shows a spinner while submitting, then redirects to Paystack on success', async () => {
    let resolveSubmit;
    schoolsApi.registerSchool.mockReturnValue(new Promise((resolve) => { resolveSubmit = resolve; }));

    render(<RegisterPage />, { wrapper: MemoryRouter });
    await fillForm();

    expect(screen.getByText(/preparing checkout/i)).toBeInTheDocument();
    resolveSubmit({ authorization_url: 'https://checkout.paystack.com/abc', school_id: 42 });

    await waitFor(() => expect(window.location.href).toBe('https://checkout.paystack.com/abc'));
  });

  it('shows a retry-friendly banner on 502/503, not a field error', async () => {
    schoolsApi.registerSchool.mockRejectedValue(
      new ApiError('The payment provider is temporarily unavailable. Please try again shortly.', { status: 502 }),
    );

    render(<RegisterPage />, { wrapper: MemoryRouter });
    await fillForm();

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/temporarily unavailable/i));
  });
});
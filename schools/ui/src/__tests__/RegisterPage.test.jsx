import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '../pages/RegisterPage';
import * as schoolsApi from '../api/schoolsApi';
import { ApiError } from '../api/client';

vi.mock('../api/schoolsApi');

async function fillForm() {
  await userEvent.type(screen.getByLabelText(/school name/i), 'Bright Future College');
  await userEvent.type(screen.getByLabelText(/state/i), 'Lagos');
  await userEvent.type(screen.getByLabelText(/contact email/i), 'admin@school.com');
  await userEvent.type(screen.getByLabelText(/plan id/i), '1');
  await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }));
}

describe('RegisterPage', () => {
  beforeEach(() => {
    window.IS_AUTHENTICATED = true;
    delete window.location;
    window.location = { href: '', pathname: '/school-plan/register', search: '' };
  });

  it('shows a login prompt instead of the form when not authenticated', () => {
    window.IS_AUTHENTICATED = false;
    render(<RegisterPage />, { wrapper: MemoryRouter });
    expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/school name/i)).not.toBeInTheDocument();
  });

  it('shows field-specific errors from a 400 response, not a generic banner', async () => {
    schoolsApi.registerSchool.mockRejectedValue(
      new ApiError('Please fix the highlighted fields.', {
        status: 400,
        fieldErrors: { contact_email: ['Enter a valid email.'] },
      }),
    );

    render(<RegisterPage />, { wrapper: MemoryRouter });
    await fillForm();

    await waitFor(() => expect(screen.getByText('Enter a valid email.')).toBeInTheDocument());
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
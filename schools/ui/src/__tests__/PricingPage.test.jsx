import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PricingPage } from '../pages/PricingPage';
import * as schoolsApi from '../api/schoolsApi';
import { invalidateResource } from '../hooks/useApiResource';

vi.mock('../api/schoolsApi');

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

describe('PricingPage', () => {
  beforeEach(() => {
    invalidateResource('');
    navigateMock.mockClear();
  });

  it('renders plans after loading', async () => {
    schoolsApi.listPlans.mockResolvedValue({
      plans: [{
        id: 1, name: 'School Basic — Termly', duration: 'TERMLY', price: '50000.00',
        seat_limit: 200, description: 'Good for one arm.', features_list: ['Feature A'],
      }],
    });

    render(<PricingPage />, { wrapper: MemoryRouter });
    await waitFor(() => expect(screen.getByText('School Basic — Termly')).toBeInTheDocument());
  });

  it('navigates to registration with the chosen plan id', async () => {
    schoolsApi.listPlans.mockResolvedValue({
      plans: [{ id: 7, name: 'School Pro', duration: 'TERMLY', price: '90000.00', seat_limit: 500, description: '', features_list: [] }],
    });

    render(<PricingPage />, { wrapper: MemoryRouter });
    const button = await screen.findByRole('button', { name: /choose school pro/i });
    await userEvent.click(button);

    expect(navigateMock).toHaveBeenCalledWith('/register?plan=7');
  });

  it('shows an error banner when the plan list fails to load', async () => {
    schoolsApi.listPlans.mockRejectedValue(new Error('Could not reach the server.'));

    render(<PricingPage />, { wrapper: MemoryRouter });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the server.'));
  });
});
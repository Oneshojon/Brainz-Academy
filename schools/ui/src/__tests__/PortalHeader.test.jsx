import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PortalHeader } from '../components/PortalHeader';

describe('PortalHeader', () => {
  it('shows the school name and a seal badge with its first letter', () => {
    render(<PortalHeader schoolName="Bright Future Academy" />);
    expect(screen.getByText('Bright Future Academy')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders a Sign out link to the Django logout view', () => {
    render(<PortalHeader schoolName="Bright Future Academy" />);
    const signOut = screen.getByRole('link', { name: /sign out/i });
    expect(signOut).toHaveAttribute('href', '/logout_view/');
  });
});
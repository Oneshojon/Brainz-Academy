import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudentPortal } from '../pages/StudentPortal';

describe('StudentPortal', () => {
  it('shows the school name and a named upcoming feature, not a vague placeholder', () => {
    render(<StudentPortal me={{ school_name: 'Riverside Secondary' }} />);
    expect(screen.getByText('Riverside Secondary')).toBeInTheDocument();
    expect(screen.getByText(/learning companion is coming soon/i)).toBeInTheDocument();
  });
});
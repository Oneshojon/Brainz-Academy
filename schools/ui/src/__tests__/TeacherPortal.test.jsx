import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TeacherPortal } from '../pages/TeacherPortal';

/**
 * Only the resource-grid/home route is exercised here -- what renders
 * *inside* @brainz/lesson-plan-generator (mounted lazily at
 * "lesson-plans/*") is already covered by that package's own test suite.
 * Deliberately not mocking '@brainz/lesson-plan-generator' to smoke-test
 * the click-through: mocking a bare workspace-symlinked specifier isn't
 * reliable in this monorepo (Vite's dep pre-bundling can hand the real
 * module to React.lazy() before the mock applies -- see
 * schools/ui/src/__tests__/schoolsApi.test.js's comment for the same
 * issue hit and fixed there). Asserting on the rendered link's href is
 * the safe, reliable way to prove the wiring is correct without
 * depending on that mock ever actually intercepting.
 */
function renderHome(me) {
  return render(
    <MemoryRouter initialEntries={['/portal/']}>
      <Routes>
        <Route path="/portal/*" element={<TeacherPortal me={me} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TeacherPortal', () => {
  it('shows the school name and Teacher Portal heading', () => {
    renderHome({ school_name: 'Bright Future Academy', school_role: 'TEACHER' });
    expect(screen.getByText('Bright Future Academy')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /teacher portal/i })).toBeInTheDocument();
  });

  it('shows the Lesson Plan Generator card, correctly linked, for a TEACHER', () => {
    renderHome({ school_name: 'Bright Future Academy', school_role: 'TEACHER' });
    const card = screen.getByRole('link', { name: /lesson plan generator/i });
    expect(card).toHaveAttribute('href', '/portal/lesson-plans');
  });

  it('hides the Lesson Plan Generator card for an ADMIN (403 on that endpoint today)', () => {
    renderHome({ school_name: 'Bright Future Academy', school_role: 'ADMIN' });
    expect(screen.queryByRole('link', { name: /lesson plan generator/i })).not.toBeInTheDocument();
    expect(screen.getByText(/nothing's been set up/i)).toBeInTheDocument();
  });
});
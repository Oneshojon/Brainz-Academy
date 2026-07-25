/**
 * Tests for sitting-label and subject/board scoping fixes.
 *
 * Covers:
 *  - QuestionGeneratorForm: sitting dropdown fetches scoped options and
 *    displays the correct label (regression for the JUNE_JULY raw-value bug).
 *  - Step5Export: sitting tag on a saved question resolves to its label,
 *    not the raw value.
 *  - Step2Subject: subjects are fetched scoped to the selected board.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

vi.mock('../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  getTestBuilderAccess: vi.fn(),
}))

import api from '../api'

beforeEach(() => {
  window.USER_ROLE = 'TEACHER'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('QuestionGeneratorForm — sitting scoping', () => {
  it('fetches sittings scoped to subject and displays June/July correctly', async () => {
    api.get.mockImplementation((url) => {
      if (url === 'subjects/') {
        return Promise.resolve({ data: [{ id: 1, name: 'English Language', question_count: 5, is_oral_eligible: true }] })
      }
      if (url === 'exam-boards/') {
        return Promise.resolve({ data: [{ id: 1, name: 'NECO', abbreviation: 'NECO' }] })
      }
      if (url.startsWith('available-sittings/')) {
        return Promise.resolve({ data: { sittings: [{ value: 'JUNE_JULY', label: 'June/July' }] } })
      }
      if (url.startsWith('years/')) {
        return Promise.resolve({ data: { years: [2023] } })
      }
      return Promise.resolve({ data: [] })
    })

    const { default: QuestionGeneratorForm } = await import(
      '../components/QuestionGeneratorForm'
    )
    render(<QuestionGeneratorForm onResults={vi.fn()} onClear={vi.fn()} access={null} />)

    const subjectSelect = await screen.findByDisplayValue('— Select Subject —')
    fireEvent.change(subjectSelect, { target: { value: '1' } })

    await waitFor(() => {
      expect(screen.getByText('June/July')).toBeTruthy()
    })

    // Confirm the raw value never appears in the UI
    expect(screen.queryByText('JUNE_JULY')).toBeFalsy()
  })
})

describe('Step5Export — sitting label lookup', () => {
  it('resolves JUNE_JULY to June/July in the question tag, not the raw value', async () => {
    api.get.mockImplementation((url) => {
      if (url === 'sitting-choices/') {
        return Promise.resolve({
          data: { sittings: [{ value: 'JUNE_JULY', label: 'June/July' }] },
        })
      }
      return Promise.resolve({ data: [] })
    })

    const { default: Step5Export } = await import(
      '../components/builder/Step5Export'
    )
    const mockQuestion = {
      id: 1,
      content: 'Test question',
      question_type: 'OBJ',
      marks: 1,
      exam_year: 2023,
      sitting: 'JUNE_JULY',
      customMarks: 1,
      choices: [],
      topics: [],
    }
    render(
      <Step5Export
        savedQuestions={[mockQuestion]}
        testTitle="Test"
        access={{}}
        onUpdateMarks={vi.fn()}
        onRemove={vi.fn()}
        onReorder={vi.fn()}
        onBack={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/June\/July/)).toBeTruthy()
    })
    expect(screen.queryByText(/JUNE_JULY/)).toBeFalsy()
  })
})

describe('Step2Subject — board-scoped subjects', () => {
  it('fetches subjects with the board id as a query param', async () => {
    api.get.mockResolvedValue({ data: [{ id: 1, name: 'Physics', question_count: 3 }] })

    const { default: Step2Subject } = await import(
      '../components/builder/Step2Subject'
    )
    render(
      <Step2Subject
        board={{ id: 7, abbreviation: 'NECO' }}
        onSelect={vi.fn()}
        selected={null}
        onBack={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('subjects/?board=7')
    })
  })
})

describe('QuestionGeneratorForm — exam board before subject, board-scoped subjects', () => {
  // Full endpoint mock covering every call QuestionGeneratorForm makes on
  // mount and on exam_board change, matching each endpoint's real response
  // shape exactly (years/available-sittings return nested objects, not
  // bare arrays) — an incomplete mock here previously caused a real crash
  // (setAvailableYears(undefined) from an unmatched fallback response).
  function mockGeneratorFormApi({ subjects = [], boardSubjects = {}, boards = [] } = {}) {
    api.get.mockImplementation((url) => {
      if (url.startsWith('subjects/?board=')) {
        const boardId = url.split('board=')[1]
        return Promise.resolve({ data: boardSubjects[boardId] ?? [] })
      }
      if (url === 'subjects/') {
        return Promise.resolve({ data: subjects })
      }
      if (url === 'exam-boards/') {
        return Promise.resolve({ data: boards })
      }
      if (url.startsWith('topics/')) {
        return Promise.resolve({ data: [] })
      }
      if (url.startsWith('years/')) {
        return Promise.resolve({ data: { years: [] } })
      }
      if (url.startsWith('available-sittings/')) {
        return Promise.resolve({ data: { sittings: [] } })
      }
      return Promise.resolve({ data: [] })
    })
  }

  it('renders the Exam Board select before the Subject select', async () => {
    mockGeneratorFormApi({
      boards: [{ id: 1, name: 'NECO', abbreviation: 'NECO' }],
    })

    const { default: QuestionGeneratorForm } = await import(
      '../components/QuestionGeneratorForm'
    )
    const { container } = render(
      <QuestionGeneratorForm onResults={vi.fn()} onClear={vi.fn()} access={null} />
    )

    // Board option text is "NECO (NECO)" (name + abbreviation) — a single
    // exact string match against "NECO" alone won't hit it, so use a regex.
    await waitFor(() => screen.getByText(/NECO/))

    const labels = Array.from(container.querySelectorAll('.form-label'))
      .map((el) => el.textContent)
    const boardIdx   = labels.findIndex((t) => t.includes('Exam Board'))
    const subjectIdx = labels.findIndex((t) => t.includes('Subject'))

    expect(boardIdx).toBeGreaterThanOrEqual(0)
    expect(subjectIdx).toBeGreaterThanOrEqual(0)
    expect(boardIdx).toBeLessThan(subjectIdx)
  })

  it('re-fetches subjects scoped to board when exam board changes', async () => {
    mockGeneratorFormApi({
      subjects: [{ id: 1, name: 'Physics', question_count: 5 }],
      boards: [{ id: 1, name: 'NECO', abbreviation: 'NECO' }],
      boardSubjects: {
        '1': [{ id: 2, name: 'English Language', question_count: 3 }],
      },
    })

    const { default: QuestionGeneratorForm } = await import(
      '../components/QuestionGeneratorForm'
    )
    render(<QuestionGeneratorForm onResults={vi.fn()} onClear={vi.fn()} access={null} />)

    await waitFor(() => screen.getByText('Physics'))

    const boardSelect = screen.getByDisplayValue('— Any Board —')
    fireEvent.change(boardSelect, { target: { value: '1' } })

    await waitFor(() => {
      expect(screen.getByText('English Language')).toBeTruthy()
      expect(screen.queryByText('Physics')).toBeFalsy()
    })
  })
})
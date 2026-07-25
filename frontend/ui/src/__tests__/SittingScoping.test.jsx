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
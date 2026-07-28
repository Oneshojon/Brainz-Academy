/**
 * Tests for:
 *  - boardParamValue() util (null/all/real/mix board → correct query param)
 *  - Step2Subject WAEC+NECO combined board: subjects use INTERSECTION
 *  - QuestionList (Random Builder): question numbering is serial (array
 *    position), not the raw DB question_number
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  getTestBuilderAccess: vi.fn(),
}))

import api from '../api'
import { boardParamValue } from '../utils/boardParam'

beforeEach(() => {
  window.USER_ROLE = 'TEACHER'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('boardParamValue', () => {
  it('returns undefined for null board', () => {
    expect(boardParamValue(null)).toBeUndefined()
  })

  it('returns undefined for a board with no id', () => {
    expect(boardParamValue({})).toBeUndefined()
  })

  it('returns undefined for the "All Boards" sentinel', () => {
    expect(boardParamValue({ id: 'all' })).toBeUndefined()
  })

  it('returns the id as a string for a real board', () => {
    expect(boardParamValue({ id: 7 })).toBe('7')
  })

  it('returns comma-joined component_ids for the WAEC+NECO combined board', () => {
    expect(boardParamValue({ id: 'mix', component_ids: [1, 2] })).toBe('1,2')
  })
})

describe('Step2Subject — WAEC+NECO combined board intersection', () => {
  it('shows only subjects present in both boards when component_ids is set', async () => {
    api.get.mockImplementation((url) => {
      if (url === 'subjects/?board=1') {
        return Promise.resolve({ data: [
          { id: 10, name: 'Physics', question_count: 5 },
          { id: 11, name: 'English Language', question_count: 3 },
        ] })
      }
      if (url === 'subjects/?board=2') {
        return Promise.resolve({ data: [
          { id: 11, name: 'English Language', question_count: 2 },
          { id: 12, name: 'Chemistry', question_count: 4 },
        ] })
      }
      return Promise.resolve({ data: [] })
    })

    const { default: Step2Subject } = await import(
      '../components/builder/Step2Subject'
    )
    render(
      <Step2Subject
        board={{ id: 'mix', abbreviation: 'WAEC+NECO', component_ids: [1, 2] }}
        onSelect={vi.fn()}
        selected={null}
        onBack={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('English Language')).toBeTruthy()
    })
    expect(screen.queryByText('Physics')).toBeFalsy()
    expect(screen.queryByText('Chemistry')).toBeFalsy()
  })

  it('shows unfiltered subjects for the "All Boards" sentinel', async () => {
    api.get.mockImplementation((url) => {
      if (url === 'subjects/') {
        return Promise.resolve({ data: [
          { id: 20, name: 'Biology', question_count: 4 },
        ] })
      }
      return Promise.resolve({ data: [] })
    })

    const { default: Step2Subject } = await import(
      '../components/builder/Step2Subject'
    )
    render(
      <Step2Subject
        board={{ id: 'all', abbreviation: 'ALL' }}
        onSelect={vi.fn()}
        selected={null}
        onBack={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Biology')).toBeTruthy()
    })
    expect(api.get).toHaveBeenCalledWith('subjects/')
  })
})

describe('QuestionList — serial numbering (Random Builder)', () => {
  it('numbers questions by array position, not raw question_number', async () => {
    const questions = [
      { id: 1, question_number: 47, content: 'First', question_type: 'OBJ', marks: 1, choices: [], topics: [] },
      { id: 2, question_number: 3,  content: 'Second', question_type: 'OBJ', marks: 1, choices: [], topics: [] },
    ]

    const { default: QuestionList } = await import('../components/QuestionList')
    render(<QuestionList questions={questions} filterMeta={null} access={{ allowed: true }} />)

    expect(screen.getByText('Q1')).toBeTruthy()
    expect(screen.getByText('Q2')).toBeTruthy()
    expect(screen.queryByText('Q47')).toBeFalsy()
    expect(screen.queryByText('Q3')).toBeFalsy()
  })
})
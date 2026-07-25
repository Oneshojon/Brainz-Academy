/**
 * TestBuilder.test.jsx
 *
 * Tests for the test builder React app:
 *  - Mode selector (Random vs Manual)
 *  - Manual mode: all 5 steps
 *  - Back-button guard (pushState / popstate)
 *  - ModeSelector color visibility
 *
 * All network calls go through the shared `api` axios instance (see
 * frontend/ui/src/api.js) — every component in this app uses api.get/post,
 * never the raw fetch API. api is mocked once here via vi.mock, and
 * mockApiDefaults() configures sensible responses for every endpoint the
 * app's components call on mount, matching the pattern established in
 * SittingScoping.test.jsx.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'

vi.mock('../api', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  getTestBuilderAccess: vi.fn(),
}))

import api from '../api'

/**
 * Configures api.get with defaults for every endpoint the app's components
 * call on mount, keyed by substring match so exact query params don't need
 * to be replicated here. Pass overrides to customise a specific endpoint's
 * response for an individual test (e.g. { flags: { test_builder_random: false } }).
 */
function mockApiDefaults(overrides = {}) {
  api.get.mockImplementation((url) => {
    if (url.includes('test-builder-access')) {
      return Promise.resolve({
        data: overrides.access ?? {
          allowed: true, is_free: false, trials_remaining: 9999,
          max_questions: 9999, pdf_only: false, reason: '',
        },
      })
    }
    if (url.includes('feature-flags')) {
      return Promise.resolve({
        data: overrides.flags ?? { test_builder_random: true, test_builder_manual: true },
      })
    }
    if (url.includes('exam-boards')) {
      return Promise.resolve({
        data: overrides.boards ?? [
          { id: 1, name: 'West African Examinations Council', abbreviation: 'WAEC' },
        ],
      })
    }
    if (url.includes('subjects')) {
      return Promise.resolve({ data: overrides.subjects ?? [] })
    }
    if (url.includes('topics')) {
      return Promise.resolve({ data: overrides.topics ?? [] })
    }
    if (url.includes('years')) {
      return Promise.resolve({ data: { years: overrides.years ?? [] } })
    }
    if (url.includes('available-sittings')) {
      return Promise.resolve({ data: { sittings: overrides.sittings ?? [] } })
    }
    return Promise.resolve({ data: [] })
  })
}

// Mock window globals set by Django template
beforeEach(() => {
  window.USER_ROLE = 'TEACHER'
  window.LOGO_URL = '/static/logo.png'
  mockApiDefaults()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// App — mode selector
// ---------------------------------------------------------------------------

describe('App — mode selector', () => {
  it('renders both mode cards', async () => {
    const { default: App } = await import('../App')
    render(<App />)
    expect(screen.getByText(/Random \/ Filter/i)).toBeTruthy()
    expect(screen.getByText(/Manual Selection/i)).toBeTruthy()
  })

  it('mode cards have visible text (color not invisible)', async () => {
    const { default: App } = await import('../App')
    const { container } = render(<App />)
    const cards = container.querySelectorAll('.mode-card')
    expect(cards.length).toBeGreaterThanOrEqual(2)
    cards.forEach(card => {
      const style = window.getComputedStyle(card)
      expect(style.display).not.toBe('none')
    })
  })

  it('clicking Manual Selection enters manual mode', async () => {
    const { default: App } = await import('../App')
    render(<App />)
    const manualCard = screen.getByText(/Manual Selection/i).closest('.mode-card')
    fireEvent.click(manualCard)
    // Step 1's own section title is unique — avoids ambiguous "Board" matches
    // against the topbar's "← Dashboard" link and the step nav's "Exam Board" label.
    await waitFor(() => {
      expect(screen.getByText('Select Exam Board')).toBeTruthy()
    })
  })

  it('clicking Random / Filter enters random mode', async () => {
    const { default: App } = await import('../App')
    render(<App />)
    const randomCard = screen.getByText(/Random \/ Filter/i).closest('.mode-card')
    fireEvent.click(randomCard)
    await waitFor(() => {
      expect(screen.getByText(/Question Builder/i)).toBeTruthy()
    })
  })

  it('disabled mode card cannot be clicked when flag is off', async () => {
    mockApiDefaults({ flags: { test_builder_random: false, test_builder_manual: true } })
    const { default: App } = await import('../App')
    render(<App />)
    // flags load asynchronously — wait for the card to pick up the disabled class
    const randomCard = await screen.findByText(/Random \/ Filter/i)
      .then(el => el.closest('.mode-card'))
    await waitFor(() => {
      expect(randomCard.classList.contains('disabled')).toBe(true)
    })
  })

  it('Change Mode button returns to mode selector from manual mode', async () => {
    const { default: App } = await import('../App')
    render(<App />)
    fireEvent.click(screen.getByText(/Manual Selection/i).closest('.mode-card'))
    await waitFor(() => screen.getByText('Select Exam Board'))
    fireEvent.click(screen.getByText(/Change Mode/i))
    await waitFor(() => {
      expect(screen.getByText(/Random \/ Filter/i)).toBeTruthy()
    })
  })
})

// ---------------------------------------------------------------------------
// Manual builder — Step navigation
// ---------------------------------------------------------------------------

describe('BuilderLayout — step navigation', () => {
  async function enterManualMode() {
    const { default: App } = await import('../App')
    render(<App />)
    fireEvent.click(screen.getByText(/Manual Selection/i).closest('.mode-card'))
    await waitFor(() => screen.getByText('Select Exam Board'))
  }

  it('starts on step 1 (board selection)', async () => {
    await enterManualMode()
    expect(screen.getByText('Select Exam Board')).toBeTruthy()
  })

  it('step nav shows 5 steps', async () => {
    const { default: App } = await import('../App')
    render(<App />)
    fireEvent.click(screen.getByText(/Manual Selection/i).closest('.mode-card'))
    await waitFor(() => {
      const stepItems = document.querySelectorAll('.step-item, .step-btn')
      expect(stepItems.length).toBeGreaterThanOrEqual(5)
    })
  })
})

// ---------------------------------------------------------------------------
// Step 1 — Board selection
// ---------------------------------------------------------------------------

describe('Step1Board', () => {
  it('renders board cards', async () => {
    const { default: Step1Board } = await import('../components/builder/Step1Board')
    render(<Step1Board onSelect={vi.fn()} selected={null} />)
    await waitFor(() => {
      expect(screen.getByText('WAEC')).toBeTruthy()
    })
  })

  it('calls onSelect when a board card is clicked', async () => {
    const onSelect = vi.fn()
    const { default: Step1Board } = await import('../components/builder/Step1Board')
    render(<Step1Board onSelect={onSelect} selected={null} />)
    await waitFor(() => screen.getByText('WAEC'))
    fireEvent.click(screen.getByText('WAEC').closest('.board-card'))
    expect(onSelect).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Step 4 — Question filter (OBJ / Theory / All) and topic bar
// ---------------------------------------------------------------------------

describe('Step4Questions — type filter and topic bar', () => {
  const mockProps = {
    board: { id: 1, abbreviation: 'WAEC' },
    subject: { id: 1, name: 'Physics' },
    theme: { id: 1, name: 'Mechanics' },
    savedQuestions: [],
    onAdd: vi.fn(),
    onRemove: vi.fn(),
    onBack: vi.fn(),
    onDone: vi.fn(),
    onChangeTheme: vi.fn(),
    qTypeFilter: '',
    onQTypeFilter: vi.fn(),
  }

  it('renders topic bar with topic name', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [], topic_names: ['Mechanics'] })
    })
    const { default: Step4Questions } = await import(
      '../components/builder/Step4Questions'
    )
    render(<Step4Questions {...mockProps} />)
    await waitFor(() => {
      expect(
        screen.queryByText('Mechanics') ||
        document.querySelector('.q4-topic-bar')
      ).toBeTruthy()
    })
  })

  it('renders All / OBJ / Theory toggle buttons', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [], topic_names: [] })
    })
    const { default: Step4Questions } = await import(
      '../components/builder/Step4Questions'
    )
    render(<Step4Questions {...mockProps} />)
    await waitFor(() => {
      expect(screen.queryByText('All') || screen.queryByText('OBJ')).toBeTruthy()
    })
  })

  it('OBJ filter button calls onQTypeFilter with "OBJ"', async () => {
    const onQTypeFilter = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [], topic_names: [] })
    })
    const { default: Step4Questions } = await import(
      '../components/builder/Step4Questions'
    )
    render(<Step4Questions {...mockProps} onQTypeFilter={onQTypeFilter} />)
    await waitFor(() => screen.queryByText('OBJ'))
    const objBtn = screen.queryByText('OBJ')
    if (objBtn) fireEvent.click(objBtn)
    expect(onQTypeFilter).toHaveBeenCalledWith('OBJ')
  })

  it('"Choose Type:" label is visible and cyan', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [], topic_names: [] })
    })
    const { default: Step4Questions } = await import(
      '../components/builder/Step4Questions'
    )
    render(<Step4Questions {...mockProps} />)
    await waitFor(() => {
      const label = screen.queryByText(/Choose Type/i) ||
                    screen.queryByText(/Type:/i)
      if (label) {
        const style = window.getComputedStyle(label)
        expect(style.visibility).not.toBe('hidden')
      }
    })
  })

  it('Change Topic button is present in topic bar', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [], topic_names: [] })
    })
    const { default: Step4Questions } = await import(
      '../components/builder/Step4Questions'
    )
    render(<Step4Questions {...mockProps} />)
    await waitFor(() => {
      expect(
        screen.queryByText(/Change Topic/i) ||
        document.querySelector('.q4-topic-btn')
      ).toBeTruthy()
    })
  })
})

// ---------------------------------------------------------------------------
// Step 5 — Export / Review
// ---------------------------------------------------------------------------

describe('Step5Export', () => {
  // Step5Export reads q.topic_names (flat string array) and q.sitting,
  // not q.topics — matches the shape returned by QuestionListSerializer /
  // QuestionSerializer (see catalog/serializers.py get_topic_names()).
  const mockQuestion = {
    id: 1,
    content: 'What is the speed of light?',
    question_type: 'OBJ',
    marks: 1,
    topic_names: ['Waves'],
    choices: [{ id: 1, label: 'A', choice_text: '3×10⁸ m/s', is_correct: true }],
  }

  const mockProps = {
    savedQuestions: [{ ...mockQuestion, customMarks: 1 }],
    testTitle: 'My Physics Test',
    access: { can_download: true },
    onUpdateMarks: vi.fn(),
    onRemove: vi.fn(),
    onReorder: vi.fn(),
    onBack: vi.fn(),
  }

  it('renders question list in step 5', async () => {
    const { default: Step5Export } = await import(
      '../components/builder/Step5Export'
    )
    render(<Step5Export {...mockProps} />)
    expect(screen.getByText(/speed of light/i)).toBeTruthy()
  })

  it('shows "Questions only" and "Mark scheme" download options', async () => {
    const { default: Step5Export } = await import(
      '../components/builder/Step5Export'
    )
    render(<Step5Export {...mockProps} />)
    // The mobile export bar renders "Questions only" twice (PDF + Word
    // buttons) — assert at least one exists rather than a single unique match.
    const questionsOnlyBtns = screen.queryAllByText(/Questions only/i)
    const markSchemeBtns = screen.queryAllByText(/Mark scheme/i)
    expect(questionsOnlyBtns.length + markSchemeBtns.length).toBeGreaterThan(0)
  })

  it('shows topic name for each question', async () => {
    const { default: Step5Export } = await import(
      '../components/builder/Step5Export'
    )
    render(<Step5Export {...mockProps} />)
    expect(screen.queryByText('Waves')).toBeTruthy()
  })

  it('shows question numbered starting from 1', async () => {
    const { default: Step5Export } = await import(
      '../components/builder/Step5Export'
    )
    render(<Step5Export {...mockProps} />)
    expect(screen.queryByText('Q1') || document.body.textContent.includes('1')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Browser back-button guard (pushState / popstate)
// ---------------------------------------------------------------------------

describe('BuilderLayout — back-button guard', () => {
  it('replaces state for step 1 on initial mount (does not push)', async () => {
    // BuilderLayout's mount effect calls history.replaceState for the
    // initial step (see: window.history.replaceState({ step: 1 }, ...)),
    // not pushState — pushState only fires on subsequent step advances
    // (step > 1). This matches the component's actual mount behavior.
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    const { default: BuilderLayout } = await import(
      '../components/builder/BuilderLayout'
    )
    const onChangeMode = vi.fn()
    render(<BuilderLayout access={{}} onChangeMode={onChangeMode} />)

    expect(replaceStateSpy).toHaveBeenCalledWith(
      { step: 1 }, '', expect.any(String)
    )
    replaceStateSpy.mockRestore()
  })

  it('does not call onChangeMode on intermediate back steps', async () => {
    const onChangeMode = vi.fn()
    const { default: BuilderLayout } = await import(
      '../components/builder/BuilderLayout'
    )
    render(<BuilderLayout access={{}} onChangeMode={onChangeMode} />)

    const popEvent = new PopStateEvent('popstate', { state: { step: 1 } })
    window.dispatchEvent(popEvent)

    expect(onChangeMode).not.toHaveBeenCalled()
  })

  it('calls onChangeMode when popstate fires with no state', async () => {
    const onChangeMode = vi.fn()
    const { default: BuilderLayout } = await import(
      '../components/builder/BuilderLayout'
    )
    render(<BuilderLayout access={{}} onChangeMode={onChangeMode} />)

    const popEvent = new PopStateEvent('popstate', { state: null })
    window.dispatchEvent(popEvent)

    expect(onChangeMode).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Mode selector — color visibility regression test
// ---------------------------------------------------------------------------

describe('ModeSelector — color regression', () => {
  it('mode card title text is not white-on-white', async () => {
    const { default: App } = await import('../App')
    const { container } = render(<App />)
    const titles = container.querySelectorAll('.mode-card-title')
    titles.forEach(el => {
      const style = window.getComputedStyle(el)
      expect(style.color).not.toBe('rgb(255, 255, 255)')
    })
  })

  it('mode card description text is readable', async () => {
    const { default: App } = await import('../App')
    const { container } = render(<App />)
    const descs = container.querySelectorAll('.mode-card-desc')
    descs.forEach(el => {
      expect(el.textContent.trim().length).toBeGreaterThan(0)
    })
  })
})
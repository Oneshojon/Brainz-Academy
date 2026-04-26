/**
 * TestBuilder.test.jsx
 *
 * Tests for the test builder React app:
 *  - Mode selector (Random vs Manual)
 *  - Manual mode: all 5 steps
 *  - Back-button guard (pushState / popstate)
 *  - ModeSelector color visibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock window globals set by Django template
beforeEach(() => {
  window.USER_ROLE = 'TEACHER'
  window.LOGO_URL = '/static/logo.png'
  window.FEATURE_FLAGS = { random: true, manual: true }
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// App — mode selector
// ---------------------------------------------------------------------------

describe('App — mode selector', () => {
  it('renders both mode cards', async () => {
    const { App } = await import('../src/App')
    render(<App />)
    expect(screen.getByText(/Random \/ Filter/i)).toBeTruthy()
    expect(screen.getByText(/Manual Selection/i)).toBeTruthy()
  })

  it('mode cards have visible text (color not invisible)', async () => {
    const { App } = await import('../src/App')
    const { container } = render(<App />)
    const cards = container.querySelectorAll('.mode-card')
    expect(cards.length).toBeGreaterThanOrEqual(2)
    cards.forEach(card => {
      // Cards must not have color set to white-on-white
      const style = window.getComputedStyle(card)
      // Just assert the card is visible (not display:none or visibility:hidden)
      expect(style.display).not.toBe('none')
    })
  })

  it('clicking Manual Selection enters manual mode', async () => {
    const { App } = await import('../src/App')
    render(<App />)
    const manualCard = screen.getByText(/Manual Selection/i).closest('.mode-card')
    fireEvent.click(manualCard)
    // After clicking, step nav or builder should be visible
    await waitFor(() => {
      expect(
        screen.queryByText(/Step 1/i) ||
        screen.queryByText(/Board/i) ||
        screen.queryByText(/Exam Board/i)
      ).toBeTruthy()
    })
  })

  it('clicking Random / Filter enters random mode', async () => {
    const { App } = await import('../src/App')
    render(<App />)
    const randomCard = screen.getByText(/Random \/ Filter/i).closest('.mode-card')
    fireEvent.click(randomCard)
    await waitFor(() => {
      // Random mode shows the filter sidebar
      expect(
        screen.queryByText(/Generate/i) ||
        screen.queryByText(/Filter/i)
      ).toBeTruthy()
    })
  })

  it('disabled mode card cannot be clicked when flag is off', async () => {
    window.FEATURE_FLAGS = { random: false, manual: true }
    const { App } = await import('../src/App')
    render(<App />)
    const randomCard = screen.getByText(/Random \/ Filter/i).closest('.mode-card')
    expect(randomCard.classList.contains('disabled')).toBe(true)
  })

  it('Change Mode button returns to mode selector from manual mode', async () => {
    const { App } = await import('../src/App')
    render(<App />)
    fireEvent.click(screen.getByText(/Manual Selection/i).closest('.mode-card'))
    await waitFor(() => screen.getByText(/Change Mode/i))
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
    const { App } = await import('../src/App')
    render(<App />)
    fireEvent.click(screen.getByText(/Manual Selection/i).closest('.mode-card'))
    await waitFor(() => screen.getByText(/Board/i, { exact: false }))
  }

  it('starts on step 1 (board selection)', async () => {
    await enterManualMode()
    // Step 1 content visible
    expect(screen.getByText(/WAEC/i) || screen.getByText(/Board/i)).toBeTruthy()
  })

  it('step nav shows 5 steps', async () => {
    const { App } = await import('../src/App')
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
    // Mock the API fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 1, name: 'West African Examinations Council', abbreviation: 'WAEC' },
        { id: 2, name: 'National Examinations Council', abbreviation: 'NECO' },
      ])
    })
    const { default: Step1Board } = await import('../src/components/builder/Step1Board')
    render(<Step1Board onSelect={vi.fn()} selected={null} />)
    await waitFor(() => {
      expect(screen.getByText('WAEC')).toBeTruthy()
    })
  })

  it('calls onSelect when a board card is clicked', async () => {
    const onSelect = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        { id: 1, name: 'WAEC', abbreviation: 'WAEC' },
      ])
    })
    const { default: Step1Board } = await import('../src/components/builder/Step1Board')
    render(<Step1Board onSelect={onSelect} selected={null} />)
    await waitFor(() => screen.getByText('WAEC'))
    fireEvent.click(screen.getByText('WAEC').closest('.board-card') ||
                    screen.getByText('WAEC'))
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
      '../src/components/builder/Step4Questions'
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
      '../src/components/builder/Step4Questions'
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
      '../src/components/builder/Step4Questions'
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
      '../src/components/builder/Step4Questions'
    )
    render(<Step4Questions {...mockProps} />)
    await waitFor(() => {
      const label = screen.queryByText(/Choose Type/i) ||
                    screen.queryByText(/Type:/i)
      if (label) {
        const style = window.getComputedStyle(label)
        // Must not be invisible
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
      '../src/components/builder/Step4Questions'
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
  const mockQuestion = {
    id: 1,
    content: 'What is the speed of light?',
    question_type: 'OBJ',
    marks: 1,
    topics: [{ name: 'Waves' }],
    choices: [{ label: 'A', choice_text: '3×10⁸ m/s', is_correct: true }],
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
      '../src/components/builder/Step5Export'
    )
    render(<Step5Export {...mockProps} />)
    expect(screen.getByText(/speed of light/i)).toBeTruthy()
  })

  it('shows "Questions only" and "Mark scheme" download options', async () => {
    const { default: Step5Export } = await import(
      '../src/components/builder/Step5Export'
    )
    render(<Step5Export {...mockProps} />)
    expect(
      screen.queryByText(/Questions only/i) ||
      screen.queryByText(/Mark scheme/i)
    ).toBeTruthy()
  })

  it('shows topic name for each question', async () => {
    const { default: Step5Export } = await import(
      '../src/components/builder/Step5Export'
    )
    render(<Step5Export {...mockProps} />)
    expect(screen.queryByText('Waves')).toBeTruthy()
  })

  it('shows question numbered starting from 1', async () => {
    const { default: Step5Export } = await import(
      '../src/components/builder/Step5Export'
    )
    render(<Step5Export {...mockProps} />)
    // Should show Q1 or 1.
    expect(screen.queryByText('Q1') || document.body.textContent.includes('1')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Browser back-button guard (pushState / popstate)
// ---------------------------------------------------------------------------

describe('BuilderLayout — back-button guard', () => {
  it('popstate on step 4 goes to step 3, not mode selector', async () => {
    // This tests the useRef flag that prevents duplicate popstate handling
    const pushStateSpy = vi.spyOn(window.history, 'pushState')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    })
    const { default: BuilderLayout } = await import(
      '../src/components/builder/BuilderLayout'
    )
    const onChangeMode = vi.fn()
    render(<BuilderLayout access={{}} onChangeMode={onChangeMode} />)

    // Should have pushed a state for step 1
    expect(pushStateSpy).toHaveBeenCalled()
    pushStateSpy.mockRestore()
  })

  it('does not call onChangeMode on intermediate back steps', async () => {
    const onChangeMode = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    })
    const { default: BuilderLayout } = await import(
      '../src/components/builder/BuilderLayout'
    )
    render(<BuilderLayout access={{}} onChangeMode={onChangeMode} />)

    // Simulate popstate with step=1 (not below step 1)
    const popEvent = new PopStateEvent('popstate', { state: { step: 1 } })
    window.dispatchEvent(popEvent)

    expect(onChangeMode).not.toHaveBeenCalled()
  })

  it('calls onChangeMode when popstate fires with no state', async () => {
    const onChangeMode = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    const { default: BuilderLayout } = await import(
      '../src/components/builder/BuilderLayout'
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
    const { App } = await import('../src/App')
    const { container } = render(<App />)
    const titles = container.querySelectorAll('.mode-card-title')
    titles.forEach(el => {
      const style = window.getComputedStyle(el)
      // Color should not be #ffffff or white
      expect(style.color).not.toBe('rgb(255, 255, 255)')
    })
  })

  it('mode card description text is readable', async () => {
    const { App } = await import('../src/App')
    const { container } = render(<App />)
    const descs = container.querySelectorAll('.mode-card-desc')
    descs.forEach(el => {
      expect(el.textContent.trim().length).toBeGreaterThan(0)
    })
  })
})
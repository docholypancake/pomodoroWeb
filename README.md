[![CI/CD Pipeline](https://github.com/docholypancake/pomodoroWeb/actions/workflows/ci.yml/badge.svg)](https://github.com/docholypancake/pomodoroWeb/actions/workflows/ci.yml)

# Pomodoro Web

Pomodoro Web is a static browser-based focus app with a persistent 4-session Pomodoro timer, a mini timer for secondary pages, and a local-only productivity workspace for tasks and notes.

Production: [docholypancake.github.io/pomodoroWeb](https://docholypancake.github.io/pomodoroWeb/)

## Product Overview
- Persistent Pomodoro cycle that survives refreshes, tab switches, and browser restarts by rehydrating state from `localStorage`
- Full 4-session cycle with Pomodoro, Short Break, and Long Break transitions
- Mini timer in the header on secondary pages
- Local productivity page with to-do and notes tabs
- Optional transition sounds
- No login, no backend, no sync requirement

## Core Behavior
- Timer state is stored in `localStorage` and recalculated from wall-clock time whenever the timer page is reopened.
- After the fourth Pomodoro, the app runs the long break and then resets to idle Pomodoro 1.
- Settings apply only while the timer is idle. Running timers do not get mutated mid-session.
- Productivity items are stored locally and normalized on load so malformed stored data does not break the UI.

## Validation Rules
### Timer Settings
- Pomodoro: `1` to `120`
- Short Break: `1` to `30`
- Long Break: `1` to `80`
- `0` resets that specific field to its default value
- Decimal values are floored: `5.5` becomes `5`
- Negative values are rejected
- Scientific and hexadecimal-like input such as `1e2` and `0x10` are rejected

### Productivity Fields
- Task input is trimmed, required, and capped to `160` characters
- Note input is trimmed, required, and capped to `1200` characters
- The same rules apply when items are restored from `localStorage`, not only when entered through the UI

## Pages
- Timer: `index.html`
- Productivity: `productivity.html`
- About: `about.html`
- Help Us: `helpus.html`

## Technical Notes
- Static HTML/CSS/JS project
- Shared timer state lives in `src/js/timer-state.js`
- Shared settings validation lives in `src/js/settings-validation.js`
- Shared productivity storage logic lives in `src/js/productivity-store.js`
- Sound playback is coordinated through `src/js/sound.js`
- Browser tests use Playwright
- Unit tests use Vitest with `jsdom`

## Run Locally
Open the app directly in a browser for quick manual checks, or use the local test server for browser automation.

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm run test
npm run test:unit
npm run test:unit:coverage
npm run test:e2e
npm run test:smoke
npm run test:regression
```

Quiet mode without per-test `Expected / Actual` output:

```bash
npm run test:unit:quiet
npm run test:e2e:quiet
```

## Test Coverage
- Unit tests cover timer-state rules, settings validation, and productivity storage normalization
- A coverage report can be generated with `npm run test:unit:coverage`
- HTML coverage output is written to `coverage/unit/index.html`
- Smoke tests cover shell rendering, navigation, and page availability
- E2E tests cover timer persistence, field validation, mini timer behavior, cross-page sync, and productivity CRUD flows
- Coverage analysis notes live in `docs/testing/coverage-analysis.md`
- A manual checklist lives in `docs/testing/manual-test-plan.md`

## Product Analytics
- PostHog is initialized from `src/js/analytics.js`
- Configure `VITE_POSTHOG_API_KEY`, `VITE_POSTHOG_API_HOST`, and `VITE_POSTHOG_URGENT_FILTER_FLAG` in `.env`
- Custom events currently include `task_created`, `task_completed`, `task_deleted`, `task_creation_validation_failed`, `productivity_page_viewed`, and `urgent_filter_toggled`
- The `show-urgent-filter` feature flag reveals the urgent-task filter on the productivity page
- A lab-ready PostHog setup checklist lives in `docs/testing/posthog-lab5.md`

## Repository Structure
```text
index.html
productivity.html
about.html
helpus.html
src/
  assets/
  css/
    style.css
    modules/
  js/
    timer-state.js
    timer.js
    settings-validation.js
    settings.js
    mini-timer.js
    productivity-store.js
    productivity.js
    sound.js
    entries/
tests/
  unit/
  e2e/
docs/
  testing/
```

## Browser Note
Safari can aggressively suspend background tabs, which may interfere with background audio playback even when timer state itself is restored correctly. Chrome-based browsers generally give the best experience for background sound behavior.

## Contributing
- Report bugs or suggest changes: https://github.com/docholypancake/pomodoroWeb/issues

## License
See `LICENSE`.

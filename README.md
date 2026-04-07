# Pomodoro Web

Pomodoro Web is a static browser app for running a full Pomodoro focus cycle, keeping timer state alive across reloads, and tracking lightweight productivity notes without requiring an account or backend.

Live site: https://docholypancake.github.io/pomodoroWeb/

## Product Overview

Pomodoro Web is built around a simple goal: make a focus timer reliable enough to survive real usage.

That means:
- the timer persists in `localStorage`
- the active cycle is restored when the app is reopened
- the app can advance through missed pomodoro and break transitions based on wall-clock time
- a mini timer stays visible on non-home pages
- productivity notes and tasks stay local to the browser, with no login required

The app currently includes:
- a full timer page
- a productivity page with local todo and notes storage
- informational About and Help Us pages
- sound notifications for focus/break transitions
- automated unit and end-to-end test coverage

## Core Features

### Timer
- Pomodoro, Short Break, and Long Break modes
- automatic 4-session cycle progression
- persisted timer state across refreshes and browser reopen
- session progress ring and cycle projection text
- start, pause, and reset controls
- optional sound notifications

### Settings
- configurable Pomodoro / Short Break / Long Break durations
- integer-only input behavior
- decimal values are floored before saving
- `0` resets the field to its default value
- max values:
  - Pomodoro: `120`
  - Short Break: `30`
  - Long Break: `80`

### Productivity
- local to-do list
- local notes list
- add / edit / delete flows
- todo completion tracking
- safe recovery from malformed stored data

### Mini Timer
- appears on non-home pages
- reflects the shared timer state
- responds to storage updates from other pages
- links back to the main timer

## How the Timer Works

The timer does not try to keep JavaScript running while the page is closed. Instead, it stores enough state to reconstruct the correct timer segment later.

The persisted timer state includes:
- current mode
- whether the timer is running
- segment end timestamp
- remaining seconds for paused states
- completed pomodoros in the current 4-session cycle

When the app opens again:
1. settings are loaded from `localStorage`
2. timer state is loaded from `localStorage`
3. the timer compares the saved `endTime` against `Date.now()`
4. any completed pomodoro/break transitions are replayed until the correct current state is reached

This lets the timer continue logically in the background, even if the page was refreshed or closed.

## Sound Behavior

Pomodoro Web uses browser audio for transition sounds.

Important note:
- some browsers restrict autoplay/audio playback on pages that have not yet received a user interaction
- the app includes a shared sound manager to improve playback reliability across pages
- even with that in place, some browser policies may still suppress sound until the user interacts with the page

For the best experience, use a Chromium-based browser and interact with the page before relying on background transition sounds.

## Tech Stack

This project is intentionally lightweight:
- plain HTML
- modular CSS
- vanilla JavaScript
- Web Worker for timer ticks while the page is open
- `localStorage` for persistence
- Vitest + jsdom for unit tests
- Playwright for browser end-to-end tests

There is no backend, no authentication layer, and no database.

## Project Structure

```text
.
├── index.html
├── productivity.html
├── about.html
├── helpus.html
├── assets/
│   ├── icon/
│   ├── pictures/
│   └── sounds/
├── css/
│   ├── style.css
│   └── modules/
│       ├── base.css
│       ├── header.css
│       ├── layout.css
│       ├── timer.css
│       ├── productivity.css
│       ├── footer.css
│       ├── responsive.css
│       └── utilities.css
├── js/
│   ├── timer-state.js
│   ├── timer.js
│   ├── worker.js
│   ├── settings.js
│   ├── mini-timer.js
│   ├── productivity-store.js
│   ├── productivity.js
│   └── sound.js
├── docs/
│   └── testing/
│       └── manual-test-plan.md
└── tests/
    ├── unit/
    │   ├── timer-state.spec.js
    │   └── productivity-store.spec.js
    ├── e2e/
    │   ├── timer.spec.js
    │   ├── settings.spec.js
    │   └── productivity.spec.js
    └── server.js
```

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run the test server manually

```bash
npm run start:test-server
```

Then open:
- `http://127.0.0.1:4173/index.html`

You can also use any other static server if you prefer.

## Testing

### Run all tests

```bash
npm test
```

### Run unit tests

```bash
npm run test:unit
```

### Run unit tests in watch mode

```bash
npm run test:unit:watch
```

### Run end-to-end tests

```bash
npm run test:e2e
```

### Run headed Playwright tests

```bash
npm run test:e2e:headed
```

## Test Coverage Highlights

### Unit tests
- settings normalization
- timer state normalization
- timer hydration across elapsed segments
- cycle reset after long break
- productivity storage normalization and CRUD behavior

### End-to-end tests
- timer persistence across reloads
- pause/resume behavior
- settings validation and persistence
- mini timer cross-page synchronization
- transition sound request flows
- productivity add/edit/delete/complete flows
- malformed storage recovery

Manual QA notes also live in [docs/testing/manual-test-plan.md](docs/testing/manual-test-plan.md).

## Usage Notes

### Timer settings behavior
- only whole numbers are accepted
- decimal values are floored before saving
- entering `0` resets that field to its default value
- invalid values above the allowed max are rejected with inline validation

### Productivity data
- stored locally in the current browser
- not synced across devices
- clearing browser storage removes saved tasks, notes, settings, and timer state

## Contributing

Issues, bug reports, and suggestions are welcome:
- https://github.com/docholypancake/pomodoroWeb/issues

If you contribute code, please run:

```bash
npm test
```

before opening a PR.

## License

See [LICENSE](LICENSE).

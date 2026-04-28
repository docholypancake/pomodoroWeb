# Unit Test Coverage Analysis

## Command

```bash
npm run test:unit:coverage
```

The HTML report is generated at `coverage/unit/index.html`, and the JSON summary is generated at `coverage/unit/coverage-summary.json`.

## Current Summary

Coverage is currently calculated for `src/js/**/*.js`, excluding the simple entrypoint shims in `src/js/entries/*.js`.

| Metric | Result |
|---|---:|
| Statements | 38.64% |
| Branches | 84.32% |
| Functions | 80.76% |
| Lines | 38.64% |

## Strongly Covered Modules

| File | Statements | Why this is high |
|---|---:|---|
| `src/js/timer-state.js` | 96.53% | Core timer state transitions are pure and heavily unit-tested. |
| `src/js/settings-validation.js` | 94.53% | Validation rules are deterministic and covered with positive and negative cases. |
| `src/js/productivity-store.js` | 93.15% | Storage normalization and CRUD logic are covered through unit tests. |
| `src/js/app-status.js` | 100% | The environment-status DOM write is directly unit-tested. |
| `src/js/worker.js` | 100% | Worker start/stop/tick behavior is unit-tested with mocked timers. |

## Low-Coverage Modules

| File | Statements | Reason |
|---|---:|---|
| `src/js/timer.js` | 0% | Large browser coordinator module; behavior is currently validated through Playwright rather than unit tests. |
| `src/js/settings.js` | 0% | DOM-driven settings controller with many event listeners; covered indirectly by browser tests. |
| `src/js/productivity.js` | 0% | Page-level UI controller; CRUD and validation flows are exercised in e2e tests instead of isolated unit tests. |
| `src/js/mini-timer.js` | 0% | Cross-page header widget is validated through browser sync tests, not unit tests. |
| `src/js/sound.js` | 0% | Depends on browser audio APIs and autoplay policies; best validated with browser-level behavior tests. |

## Analysis of Untested Areas

### Code that should be unit-tested further

- `src/js/timer.js`
  The timer page still contains meaningful orchestration logic around state hydration, button actions, rendering, worker fallback, and transition sounds. A thin DOM-fixture unit suite would improve maintainability and raise confidence during refactors.

- `src/js/settings.js`
  The validation rules themselves are already covered in `src/js/settings-validation.js`, but the controller that binds those rules to DOM fields is not. Adding targeted unit tests for error rendering, field normalization, and event dispatch would be useful.

- `src/js/productivity.js`
  The storage layer is covered well, but the tab switching, edit mode rendering, inline validation messages, and storage-event synchronization on the page are still only covered through e2e. A few focused DOM-level unit tests would be justified.

### Code where missing unit coverage is acceptable for now

- `src/js/mini-timer.js`
  This module is highly event- and browser-state-driven. Because the important user-facing behavior is already covered in Playwright through cross-page synchronization and timer persistence scenarios, the lack of unit coverage is acceptable in the short term.

- `src/js/sound.js`
  Browser audio behavior depends on autoplay policy, media element state, and gesture unlocking. Unit tests here would mostly mock browser APIs without proving real playback behavior. The current browser-level regression tests are more valuable than shallow unit mocks.

## Conclusion

The current coverage profile shows that the most critical pure business-logic layers are well covered: timer state rules, settings validation, productivity storage, worker ticking, and app status injection. The remaining uncovered surface is concentrated in browser-controller modules whose most important behavior is already exercised by Playwright. The next best improvement would be adding DOM-level unit tests for `src/js/timer.js`, `src/js/settings.js`, and `src/js/productivity.js`.

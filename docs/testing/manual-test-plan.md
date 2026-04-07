# Manual Test Plan

## Timer Persistence
- Fresh load shows `25:00`, `Pomodoro 1 of 4`, and `Cycle ends at --:--`.
- Starting the timer changes the primary button to `Pause` and begins counting down.
- Pausing preserves the remaining time after a reload.
- Reset returns the timer to idle `Pomodoro 1` and clears any in-progress cycle.
- Refreshing `index.html` during an active pomodoro preserves the running countdown.
- Closing the page and reopening after the pomodoro duration elapses advances into the correct break.
- Reopening after enough elapsed time to skip multiple segments lands on the correct current mode and remaining time.
- Completing the fourth pomodoro followed by the long break resets to idle `Pomodoro 1`.

## Settings
- Saved settings persist after reload.
- Invalid values outside the allowed ranges show an inline validation message and do not save.
- Updating settings while the timer is idle updates the restored countdown length for the current mode.
- The settings button is disabled while the timer is running.

## Mini Timer
- `about.html`, `helpus.html`, and `productivity.html` show the mini timer in the header.
- The mini timer reflects mode, remaining time, and running/paused/ready status from the shared timer state.
- Navigating away from `index.html` while the timer runs keeps the mini timer in sync after storage updates.

## Productivity
- Adding, editing, deleting, and completing a todo item updates the UI and persists after reload.
- Adding, editing, and deleting a note updates the UI and persists after reload.
- Empty submissions show inline validation feedback.
- Corrupted `pomodoroProductivity.v1` storage falls back to a safe empty state without breaking the page.

## Responsive / Visual
- Header navigation wraps cleanly on mobile widths.
- The mini timer remains readable and full-width on narrow screens.
- Timer circle, controls, settings panel, and productivity forms remain usable on tablet and mobile sizes.
- About page image and Help Us donation QR code scale without layout overlap.

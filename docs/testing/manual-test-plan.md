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

### Timer Settings Positive Cases
- Open Settings, enter `30` for Pomodoro, `6` for Short Break, `20` for Long Break, keep sound enabled, click `Save & Close`.
  Expected result: settings panel closes, timer updates to `30:00`, no validation error is shown, and the same values remain after reload.
- Open Settings, save boundary minimum values `1` for Pomodoro, `1` for Short Break, and `1` for Long Break.
  Expected result: values save successfully, timer reflects the selected duration for the current mode, and no error is shown.
- Open Settings, save boundary maximum values `120` for Pomodoro, `30` for Short Break, and `80` for Long Break.
  Expected result: values save successfully and persist after reload.
- Open Settings, disable `Sound Notifications`, click `Save & Close`, then reload and reopen Settings.
  Expected result: the checkbox remains unchecked after reload.
- With the timer idle on Pomodoro, save a new Pomodoro duration.
  Expected result: the main timer display immediately reflects the new Pomodoro duration.
- With the timer idle on Short Break or Long Break, save a new break duration for the current mode.
  Expected result: the timer display updates to the new break length for that mode.
- Open Settings, change values, then click `Cancel`.
  Expected result: unsaved changes are discarded and reopening Settings shows the previously saved values.

### Timer Settings Negative Cases
- Enter `0` in Pomodoro and click `Save & Close`.
  Expected result: the field resets to its default value (`25` for Pomodoro), the value is accepted, and reopening Settings shows the defaulted value.
- Enter `121` in Pomodoro and click `Save & Close`.
  Expected result: save is blocked with the same inline validation behavior.
- Enter `0` or `31` in Short Break and click `Save & Close`.
  Expected result: `0` resets to the default short break value (`5`), while `31` is blocked with `Short break must be between 1 and 30.`.
- Enter `0` or `81` in Long Break and click `Save & Close`.
  Expected result: `0` resets to the default long break value (`15`), while `81` is blocked with `Long break must be between 1 and 80.`.
- Clear a numeric field so it becomes blank, then click `Save & Close`.
  Expected result: save is blocked, the field is marked invalid, and previously saved values are preserved.
- Enter a decimal such as `5.5` and click `Save & Close`.
  Expected result: the field is floored to `5`, the displayed value changes to `5`, and the save succeeds.
- Enter non-numeric text through browser devtools/manual DOM edit, then click `Save & Close`.
  Expected result: save is blocked because the field must resolve to a whole number within that field’s allowed range.
- Start the timer and attempt to open Settings.
  Expected result: the Settings button stays disabled and the settings panel does not open while the timer is running.
- Corrupt `pomodoroSettings` in localStorage manually, then reload and open Settings.
  Expected result: the app falls back to safe default settings instead of crashing.

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

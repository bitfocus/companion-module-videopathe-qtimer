## QTimer

This module controls QTimer through the HTTP API exposed by the application.

App is available for free on videopathe.com for Windows / MacOS.

### Connection

- Default host: `127.0.0.1`
- Default port: `2222`
- The poll interval controls how often Companion refreshes the current state.
- `Poll NDI / OMT stream status` can be turned off if you do not use the network outputs.

### What This Module Controls

- Timer: start, pause, reset, set duration, adjust duration, presets, blink settings, additional time
- Chrono: start, stop, reset, blink settings, color thresholds
- Display: timer, clock, chrono, logo, black, test pattern
- **Second extended screen: independent mode, mirror on/off, and per-output layout presets**
- **Layout presets: apply any of the 12 presets to the main screen, the second screen, or the network output**
- **Display elements: show/hide, recolour, progress-bar thresholds, raw `displaySettings` JSON**
- **Clock: 12h AM/PM or 24h format**
- Messages: set, clear, blink, visibility, red alert, preset messages, operator-view messages
- Audio: enable, disable, stop, master volume, stop-current-on-play, rules on or off, play audio
- Playlist: start, stop, previous, next, select session, enable or disable sessions, intermission and end-of-session options, save
- **Network streams: NDI and OMT status, test patterns, alpha channel, stop**
- Ready Pages: pre-grouped button banks for Main, Timer, Chrono, Audio, Playlist, Show, Intermission, and Screen 2

### Second Extended Screen

QTimer 2026.8 can drive a second extended screen with its own display mode while the
running timer/chrono stays shared with the main screen.

- `Display: Set mode` now has a **Target screen** option: `Main screen`, `Second extended screen`, or `Both screens`.
  Sending a mode to the second screen automatically takes it out of mirror mode, exactly like the app does.
- `Screen 2: Mirror main screen` toggles or forces the mirror behaviour back on.
- `Layout: Apply preset to an output` assigns one of the 12 layout presets to `main`,
  `extended2` (second screen) or `network` (NDI / OMT). For `main` the preset is applied live;
  for the other two it is stored as the output's layout override, like the _Layouts per output_ popup.

Matching feedbacks: `Second screen mirrors the main screen`, `Second screen mode matches`
(with an _only when independent_ option so a button lights up only when the second screen
is doing its own thing), and `Output layout preset matches`.

Matching variables: `screen2_follow_main`, `screen2_mode`, `screen2_independent_mode`,
`output_layout_extended`, `output_layout_extended2`, `output_layout_network`.

### Live Dropdowns

Several options are filled from QTimer itself and refresh while Companion is connected:

- timer presets (`Timer: Recall preset`)
- preset messages (`Message: Send a preset message`)
- audio sounds (`Audio: Play sound`)
- audio trigger rules (`Audio: Set one rule enabled` / `volume`, and the matching feedback)
- playlist sessions (`Playlist: Select session by index`, `Playlist: Enable or disable session`)

Each of these accepts a custom value too, so you can drive them from a Companion variable.

### Toggles

Actions that used to be enable-only now offer a `Toggle` choice that resolves against the
value QTimer currently reports: audio enabled, stop-current-on-play, all audio rules, a single
audio rule, chrono color thresholds, playlist session enabled, auto intermission, use default
session duration, second-screen mirror, display element visibility, and the NDI/OMT test patterns.

### Variables

The module exposes useful runtime values such as:

- remaining time and duration
- elapsed time and progress percentage
- current display mode, layout family, and second screen mode
- message text, color, visibility, and blinking state
- chrono time and thresholds
- additional time full/hours/minutes/seconds
- audio enabled state and master volume
- playlist current and next session, end action, intermission countdown
- NDI and OMT source name, resolution, frame rate, running state

### Feedbacks

The module includes boolean feedbacks for common states:

- connection status
- current display mode, layout family, and second screen mode/mirror
- output layout preset per output
- display element visibility and clock format
- timer running or finished, remaining time and progress comparisons
- chrono running, chrono time comparison, additional time comparison
- message visibility and blinking
- red alert active
- audio enabled, all rules, and a single rule
- playlist running, in intermission, session enabled, end action

### Network Streams (NDI / OMT)

Status is read-only by default and drives the `ndi_*` / `omt_*` variables and feedbacks.

Only the self-contained stream controls are exposed as actions: **test pattern**, **alpha
channel**, and **stop**. Starting a real NDI/OMT program stream is deliberately _not_ exposed,
because QTimer's capture pipeline is set up inside the app (Electron IPC) before the HTTP
`start` call — starting it over HTTP alone would publish a source with no frames. Start the
stream from the QTimer _Network streams_ window, then use Companion to monitor or stop it.

### Known Design Choice

The current implementation uses a hybrid approach:

- WebSocket for live timer state refresh
- HTTP polling for periodic fallback refresh, playlist, audio, and stream status

### Local Development With Companion

- Set the Developer Modules path to the parent folder that contains this module folder.
- Add the connection from the `Connections` page, not from `Manage Modules`.
- Recommended local config is host `127.0.0.1`, port `2222`, poll interval `1000`.
- While developing the module, run `yarn dev` in the module folder so Companion can pick up rebuilt files automatically.

### Readout Presets

This module includes readout presets intended for stream deck style operation:

- Timer readout buttons for full time, hours, minutes, and seconds
- Additional time readout buttons for full time, hours, minutes, and seconds
- Clock readout buttons for full time, hours, minutes, seconds, and AM PM
- Chrono readout buttons for full time, hours, minutes, and seconds
- Second screen mode and per-output layout readouts
- NDI and OMT stream readouts
- Playlist current/next session, intermission countdown, and message readout buttons

These presets rely on module variables and can be styled further by the user after being placed.

### Ready Page Presets

The module also includes ready-made preset categories for faster deployment:

- `Ready Page - Main`
- `Ready Page - Timer`
- `Ready Page - Chrono`
- `Ready Page - Audio`
- `Ready Page - Playlist`
- `Ready Page - Show`
- `Ready Page - Intermission`
- `Ready Page - Screen 2`

These categories duplicate a curated subset of presets so you can populate a Companion page quickly without assembling each button manually.

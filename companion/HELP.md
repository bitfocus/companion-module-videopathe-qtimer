## QTimer

This module controls QTimer through the HTTP API exposed by the application. 

App is available for free on videopathe.com for Windows / MacOS.

### Connection

- Default host: `127.0.0.1`
- Default port: `2222`
- The poll interval controls how often Companion refreshes the current state.

### What This Module Controls

- Timer: start, pause, reset, set duration, adjust duration, presets, blink settings, additional time
- Chrono: start, stop, reset, blink settings, color thresholds
- Display: timer, clock, chrono, logo, black, test pattern
- Messages: set, clear, blink, visibility, red alert
- Audio: enable, disable, stop, master volume, stop-current-on-play, rules on or off, play audio
- Playlist: start, stop, previous, next, select session, enable or disable sessions, intermission and end-of-session options
- Ready Pages: pre-grouped button banks for Main, Timer, Chrono, Audio, Playlist, Show, and Intermission

### Variables

The module exposes useful runtime values such as:

- remaining time and duration
- elapsed time and progress percentage
- current display mode
- message text and color
- message blinking state
- chrono time
- additional time full/hours/minutes/seconds
- audio enabled state and master volume
- playlist current session name and index

### Feedbacks

The module includes boolean feedbacks for common states:

- connection status
- current display mode
- timer running or finished
- chrono running
- message visibility and blinking
- red alert active
- audio enabled and rule state
- playlist running or in intermission

### Known Design Choice

The current implementation uses a hybrid approach:

- WebSocket for live timer state refresh
- HTTP polling for periodic fallback refresh and playlist state

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
- Playlist and message readout buttons

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

These categories duplicate a curated subset of presets so you can populate a Companion page quickly without assembling each button manually.

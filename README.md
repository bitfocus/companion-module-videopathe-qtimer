# companion-module-videopathe-qtimer

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

Bitfocus Companion module for controlling QTimer over its local HTTP API. 

App is available for free on videopathe.com for Windows / MacOS.

## Scope

This first implementation targets the QTimer API exposed by the desktop app on port `2222`.
It currently uses a hybrid model:

- WebSocket for immediate timer state updates
- HTTP polling for periodic refresh and playlist synchronization

It covers:

- timer transport and duration control
- timer blink and additional-time control
- chrono transport and display options
- display mode switching
- message and red alert control
- audio master toggles and rule toggles
- playlist transport and main options
- Companion variables and feedbacks based on QTimer state
- regrouped presets for Timer, Chrono, Display, Message, Audio, Playlist, and Readouts
- ready pages for Main, Timer, Chrono, Audio, Playlist, Show, and Intermission

## Development

Install dependencies:

```bash
yarn
```

Build once:

```bash
yarn build
```

Watch mode:

```bash
yarn dev
```

This is the recommended mode while testing with Companion. The developer modules folder will detect rebuilt files and reload the module.

Package for Companion:

```bash
yarn package
```

## Notes

- Default target is `127.0.0.1:2222`.
- QTimer must be running with its API server enabled.
- The module consumes WebSocket `state` updates from QTimer and also polls `/api/status` and `/api/playlist/state`.
- The Companion Developer Modules path must point to the parent folder containing `companion-module-videopathe-qtimer`, not to the module folder itself.

## Local Companion Test Flow

1. In Companion, set the Developer Modules path to the parent folder containing this module.
2. Add a new connection using `Videopathe: QTimer`.
3. Configure host `127.0.0.1`, port `2222`, poll interval `1000`.
4. Save the connection and confirm it reaches `ok` status.
5. Drag presets from the module onto buttons.

Suggested first checks:

- `Timer Start`, `Timer Pause`, `Timer Reset`
- `Blink Timer`, `Addt Toggle`, `Addt Blink`
- `Mode Timer`, `Mode Clock`, `Mode Chrono`
- `Timer HH`, `Timer MM`, `Timer SS`
- `Additional HH`, `Additional MM`, `Additional SS`
- `Clock HH`, `Clock MM`, `Clock SS`
- `Chrono HH`, `Chrono MM`, `Chrono SS`
- `Message Show`, `Message Blink`, `Message Alert`
- `Audio`, `Rules On`
- `Ready Page - Main`, `Ready Page - Show`, `Ready Page - Intermission`

## Ready Pages

The module now includes preset categories intended to give you directly usable button banks:

- `Ready Page - Main`: core display mode, transport, and message controls
- `Ready Page - Timer`: split timer readouts and timer-specific actions
- `Ready Page - Chrono`: split chrono readouts and chrono-specific actions
- `Ready Page - Audio`: global audio controls plus a selection of play presets
- `Ready Page - Playlist`: playlist transport and readouts
- `Ready Page - Show`: a compact stage-facing page mixing timer, message, and audio essentials
- `Ready Page - Intermission`: a page focused on clock/logo/intermission workflow

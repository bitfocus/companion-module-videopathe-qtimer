A [Bitfocus Companion](https://bitfocus.io/companion) module to control **QTimer**, the countdown, clock &
show-timer application for Windows and macOS, over its local HTTP API.

QTimer is available for free on [videopathe.com](https://videopathe.com).

See [HELP.md](./companion/HELP.md) for the in-Companion help page, and [LICENSE](./LICENSE).

## Scope

The module targets the API exposed by the QTimer desktop app on port `2222`. It uses a **hybrid** model:

- a **WebSocket** (`ws://<host>:2222/?client=companion-module`) that pushes `state` updates the moment the
  timer changes, so transport feedbacks react without waiting for a poll
- **HTTP polling** for everything the socket does not carry — `/api/status`, `/api/playlist/state`,
  `/api/audio/settings`, and (optionally) `/api/ndi/status` + `/api/omt/status`

The default poll interval is `1000 ms`. The socket reconnects on its own, and polling keeps the connection
alive if the socket is unavailable, so the module stays usable either way.

It covers:

- timer transport, duration set/adjust, stored presets, blink on end and blink threshold
- additional time: toggle, blink toggle, and readouts
- chrono transport, hours display, blink settings, and the two colour thresholds
- display mode switching (Timer / Clock / Chrono / Logo / Black / Mire) on the main screen, the second
  extended screen, or both at once
- layout presets (12 per mode) applied to the main screen, the second extended screen, or the network output
- display elements: show/hide, per-element colour, progress-bar thresholds, timer colour sync, and a raw
  `displaySettings` JSON escape hatch
- clock 12h AM/PM or 24h format
- messages: free text, preset messages, operator-view layout messages, blink, visibility, red alert, and
  speaker acknowledgement
- audio: master enable, master volume, stop-current-on-play, all rules or a single rule, and sound playback
- playlist: transport, session selection by index or name, session enable/disable, end-of-session action,
  auto mode, intermission control and duration, defaults, clear, and save
- NDI / OMT stream monitoring, test patterns, alpha channel, and stop
- 117 Companion variables covering timer, chrono, clock, message, audio, playlist, layout and stream state
- 47 feedbacks, including two advanced ones (red alert style, current display time colour & blink)
- ready-made presets grouped by Timer, Chrono, Display, Screen 2, Layouts, Message, Audio, Playlist,
  Network Streams and Readouts

## Requirements

- QTimer running on Windows or macOS, with its API server enabled
- The QTimer machine and the Companion machine on the same network (or the same machine)
- Companion 3.x

## Setup

1. Start QTimer and make sure its web server is running.
2. Note the machine's IP address, or use `127.0.0.1` if Companion runs on the same machine.
3. In Companion, add a **Videopathe: QTimer** connection and fill in:

| Field                            | Default     | Description                                                                    |
| -------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| **QTimer host**                  | `127.0.0.1` | IP address of the machine running QTimer, e.g. `192.168.1.20`                  |
| **QTimer port**                  | `2222`      | QTimer HTTP API port                                                           |
| **Poll interval (ms)**           | `1000`      | Periodic refresh rate, `250`–`10000`. The WebSocket already covers timer state |
| **API PIN**                      | _blank_     | Only for a remote Companion when QTimer's API is PIN-protected — see below     |
| **Poll NDI / OMT stream status** | on          | Turn off if the network outputs are unused — saves two requests per tick       |

4. Save, and confirm the connection reaches the `ok` status.
5. Drag presets from the module onto your buttons.

### PIN-protected API

QTimer can lock its network interfaces behind a 4–8 digit PIN (_Settings → Security_). That PIN has two
separate switches, and only the second one concerns this module:

- **PIN enabled** alone guards the web interface. The REST API stays open, so the module keeps working with
  the **API PIN** field left blank.
- **Protection API par PIN** additionally guards `/api/*`. From that point a remote Companion must
  authenticate, and the **API PIN** field has to hold the same PIN.

QTimer never asks a PIN of requests coming from its own machine, so a `127.0.0.1` connection never needs
this field, whatever the settings.

When a PIN is set, the module exchanges it for QTimer's session cookie on the first `401` and retries the
request. The cookie lasts 12 hours and is renewed the same way when it expires, so nothing has to be done
by hand. A wrong or missing PIN puts the connection in the **authentication failure** state with the reason
in the module log, rather than looking like an unreachable host.

The WebSocket is not covered by QTimer's PIN middleware and stays reachable either way; the module sends
the cookie on the handshake anyway once it holds one.

## Actions

| Action                                     | Options                                             | Notes                                                                                   |
| ------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| General: Refresh QTimer state now          | —                                                   | Forces an immediate poll                                                                |
| Timer: Start / Pause / Reset               | —                                                   | Transport                                                                               |
| Timer: Set duration                        | duration (s)                                        | `0`…`86400`                                                                             |
| Timer: Adjust duration                     | adjustment (s)                                      | Negative values subtract                                                                |
| Timer: Recall preset                       | preset                                              | The preset list is read live from QTimer; a custom value may be an index or a variable  |
| Timer: Toggle hours display                | —                                                   |                                                                                         |
| Timer: Set blink on end                    | toggle / on / off                                   |                                                                                         |
| Timer: Set blink threshold                 | seconds or percent, value                           |                                                                                         |
| Timer: Toggle additional time / its blink  | —                                                   |                                                                                         |
| Chrono: Start / Stop / Reset               | —                                                   | Transport                                                                               |
| Chrono: Toggle hours display               | —                                                   |                                                                                         |
| Chrono: Set blink on end                   | toggle / on / off                                   |                                                                                         |
| Chrono: Set blink threshold                | seconds or percent, value                           |                                                                                         |
| Chrono: Set color thresholds enabled       | toggle / on / off                                   |                                                                                         |
| Chrono: Set color threshold value          | threshold 1 / 2, seconds                            |                                                                                         |
| Chrono: Set threshold color                | colour 1 / 2, colour                                |                                                                                         |
| Display: Set mode                          | mode, target screen                                 | Modes: Timer, Clock, Chrono, Logo, Black, Mire. Target: main / second screen / both     |
| Screen 2: Mirror main screen               | toggle / on / off                                   | Sending a mode to the second screen takes it out of mirror mode, exactly like the app   |
| Layout: Apply preset to an output          | layout mode, preset `0`…`11`, output                | Output: main (+ extended & Key/Cut), second extended screen, network stream             |
| Display: Show or hide an element           | element, toggle / on / off                          | Timer, progress bar, message, clock, chrono, additional time, logo, black, test pattern |
| Display: Set element color                 | element, colour                                     |                                                                                         |
| Display: Sync timer color with progress    | toggle / on / off                                   |                                                                                         |
| Display: Set progress bar thresholds       | threshold values                                    |                                                                                         |
| Display: Set raw display settings (JSON)   | JSON                                                | Escape hatch for settings with no dedicated action                                      |
| Clock: Set 12h AM/PM format                | toggle / on / off                                   |                                                                                         |
| Message: Set message                       | text, colour, blink                                 |                                                                                         |
| Message: Send a preset message             | preset message                                      | List read live from QTimer, custom value accepted                                       |
| Message: Send an operator layout message   | layout message options                              | The operator-view messages                                                              |
| Message: Acknowledge from speaker view     | —                                                   |                                                                                         |
| Message: Clear / Toggle visibility / blink | —                                                   |                                                                                         |
| Message: Start red alert                   | duration                                            |                                                                                         |
| Audio: Play sound                          | sound, volume                                       | Sound list read live from QTimer                                                        |
| Audio: Stop current sound                  | —                                                   |                                                                                         |
| Audio: Set enabled / Toggle enabled        | toggle / on / off                                   |                                                                                         |
| Audio: Set master volume                   | volume `0`…`100`                                    |                                                                                         |
| Audio: Set stop current on play            | toggle / on / off                                   |                                                                                         |
| Audio: Set all rules enabled               | toggle / on / off                                   |                                                                                         |
| Audio: Set one rule enabled / volume       | rule, state or volume                               | Rule list read live from QTimer                                                         |
| Playlist: Start / Stop / Next / Previous   | —                                                   | Transport over sessions                                                                 |
| Playlist: Select session by index          | index                                               | Session list read live from QTimer                                                      |
| Playlist: Select session by name           | name, exact match / contains                        |                                                                                         |
| Playlist: Enable or disable session        | session, toggle / on / off                          |                                                                                         |
| Playlist: Set end action                   | disabled / stop playlist / intermission / auto mode | What happens when a session ends                                                        |
| Playlist: Set auto mode target             | Clock / Logo / Black                                | The mode used by the `auto mode` end action                                             |
| Playlist: Set auto intermission enabled    | toggle / on / off                                   |                                                                                         |
| Playlist: Toggle or force intermission     | toggle / on / off                                   |                                                                                         |
| Playlist: Set intermission duration        | seconds                                             |                                                                                         |
| Playlist: Set default session duration     | seconds                                             |                                                                                         |
| Playlist: Set default additional time      | seconds                                             |                                                                                         |
| Playlist: Set use default session duration | toggle / on / off                                   |                                                                                         |
| Playlist: Clear all sessions / log         | —                                                   |                                                                                         |
| Playlist: Save to persistent storage       | —                                                   |                                                                                         |
| NDI / OMT: Test pattern                    | toggle / on / off                                   |                                                                                         |
| NDI: Set alpha channel                     | toggle / on / off                                   |                                                                                         |
| NDI / OMT: Stop stream                     | —                                                   |                                                                                         |
| System: Clear trigger logs                 | —                                                   |                                                                                         |

Starting a real NDI/OMT program stream is deliberately _not_ exposed. QTimer sets up its capture pipeline
inside the app (Electron IPC) before the HTTP `start` call, so starting it over HTTP alone would publish a
source with no frames. Start the stream from QTimer's _Network streams_ window, then monitor or stop it here.

Every dropdown fed from QTimer — timer presets, preset messages, audio sounds, audio rules, playlist
sessions — accepts a custom value too, so it can be driven from a Companion variable. The actions that used
to be enable-only now offer a `Toggle` choice resolved against the value QTimer currently reports.

## Feedbacks

| Feedback                                       | Type     | Description                                                                                                        |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| Connection is ok                               | boolean  | The module is reaching QTimer                                                                                      |
| Display mode matches                           | boolean  | Timer / Clock / Chrono / Logo / Black / Mire                                                                       |
| Timer is running / is finished                 | boolean  |                                                                                                                    |
| Timer blink on end is enabled / is active      | boolean  | The setting, and the live blink phase                                                                              |
| Additional time is running / enabled / blinks  | boolean  |                                                                                                                    |
| Additional time comparison                     | boolean  | `<`, `<=`, `=`, `>=`, `>` against a number of seconds                                                              |
| Chrono is running                              | boolean  |                                                                                                                    |
| Chrono blink is enabled / is active            | boolean  |                                                                                                                    |
| Chrono color thresholds are enabled            | boolean  |                                                                                                                    |
| Chrono reached threshold 1 / 2                 | boolean  |                                                                                                                    |
| Chrono time comparison                         | boolean  | Comparison against a number of seconds                                                                             |
| Remaining time comparison                      | boolean  | Useful for an end-of-session warning                                                                               |
| Progress percent comparison                    | boolean  |                                                                                                                    |
| Message is visible / blinking is enabled       | boolean  |                                                                                                                    |
| Message color matches                          | boolean  |                                                                                                                    |
| Red alert is active                            | boolean  |                                                                                                                    |
| **Red alert color style**                      | advanced | Paints the button with QTimer's own alert colour                                                                   |
| Current display time blink is enabled          | boolean  |                                                                                                                    |
| **Current display time color and blink style** | advanced | Mirrors on the button exactly what the screen is showing                                                           |
| Audio is enabled                               | boolean  |                                                                                                                    |
| Audio stop current on play is enabled          | boolean  |                                                                                                                    |
| At least one audio rule is enabled             | boolean  |                                                                                                                    |
| Audio rule is enabled                          | boolean  | Per named rule                                                                                                     |
| Playlist is running / is in intermission       | boolean  |                                                                                                                    |
| Current playlist session index / name matches  | boolean  | The name variant offers exact match or contains                                                                    |
| Playlist session is enabled                    | boolean  |                                                                                                                    |
| Playlist end of session action matches         | boolean  |                                                                                                                    |
| Intermission layout is active                  | boolean  |                                                                                                                    |
| Second screen mirrors the main screen          | boolean  |                                                                                                                    |
| Second screen mode matches                     | boolean  | With an _only when independent_ option, so the button lights up only when the second screen is doing its own thing |
| Output layout preset matches                   | boolean  | Per output role                                                                                                    |
| Active layout family matches                   | boolean  |                                                                                                                    |
| Display element is visible                     | boolean  | Per element                                                                                                        |
| Clock uses 12h AM/PM format                    | boolean  |                                                                                                                    |
| NDI / OMT stream is running                    | boolean  |                                                                                                                    |
| NDI / OMT test pattern is active               | boolean  |                                                                                                                    |

## Variables

All variables are prefixed with `$(videopathe-qtimer:…)`.

**Connection** — `connection_status`, `websocket_connected`, `server_url`

**Display** — `display_mode`, `display_time_source`, `display_time_formatted`, `display_time_full_formatted`,
`display_time_hours`, `display_time_minutes`, `display_time_seconds`, `layout_mode`, `clock_12h_format`

**Timer** — `timer_running`, `timer_full_formatted`, `timer_blink_enabled`, `timer_blink_active`,
`timer_hours`, `timer_minutes`, `timer_seconds`, `timer_preset_count`

**Duration, elapsed & progress** — `duration_seconds`, `duration_formatted`, `duration_full_formatted`,
`duration_hours`, `duration_minutes`, `duration_seconds_component`, `time_remaining_seconds`,
`time_remaining_formatted`, `elapsed_seconds`, `elapsed_formatted`, `elapsed_full_formatted`,
`elapsed_hours`, `elapsed_minutes`, `elapsed_seconds_component`, `progress_percent`, `remaining_percent`

**Additional time** — `additional_time_enabled`, `additional_time_running`, `additional_time_blink`,
`additional_time_seconds`, `additional_time_formatted`, `additional_time_hours`, `additional_time_minutes`,
`additional_time_seconds_component`

**Clock** — `clock_text`, `clock_hours`, `clock_minutes`, `clock_seconds`, `clock_ampm`

**Chrono** — `chrono_seconds`, `chrono_formatted`, `chrono_full_formatted`, `chrono_blink_enabled`,
`chrono_blink_active`, `chrono_color_thresholds_enabled`, `chrono_threshold1`, `chrono_threshold1_color`,
`chrono_threshold2`, `chrono_threshold2_color`, `chrono_hours`, `chrono_minutes`, `chrono_seconds_component`

**Message & alert** — `message_text`, `message_visible`, `message_color`, `message_blinking`,
`red_alert_active`, `red_alert_color`, `preset_message_count`

**Audio** — `audio_enabled`, `audio_master_volume_percent`, `audio_stop_current_on_play`, `audio_rule_count`,
`audio_enabled_rule_count`

**Playlist** — `playlist_running`, `playlist_intermission`, `playlist_session_count`,
`playlist_enabled_session_count`, `playlist_current_session_index`, `playlist_current_session_name`,
`playlist_current_session_mode`, `playlist_current_session_enabled`, `playlist_chrono_seconds`,
`playlist_chrono_formatted`, `playlist_chrono_hours`, `playlist_chrono_minutes`,
`playlist_chrono_seconds_component`, `playlist_next_session_name`, `playlist_next_session_index`,
`playlist_end_action`, `playlist_auto_mode`, `playlist_auto_intermission`, `playlist_intermission_duration`,
`playlist_intermission_remaining`, `playlist_intermission_remaining_formatted`,
`playlist_default_session_duration`, `playlist_default_additional_time`, `playlist_session_log_count`,
`intermission_active`

**Outputs** — `screen2_follow_main`, `screen2_mode`, `screen2_independent_mode`, `output_layout_extended`,
`output_layout_extended2`, `output_layout_network`

**Network streams** — `ndi_available`, `ndi_running`, `ndi_test_pattern`, `ndi_source_name`,
`ndi_resolution`, `ndi_frame_rate`, and the matching `omt_*` set

## Presets

Ready-made buttons, grouped in the Presets tab. Every preset also carries a "connection lost" feedback that
turns the button dark red when QTimer is unreachable.

- **Timer** — start, pause, reset, ±5 s, ±60 s, set 5/10/15/30 min, blink toggle, blink at 60 s, additional
  time toggle, additional time blink
- **Chrono** — start, stop, reset, blink toggle, blink at 60 s, colour thresholds toggle, threshold 1 at
  5 min, threshold 2 at 10 min
- **Display** — one button per display mode, show/hide for the six main elements, clock 12/24h, timer colour
  sync, plus the current display time readouts
- **Screen 2** — mirror toggle, mirror on, and one button per mode for the second screen alone and for both
  screens at once
- **Layouts** — the first four timer layout presets for each output (main, second screen, network)
- **Message** — show, blink, clear, red alert, a generic message, a pause message
- **Audio** — master toggle, stop, stop-current-on-play, rules on / off, volume 80 %, and one play button per
  sound exposed by QTimer
- **Playlist** — start, stop, previous, next, intermission toggle, plus the playlist readouts: current
  session, session mode, next session, session chrono, intermission countdown, current display time
- **Network Streams** — NDI and OMT test pattern toggles and stop buttons
- **Readouts** — the full readout set for timer, additional time, clock, chrono, display time, second screen
  mode, per-output layouts, NDI / OMT status, playlist sessions and message text

The `Playlist` category is the one to reach for when building an intermission page: it puts the transport,
the intermission toggle and the intermission countdown side by side.

## Development

```sh
corepack enable
yarn install
yarn build      # compiles TypeScript to dist/
yarn dev        # watch mode — recommended while testing with Companion
yarn lint       # eslint + prettier
yarn format     # applies prettier
yarn package    # builds a .tgz for Companion
```

To test in Companion developer mode, set Companion's **Developer modules path** to the _parent_ folder
containing `companion-module-videopathe-qtimer` — not to the module folder itself — then add a
**Videopathe: QTimer** connection from the `Connections` page (not from `Manage Modules`). In watch mode,
Companion reloads the module when the files are rebuilt.

Suggested first checks once connected: `TIMER START` / `TIMER PAUSE` / `TIMER RESET`, the display mode
buttons, `SCR2 MIRROR`, a layout preset, `MESSAGE SHOW`, `AUDIO`, and the NDI / OMT test patterns.

## API reference

- WebSocket `ws://<host>:2222/?client=companion-module` — pushed `state` updates
- `GET /api/status` — aggregated state snapshot (timer, chrono, display, message, screens, layouts)
- `GET /api/playlist/state` — sessions, current/next session, intermission
- `GET /api/audio/settings` — master state, volume, rules
- `GET /api/ndi/status`, `GET /api/omt/status` — stream state (optional, see the config checkbox)
- `POST /api/timer/*` — start, pause, reset, set, adjust, presets, blink options, additional time
- `POST /api/chrono/*` — transport and options, including colour thresholds
- `POST /api/mode`, `/api/screen2/mode`, `/api/screen2/follow`, `/api/layout-preset`
- `POST /api/display/settings`, `/api/clock/toggle-12h-format`
- `POST /api/message/*`, `/api/layout-message/set`, `/api/speaker/ack`
- `POST /api/audio/*` — play, stop, enabled, volume, rules
- `POST /api/playlist/*` — transport, session selection, options, save, clear
- `POST /api/ndi/*`, `/api/omt/*` — test stream, alpha, stop
- `POST /api/auth/pin` — exchanges the PIN for the `qtimer_auth` session cookie, when the API is protected

## Troubleshooting

- **Connection failure** — check the IP address and port, that QTimer's API server is enabled, and that both
  machines are on the same network.
- **Authentication failure** — QTimer has _Protection API par PIN_ enabled. Fill in the **API PIN** field
  with the same 4–8 digit PIN, or turn that option off in QTimer if the API is meant to stay open.
- **The connection goes `ok` but nothing updates** — the WebSocket may be blocked while HTTP still passes.
  Check the module log at debug level; polling alone still refreshes state at the poll interval.
- **Two requests per tick you don't need** — turn off _Poll NDI / OMT stream status_ if the network outputs
  are unused.
- **A preset, sound, rule or session is missing from a dropdown** — the list comes from QTimer and refreshes
  while connected. Add it in QTimer, or type the value manually (every dropdown accepts a custom value).

## Changelog

### 1.1.0

- Second extended screen: `Display: Set mode` gained a target (main / second screen / both), plus a mirror
  toggle action, feedbacks, variables and presets.
- Layout presets can now be applied per output (`main`, `extended2`, `network`), with a matching feedback and
  readouts for the assigned preset.
- Display settings: show/hide any element, set element colours, progress-bar thresholds, timer colour sync,
  and a raw `displaySettings` JSON escape hatch.
- Clock 12h/24h format action, feedback, and variable.
- Preset messages, operator-view layout messages, and speaker acknowledgement.
- Playlist save, next-session and intermission countdown variables, session-enabled and end-action feedbacks.
- NDI / OMT status polling with variables, feedbacks, test-pattern and stop actions.
- Live dropdowns for timer presets, preset messages, audio sounds, audio rules, and playlist sessions, all
  accepting a custom value or variable.
- `Toggle` added to the enable/disable actions that could be resolved against live state.
- Fixed the chrono colour-threshold state, which QTimer now reports as a top-level
  `chronoColorThresholdsEnabled` flag rather than inside `chronoDisplayOptions`.
- Support for QTimer's PIN-protected API: an **API PIN** connection field, automatic authentication and
  cookie renewal on `401`, and a distinct authentication-failure status.
- Removed the eight `Ready Page - *` preset categories. Every one of their buttons was a duplicate of a
  preset already available in a normal category. The playlist readouts they grouped now live in the
  `Playlist` category instead, next to the transport buttons.

### 1.0.0

- Initial release.

## License

MIT

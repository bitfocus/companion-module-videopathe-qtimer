import {
	CHRONO_COLOR_CHOICES,
	CHRONO_THRESHOLD_CHOICES,
	DISPLAY_MODE_CHOICES,
	END_ACTION_CHOICES,
	MODE_CHOICES_SECONDS_PERCENT,
	PLAYLIST_AUTO_MODE_CHOICES,
	TOGGLE_CHOICES,
} from './choices.js'
import type { ModuleInstance } from './main.js'

function toggleChoiceToPayload(choice: unknown): boolean | undefined {
	switch (choice) {
		case 'on':
			return true
		case 'off':
			return false
		default:
			return undefined
	}
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		refresh_state: {
			name: 'Refresh QTimer state now',
			options: [],
			callback: async () => {
				await self.refreshAllState()
			},
		},
		timer_start: {
			name: 'Timer: Start',
			options: [],
			callback: async () => self.postCommand('/api/timer/start'),
		},
		timer_pause: {
			name: 'Timer: Pause',
			options: [],
			callback: async () => self.postCommand('/api/timer/pause'),
		},
		timer_reset: {
			name: 'Timer: Reset',
			options: [],
			callback: async () => self.postCommand('/api/timer/reset'),
		},
		timer_set_duration: {
			name: 'Timer: Set duration',
			options: [
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (seconds)',
					default: 600,
					min: 0,
					max: 86400,
				},
			],
			callback: async (event) => self.postCommand('/api/timer/set', { duration: Number(event.options.duration) }),
		},
		timer_adjust_duration: {
			name: 'Timer: Adjust duration',
			options: [
				{
					id: 'adjustment',
					type: 'number',
					label: 'Adjustment (seconds)',
					default: 30,
					min: -86400,
					max: 86400,
				},
			],
			callback: async (event) => self.postCommand('/api/timer/adjust', { adjustment: Number(event.options.adjustment) }),
		},
		timer_preset: {
			name: 'Timer: Recall preset',
			options: [
				{
					id: 'index',
					type: 'number',
					label: 'Preset index (0-14)',
					default: 0,
					min: 0,
					max: 14,
				},
			],
			callback: async (event) => self.postCommand(`/api/timer/preset/${Number(event.options.index)}`),
		},
		timer_toggle_hours: {
			name: 'Timer: Toggle hours display',
			options: [],
			callback: async () => self.postCommand('/api/timer/options/toggle-hours'),
		},
		timer_set_blink_enabled: {
			name: 'Timer: Set blink on end',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Blink state',
					default: 'toggle',
					choices: [...TOGGLE_CHOICES],
				},
			],
			callback: async (event) => {
				const payload = toggleChoiceToPayload(event.options.state)
				await self.postCommand('/api/timer/options/toggle-blink', payload === undefined ? undefined : { payload })
			},
		},
		timer_set_blink_threshold: {
			name: 'Timer: Set blink threshold',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Threshold mode',
					default: 'seconds',
					choices: [...MODE_CHOICES_SECONDS_PERCENT],
				},
				{
					id: 'threshold',
					type: 'number',
					label: 'Threshold',
					default: 60,
					min: 0,
					max: 100000,
				},
			],
			callback: async (event) => self.postCommand('/api/timer/options/blink-threshold', {
				mode: event.options.mode,
				threshold: Number(event.options.threshold),
			}),
		},
		timer_toggle_additional_time: {
			name: 'Timer: Toggle additional time',
			options: [],
			callback: async () => self.postCommand('/api/timer/additional-time/toggle'),
		},
		timer_toggle_additional_time_blink: {
			name: 'Timer: Toggle additional time blink',
			options: [],
			callback: async () => self.postCommand('/api/timer/additional-time/toggle-blink'),
		},
		chrono_start: {
			name: 'Chrono: Start',
			options: [],
			callback: async () => self.postCommand('/api/chrono/start'),
		},
		chrono_stop: {
			name: 'Chrono: Stop',
			options: [],
			callback: async () => self.postCommand('/api/chrono/stop'),
		},
		chrono_reset: {
			name: 'Chrono: Reset',
			options: [],
			callback: async () => self.postCommand('/api/chrono/reset'),
		},
		chrono_toggle_hours: {
			name: 'Chrono: Toggle hours display',
			options: [],
			callback: async () => self.postCommand('/api/chrono/options/toggle-hours'),
		},
		chrono_set_blink_enabled: {
			name: 'Chrono: Set blink on end',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Blink state',
					default: 'toggle',
					choices: [...TOGGLE_CHOICES],
				},
			],
			callback: async (event) => {
				const payload = toggleChoiceToPayload(event.options.state)
				await self.postCommand('/api/chrono/options/toggle-blink', payload === undefined ? undefined : { payload })
			},
		},
		chrono_set_blink_threshold: {
			name: 'Chrono: Set blink threshold',
			options: [
				{
					id: 'threshold',
					type: 'number',
					label: 'Threshold (seconds)',
					default: 60,
					min: 0,
					max: 86400,
				},
			],
			callback: async (event) => self.postCommand('/api/chrono/options/blink-threshold', { threshold: Number(event.options.threshold) }),
		},
		chrono_set_color_thresholds_enabled: {
			name: 'Chrono: Set color thresholds enabled',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => self.postCommand('/api/chrono/options/toggle-color-thresholds', { enabled: event.options.state === 'on' }),
		},
		chrono_set_color_threshold: {
			name: 'Chrono: Set color threshold value',
			options: [
				{
					id: 'threshold',
					type: 'dropdown',
					label: 'Threshold',
					default: 'threshold1',
					choices: [...CHRONO_THRESHOLD_CHOICES],
				},
				{
					id: 'value',
					type: 'number',
					label: 'Value (seconds)',
					default: 300,
					min: 0,
					max: 86400,
				},
			],
			callback: async (event) => self.postCommand('/api/chrono/options/set-color-threshold', {
				threshold: event.options.threshold,
				value: Number(event.options.value),
			}),
		},
		chrono_set_color: {
			name: 'Chrono: Set threshold color',
			options: [
				{
					id: 'color',
					type: 'dropdown',
					label: 'Color slot',
					default: 'color1',
					choices: [...CHRONO_COLOR_CHOICES],
				},
				{
					id: 'value',
					type: 'colorpicker',
					label: 'Hex color',
					default: 0xeab308,
				},
			],
			callback: async (event) => {
				const numericColor = Number(event.options.value)
				const hexColor = `#${numericColor.toString(16).padStart(6, '0')}`
				await self.postCommand('/api/chrono/options/set-color', { color: event.options.color, value: hexColor })
			},
		},
		set_display_mode: {
			name: 'Display: Set mode',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'timer',
					choices: [...DISPLAY_MODE_CHOICES],
				},
			],
			callback: async (event) => self.postCommand('/api/mode', { mode: event.options.mode }),
		},
		message_set: {
			name: 'Message: Set message',
			options: [
				{
					id: 'message',
					type: 'textinput',
					label: 'Message',
					default: '',
					useVariables: true,
				},
				{
					id: 'color',
					type: 'colorpicker',
					label: 'Color',
					default: 0xffffff,
				},
			],
			callback: async (event) => {
				const numericColor = Number(event.options.color)
				const color = `#${numericColor.toString(16).padStart(6, '0')}`
				await self.postCommand('/api/message/set', { message: String(event.options.message ?? ''), color })
			},
		},
		message_clear: {
			name: 'Message: Clear',
			options: [],
			callback: async () => self.postCommand('/api/message/clear'),
		},
		message_toggle_visibility: {
			name: 'Message: Toggle visibility',
			options: [],
			callback: async () => self.postCommand('/api/message/toggle-visibility'),
		},
		message_toggle_blinking: {
			name: 'Message: Toggle blinking',
			options: [],
			callback: async () => self.postCommand('/api/message/toggle-blinking'),
		},
		message_red_alert: {
			name: 'Message: Start red alert',
			options: [
				{
					id: 'color',
					type: 'colorpicker',
					label: 'Alert color',
					default: 0xef4444,
				},
			],
			callback: async (event) => {
				const numericColor = Number(event.options.color)
				const color = `#${numericColor.toString(16).padStart(6, '0')}`
				await self.postCommand('/api/message/color-alert', { color })
			},
		},
		audio_play: {
			name: 'Audio: Play sound',
			options: [
				{
					id: 'soundId',
					type: 'textinput',
					label: 'Sound ID',
					default: '',
					useVariables: true,
				},
				{
					id: 'volume',
					type: 'number',
					label: 'Volume percent (optional)',
					default: 100,
					min: 0,
					max: 100,
				},
			],
			callback: async (event) => {
				const soundId = String(event.options.soundId ?? '').trim()
				const volumePercent = Number(event.options.volume)
				await self.postCommand('/api/audio/play', {
					soundId,
					...(Number.isFinite(volumePercent) ? { volume: Math.max(0, Math.min(100, volumePercent)) / 100 } : {}),
				})
			},
		},
		audio_stop: {
			name: 'Audio: Stop current sound',
			options: [],
			callback: async () => self.postCommand('/api/audio/stop'),
		},
		audio_set_enabled: {
			name: 'Audio: Set enabled',
			options: [
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => self.postCommand('/api/audio/enabled', { enabled: event.options.enabled === 'on' }),
		},
		audio_toggle_enabled: {
			name: 'Audio: Toggle enabled',
			options: [],
			callback: async () => self.postCommand('/api/audio/enabled', {
				enabled: self.runtimeState.qtimer?.audioSettings?.enabled !== true,
			}),
		},
		audio_set_master_volume: {
			name: 'Audio: Set master volume',
			options: [
				{
					id: 'volume',
					type: 'number',
					label: 'Volume percent',
					default: 80,
					min: 0,
					max: 100,
				},
			],
			callback: async (event) => self.postCommand('/api/audio/master-volume', {
				volume: Math.max(0, Math.min(100, Number(event.options.volume))) / 100,
			}),
		},
		audio_set_stop_current_on_play: {
			name: 'Audio: Set stop current on play',
			options: [
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => self.postCommand('/api/audio/stop-current-on-play', { enabled: event.options.enabled === 'on' }),
		},
		audio_set_rules_enabled: {
			name: 'Audio: Set all rules enabled',
			options: [
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => self.postCommand('/api/audio/rules/enabled', { enabled: event.options.enabled === 'on' }),
		},
		audio_set_rule_enabled: {
			name: 'Audio: Set one rule enabled',
			options: [
				{
					id: 'ruleId',
					type: 'textinput',
					label: 'Rule ID',
					default: '',
					useVariables: true,
				},
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => self.postCommand(`/api/audio/rules/${encodeURIComponent(String(event.options.ruleId ?? '').trim())}/enabled`, {
				enabled: event.options.enabled === 'on',
			}),
		},
		audio_set_rule_volume: {
			name: 'Audio: Set one rule volume',
			options: [
				{
					id: 'ruleId',
					type: 'textinput',
					label: 'Rule ID',
					default: '',
					useVariables: true,
				},
				{
					id: 'volume',
					type: 'number',
					label: 'Volume percent',
					default: 80,
					min: 0,
					max: 100,
				},
			],
			callback: async (event) => self.postCommand(`/api/audio/rules/${encodeURIComponent(String(event.options.ruleId ?? '').trim())}/volume`, {
				volume: Math.max(0, Math.min(100, Number(event.options.volume))) / 100,
			}),
		},
		playlist_start: {
			name: 'Playlist: Start',
			options: [],
			callback: async () => self.postCommand('/api/playlist/start'),
		},
		playlist_stop: {
			name: 'Playlist: Stop',
			options: [],
			callback: async () => self.postCommand('/api/playlist/stop'),
		},
		playlist_next: {
			name: 'Playlist: Next session',
			options: [],
			callback: async () => self.postCommand('/api/playlist/next'),
		},
		playlist_previous: {
			name: 'Playlist: Previous session',
			options: [],
			callback: async () => self.postCommand('/api/playlist/previous'),
		},
		playlist_select_session_by_index: {
			name: 'Playlist: Select session by index',
			options: [
				{
					id: 'index',
					type: 'number',
					label: 'Session index',
					default: 0,
					min: 0,
					max: 999,
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/select-session', { index: Number(event.options.index) }),
		},
		playlist_select_session_by_name: {
			name: 'Playlist: Select session by name',
			options: [
				{
					id: 'name',
					type: 'textinput',
					label: 'Session name',
					default: '',
					useVariables: true,
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/select-session', { name: String(event.options.name ?? '') }),
		},
		playlist_set_session_enabled: {
			name: 'Playlist: Enable or disable session',
			options: [
				{
					id: 'index',
					type: 'number',
					label: 'Session index',
					default: 0,
					min: 0,
					max: 999,
				},
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'Enabled',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/session/enabled', {
				index: Number(event.options.index),
				enabled: event.options.enabled === 'on',
			}),
		},
		playlist_set_end_action: {
			name: 'Playlist: Set end action',
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'End action',
					default: 'disabled',
					choices: [...END_ACTION_CHOICES],
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/options/end-action', { action: event.options.action }),
		},
		playlist_set_auto_mode: {
			name: 'Playlist: Set auto mode target',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'clock',
					choices: [...PLAYLIST_AUTO_MODE_CHOICES],
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/options/auto-mode', { mode: event.options.mode }),
		},
		playlist_set_auto_intermission_enabled: {
			name: 'Playlist: Set auto intermission enabled',
			options: [
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/options/auto-intermission', { enabled: event.options.enabled === 'on' }),
		},
		playlist_toggle_intermission: {
			name: 'Playlist: Toggle or force intermission',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: 'toggle',
					choices: [...TOGGLE_CHOICES],
				},
			],
			callback: async (event) => {
				const enabled = toggleChoiceToPayload(event.options.state)
				await self.postCommand('/api/playlist/options/intermission', enabled === undefined ? undefined : { enabled })
			},
		},
		playlist_set_default_session_duration: {
			name: 'Playlist: Set default session duration',
			options: [
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (seconds)',
					default: 600,
					min: 0,
					max: 86400,
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/options/default-session-duration', { duration: Number(event.options.duration) }),
		},
		playlist_set_default_additional_time: {
			name: 'Playlist: Set default additional time',
			options: [
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (seconds)',
					default: 120,
					min: 0,
					max: 86400,
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/options/default-additional-time', { duration: Number(event.options.duration) }),
		},
		playlist_set_use_default_session_duration: {
			name: 'Playlist: Set use default session duration',
			options: [
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/options/use-default-session-duration', { enabled: event.options.enabled === 'on' }),
		},
		playlist_set_intermission_duration: {
			name: 'Playlist: Set intermission duration',
			options: [
				{
					id: 'duration',
					type: 'number',
					label: 'Duration (seconds)',
					default: 300,
					min: 0,
					max: 86400,
				},
			],
			callback: async (event) => self.postCommand('/api/playlist/options/intermission-duration', { duration: Number(event.options.duration) }),
		},
		playlist_clear_sessions: {
			name: 'Playlist: Clear all sessions',
			options: [],
			callback: async () => self.postCommand('/api/playlist/clear-sessions'),
		},
		playlist_clear_log: {
			name: 'Playlist: Clear execution log',
			options: [],
			callback: async () => self.postCommand('/api/playlist/clear-log'),
		},
	})
}

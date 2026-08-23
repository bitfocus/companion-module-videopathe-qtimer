import {
	CHRONO_COLOR_CHOICES,
	CHRONO_THRESHOLD_CHOICES,
	COLORED_DISPLAY_ELEMENT_CHOICES,
	DISPLAY_ELEMENT_CHOICES,
	DISPLAY_MODE_CHOICES,
	END_ACTION_CHOICES,
	LAYOUT_MODE_CHOICES,
	LAYOUT_TARGET_CHOICES,
	MODE_CHOICES_SECONDS_PERCENT,
	OPERATOR_VIEW_CHOICES,
	PLAYLIST_AUTO_MODE_CHOICES,
	TOGGLE_CHOICES,
} from './choices.js'
import {
	getPlaylistSessionByIndex,
	isChronoColorThresholdsEnabled,
	isDisplayElementVisible,
	isScreen2FollowingMain,
} from './state.js'
import type { ModuleInstance } from './main.js'

const LAYOUT_PRESET_CHOICES = Array.from({ length: 12 }, (_unused, index) => ({
	id: String(index),
	label: `Preset ${index + 1}`,
}))

const DISPLAY_MODE_TARGET_CHOICES = [
	{ id: 'main', label: 'Main screen' },
	{ id: 'screen2', label: 'Second extended screen' },
	{ id: 'both', label: 'Both screens' },
] as const

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

/** Resolve a toggle/on/off choice against the value QTimer currently reports. */
function resolveToggleState(choice: unknown, current: boolean): boolean {
	return toggleChoiceToPayload(choice) ?? !current
}

/**
 * Dropdowns built from live QTimer data use `allowCustom`, so the stored value can be
 * either a picked id or free text containing Companion variables.
 */
async function resolveText(self: ModuleInstance, value: unknown): Promise<string> {
	let raw = ''
	if (typeof value === 'string') {
		raw = value
	} else if (typeof value === 'number' || typeof value === 'boolean') {
		raw = String(value)
	}

	if (!raw.includes('$(')) {
		return raw.trim()
	}

	return (await self.parseVariablesInString(raw)).trim()
}

async function resolveNumber(self: ModuleInstance, value: unknown, fallback = 0): Promise<number> {
	const text = await resolveText(self, value)
	const parsed = Number(text)
	return Number.isFinite(parsed) ? parsed : fallback
}

function toHexColor(value: unknown): string {
	const numericColor = Number(value)
	if (!Number.isFinite(numericColor)) {
		return '#ffffff'
	}

	return `#${Math.max(0, Math.round(numericColor)).toString(16).padStart(6, '0')}`
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
			callback: async (event) =>
				self.postCommand('/api/timer/adjust', { adjustment: Number(event.options.adjustment) }),
		},
		timer_preset: {
			name: 'Timer: Recall preset',
			options: [
				{
					id: 'index',
					type: 'dropdown',
					label: 'Preset',
					default: '0',
					choices: self.getTimerPresetChoices(),
					allowCustom: true,
					tooltip: 'Presets are read live from QTimer. A custom value may be an index or a variable.',
				},
			],
			callback: async (event) => {
				const index = await resolveNumber(self, event.options.index, -1)
				if (!Number.isInteger(index) || index < 0) {
					self.log('warn', `timer_preset: invalid preset index "${String(event.options.index)}"`)
					return
				}

				await self.postCommand(`/api/timer/preset/${index}`)
			},
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
			callback: async (event) =>
				self.postCommand('/api/timer/options/blink-threshold', {
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
			callback: async (event) =>
				self.postCommand('/api/chrono/options/blink-threshold', { threshold: Number(event.options.threshold) }),
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
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) =>
				self.postCommand('/api/chrono/options/toggle-color-thresholds', {
					enabled: resolveToggleState(event.options.state, isChronoColorThresholdsEnabled(self.runtimeState.qtimer)),
				}),
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
			callback: async (event) =>
				self.postCommand('/api/chrono/options/set-color-threshold', {
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
				{
					id: 'target',
					type: 'dropdown',
					label: 'Target screen',
					default: 'main',
					choices: [...DISPLAY_MODE_TARGET_CHOICES],
					tooltip:
						'Sending a mode to the second screen takes it out of mirror mode. The running timer/chrono stays shared.',
				},
			],
			callback: async (event) => {
				const mode = event.options.mode
				const target = event.options.target ?? 'main'

				if (target !== 'screen2') {
					await self.postCommand('/api/mode', { mode })
				}

				// A mirroring second screen already follows /api/mode, and pushing a mode to it
				// would drop the mirror, so only address it explicitly when it is independent.
				const needsScreen2 =
					target === 'screen2' || (target === 'both' && !isScreen2FollowingMain(self.runtimeState.qtimer))

				if (needsScreen2) {
					await self.postCommand('/api/screen2/mode', { mode })
				}
			},
		},
		screen2_set_follow_main: {
			name: 'Screen 2: Mirror main screen',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Mirror state',
					default: 'toggle',
					choices: [...TOGGLE_CHOICES],
				},
			],
			callback: async (event) =>
				self.postCommand('/api/screen2/follow', {
					followMain: resolveToggleState(event.options.state, isScreen2FollowingMain(self.runtimeState.qtimer)),
				}),
		},
		layout_preset_apply: {
			name: 'Layout: Apply preset to an output',
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Layout mode',
					default: 'timer',
					choices: [...LAYOUT_MODE_CHOICES],
				},
				{
					id: 'index',
					type: 'dropdown',
					label: 'Layout preset',
					default: '0',
					choices: LAYOUT_PRESET_CHOICES,
					allowCustom: true,
					tooltip: 'QTimer stores 12 layout presets per mode (index 0 to 11).',
				},
				{
					id: 'target',
					type: 'dropdown',
					label: 'Output',
					default: 'main',
					choices: [...LAYOUT_TARGET_CHOICES],
				},
			],
			callback: async (event) => {
				const index = await resolveNumber(self, event.options.index, -1)
				if (!Number.isInteger(index) || index < 0 || index > 11) {
					self.log('warn', `layout_preset_apply: invalid preset index "${String(event.options.index)}"`)
					return
				}

				await self.postCommand('/api/layout-preset', {
					mode: event.options.mode,
					index,
					target: event.options.target ?? 'main',
				})
			},
		},
		display_set_element_visibility: {
			name: 'Display: Show or hide an element',
			options: [
				{
					id: 'element',
					type: 'dropdown',
					label: 'Element',
					default: 'timer',
					choices: [...DISPLAY_ELEMENT_CHOICES],
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'Visibility',
					default: 'toggle',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Show' },
						{ id: 'off', label: 'Hide' },
					],
				},
			],
			callback: async (event) => {
				const element = String(event.options.element ?? '')
				const visible = resolveToggleState(
					event.options.state,
					isDisplayElementVisible(self.runtimeState.qtimer, element),
				)

				await self.postCommand('/api/display/settings', {
					displaySettings: { [element]: { visible } },
				})
			},
		},
		display_set_element_color: {
			name: 'Display: Set element color',
			options: [
				{
					id: 'element',
					type: 'dropdown',
					label: 'Element',
					default: 'timer',
					choices: [...COLORED_DISPLAY_ELEMENT_CHOICES],
				},
				{
					id: 'color',
					type: 'colorpicker',
					label: 'Color',
					default: 0xffffff,
				},
			],
			callback: async (event) =>
				self.postCommand('/api/display/settings', {
					displaySettings: { [String(event.options.element ?? '')]: { color: toHexColor(event.options.color) } },
				}),
		},
		display_set_timer_color_sync: {
			name: 'Display: Sync timer color with progress',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: 'toggle',
					choices: [...TOGGLE_CHOICES],
				},
			],
			callback: async (event) =>
				self.postCommand('/api/display/settings', {
					displaySettings: {
						timer: {
							syncColorWithProgress: resolveToggleState(
								event.options.state,
								self.runtimeState.qtimer?.displaySettings?.timer?.syncColorWithProgress === true,
							),
						},
					},
				}),
		},
		display_set_progress_thresholds: {
			name: 'Display: Set progress bar thresholds',
			options: [
				{
					id: 'yellowThreshold',
					type: 'number',
					label: 'Yellow threshold (percent remaining)',
					default: 30,
					min: 0,
					max: 100,
				},
				{
					id: 'redThreshold',
					type: 'number',
					label: 'Red threshold (percent remaining)',
					default: 10,
					min: 0,
					max: 100,
				},
			],
			callback: async (event) =>
				self.postCommand('/api/display/settings', {
					displaySettings: {
						progressBar: {
							yellowThreshold: Number(event.options.yellowThreshold),
							redThreshold: Number(event.options.redThreshold),
						},
					},
				}),
		},
		display_set_settings_raw: {
			name: 'Display: Set raw display settings (JSON)',
			options: [
				{
					id: 'json',
					type: 'textinput',
					label: 'displaySettings JSON',
					default: '{"timer":{"visible":true}}',
					useVariables: true,
					tooltip: 'Any subset of QTimer displaySettings. Unknown keys are ignored by QTimer.',
				},
			],
			callback: async (event) => {
				const json = await resolveText(self, event.options.json)
				let displaySettings: unknown

				try {
					displaySettings = JSON.parse(json)
				} catch (error) {
					self.log('warn', `display_set_settings_raw: invalid JSON (${String(error)})`)
					return
				}

				if (typeof displaySettings !== 'object' || displaySettings === null || Array.isArray(displaySettings)) {
					self.log('warn', 'display_set_settings_raw: JSON must be an object')
					return
				}

				await self.postCommand('/api/display/settings', { displaySettings })
			},
		},
		clock_set_12h_format: {
			name: 'Clock: Set 12h AM/PM format',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Format',
					default: 'toggle',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: '12h (AM/PM)' },
						{ id: 'off', label: '24h' },
					],
				},
			],
			callback: async (event) => {
				const forced = toggleChoiceToPayload(event.options.state)
				await self.postCommand(
					'/api/clock/toggle-12h-format',
					forced === undefined ? undefined : { use12HourFormat: forced },
				)
			},
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
		message_set_preset: {
			name: 'Message: Send a preset message',
			options: [
				{
					id: 'message',
					type: 'dropdown',
					label: 'Preset message',
					default: '',
					choices: self.getPresetMessageChoices(),
					allowCustom: true,
					tooltip: 'Preset messages are read live from QTimer. Custom text and variables are accepted.',
				},
				{
					id: 'color',
					type: 'colorpicker',
					label: 'Color',
					default: 0xffffff,
				},
			],
			callback: async (event) =>
				self.postCommand('/api/message/set', {
					message: await resolveText(self, event.options.message),
					color: toHexColor(event.options.color),
				}),
		},
		layout_message_set: {
			name: 'Message: Send an operator layout message',
			options: [
				{
					id: 'sourceView',
					type: 'dropdown',
					label: 'From view',
					default: 'operator',
					choices: [...OPERATOR_VIEW_CHOICES],
					allowCustom: true,
				},
				{
					id: 'targetView',
					type: 'dropdown',
					label: 'To view',
					default: 'presenter',
					choices: [...OPERATOR_VIEW_CHOICES],
					allowCustom: true,
				},
				{
					id: 'message',
					type: 'textinput',
					label: 'Message (empty clears it)',
					default: '',
					useVariables: true,
				},
			],
			callback: async (event) => {
				const sourceView = await resolveText(self, event.options.sourceView)
				const targetView = await resolveText(self, event.options.targetView)

				if (!sourceView || !targetView) {
					self.log('warn', 'layout_message_set: both source and target views are required')
					return
				}

				await self.postCommand('/api/layout-message/set', {
					sourceView,
					targetView,
					message: await resolveText(self, event.options.message),
				})
			},
		},
		speaker_ack: {
			name: 'Message: Acknowledge from speaker view',
			options: [
				{
					id: 'message',
					type: 'textinput',
					label: 'Acknowledged message',
					default: '',
					useVariables: true,
				},
			],
			callback: async (event) =>
				self.postCommand('/api/speaker/ack', {
					message: await resolveText(self, event.options.message),
					timestamp: new Date().toISOString(),
				}),
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
					type: 'dropdown',
					label: 'Sound',
					default: '',
					choices: self.getAvailableAudioSounds().map((sound) => ({ id: sound.id, label: sound.label })),
					allowCustom: true,
					tooltip: 'Sounds are read live from QTimer. A custom value may be a sound id or a variable.',
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
				const soundId = await resolveText(self, event.options.soundId)
				if (!soundId) {
					self.log('warn', 'audio_play: a sound is required')
					return
				}

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
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) =>
				self.postCommand('/api/audio/enabled', {
					enabled: resolveToggleState(event.options.enabled, self.runtimeState.qtimer?.audioSettings?.enabled === true),
				}),
		},
		audio_toggle_enabled: {
			name: 'Audio: Toggle enabled',
			options: [],
			callback: async () =>
				self.postCommand('/api/audio/enabled', {
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
			callback: async (event) =>
				self.postCommand('/api/audio/master-volume', {
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
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) =>
				self.postCommand('/api/audio/stop-current-on-play', {
					enabled: resolveToggleState(
						event.options.enabled,
						self.runtimeState.qtimer?.audioSettings?.stopCurrentOnPlay !== false,
					),
				}),
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
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) =>
				self.postCommand('/api/audio/rules/enabled', {
					enabled: resolveToggleState(
						event.options.enabled,
						(self.runtimeState.qtimer?.audioSettings?.triggerRules ?? []).some((rule) => rule.enabled === true),
					),
				}),
		},
		audio_set_rule_enabled: {
			name: 'Audio: Set one rule enabled',
			options: [
				{
					id: 'ruleId',
					type: 'dropdown',
					label: 'Rule',
					default: '',
					choices: self.getAudioRuleChoices(),
					allowCustom: true,
					tooltip: 'Rules are read live from QTimer. A custom value may be a rule id or a variable.',
				},
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => {
				const ruleId = await resolveText(self, event.options.ruleId)
				if (!ruleId) {
					self.log('warn', 'audio_set_rule_enabled: a rule is required')
					return
				}

				const currentRule = (self.runtimeState.qtimer?.audioSettings?.triggerRules ?? []).find(
					(rule) => rule.id === ruleId,
				)

				await self.postCommand(`/api/audio/rules/${encodeURIComponent(ruleId)}/enabled`, {
					enabled: resolveToggleState(event.options.enabled, currentRule?.enabled === true),
				})
			},
		},
		audio_set_rule_volume: {
			name: 'Audio: Set one rule volume',
			options: [
				{
					id: 'ruleId',
					type: 'dropdown',
					label: 'Rule',
					default: '',
					choices: self.getAudioRuleChoices(),
					allowCustom: true,
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
			callback: async (event) => {
				const ruleId = await resolveText(self, event.options.ruleId)
				if (!ruleId) {
					self.log('warn', 'audio_set_rule_volume: a rule is required')
					return
				}

				await self.postCommand(`/api/audio/rules/${encodeURIComponent(ruleId)}/volume`, {
					volume: Math.max(0, Math.min(100, Number(event.options.volume))) / 100,
				})
			},
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
					type: 'dropdown',
					label: 'Session',
					default: '0',
					choices: self.getPlaylistSessionChoices(),
					allowCustom: true,
					tooltip: 'Sessions are read live from QTimer. A custom value may be an index or a variable.',
				},
			],
			callback: async (event) => {
				const index = await resolveNumber(self, event.options.index, -1)
				if (!Number.isInteger(index) || index < 0) {
					self.log('warn', `playlist_select_session_by_index: invalid index "${String(event.options.index)}"`)
					return
				}

				await self.postCommand('/api/playlist/select-session', { index })
			},
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
			callback: async (event) =>
				self.postCommand('/api/playlist/select-session', { name: String(event.options.name ?? '') }),
		},
		playlist_set_session_enabled: {
			name: 'Playlist: Enable or disable session',
			options: [
				{
					id: 'index',
					type: 'dropdown',
					label: 'Session',
					default: '0',
					choices: self.getPlaylistSessionChoices(),
					allowCustom: true,
				},
				{
					id: 'enabled',
					type: 'dropdown',
					label: 'Enabled',
					default: 'on',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) => {
				const index = await resolveNumber(self, event.options.index, -1)
				if (!Number.isInteger(index) || index < 0) {
					self.log('warn', `playlist_set_session_enabled: invalid index "${String(event.options.index)}"`)
					return
				}

				const session = getPlaylistSessionByIndex(self.runtimeState.playlist, index)

				await self.postCommand('/api/playlist/session/enabled', {
					index,
					enabled: resolveToggleState(event.options.enabled, session?.isEnabled !== false),
				})
			},
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
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) =>
				self.postCommand('/api/playlist/options/auto-intermission', {
					enabled: resolveToggleState(
						event.options.enabled,
						self.runtimeState.playlist?.autoIntermissionEnabled === true,
					),
				}),
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
			callback: async (event) =>
				self.postCommand('/api/playlist/options/default-session-duration', {
					duration: Number(event.options.duration),
				}),
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
			callback: async (event) =>
				self.postCommand('/api/playlist/options/default-additional-time', { duration: Number(event.options.duration) }),
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
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Enable' },
						{ id: 'off', label: 'Disable' },
					],
				},
			],
			callback: async (event) =>
				self.postCommand('/api/playlist/options/use-default-session-duration', {
					enabled: resolveToggleState(
						event.options.enabled,
						self.runtimeState.playlist?.useDefaultSessionDuration === true,
					),
				}),
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
			callback: async (event) =>
				self.postCommand('/api/playlist/options/intermission-duration', { duration: Number(event.options.duration) }),
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
		playlist_save: {
			name: 'Playlist: Save to persistent storage',
			options: [],
			callback: async () => self.postCommand('/api/playlist/save'),
		},
		ndi_stop: {
			name: 'NDI: Stop stream',
			options: [],
			callback: async () => self.postCommand('/api/ndi/stop'),
		},
		ndi_set_alpha: {
			name: 'NDI: Set alpha channel',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Alpha channel',
					default: 'on',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Include alpha' },
						{ id: 'off', label: 'Opaque' },
					],
				},
			],
			callback: async (event) =>
				self.postCommand('/api/ndi/set-alpha', {
					includeAlpha: resolveToggleState(event.options.state, self.runtimeState.ndi?.includeAlpha === true),
				}),
		},
		ndi_test_pattern: {
			name: 'NDI: Test pattern',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Test pattern',
					default: 'toggle',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Start' },
						{ id: 'off', label: 'Stop' },
					],
				},
				{
					id: 'showAlphaZone',
					type: 'checkbox',
					label: 'Show alpha zone',
					default: false,
				},
				{
					id: 'alphaZonePosition',
					type: 'dropdown',
					label: 'Alpha zone position',
					default: 'left',
					choices: [
						{ id: 'left', label: 'Left' },
						{ id: 'center', label: 'Center' },
						{ id: 'right', label: 'Right' },
					],
					isVisible: (options) => options.showAlphaZone === true,
				},
			],
			callback: async (event) => {
				const shouldRun = resolveToggleState(event.options.state, self.runtimeState.ndi?.testPatternActive === true)

				if (!shouldRun) {
					await self.postCommand('/api/ndi/stop-test-stream')
					return
				}

				await self.postCommand('/api/ndi/test-stream', {
					showAlphaZone: event.options.showAlphaZone === true,
					alphaZonePosition: event.options.alphaZonePosition ?? 'left',
				})
			},
		},
		omt_stop: {
			name: 'OMT: Stop stream',
			options: [],
			callback: async () => self.postCommand('/api/omt/stop'),
		},
		omt_test_pattern: {
			name: 'OMT: Test pattern',
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Test pattern',
					default: 'toggle',
					choices: [
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'on', label: 'Start' },
						{ id: 'off', label: 'Stop' },
					],
				},
				{
					id: 'showAlphaZone',
					type: 'checkbox',
					label: 'Show alpha zone',
					default: false,
				},
			],
			callback: async (event) => {
				const shouldRun = resolveToggleState(event.options.state, self.runtimeState.omt?.testPatternActive === true)

				if (!shouldRun) {
					await self.postCommand('/api/omt/stop-test-stream')
					return
				}

				await self.postCommand('/api/omt/test-stream', {
					showAlphaZone: event.options.showAlphaZone === true,
				})
			},
		},
		clear_trigger_logs: {
			name: 'System: Clear trigger logs',
			options: [],
			callback: async () => self.postCommand('/api/clear-trigger-logs'),
		},
	})
}

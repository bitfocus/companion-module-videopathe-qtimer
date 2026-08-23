import { combineRgb } from '@companion-module/base'
import {
	COMPARISON_CHOICES,
	DISPLAY_ELEMENT_CHOICES,
	DISPLAY_MODE_CHOICES,
	END_ACTION_CHOICES,
	LAYOUT_MODE_CHOICES,
	OUTPUT_ROLE_CHOICES,
	SESSION_MATCH_CHOICES,
} from './choices.js'
import {
	compareNumbers,
	compareStrings,
	getActiveDisplayTimeState,
	getCurrentPlaylistSession,
	getOutputLayoutPresetIndex,
	getPlaylistEndAction,
	getPlaylistSessionByIndex,
	getScreen2Mode,
	inferDisplayMode,
	inferLayoutMode,
	isChronoColorThresholdsEnabled,
	isClock12HourFormat,
	isDisplayElementVisible,
	isScreen2FollowingMain,
	isTimerFinished,
	normalizeHexColor,
	safeNumber,
	type OutputRole,
} from './state.js'
import type { ModuleInstance } from './main.js'

function parseHexColor(color: string): [number, number, number] | null {
	const normalized = normalizeHexColor(color)
	if (!normalized) {
		return null
	}

	const hex = normalized.slice(1)
	return [
		Number.parseInt(hex.slice(0, 2), 16),
		Number.parseInt(hex.slice(2, 4), 16),
		Number.parseInt(hex.slice(4, 6), 16),
	]
}

function accentuateColor([red, green, blue]: [number, number, number]): [number, number, number] {
	return [red, green, blue].map((channel) => Math.min(255, Math.round(channel * 1.2 + 12))) as [number, number, number]
}

function darkenColor([red, green, blue]: [number, number, number]): [number, number, number] {
	return [red, green, blue].map((channel) => Math.max(0, Math.round(channel * 0.35))) as [number, number, number]
}

function getContrastingTextColor([red, green, blue]: [number, number, number]): number {
	const luminance = red * 0.299 + green * 0.587 + blue * 0.114
	return luminance >= 160 ? combineRgb(0, 0, 0) : combineRgb(255, 255, 255)
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		connected: {
			name: 'Connection is ok',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(34, 197, 94),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.isConnected,
		},
		display_mode: {
			name: 'Display mode matches',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(59, 130, 246),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'timer',
					choices: [...DISPLAY_MODE_CHOICES],
				},
			],
			callback: (feedback) => inferDisplayMode(self.runtimeState.qtimer) === feedback.options.mode,
		},
		timer_running: {
			name: 'Timer is running',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(34, 197, 94),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.isRunning === true,
		},
		timer_finished: {
			name: 'Timer is finished',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(239, 68, 68),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => isTimerFinished(self.runtimeState.qtimer),
		},
		additional_time_running: {
			name: 'Additional time is running',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(234, 179, 8),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.additionalTimeRunning === true,
		},
		additional_time_enabled: {
			name: 'Additional time is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(245, 158, 11),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.additionalTimeEnabled === true,
		},
		additional_time_blink_enabled: {
			name: 'Additional time blink is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(234, 88, 12),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.additionalTimeBlink === true,
		},
		chrono_running: {
			name: 'Chrono is running',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(168, 85, 247),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.isChronoRunning === true,
		},
		timer_blink_enabled: {
			name: 'Timer blink on end is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(249, 115, 22),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.timerDisplayOptions?.blinkOnEnd === true,
		},
		timer_blink_active: {
			name: 'Timer blink state is active',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(153, 27, 27),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.timerBlinkState === true,
		},
		chrono_blink_enabled: {
			name: 'Chrono blink is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(124, 58, 237),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.chronoDisplayOptions?.blinkOnEnd === true,
		},
		chrono_blink_active: {
			name: 'Chrono blink state is active',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(91, 33, 182),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.chronoDisplayOptions?.blinkState === true,
		},
		chrono_color_thresholds_enabled: {
			name: 'Chrono color thresholds are enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(202, 138, 4),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => isChronoColorThresholdsEnabled(self.runtimeState.qtimer),
		},
		chrono_threshold1_reached: {
			name: 'Chrono reached threshold 1',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(234, 179, 8),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => {
				const state = self.runtimeState.qtimer
				const threshold = safeNumber(state?.chronoColorThresholds?.threshold1)
				return threshold > 0 && safeNumber(state?.chronoTime) >= threshold
			},
		},
		chrono_threshold2_reached: {
			name: 'Chrono reached threshold 2',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(220, 38, 38),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const state = self.runtimeState.qtimer
				const threshold = safeNumber(state?.chronoColorThresholds?.threshold2)
				return threshold > 0 && safeNumber(state?.chronoTime) >= threshold
			},
		},
		message_visible: {
			name: 'Message is visible',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(14, 165, 233),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				const state = self.runtimeState.qtimer
				return state?.messageVisible === true && !!state.message
			},
		},
		message_blinking: {
			name: 'Message blinking is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(251, 191, 36),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.messageBlinking === true,
		},
		message_color_matches: {
			name: 'Message color matches',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(59, 130, 246),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'color',
					type: 'colorpicker',
					label: 'Message color',
					default: 0xffffff,
				},
			],
			callback: (feedback) => {
				const actual = normalizeHexColor(self.runtimeState.qtimer?.messageColor)
				const expected = normalizeHexColor(`#${Number(feedback.options.color).toString(16).padStart(6, '0')}`)
				return !!actual && actual === expected
			},
		},
		red_alert_active: {
			name: 'Red alert is active',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(220, 38, 38),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.redAlert?.isActive === true,
		},
		red_alert_dynamic: {
			name: 'Red alert color style',
			type: 'advanced',
			options: [],
			callback: () => {
				if (!self.isConnected) {
					return {}
				}

				const redAlert = self.runtimeState.qtimer?.redAlert
				const rgb = parseHexColor(redAlert?.color ?? '')
				if (!rgb) {
					return {}
				}

				const background = redAlert?.isActive === true && redAlert?.isVisible === true ? accentuateColor(rgb) : rgb

				return {
					bgcolor: combineRgb(...background),
					color: getContrastingTextColor(background),
				}
			},
		},
		display_time_blink_enabled: {
			name: 'Current display time blink is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(249, 115, 22),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => getActiveDisplayTimeState(self.runtimeState.qtimer).blinkEnabled,
		},
		display_time_dynamic: {
			name: 'Current display time color and blink style',
			type: 'advanced',
			options: [],
			callback: () => {
				if (!self.isConnected) {
					return {}
				}

				const displayTime = getActiveDisplayTimeState(self.runtimeState.qtimer)
				const rgb = parseHexColor(displayTime.color)
				if (!rgb) {
					return {}
				}

				const background = displayTime.blinkEnabled
					? displayTime.blinkVisible
						? accentuateColor(rgb)
						: darkenColor(rgb)
					: rgb

				return {
					bgcolor: combineRgb(...background),
					color: getContrastingTextColor(background),
				}
			},
		},
		audio_enabled: {
			name: 'Audio is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(16, 185, 129),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.audioSettings?.enabled === true,
		},
		audio_stop_current_on_play: {
			name: 'Audio stop current on play is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(20, 184, 166),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.runtimeState.qtimer?.audioSettings?.stopCurrentOnPlay !== false,
		},
		audio_rules_enabled: {
			name: 'At least one audio rule is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(13, 148, 136),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () =>
				(self.runtimeState.qtimer?.audioSettings?.triggerRules ?? []).some((rule) => rule.enabled === true),
		},
		playlist_running: {
			name: 'Playlist is running',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(249, 115, 22),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.runtimeState.playlist?.isRunning === true,
		},
		playlist_intermission: {
			name: 'Playlist is in intermission',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(234, 179, 8),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.runtimeState.playlist?.intermissionMode === true,
		},
		playlist_current_session_index: {
			name: 'Current playlist session index matches',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(99, 102, 241),
				color: combineRgb(255, 255, 255),
			},
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
			callback: (feedback) =>
				safeNumber(self.runtimeState.playlist?.currentSessionIndex, -1) === Number(feedback.options.index),
		},
		playlist_current_session_name: {
			name: 'Current playlist session name matches',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(99, 102, 241),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'matchType',
					type: 'dropdown',
					label: 'Match type',
					default: 'exact',
					choices: [...SESSION_MATCH_CHOICES],
				},
				{
					id: 'text',
					type: 'textinput',
					label: 'Session name',
					default: '',
					useVariables: true,
				},
			],
			callback: (feedback) => {
				const currentSession = getCurrentPlaylistSession(self.runtimeState.playlist)
				return compareStrings(
					String(feedback.options.matchType),
					currentSession?.name ?? '',
					String(feedback.options.text ?? ''),
				)
			},
		},
		remaining_time_compare: {
			name: 'Remaining time comparison',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(16, 185, 129),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'operator',
					type: 'dropdown',
					label: 'Operator',
					default: 'lte',
					choices: [...COMPARISON_CHOICES],
				},
				{
					id: 'seconds',
					type: 'number',
					label: 'Seconds',
					default: 60,
					min: 0,
					max: 86400,
				},
			],
			callback: (feedback) =>
				compareNumbers(
					String(feedback.options.operator),
					safeNumber(self.runtimeState.qtimer?.timeRemaining),
					Number(feedback.options.seconds),
				),
		},
		screen2_follow_main: {
			name: 'Second screen mirrors the main screen',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(22, 163, 74),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => isScreen2FollowingMain(self.runtimeState.qtimer),
		},
		screen2_mode: {
			name: 'Second screen mode matches',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(139, 92, 246),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'clock',
					choices: [...DISPLAY_MODE_CHOICES],
				},
				{
					id: 'onlyWhenIndependent',
					type: 'checkbox',
					label: 'Only when the second screen is independent',
					default: false,
				},
			],
			callback: (feedback) => {
				if (feedback.options.onlyWhenIndependent === true && isScreen2FollowingMain(self.runtimeState.qtimer)) {
					return false
				}

				return getScreen2Mode(self.runtimeState.qtimer) === feedback.options.mode
			},
		},
		output_layout_preset: {
			name: 'Output layout preset matches',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(37, 99, 235),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'role',
					type: 'dropdown',
					label: 'Output',
					default: 'extended2',
					choices: [...OUTPUT_ROLE_CHOICES],
				},
				{
					id: 'index',
					type: 'number',
					label: 'Layout preset index (-1 = follows main layout)',
					default: 0,
					min: -1,
					max: 11,
				},
			],
			callback: (feedback) =>
				getOutputLayoutPresetIndex(self.runtimeState.qtimer, feedback.options.role as OutputRole) ===
				Number(feedback.options.index),
		},
		layout_mode: {
			name: 'Active layout family matches',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(79, 70, 229),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Layout mode',
					default: 'timer',
					choices: [...LAYOUT_MODE_CHOICES],
				},
			],
			callback: (feedback) => inferLayoutMode(self.runtimeState.qtimer) === feedback.options.mode,
		},
		display_element_visible: {
			name: 'Display element is visible',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(14, 165, 233),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'element',
					type: 'dropdown',
					label: 'Element',
					default: 'timer',
					choices: [...DISPLAY_ELEMENT_CHOICES],
				},
			],
			callback: (feedback) => isDisplayElementVisible(self.runtimeState.qtimer, String(feedback.options.element ?? '')),
		},
		clock_12h_format: {
			name: 'Clock uses 12h AM/PM format',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(2, 132, 199),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => isClock12HourFormat(self.runtimeState.qtimer),
		},
		intermission_active: {
			name: 'Intermission layout is active',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(234, 179, 8),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () =>
				self.runtimeState.qtimer?.intermissionActive === true || self.runtimeState.playlist?.intermissionMode === true,
		},
		playlist_session_enabled: {
			name: 'Playlist session is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(34, 197, 94),
				color: combineRgb(0, 0, 0),
			},
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
			callback: (feedback) => {
				const session = getPlaylistSessionByIndex(self.runtimeState.playlist, Number(feedback.options.index))
				return session !== undefined && session.isEnabled !== false
			},
		},
		playlist_end_action: {
			name: 'Playlist end of session action matches',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(217, 119, 6),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'action',
					type: 'dropdown',
					label: 'End action',
					default: 'intermission',
					choices: [...END_ACTION_CHOICES],
				},
			],
			callback: (feedback) => getPlaylistEndAction(self.runtimeState.playlist) === feedback.options.action,
		},
		audio_rule_enabled: {
			name: 'Audio rule is enabled',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(13, 148, 136),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'ruleId',
					type: 'dropdown',
					label: 'Rule',
					default: '',
					choices: self.getAudioRuleChoices(),
					allowCustom: true,
				},
			],
			callback: (feedback) => {
				const ruleId = String(feedback.options.ruleId ?? '').trim()
				if (!ruleId) {
					return false
				}

				return (self.runtimeState.qtimer?.audioSettings?.triggerRules ?? []).some(
					(rule) => rule.id === ruleId && rule.enabled === true,
				)
			},
		},
		chrono_time_compare: {
			name: 'Chrono time comparison',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(168, 85, 247),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'operator',
					type: 'dropdown',
					label: 'Operator',
					default: 'gte',
					choices: [...COMPARISON_CHOICES],
				},
				{
					id: 'seconds',
					type: 'number',
					label: 'Seconds',
					default: 300,
					min: 0,
					max: 86400,
				},
			],
			callback: (feedback) =>
				compareNumbers(
					String(feedback.options.operator),
					safeNumber(self.runtimeState.qtimer?.chronoTime),
					Number(feedback.options.seconds),
				),
		},
		additional_time_compare: {
			name: 'Additional time comparison',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(245, 158, 11),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'operator',
					type: 'dropdown',
					label: 'Operator',
					default: 'gte',
					choices: [...COMPARISON_CHOICES],
				},
				{
					id: 'seconds',
					type: 'number',
					label: 'Seconds',
					default: 60,
					min: 0,
					max: 86400,
				},
			],
			callback: (feedback) =>
				compareNumbers(
					String(feedback.options.operator),
					safeNumber(self.runtimeState.qtimer?.additionalTimeValue),
					Number(feedback.options.seconds),
				),
		},
		ndi_running: {
			name: 'NDI stream is running',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(190, 24, 93),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.ndi?.running === true,
		},
		ndi_test_pattern_active: {
			name: 'NDI test pattern is active',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(219, 39, 119),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.ndi?.testPatternActive === true,
		},
		omt_running: {
			name: 'OMT stream is running',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(6, 148, 162),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => self.runtimeState.omt?.running === true,
		},
		omt_test_pattern_active: {
			name: 'OMT test pattern is active',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(8, 178, 194),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => self.runtimeState.omt?.testPatternActive === true,
		},
		progress_percent_compare: {
			name: 'Progress percent comparison',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(6, 182, 212),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'operator',
					type: 'dropdown',
					label: 'Operator',
					default: 'gte',
					choices: [...COMPARISON_CHOICES],
				},
				{
					id: 'percent',
					type: 'number',
					label: 'Percent',
					default: 50,
					min: 0,
					max: 100,
				},
			],
			callback: (feedback) =>
				compareNumbers(String(feedback.options.operator), self.progressPercent, Number(feedback.options.percent)),
		},
	})
}

import type {
	CompanionOptionValues,
	CompanionPresetDefinitions,
	CompanionPresetFeedback,
	CompanionTextSize,
} from '@companion-module/base'
import { combineRgb } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export function UpdatePresets(self: ModuleInstance): void {
	const moduleId = 'videopathe-qtimer'
	const readoutCategory = 'Readouts'
	const variable = (name: string) => `$(${moduleId}:${name})`
	const disconnectedFeedback = {
		feedbackId: 'connected',
		options: {},
		isInverted: true,
		style: {
			bgcolor: combineRgb(127, 29, 29),
			color: combineRgb(255, 255, 255),
		},
	} satisfies CompanionPresetFeedback
	const displayTimeFeedbacks = [{ feedbackId: 'display_time_dynamic', options: {} }] satisfies CompanionPresetFeedback[]

	const presets: CompanionPresetDefinitions = {}
	const playlistCategory = 'Playlist'
	const screen2Category = 'Screen 2'
	const layoutCategory = 'Layouts'
	const displayCategory = 'Display'
	const networkCategory = 'Network Streams'
	const displayModeChoices = [
		{ id: 'timer', label: 'TIMER' },
		{ id: 'clock', label: 'CLOCK' },
		{ id: 'chrono', label: 'CHRONO' },
		{ id: 'logo', label: 'LOGO' },
		{ id: 'black', label: 'BLACK' },
		{ id: 'mire', label: 'MIRE' },
	] as const
	const modeBackgrounds: Record<string, number> = {
		timer: combineRgb(30, 64, 175),
		clock: combineRgb(13, 148, 136),
		chrono: combineRgb(126, 34, 206),
		logo: combineRgb(120, 53, 15),
		black: combineRgb(24, 24, 27),
		mire: combineRgb(100, 116, 139),
	}

	function createActionPreset(
		id: string,
		category: string,
		name: string,
		text: string,
		bgcolor: number,
		color: number,
		actionId: string,
		options: CompanionOptionValues = {},
		feedbacks: CompanionPresetFeedback[] = [],
		size: CompanionTextSize = 'auto',
	): void {
		presets[id] = {
			type: 'button',
			category,
			name,
			style: {
				text,
				size,
				color,
				bgcolor,
				show_topbar: false,
			},
			steps: [
				{
					down: [{ actionId, options }],
					up: [],
				},
			],
			feedbacks: [disconnectedFeedback, ...feedbacks],
		}
	}

	function createReadoutPreset(
		id: string,
		name: string,
		text: string,
		bgcolor: number,
		size: CompanionTextSize,
		feedbacks: CompanionPresetFeedback[] = [],
	): void {
		presets[id] = {
			type: 'button',
			category: readoutCategory,
			name,
			style: {
				text,
				size,
				color: combineRgb(255, 255, 255),
				bgcolor,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [disconnectedFeedback, ...feedbacks],
		}
	}

	function clonePresetToCategory(sourceId: string, cloneId: string, category: string, name: string): void {
		const sourcePreset = presets[sourceId]
		if (!sourcePreset || sourcePreset.type !== 'button') {
			return
		}

		const buttonPreset = sourcePreset

		presets[cloneId] = {
			...buttonPreset,
			category,
			name,
			style: {
				...buttonPreset.style,
			},
			steps: buttonPreset.steps.map((step) => ({
				...step,
				down: step.down.map((action) => ({ ...action })),
				up: step.up.map((action) => ({ ...action })),
			})),
			feedbacks: buttonPreset.feedbacks.map((feedback) => ({
				...feedback,
				options: { ...feedback.options },
				style: feedback.style ? { ...feedback.style } : undefined,
			})),
		}
	}

	function applyFixedTextSizeToCategories(categories: string[], size: CompanionTextSize): void {
		const categorySet = new Set(categories)

		for (const preset of Object.values(presets)) {
			if (!preset || preset.type !== 'button' || !categorySet.has(preset.category)) {
				continue
			}

			preset.style = {
				...preset.style,
				size,
			}
		}
	}

	createActionPreset(
		'timer_start',
		'Timer',
		'Start timer',
		'TIMER\nSTART',
		combineRgb(22, 163, 74),
		combineRgb(255, 255, 255),
		'timer_start',
		{},
		[
			{
				feedbackId: 'timer_running',
				options: {},
				style: { bgcolor: combineRgb(34, 197, 94), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createActionPreset(
		'timer_pause',
		'Timer',
		'Pause timer',
		'TIMER\nPAUSE',
		combineRgb(250, 204, 21),
		combineRgb(0, 0, 0),
		'timer_pause',
	)
	createActionPreset(
		'timer_reset',
		'Timer',
		'Reset timer',
		'TIMER\nRESET',
		combineRgb(239, 68, 68),
		combineRgb(255, 255, 255),
		'timer_reset',
	)
	createActionPreset(
		'timer_plus_5',
		'Timer',
		'Add 5 seconds',
		'+5\nSEC',
		combineRgb(8, 145, 178),
		combineRgb(255, 255, 255),
		'timer_adjust_duration',
		{ adjustment: 5 },
	)
	createActionPreset(
		'timer_minus_5',
		'Timer',
		'Subtract 5 seconds',
		'-5\nSEC',
		combineRgb(14, 116, 144),
		combineRgb(255, 255, 255),
		'timer_adjust_duration',
		{ adjustment: -5 },
	)
	createActionPreset(
		'timer_plus_60',
		'Timer',
		'Add 60 seconds',
		'+60\nSEC',
		combineRgb(2, 132, 199),
		combineRgb(255, 255, 255),
		'timer_adjust_duration',
		{ adjustment: 60 },
	)
	createActionPreset(
		'timer_minus_60',
		'Timer',
		'Subtract 60 seconds',
		'-60\nSEC',
		combineRgb(3, 105, 161),
		combineRgb(255, 255, 255),
		'timer_adjust_duration',
		{ adjustment: -60 },
	)
	createActionPreset(
		'timer_set_5m',
		'Timer',
		'Set timer to 5 minutes',
		'SET\n05:00',
		combineRgb(51, 65, 85),
		combineRgb(255, 255, 255),
		'timer_set_duration',
		{ duration: 300 },
	)
	createActionPreset(
		'timer_set_10m',
		'Timer',
		'Set timer to 10 minutes',
		'SET\n10:00',
		combineRgb(51, 65, 85),
		combineRgb(255, 255, 255),
		'timer_set_duration',
		{ duration: 600 },
	)
	createActionPreset(
		'timer_set_15m',
		'Timer',
		'Set timer to 15 minutes',
		'SET\n15:00',
		combineRgb(51, 65, 85),
		combineRgb(255, 255, 255),
		'timer_set_duration',
		{ duration: 900 },
	)
	createActionPreset(
		'timer_set_30m',
		'Timer',
		'Set timer to 30 minutes',
		'SET\n30:00',
		combineRgb(51, 65, 85),
		combineRgb(255, 255, 255),
		'timer_set_duration',
		{ duration: 1800 },
	)
	createActionPreset(
		'timer_blink_toggle',
		'Timer',
		'Toggle timer blink',
		'BLINK\nTIMER',
		combineRgb(249, 115, 22),
		combineRgb(255, 255, 255),
		'timer_set_blink_enabled',
		{ state: 'toggle' },
		[
			{
				feedbackId: 'timer_blink_enabled',
				options: {},
				style: { bgcolor: combineRgb(234, 88, 12), color: combineRgb(255, 255, 255) },
			},
		],
	)
	createActionPreset(
		'timer_blink_60',
		'Timer',
		'Set timer blink threshold to 60 seconds',
		'BLINK\n60S',
		combineRgb(194, 65, 12),
		combineRgb(255, 255, 255),
		'timer_set_blink_threshold',
		{ mode: 'seconds', threshold: 60 },
	)
	createActionPreset(
		'timer_additional_toggle',
		'Timer',
		'Toggle additional time',
		'ADDT\nTOGGLE',
		combineRgb(217, 119, 6),
		combineRgb(255, 255, 255),
		'timer_toggle_additional_time',
		{},
		[
			{
				feedbackId: 'additional_time_enabled',
				options: {},
				style: { bgcolor: combineRgb(245, 158, 11), color: combineRgb(0, 0, 0) },
			},
			{
				feedbackId: 'additional_time_running',
				options: {},
				style: { bgcolor: combineRgb(251, 191, 36), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createActionPreset(
		'timer_additional_blink_toggle',
		'Timer',
		'Toggle additional time blink',
		'ADDT\nBLINK',
		combineRgb(154, 52, 18),
		combineRgb(255, 255, 255),
		'timer_toggle_additional_time_blink',
		{},
		[
			{
				feedbackId: 'additional_time_blink_enabled',
				options: {},
				style: { bgcolor: combineRgb(234, 88, 12), color: combineRgb(255, 255, 255) },
			},
		],
	)

	createActionPreset(
		'chrono_start',
		'Chrono',
		'Start chrono',
		'CHRONO\nSTART',
		combineRgb(147, 51, 234),
		combineRgb(255, 255, 255),
		'chrono_start',
		{},
		[
			{
				feedbackId: 'chrono_running',
				options: {},
				style: { bgcolor: combineRgb(168, 85, 247), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'chrono_stop',
		'Chrono',
		'Stop chrono',
		'CHRONO\nSTOP',
		combineRgb(126, 34, 206),
		combineRgb(255, 255, 255),
		'chrono_stop',
	)
	createActionPreset(
		'chrono_reset',
		'Chrono',
		'Reset chrono',
		'CHRONO\nRESET',
		combineRgb(88, 28, 135),
		combineRgb(255, 255, 255),
		'chrono_reset',
	)
	createActionPreset(
		'chrono_blink_toggle',
		'Chrono',
		'Toggle chrono blink',
		'BLINK\nCHRONO',
		combineRgb(124, 58, 237),
		combineRgb(255, 255, 255),
		'chrono_set_blink_enabled',
		{ state: 'toggle' },
		[
			{
				feedbackId: 'chrono_blink_enabled',
				options: {},
				style: { bgcolor: combineRgb(109, 40, 217), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'chrono_blink_60',
		'Chrono',
		'Set chrono blink threshold to 60 seconds',
		'BLINK\n60S',
		combineRgb(91, 33, 182),
		combineRgb(255, 255, 255),
		'chrono_set_blink_threshold',
		{ threshold: 60 },
	)
	createActionPreset(
		'chrono_thresholds_on',
		'Chrono',
		'Enable chrono color thresholds',
		'COLOR\nON',
		combineRgb(202, 138, 4),
		combineRgb(0, 0, 0),
		'chrono_set_color_thresholds_enabled',
		{ state: 'on' },
		[
			{
				feedbackId: 'chrono_color_thresholds_enabled',
				options: {},
				style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) },
			},
		],
		'14',
	)
	createActionPreset(
		'chrono_threshold1_5m',
		'Chrono',
		'Set chrono threshold 1 to 5 minutes',
		'TH1\n05:00',
		combineRgb(180, 83, 9),
		combineRgb(255, 255, 255),
		'chrono_set_color_threshold',
		{ threshold: 'threshold1', value: 300 },
	)
	createActionPreset(
		'chrono_threshold2_10m',
		'Chrono',
		'Set chrono threshold 2 to 10 minutes',
		'TH2\n10:00',
		combineRgb(185, 28, 28),
		combineRgb(255, 255, 255),
		'chrono_set_color_threshold',
		{ threshold: 'threshold2', value: 600 },
	)

	createActionPreset(
		'mode_timer',
		'Display',
		'Switch to timer mode',
		'TIMER',
		combineRgb(22, 163, 74),
		combineRgb(255, 255, 255),
		'set_display_mode',
		{ mode: 'timer', target: 'main' },
		[
			{
				feedbackId: 'display_mode',
				options: { mode: 'timer' },
				style: { bgcolor: combineRgb(22, 163, 74), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'mode_clock',
		'Display',
		'Switch to clock mode',
		'CLOCK',
		combineRgb(147, 51, 234),
		combineRgb(255, 255, 255),
		'set_display_mode',
		{ mode: 'clock', target: 'main' },
		[
			{
				feedbackId: 'display_mode',
				options: { mode: 'clock' },
				style: { bgcolor: combineRgb(147, 51, 234), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'mode_chrono',
		'Display',
		'Switch to chrono mode',
		'CHRONO',
		combineRgb(220, 38, 38),
		combineRgb(255, 255, 255),
		'set_display_mode',
		{ mode: 'chrono', target: 'main' },
		[
			{
				feedbackId: 'display_mode',
				options: { mode: 'chrono' },
				style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'mode_logo',
		'Display',
		'Switch to logo mode',
		'LOGO',
		combineRgb(37, 99, 235),
		combineRgb(255, 255, 255),
		'set_display_mode',
		{ mode: 'logo', target: 'main' },
		[
			{
				feedbackId: 'display_mode',
				options: { mode: 'logo' },
				style: { bgcolor: combineRgb(37, 99, 235), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'mode_black',
		'Display',
		'Switch to black mode',
		'BLACK',
		combineRgb(17, 24, 39),
		combineRgb(255, 255, 255),
		'set_display_mode',
		{ mode: 'black', target: 'main' },
		[
			{
				feedbackId: 'display_mode',
				options: { mode: 'black' },
				style: { bgcolor: combineRgb(0, 0, 0), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'mode_mire',
		'Display',
		'Switch to mire mode',
		'MIRE',
		combineRgb(202, 138, 4),
		combineRgb(255, 255, 255),
		'set_display_mode',
		{ mode: 'mire', target: 'main' },
		[
			{
				feedbackId: 'display_mode',
				options: { mode: 'mire' },
				style: { bgcolor: combineRgb(202, 138, 4), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)

	createActionPreset(
		'message_show',
		'Message',
		'Toggle message visibility',
		'MSG\nSHOW',
		combineRgb(3, 105, 161),
		combineRgb(255, 255, 255),
		'message_toggle_visibility',
		{},
		[
			{
				feedbackId: 'message_visible',
				options: {},
				style: { bgcolor: combineRgb(14, 165, 233), color: combineRgb(255, 255, 255) },
			},
		],
	)
	createActionPreset(
		'message_blink',
		'Message',
		'Toggle message blinking',
		'MSG\nBLINK',
		combineRgb(217, 119, 6),
		combineRgb(255, 255, 255),
		'message_toggle_blinking',
		{},
		[
			{
				feedbackId: 'message_blinking',
				options: {},
				style: { bgcolor: combineRgb(251, 191, 36), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createActionPreset(
		'message_clear',
		'Message',
		'Clear message',
		'MSG\nCLEAR',
		combineRgb(71, 85, 105),
		combineRgb(255, 255, 255),
		'message_clear',
	)
	createActionPreset(
		'message_alert',
		'Message',
		'Trigger red alert',
		'MSG\nALERT',
		combineRgb(220, 38, 38),
		combineRgb(255, 255, 255),
		'message_red_alert',
		{ color: 0xef4444 },
		[{ feedbackId: 'red_alert_dynamic', options: {} }],
	)
	createActionPreset(
		'message_set_generic',
		'Message',
		'Set generic message',
		'MSG\nSET',
		combineRgb(30, 41, 59),
		combineRgb(255, 255, 255),
		'message_set',
		{ message: 'MESSAGE', color: 0xffffff },
	)
	createActionPreset(
		'message_set_pause',
		'Message',
		'Set pause message',
		'MSG\nPAUSE',
		combineRgb(51, 65, 85),
		combineRgb(255, 255, 255),
		'message_set',
		{ message: 'PAUSE', color: 0xffffff },
	)

	createActionPreset(
		'audio_toggle',
		'Audio',
		'Toggle audio enabled',
		'AUDIO',
		combineRgb(15, 118, 110),
		combineRgb(255, 255, 255),
		'audio_toggle_enabled',
		{},
		[
			{
				feedbackId: 'audio_enabled',
				options: {},
				style: { bgcolor: combineRgb(16, 185, 129), color: combineRgb(0, 0, 0) },
			},
		],
		'18',
	)
	createActionPreset(
		'audio_stop',
		'Audio',
		'Stop audio',
		'AUDIO\nSTOP',
		combineRgb(17, 94, 89),
		combineRgb(255, 255, 255),
		'audio_stop',
	)
	createActionPreset(
		'audio_stop_current_on_play',
		'Audio',
		'Enable stop current on play',
		'STOP\nON PLAY',
		combineRgb(13, 148, 136),
		combineRgb(255, 255, 255),
		'audio_set_stop_current_on_play',
		{ enabled: 'on' },
		[
			{
				feedbackId: 'audio_stop_current_on_play',
				options: {},
				style: { bgcolor: combineRgb(20, 184, 166), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createActionPreset(
		'audio_rules_enable',
		'Audio',
		'Enable all audio rules',
		'RULES\nON',
		combineRgb(14, 116, 144),
		combineRgb(255, 255, 255),
		'audio_set_rules_enabled',
		{ enabled: 'on' },
		[
			{
				feedbackId: 'audio_rules_enabled',
				options: {},
				style: { bgcolor: combineRgb(6, 182, 212), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createActionPreset(
		'audio_rules_disable',
		'Audio',
		'Disable all audio rules',
		'RULES\nOFF',
		combineRgb(8, 47, 73),
		combineRgb(255, 255, 255),
		'audio_set_rules_enabled',
		{ enabled: 'off' },
	)
	createActionPreset(
		'audio_volume_80',
		'Audio',
		'Set master volume to 80%',
		'VOL\n80%',
		combineRgb(15, 23, 42),
		combineRgb(255, 255, 255),
		'audio_set_master_volume',
		{ volume: 80 },
	)

	for (const sound of self.getAvailableAudioSounds()) {
		const safeId = sound.id.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
		const label = sound.label.length > 16 ? `${sound.label.slice(0, 15)}...` : sound.label
		createActionPreset(
			`audio_play_${safeId}`,
			'Audio',
			`Play audio sound: ${sound.label}`,
			`PLAY\n${label}`,
			combineRgb(30, 64, 175),
			combineRgb(255, 255, 255),
			'audio_play',
			{ soundId: sound.id, volume: 100 },
		)
	}

	createActionPreset(
		'playlist_start',
		playlistCategory,
		'Start playlist',
		'PLAYLIST\nSTART',
		combineRgb(249, 115, 22),
		combineRgb(255, 255, 255),
		'playlist_start',
		{},
		[
			{
				feedbackId: 'playlist_running',
				options: {},
				style: { bgcolor: combineRgb(251, 146, 60), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createActionPreset(
		'playlist_stop',
		playlistCategory,
		'Stop playlist',
		'PLAYLIST\nSTOP',
		combineRgb(194, 65, 12),
		combineRgb(255, 255, 255),
		'playlist_stop',
	)
	createActionPreset(
		'playlist_prev',
		playlistCategory,
		'Previous playlist session',
		'PLAYLIST\nPREV',
		combineRgb(180, 83, 9),
		combineRgb(255, 255, 255),
		'playlist_previous',
	)
	createActionPreset(
		'playlist_next',
		playlistCategory,
		'Next playlist session',
		'PLAYLIST\nNEXT',
		combineRgb(249, 115, 22),
		combineRgb(255, 255, 255),
		'playlist_next',
	)
	createActionPreset(
		'playlist_intermission_toggle',
		playlistCategory,
		'Toggle intermission',
		'INTER\nTOGGLE',
		combineRgb(234, 179, 8),
		combineRgb(0, 0, 0),
		'playlist_toggle_intermission',
		{ state: 'toggle' },
		[
			{
				feedbackId: 'playlist_intermission',
				options: {},
				style: { bgcolor: combineRgb(250, 204, 21), color: combineRgb(0, 0, 0) },
			},
		],
	)

	createActionPreset(
		'screen2_follow_toggle',
		screen2Category,
		'Toggle second screen mirror',
		'SCR2\nMIRROR',
		combineRgb(21, 128, 61),
		combineRgb(255, 255, 255),
		'screen2_set_follow_main',
		{ state: 'toggle' },
		[
			{
				feedbackId: 'screen2_follow_main',
				options: {},
				style: { bgcolor: combineRgb(34, 197, 94), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createActionPreset(
		'screen2_follow_on',
		screen2Category,
		'Second screen mirrors main screen',
		'SCR2\nFOLLOW',
		combineRgb(22, 101, 52),
		combineRgb(255, 255, 255),
		'screen2_set_follow_main',
		{ state: 'on' },
		[
			{
				feedbackId: 'screen2_follow_main',
				options: {},
				style: { bgcolor: combineRgb(34, 197, 94), color: combineRgb(0, 0, 0) },
			},
		],
	)

	for (const mode of displayModeChoices) {
		createActionPreset(
			`screen2_mode_${mode.id}`,
			screen2Category,
			`Second screen: ${mode.label.toLowerCase()} mode`,
			`SCR2\n${mode.label}`,
			modeBackgrounds[mode.id],
			combineRgb(255, 255, 255),
			'set_display_mode',
			{ mode: mode.id, target: 'screen2' },
			[
				{
					feedbackId: 'screen2_mode',
					options: { mode: mode.id, onlyWhenIndependent: true },
					style: { bgcolor: combineRgb(139, 92, 246), color: combineRgb(255, 255, 255) },
				},
			],
			'14',
		)
		createActionPreset(
			`both_mode_${mode.id}`,
			screen2Category,
			`Both screens: ${mode.label.toLowerCase()} mode`,
			`BOTH\n${mode.label}`,
			combineRgb(55, 65, 81),
			combineRgb(255, 255, 255),
			'set_display_mode',
			{ mode: mode.id, target: 'both' },
			[
				{
					feedbackId: 'display_mode',
					options: { mode: mode.id },
					style: { bgcolor: modeBackgrounds[mode.id], color: combineRgb(255, 255, 255) },
				},
			],
			'14',
		)
	}

	for (const target of [
		{ id: 'main', short: 'MAIN' },
		{ id: 'extended2', short: 'SCR2' },
		{ id: 'network', short: 'NET' },
	] as const) {
		for (let presetIndex = 0; presetIndex < 4; presetIndex++) {
			createActionPreset(
				`layout_${target.id}_timer_${presetIndex}`,
				layoutCategory,
				`Apply timer layout preset ${presetIndex + 1} to ${target.short}`,
				`${target.short}\nLAY ${presetIndex + 1}`,
				combineRgb(30, 58, 138),
				combineRgb(255, 255, 255),
				'layout_preset_apply',
				{ mode: 'timer', index: String(presetIndex), target: target.id },
				target.id === 'main'
					? []
					: [
							{
								feedbackId: 'output_layout_preset',
								options: { role: target.id, index: presetIndex },
								style: { bgcolor: combineRgb(37, 99, 235), color: combineRgb(255, 255, 255) },
							},
						],
				'14',
			)
		}
	}

	for (const element of [
		{ id: 'timer', short: 'TIMER' },
		{ id: 'progressBar', short: 'BAR' },
		{ id: 'message', short: 'MSG' },
		{ id: 'clock', short: 'CLOCK' },
		{ id: 'additionalTime', short: 'ADDT' },
		{ id: 'logo', short: 'LOGO' },
	] as const) {
		createActionPreset(
			`display_toggle_${element.id}`,
			displayCategory,
			`Toggle ${element.short.toLowerCase()} element visibility`,
			`SHOW\n${element.short}`,
			combineRgb(30, 41, 59),
			combineRgb(255, 255, 255),
			'display_set_element_visibility',
			{ element: element.id, state: 'toggle' },
			[
				{
					feedbackId: 'display_element_visible',
					options: { element: element.id },
					style: { bgcolor: combineRgb(14, 165, 233), color: combineRgb(255, 255, 255) },
				},
			],
			'14',
		)
	}

	createActionPreset(
		'display_clock_12h',
		displayCategory,
		'Toggle clock 12h AM/PM format',
		'CLOCK\n12/24H',
		combineRgb(7, 89, 133),
		combineRgb(255, 255, 255),
		'clock_set_12h_format',
		{ state: 'toggle' },
		[
			{
				feedbackId: 'clock_12h_format',
				options: {},
				style: { bgcolor: combineRgb(2, 132, 199), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'display_timer_color_sync',
		displayCategory,
		'Toggle timer color sync with progress',
		'TIMER\nSYNC',
		combineRgb(51, 65, 85),
		combineRgb(255, 255, 255),
		'display_set_timer_color_sync',
		{ state: 'toggle' },
		[],
		'14',
	)

	createActionPreset(
		'ndi_test_pattern_toggle',
		networkCategory,
		'Toggle NDI test pattern',
		'NDI\nTEST',
		combineRgb(157, 23, 77),
		combineRgb(255, 255, 255),
		'ndi_test_pattern',
		{ state: 'toggle', showAlphaZone: false, alphaZonePosition: 'left' },
		[
			{
				feedbackId: 'ndi_test_pattern_active',
				options: {},
				style: { bgcolor: combineRgb(219, 39, 119), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'ndi_stop_stream',
		networkCategory,
		'Stop NDI stream',
		'NDI\nSTOP',
		combineRgb(127, 29, 29),
		combineRgb(255, 255, 255),
		'ndi_stop',
		{},
		[
			{
				feedbackId: 'ndi_running',
				options: {},
				style: { bgcolor: combineRgb(190, 24, 93), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)
	createActionPreset(
		'omt_test_pattern_toggle',
		networkCategory,
		'Toggle OMT test pattern',
		'OMT\nTEST',
		combineRgb(15, 118, 130),
		combineRgb(255, 255, 255),
		'omt_test_pattern',
		{ state: 'toggle', showAlphaZone: false },
		[
			{
				feedbackId: 'omt_test_pattern_active',
				options: {},
				style: { bgcolor: combineRgb(8, 178, 194), color: combineRgb(0, 0, 0) },
			},
		],
		'14',
	)
	createActionPreset(
		'omt_stop_stream',
		networkCategory,
		'Stop OMT stream',
		'OMT\nSTOP',
		combineRgb(127, 29, 29),
		combineRgb(255, 255, 255),
		'omt_stop',
		{},
		[
			{
				feedbackId: 'omt_running',
				options: {},
				style: { bgcolor: combineRgb(6, 148, 162), color: combineRgb(255, 255, 255) },
			},
		],
		'14',
	)

	createReadoutPreset(
		'readout_timer_full',
		'Timer full readout',
		variable('timer_full_formatted'),
		combineRgb(17, 24, 39),
		'14',
		[
			{
				feedbackId: 'timer_finished',
				options: {},
				style: { bgcolor: combineRgb(153, 27, 27), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'timer_running',
				options: {},
				style: { bgcolor: combineRgb(21, 128, 61), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'timer_blink_active',
				options: {},
				style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) },
			},
		],
	)
	createReadoutPreset('readout_timer_h', 'Timer hours readout', variable('timer_hours'), combineRgb(17, 24, 39), '44')
	createReadoutPreset(
		'readout_timer_m',
		'Timer minutes readout',
		variable('timer_minutes'),
		combineRgb(17, 24, 39),
		'44',
	)
	createReadoutPreset(
		'readout_timer_s',
		'Timer seconds readout',
		variable('timer_seconds'),
		combineRgb(17, 24, 39),
		'44',
		[
			{
				feedbackId: 'remaining_time_compare',
				options: { operator: 'lte', seconds: 60 },
				style: { bgcolor: combineRgb(180, 83, 9), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'remaining_time_compare',
				options: { operator: 'lte', seconds: 10 },
				style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) },
			},
		],
	)
	createReadoutPreset(
		'readout_duration_full',
		'Duration full readout',
		variable('duration_full_formatted'),
		combineRgb(30, 41, 59),
		'14',
	)
	createReadoutPreset(
		'readout_elapsed_full',
		'Elapsed full readout',
		variable('elapsed_full_formatted'),
		combineRgb(30, 41, 59),
		'14',
	)
	createReadoutPreset(
		'readout_progress',
		'Progress percent readout',
		`${variable('progress_percent')}%`,
		combineRgb(3, 105, 161),
		'18',
		[
			{
				feedbackId: 'progress_percent_compare',
				options: { operator: 'gte', percent: 80 },
				style: { bgcolor: combineRgb(153, 27, 27), color: combineRgb(255, 255, 255) },
			},
		],
	)

	createReadoutPreset(
		'readout_additional_full',
		'Additional time full readout',
		variable('additional_time_formatted'),
		combineRgb(120, 53, 15),
		'14',
		[
			{
				feedbackId: 'additional_time_enabled',
				options: {},
				style: { bgcolor: combineRgb(180, 83, 9), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'additional_time_running',
				options: {},
				style: { bgcolor: combineRgb(245, 158, 11), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createReadoutPreset(
		'readout_additional_h',
		'Additional time hours readout',
		variable('additional_time_hours'),
		combineRgb(120, 53, 15),
		'44',
	)
	createReadoutPreset(
		'readout_additional_m',
		'Additional time minutes readout',
		variable('additional_time_minutes'),
		combineRgb(120, 53, 15),
		'44',
	)
	createReadoutPreset(
		'readout_additional_s',
		'Additional time seconds readout',
		variable('additional_time_seconds_component'),
		combineRgb(120, 53, 15),
		'44',
		[
			{
				feedbackId: 'additional_time_running',
				options: {},
				style: { bgcolor: combineRgb(245, 158, 11), color: combineRgb(0, 0, 0) },
			},
		],
	)

	createReadoutPreset('readout_clock_full', 'Clock full readout', variable('clock_text'), combineRgb(12, 74, 110), '14')
	createReadoutPreset('readout_clock_h', 'Clock hours readout', variable('clock_hours'), combineRgb(12, 74, 110), '44')
	createReadoutPreset(
		'readout_clock_m',
		'Clock minutes readout',
		variable('clock_minutes'),
		combineRgb(12, 74, 110),
		'44',
	)
	createReadoutPreset(
		'readout_clock_s',
		'Clock seconds readout',
		variable('clock_seconds'),
		combineRgb(12, 74, 110),
		'44',
	)
	createReadoutPreset('readout_clock_ampm', 'Clock AM PM readout', variable('clock_ampm'), combineRgb(8, 47, 73), '18')
	createReadoutPreset(
		'readout_display_time_source',
		'Display time source readout',
		variable('display_time_source'),
		combineRgb(51, 65, 85),
		'18',
	)
	createReadoutPreset(
		'readout_display_time',
		'Display time readout',
		variable('display_time_formatted'),
		combineRgb(30, 41, 59),
		'14',
		displayTimeFeedbacks,
	)
	createReadoutPreset(
		'readout_display_time_full',
		'Display time full readout',
		variable('display_time_full_formatted'),
		combineRgb(30, 41, 59),
		'14',
		displayTimeFeedbacks,
	)
	createReadoutPreset(
		'readout_display_time_h',
		'Display time hours readout',
		variable('display_time_hours'),
		combineRgb(30, 41, 59),
		'44',
		displayTimeFeedbacks,
	)
	createReadoutPreset(
		'readout_display_time_m',
		'Display time minutes readout',
		variable('display_time_minutes'),
		combineRgb(30, 41, 59),
		'44',
		displayTimeFeedbacks,
	)
	createReadoutPreset(
		'readout_display_time_s',
		'Display time seconds readout',
		variable('display_time_seconds'),
		combineRgb(30, 41, 59),
		'44',
		displayTimeFeedbacks,
	)

	createReadoutPreset(
		'readout_chrono_full',
		'Chrono full readout',
		variable('chrono_full_formatted'),
		combineRgb(76, 29, 149),
		'14',
		[
			{
				feedbackId: 'chrono_running',
				options: {},
				style: { bgcolor: combineRgb(147, 51, 234), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'chrono_threshold1_reached',
				options: {},
				style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) },
			},
			{
				feedbackId: 'chrono_threshold2_reached',
				options: {},
				style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) },
			},
		],
	)
	createReadoutPreset(
		'readout_chrono_h',
		'Chrono hours readout',
		variable('chrono_hours'),
		combineRgb(76, 29, 149),
		'44',
	)
	createReadoutPreset(
		'readout_chrono_m',
		'Chrono minutes readout',
		variable('chrono_minutes'),
		combineRgb(76, 29, 149),
		'44',
	)
	createReadoutPreset(
		'readout_chrono_s',
		'Chrono seconds readout',
		variable('chrono_seconds_component'),
		combineRgb(76, 29, 149),
		'44',
		[
			{
				feedbackId: 'chrono_threshold1_reached',
				options: {},
				style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) },
			},
			{
				feedbackId: 'chrono_threshold2_reached',
				options: {},
				style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) },
			},
		],
	)

	createReadoutPreset(
		'readout_screen2_mode',
		'Second screen mode readout',
		`SCR2\n${variable('screen2_mode')}`,
		combineRgb(17, 24, 39),
		'14',
		[
			{
				feedbackId: 'screen2_follow_main',
				options: {},
				style: { bgcolor: combineRgb(21, 128, 61), color: combineRgb(255, 255, 255) },
			},
		],
	)
	createReadoutPreset(
		'readout_output_layout_extended2',
		'Second screen layout readout',
		`SCR2 LAYOUT\n${variable('output_layout_extended2')}`,
		combineRgb(17, 24, 39),
		'14',
	)
	createReadoutPreset(
		'readout_output_layout_network',
		'Network output layout readout',
		`NET LAYOUT\n${variable('output_layout_network')}`,
		combineRgb(17, 24, 39),
		'14',
	)
	createReadoutPreset(
		'readout_ndi_status',
		'NDI stream readout',
		`NDI\n${variable('ndi_source_name')}\n${variable('ndi_resolution')}`,
		combineRgb(17, 24, 39),
		'14',
		[
			{
				feedbackId: 'ndi_running',
				options: {},
				style: { bgcolor: combineRgb(190, 24, 93), color: combineRgb(255, 255, 255) },
			},
		],
	)
	createReadoutPreset(
		'readout_omt_status',
		'OMT stream readout',
		`OMT\n${variable('omt_source_name')}\n${variable('omt_resolution')}`,
		combineRgb(17, 24, 39),
		'14',
		[
			{
				feedbackId: 'omt_running',
				options: {},
				style: { bgcolor: combineRgb(6, 148, 162), color: combineRgb(255, 255, 255) },
			},
		],
	)
	createReadoutPreset(
		'readout_playlist_next_session',
		'Next playlist session readout',
		`NEXT\n${variable('playlist_next_session_name')}`,
		combineRgb(17, 24, 39),
		'14',
	)
	createReadoutPreset(
		'readout_playlist_intermission',
		'Playlist intermission remaining readout',
		`INTER\n${variable('playlist_intermission_remaining_formatted')}`,
		combineRgb(17, 24, 39),
		'14',
		[
			{
				feedbackId: 'intermission_active',
				options: {},
				style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createReadoutPreset(
		'readout_playlist_session',
		'Playlist current session name',
		variable('playlist_current_session_name'),
		combineRgb(67, 20, 7),
		'14',
		[
			{
				feedbackId: 'playlist_running',
				options: {},
				style: { bgcolor: combineRgb(194, 65, 12), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'playlist_intermission',
				options: {},
				style: { bgcolor: combineRgb(217, 119, 6), color: combineRgb(0, 0, 0) },
			},
		],
	)
	createReadoutPreset(
		'readout_playlist_mode',
		'Playlist current session mode',
		variable('playlist_current_session_mode'),
		combineRgb(67, 20, 7),
		'18',
	)
	createReadoutPreset(
		'readout_playlist_chrono',
		'Playlist chrono full readout',
		variable('playlist_chrono_formatted'),
		combineRgb(67, 20, 7),
		'14',
	)
	createReadoutPreset(
		'readout_message',
		'Current message text',
		variable('message_text'),
		combineRgb(30, 41, 59),
		'14',
		[
			{
				feedbackId: 'message_visible',
				options: {},
				style: { bgcolor: combineRgb(3, 105, 161), color: combineRgb(255, 255, 255) },
			},
			{
				feedbackId: 'message_blinking',
				options: {},
				style: { bgcolor: combineRgb(251, 191, 36), color: combineRgb(0, 0, 0) },
			},
			{
				feedbackId: 'red_alert_active',
				options: {},
				style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) },
			},
		],
	)

	clonePresetToCategory('readout_display_time', 'display_display_time', 'Display', 'Display: current time readout')
	clonePresetToCategory(
		'readout_display_time_full',
		'display_display_time_full',
		'Display',
		'Display: current time full readout',
	)
	clonePresetToCategory(
		'readout_display_time_h',
		'display_display_time_h',
		'Display',
		'Display: current time hours readout',
	)
	clonePresetToCategory(
		'readout_display_time_m',
		'display_display_time_m',
		'Display',
		'Display: current time minutes readout',
	)
	clonePresetToCategory(
		'readout_display_time_s',
		'display_display_time_s',
		'Display',
		'Display: current time seconds readout',
	)

	clonePresetToCategory(
		'readout_playlist_session',
		'playlist_session_readout',
		playlistCategory,
		'Playlist: current session readout',
	)
	clonePresetToCategory(
		'readout_playlist_mode',
		'playlist_mode_readout',
		playlistCategory,
		'Playlist: current session mode readout',
	)
	clonePresetToCategory(
		'readout_playlist_next_session',
		'playlist_next_session_readout',
		playlistCategory,
		'Playlist: next session readout',
	)
	clonePresetToCategory(
		'readout_playlist_chrono',
		'playlist_chrono_readout',
		playlistCategory,
		'Playlist: session chrono readout',
	)
	clonePresetToCategory(
		'readout_playlist_intermission',
		'playlist_intermission_readout',
		playlistCategory,
		'Playlist: intermission countdown readout',
	)
	clonePresetToCategory(
		'readout_display_time',
		'playlist_display_time',
		playlistCategory,
		'Playlist: current display time readout',
	)

	applyFixedTextSizeToCategories(
		['Timer', 'Chrono', 'Audio', playlistCategory, screen2Category, layoutCategory, displayCategory, networkCategory],
		'14',
	)

	self.setPresetDefinitions(presets)
}

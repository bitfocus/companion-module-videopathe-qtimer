import type {
	CompanionButtonPresetDefinition,
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
	const readyPageMainCategory = 'Ready Page - Main'
	const readyPageTimerCategory = 'Ready Page - Timer'
	const readyPageChronoCategory = 'Ready Page - Chrono'
	const readyPageAudioCategory = 'Ready Page - Audio'
	const readyPagePlaylistCategory = 'Ready Page - Playlist'
	const readyPageShowCategory = 'Ready Page - Show'
	const readyPageIntermissionCategory = 'Ready Page - Intermission'

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
		size: CompanionTextSize = 'auto'
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
		feedbacks: CompanionPresetFeedback[] = []
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

		const buttonPreset = sourcePreset as CompanionButtonPresetDefinition

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

	createActionPreset('timer_start', 'Timer', 'Start timer', 'TIMER\nSTART', combineRgb(22, 163, 74), combineRgb(255, 255, 255), 'timer_start', {}, [
		{ feedbackId: 'timer_running', options: {}, style: { bgcolor: combineRgb(34, 197, 94), color: combineRgb(0, 0, 0) } },
	])
	createActionPreset('timer_pause', 'Timer', 'Pause timer', 'TIMER\nPAUSE', combineRgb(250, 204, 21), combineRgb(0, 0, 0), 'timer_pause')
	createActionPreset('timer_reset', 'Timer', 'Reset timer', 'TIMER\nRESET', combineRgb(239, 68, 68), combineRgb(255, 255, 255), 'timer_reset')
	createActionPreset('timer_plus_5', 'Timer', 'Add 5 seconds', '+5\nSEC', combineRgb(8, 145, 178), combineRgb(255, 255, 255), 'timer_adjust_duration', { adjustment: 5 })
	createActionPreset('timer_minus_5', 'Timer', 'Subtract 5 seconds', '-5\nSEC', combineRgb(14, 116, 144), combineRgb(255, 255, 255), 'timer_adjust_duration', { adjustment: -5 })
	createActionPreset('timer_plus_60', 'Timer', 'Add 60 seconds', '+60\nSEC', combineRgb(2, 132, 199), combineRgb(255, 255, 255), 'timer_adjust_duration', { adjustment: 60 })
	createActionPreset('timer_minus_60', 'Timer', 'Subtract 60 seconds', '-60\nSEC', combineRgb(3, 105, 161), combineRgb(255, 255, 255), 'timer_adjust_duration', { adjustment: -60 })
	createActionPreset('timer_set_5m', 'Timer', 'Set timer to 5 minutes', 'SET\n05:00', combineRgb(51, 65, 85), combineRgb(255, 255, 255), 'timer_set_duration', { duration: 300 })
	createActionPreset('timer_set_10m', 'Timer', 'Set timer to 10 minutes', 'SET\n10:00', combineRgb(51, 65, 85), combineRgb(255, 255, 255), 'timer_set_duration', { duration: 600 })
	createActionPreset('timer_set_15m', 'Timer', 'Set timer to 15 minutes', 'SET\n15:00', combineRgb(51, 65, 85), combineRgb(255, 255, 255), 'timer_set_duration', { duration: 900 })
	createActionPreset('timer_set_30m', 'Timer', 'Set timer to 30 minutes', 'SET\n30:00', combineRgb(51, 65, 85), combineRgb(255, 255, 255), 'timer_set_duration', { duration: 1800 })
	createActionPreset('timer_blink_toggle', 'Timer', 'Toggle timer blink', 'BLINK\nTIMER', combineRgb(249, 115, 22), combineRgb(255, 255, 255), 'timer_set_blink_enabled', { state: 'toggle' }, [
		{ feedbackId: 'timer_blink_enabled', options: {}, style: { bgcolor: combineRgb(234, 88, 12), color: combineRgb(255, 255, 255) } },
	])
	createActionPreset('timer_blink_60', 'Timer', 'Set timer blink threshold to 60 seconds', 'BLINK\n60S', combineRgb(194, 65, 12), combineRgb(255, 255, 255), 'timer_set_blink_threshold', { mode: 'seconds', threshold: 60 })
	createActionPreset('timer_additional_toggle', 'Timer', 'Toggle additional time', 'ADDT\nTOGGLE', combineRgb(217, 119, 6), combineRgb(255, 255, 255), 'timer_toggle_additional_time', {}, [
		{ feedbackId: 'additional_time_enabled', options: {}, style: { bgcolor: combineRgb(245, 158, 11), color: combineRgb(0, 0, 0) } },
		{ feedbackId: 'additional_time_running', options: {}, style: { bgcolor: combineRgb(251, 191, 36), color: combineRgb(0, 0, 0) } },
	])
	createActionPreset('timer_additional_blink_toggle', 'Timer', 'Toggle additional time blink', 'ADDT\nBLINK', combineRgb(154, 52, 18), combineRgb(255, 255, 255), 'timer_toggle_additional_time_blink', {}, [
		{ feedbackId: 'additional_time_blink_enabled', options: {}, style: { bgcolor: combineRgb(234, 88, 12), color: combineRgb(255, 255, 255) } },
	])

	createActionPreset('chrono_start', 'Chrono', 'Start chrono', 'CHRONO\nSTART', combineRgb(147, 51, 234), combineRgb(255, 255, 255), 'chrono_start', {}, [
		{ feedbackId: 'chrono_running', options: {}, style: { bgcolor: combineRgb(168, 85, 247), color: combineRgb(255, 255, 255) } },
	], '14')
	createActionPreset('chrono_stop', 'Chrono', 'Stop chrono', 'CHRONO\nSTOP', combineRgb(126, 34, 206), combineRgb(255, 255, 255), 'chrono_stop')
	createActionPreset('chrono_reset', 'Chrono', 'Reset chrono', 'CHRONO\nRESET', combineRgb(88, 28, 135), combineRgb(255, 255, 255), 'chrono_reset')
	createActionPreset('chrono_blink_toggle', 'Chrono', 'Toggle chrono blink', 'BLINK\nCHRONO', combineRgb(124, 58, 237), combineRgb(255, 255, 255), 'chrono_set_blink_enabled', { state: 'toggle' }, [
		{ feedbackId: 'chrono_blink_enabled', options: {}, style: { bgcolor: combineRgb(109, 40, 217), color: combineRgb(255, 255, 255) } },
	], '14')
	createActionPreset('chrono_blink_60', 'Chrono', 'Set chrono blink threshold to 60 seconds', 'BLINK\n60S', combineRgb(91, 33, 182), combineRgb(255, 255, 255), 'chrono_set_blink_threshold', { threshold: 60 })
	createActionPreset('chrono_thresholds_on', 'Chrono', 'Enable chrono color thresholds', 'COLOR\nON', combineRgb(202, 138, 4), combineRgb(0, 0, 0), 'chrono_set_color_thresholds_enabled', { state: 'on' }, [
		{ feedbackId: 'chrono_color_thresholds_enabled', options: {}, style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) } },
	], '14')
	createActionPreset('chrono_threshold1_5m', 'Chrono', 'Set chrono threshold 1 to 5 minutes', 'TH1\n05:00', combineRgb(180, 83, 9), combineRgb(255, 255, 255), 'chrono_set_color_threshold', { threshold: 'threshold1', value: 300 })
	createActionPreset('chrono_threshold2_10m', 'Chrono', 'Set chrono threshold 2 to 10 minutes', 'TH2\n10:00', combineRgb(185, 28, 28), combineRgb(255, 255, 255), 'chrono_set_color_threshold', { threshold: 'threshold2', value: 600 })

	createActionPreset('mode_timer', 'Display', 'Switch to timer mode', 'TIMER', combineRgb(22, 163, 74), combineRgb(255, 255, 255), 'set_display_mode', { mode: 'timer' }, [
		{ feedbackId: 'display_mode', options: { mode: 'timer' }, style: { bgcolor: combineRgb(22, 163, 74), color: combineRgb(255, 255, 255) } },
	], '14')
	createActionPreset('mode_clock', 'Display', 'Switch to clock mode', 'CLOCK', combineRgb(147, 51, 234), combineRgb(255, 255, 255), 'set_display_mode', { mode: 'clock' }, [
		{ feedbackId: 'display_mode', options: { mode: 'clock' }, style: { bgcolor: combineRgb(147, 51, 234), color: combineRgb(255, 255, 255) } },
	], '14')
	createActionPreset('mode_chrono', 'Display', 'Switch to chrono mode', 'CHRONO', combineRgb(220, 38, 38), combineRgb(255, 255, 255), 'set_display_mode', { mode: 'chrono' }, [
		{ feedbackId: 'display_mode', options: { mode: 'chrono' }, style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) } },
	], '14')
	createActionPreset('mode_logo', 'Display', 'Switch to logo mode', 'LOGO', combineRgb(37, 99, 235), combineRgb(255, 255, 255), 'set_display_mode', { mode: 'logo' }, [
		{ feedbackId: 'display_mode', options: { mode: 'logo' }, style: { bgcolor: combineRgb(37, 99, 235), color: combineRgb(255, 255, 255) } },
	], '14')
	createActionPreset('mode_black', 'Display', 'Switch to black mode', 'BLACK', combineRgb(17, 24, 39), combineRgb(255, 255, 255), 'set_display_mode', { mode: 'black' }, [
		{ feedbackId: 'display_mode', options: { mode: 'black' }, style: { bgcolor: combineRgb(0, 0, 0), color: combineRgb(255, 255, 255) } },
	], '14')
	createActionPreset('mode_mire', 'Display', 'Switch to mire mode', 'MIRE', combineRgb(202, 138, 4), combineRgb(255, 255, 255), 'set_display_mode', { mode: 'mire' }, [
		{ feedbackId: 'display_mode', options: { mode: 'mire' }, style: { bgcolor: combineRgb(202, 138, 4), color: combineRgb(255, 255, 255) } },
	], '14')

	createActionPreset('message_show', 'Message', 'Toggle message visibility', 'MSG\nSHOW', combineRgb(3, 105, 161), combineRgb(255, 255, 255), 'message_toggle_visibility', {}, [
		{ feedbackId: 'message_visible', options: {}, style: { bgcolor: combineRgb(14, 165, 233), color: combineRgb(255, 255, 255) } },
	])
	createActionPreset('message_blink', 'Message', 'Toggle message blinking', 'MSG\nBLINK', combineRgb(217, 119, 6), combineRgb(255, 255, 255), 'message_toggle_blinking', {}, [
		{ feedbackId: 'message_blinking', options: {}, style: { bgcolor: combineRgb(251, 191, 36), color: combineRgb(0, 0, 0) } },
	])
	createActionPreset('message_clear', 'Message', 'Clear message', 'MSG\nCLEAR', combineRgb(71, 85, 105), combineRgb(255, 255, 255), 'message_clear')
	createActionPreset('message_alert', 'Message', 'Trigger red alert', 'MSG\nALERT', combineRgb(220, 38, 38), combineRgb(255, 255, 255), 'message_red_alert', { color: 0xef4444 }, [
		{ feedbackId: 'red_alert_dynamic', options: {} },
	])
	createActionPreset('message_set_generic', 'Message', 'Set generic message', 'MSG\nSET', combineRgb(30, 41, 59), combineRgb(255, 255, 255), 'message_set', { message: 'MESSAGE', color: 0xffffff })
	createActionPreset('message_set_pause', 'Message', 'Set pause message', 'MSG\nPAUSE', combineRgb(51, 65, 85), combineRgb(255, 255, 255), 'message_set', { message: 'PAUSE', color: 0xffffff })

	createActionPreset('audio_toggle', 'Audio', 'Toggle audio enabled', 'AUDIO', combineRgb(15, 118, 110), combineRgb(255, 255, 255), 'audio_toggle_enabled', {}, [
		{ feedbackId: 'audio_enabled', options: {}, style: { bgcolor: combineRgb(16, 185, 129), color: combineRgb(0, 0, 0) } },
	], '18')
	createActionPreset('audio_stop', 'Audio', 'Stop audio', 'AUDIO\nSTOP', combineRgb(17, 94, 89), combineRgb(255, 255, 255), 'audio_stop')
	createActionPreset('audio_stop_current_on_play', 'Audio', 'Enable stop current on play', 'STOP\nON PLAY', combineRgb(13, 148, 136), combineRgb(255, 255, 255), 'audio_set_stop_current_on_play', { enabled: 'on' }, [
		{ feedbackId: 'audio_stop_current_on_play', options: {}, style: { bgcolor: combineRgb(20, 184, 166), color: combineRgb(0, 0, 0) } },
	])
	createActionPreset('audio_rules_enable', 'Audio', 'Enable all audio rules', 'RULES\nON', combineRgb(14, 116, 144), combineRgb(255, 255, 255), 'audio_set_rules_enabled', { enabled: 'on' }, [
		{ feedbackId: 'audio_rules_enabled', options: {}, style: { bgcolor: combineRgb(6, 182, 212), color: combineRgb(0, 0, 0) } },
	])
	createActionPreset('audio_rules_disable', 'Audio', 'Disable all audio rules', 'RULES\nOFF', combineRgb(8, 47, 73), combineRgb(255, 255, 255), 'audio_set_rules_enabled', { enabled: 'off' })
	createActionPreset('audio_volume_80', 'Audio', 'Set master volume to 80%', 'VOL\n80%', combineRgb(15, 23, 42), combineRgb(255, 255, 255), 'audio_set_master_volume', { volume: 80 })

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
			{ soundId: sound.id, volume: 100 }
		)
	}

	createActionPreset('playlist_start', 'Playlist', 'Start playlist', 'PLAYLIST\nSTART', combineRgb(249, 115, 22), combineRgb(255, 255, 255), 'playlist_start', {}, [
		{ feedbackId: 'playlist_running', options: {}, style: { bgcolor: combineRgb(251, 146, 60), color: combineRgb(0, 0, 0) } },
	])
	createActionPreset('playlist_stop', 'Playlist', 'Stop playlist', 'PLAYLIST\nSTOP', combineRgb(194, 65, 12), combineRgb(255, 255, 255), 'playlist_stop')
	createActionPreset('playlist_prev', 'Playlist', 'Previous playlist session', 'PLAYLIST\nPREV', combineRgb(180, 83, 9), combineRgb(255, 255, 255), 'playlist_previous')
	createActionPreset('playlist_next', 'Playlist', 'Next playlist session', 'PLAYLIST\nNEXT', combineRgb(249, 115, 22), combineRgb(255, 255, 255), 'playlist_next')
	createActionPreset('playlist_intermission_toggle', 'Playlist', 'Toggle intermission', 'INTER\nTOGGLE', combineRgb(234, 179, 8), combineRgb(0, 0, 0), 'playlist_toggle_intermission', { state: 'toggle' }, [
		{ feedbackId: 'playlist_intermission', options: {}, style: { bgcolor: combineRgb(250, 204, 21), color: combineRgb(0, 0, 0) } },
	])

	createReadoutPreset('readout_timer_full', 'Timer full readout', variable('timer_full_formatted'), combineRgb(17, 24, 39), '14', [
		{ feedbackId: 'timer_finished', options: {}, style: { bgcolor: combineRgb(153, 27, 27), color: combineRgb(255, 255, 255) } },
		{ feedbackId: 'timer_running', options: {}, style: { bgcolor: combineRgb(21, 128, 61), color: combineRgb(255, 255, 255) } },
		{ feedbackId: 'timer_blink_active', options: {}, style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) } },
	])
	createReadoutPreset('readout_timer_h', 'Timer hours readout', variable('timer_hours'), combineRgb(17, 24, 39), '44')
	createReadoutPreset('readout_timer_m', 'Timer minutes readout', variable('timer_minutes'), combineRgb(17, 24, 39), '44')
	createReadoutPreset('readout_timer_s', 'Timer seconds readout', variable('timer_seconds'), combineRgb(17, 24, 39), '44', [
		{ feedbackId: 'remaining_time_compare', options: { operator: 'lte', seconds: 60 }, style: { bgcolor: combineRgb(180, 83, 9), color: combineRgb(255, 255, 255) } },
		{ feedbackId: 'remaining_time_compare', options: { operator: 'lte', seconds: 10 }, style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) } },
	])
	createReadoutPreset('readout_duration_full', 'Duration full readout', variable('duration_full_formatted'), combineRgb(30, 41, 59), '14')
	createReadoutPreset('readout_elapsed_full', 'Elapsed full readout', variable('elapsed_full_formatted'), combineRgb(30, 41, 59), '14')
	createReadoutPreset('readout_progress', 'Progress percent readout', `${variable('progress_percent')}%`, combineRgb(3, 105, 161), '18', [
		{ feedbackId: 'progress_percent_compare', options: { operator: 'gte', percent: 80 }, style: { bgcolor: combineRgb(153, 27, 27), color: combineRgb(255, 255, 255) } },
	])

	createReadoutPreset('readout_additional_full', 'Additional time full readout', variable('additional_time_formatted'), combineRgb(120, 53, 15), '14', [
		{ feedbackId: 'additional_time_enabled', options: {}, style: { bgcolor: combineRgb(180, 83, 9), color: combineRgb(255, 255, 255) } },
		{ feedbackId: 'additional_time_running', options: {}, style: { bgcolor: combineRgb(245, 158, 11), color: combineRgb(0, 0, 0) } },
	])
	createReadoutPreset('readout_additional_h', 'Additional time hours readout', variable('additional_time_hours'), combineRgb(120, 53, 15), '44')
	createReadoutPreset('readout_additional_m', 'Additional time minutes readout', variable('additional_time_minutes'), combineRgb(120, 53, 15), '44')
	createReadoutPreset('readout_additional_s', 'Additional time seconds readout', variable('additional_time_seconds_component'), combineRgb(120, 53, 15), '44', [
		{ feedbackId: 'additional_time_running', options: {}, style: { bgcolor: combineRgb(245, 158, 11), color: combineRgb(0, 0, 0) } },
	])

	createReadoutPreset('readout_clock_full', 'Clock full readout', variable('clock_text'), combineRgb(12, 74, 110), '14')
	createReadoutPreset('readout_clock_h', 'Clock hours readout', variable('clock_hours'), combineRgb(12, 74, 110), '44')
	createReadoutPreset('readout_clock_m', 'Clock minutes readout', variable('clock_minutes'), combineRgb(12, 74, 110), '44')
	createReadoutPreset('readout_clock_s', 'Clock seconds readout', variable('clock_seconds'), combineRgb(12, 74, 110), '44')
	createReadoutPreset('readout_clock_ampm', 'Clock AM PM readout', variable('clock_ampm'), combineRgb(8, 47, 73), '18')
	createReadoutPreset('readout_display_time_source', 'Display time source readout', variable('display_time_source'), combineRgb(51, 65, 85), '18')
	createReadoutPreset('readout_display_time', 'Display time readout', variable('display_time_formatted'), combineRgb(30, 41, 59), '14', displayTimeFeedbacks)
	createReadoutPreset('readout_display_time_full', 'Display time full readout', variable('display_time_full_formatted'), combineRgb(30, 41, 59), '14', displayTimeFeedbacks)
	createReadoutPreset('readout_display_time_h', 'Display time hours readout', variable('display_time_hours'), combineRgb(30, 41, 59), '44', displayTimeFeedbacks)
	createReadoutPreset('readout_display_time_m', 'Display time minutes readout', variable('display_time_minutes'), combineRgb(30, 41, 59), '44', displayTimeFeedbacks)
	createReadoutPreset('readout_display_time_s', 'Display time seconds readout', variable('display_time_seconds'), combineRgb(30, 41, 59), '44', displayTimeFeedbacks)

	createReadoutPreset('readout_chrono_full', 'Chrono full readout', variable('chrono_full_formatted'), combineRgb(76, 29, 149), '14', [
		{ feedbackId: 'chrono_running', options: {}, style: { bgcolor: combineRgb(147, 51, 234), color: combineRgb(255, 255, 255) } },
		{ feedbackId: 'chrono_threshold1_reached', options: {}, style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) } },
		{ feedbackId: 'chrono_threshold2_reached', options: {}, style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) } },
	])
	createReadoutPreset('readout_chrono_h', 'Chrono hours readout', variable('chrono_hours'), combineRgb(76, 29, 149), '44')
	createReadoutPreset('readout_chrono_m', 'Chrono minutes readout', variable('chrono_minutes'), combineRgb(76, 29, 149), '44')
	createReadoutPreset('readout_chrono_s', 'Chrono seconds readout', variable('chrono_seconds_component'), combineRgb(76, 29, 149), '44', [
		{ feedbackId: 'chrono_threshold1_reached', options: {}, style: { bgcolor: combineRgb(234, 179, 8), color: combineRgb(0, 0, 0) } },
		{ feedbackId: 'chrono_threshold2_reached', options: {}, style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) } },
	])

	createReadoutPreset('readout_playlist_session', 'Playlist current session name', variable('playlist_current_session_name'), combineRgb(67, 20, 7), '14', [
		{ feedbackId: 'playlist_running', options: {}, style: { bgcolor: combineRgb(194, 65, 12), color: combineRgb(255, 255, 255) } },
		{ feedbackId: 'playlist_intermission', options: {}, style: { bgcolor: combineRgb(217, 119, 6), color: combineRgb(0, 0, 0) } },
	])
	createReadoutPreset('readout_playlist_mode', 'Playlist current session mode', variable('playlist_current_session_mode'), combineRgb(67, 20, 7), '18')
	createReadoutPreset('readout_playlist_chrono', 'Playlist chrono full readout', variable('playlist_chrono_formatted'), combineRgb(67, 20, 7), '14')
	createReadoutPreset('readout_message', 'Current message text', variable('message_text'), combineRgb(30, 41, 59), '14', [
		{ feedbackId: 'message_visible', options: {}, style: { bgcolor: combineRgb(3, 105, 161), color: combineRgb(255, 255, 255) } },
		{ feedbackId: 'message_blinking', options: {}, style: { bgcolor: combineRgb(251, 191, 36), color: combineRgb(0, 0, 0) } },
		{ feedbackId: 'red_alert_active', options: {}, style: { bgcolor: combineRgb(220, 38, 38), color: combineRgb(255, 255, 255) } },
	])

	clonePresetToCategory('mode_timer', 'ready_main_mode_timer', readyPageMainCategory, 'Ready page main: timer mode')
	clonePresetToCategory('mode_clock', 'ready_main_mode_clock', readyPageMainCategory, 'Ready page main: clock mode')
	clonePresetToCategory('mode_chrono', 'ready_main_mode_chrono', readyPageMainCategory, 'Ready page main: chrono mode')
	clonePresetToCategory('mode_logo', 'ready_main_mode_logo', readyPageMainCategory, 'Ready page main: logo mode')
	clonePresetToCategory('timer_start', 'ready_main_timer_start', readyPageMainCategory, 'Ready page main: timer start')
	clonePresetToCategory('timer_pause', 'ready_main_timer_pause', readyPageMainCategory, 'Ready page main: timer pause')
	clonePresetToCategory('timer_reset', 'ready_main_timer_reset', readyPageMainCategory, 'Ready page main: timer reset')
	clonePresetToCategory('message_show', 'ready_main_message_show', readyPageMainCategory, 'Ready page main: message show')
	clonePresetToCategory('message_alert', 'ready_main_message_alert', readyPageMainCategory, 'Ready page main: message alert')
	clonePresetToCategory('readout_timer_full', 'ready_main_timer_full', readyPageMainCategory, 'Ready page main: timer full readout')
	clonePresetToCategory('readout_clock_full', 'ready_main_clock_full', readyPageMainCategory, 'Ready page main: clock full readout')
	clonePresetToCategory('readout_message', 'ready_main_message_text', readyPageMainCategory, 'Ready page main: message readout')
	clonePresetToCategory('readout_display_time', 'ready_main_display_time', readyPageMainCategory, 'Ready page main: display time')
	clonePresetToCategory('readout_display_time_full', 'ready_main_display_time_full', readyPageMainCategory, 'Ready page main: display time full')
	clonePresetToCategory('readout_display_time_h', 'ready_main_display_time_h', readyPageMainCategory, 'Ready page main: display time hours')
	clonePresetToCategory('readout_display_time_m', 'ready_main_display_time_m', readyPageMainCategory, 'Ready page main: display time minutes')
	clonePresetToCategory('readout_display_time_s', 'ready_main_display_time_s', readyPageMainCategory, 'Ready page main: display time seconds')

	clonePresetToCategory('readout_timer_h', 'ready_timer_hours', readyPageTimerCategory, 'Ready page timer: hours')
	clonePresetToCategory('readout_timer_m', 'ready_timer_minutes', readyPageTimerCategory, 'Ready page timer: minutes')
	clonePresetToCategory('readout_timer_s', 'ready_timer_seconds', readyPageTimerCategory, 'Ready page timer: seconds')
	clonePresetToCategory('readout_additional_full', 'ready_timer_additional_full', readyPageTimerCategory, 'Ready page timer: additional time')
	clonePresetToCategory('timer_plus_60', 'ready_timer_plus_60', readyPageTimerCategory, 'Ready page timer: plus 60')
	clonePresetToCategory('timer_minus_60', 'ready_timer_minus_60', readyPageTimerCategory, 'Ready page timer: minus 60')
	clonePresetToCategory('timer_blink_toggle', 'ready_timer_blink', readyPageTimerCategory, 'Ready page timer: blink toggle')
	clonePresetToCategory('timer_additional_toggle', 'ready_timer_additional_toggle', readyPageTimerCategory, 'Ready page timer: additional toggle')

	clonePresetToCategory('chrono_start', 'ready_chrono_start', readyPageChronoCategory, 'Ready page chrono: start')
	clonePresetToCategory('chrono_stop', 'ready_chrono_stop', readyPageChronoCategory, 'Ready page chrono: stop')
	clonePresetToCategory('chrono_reset', 'ready_chrono_reset', readyPageChronoCategory, 'Ready page chrono: reset')
	clonePresetToCategory('readout_chrono_h', 'ready_chrono_hours', readyPageChronoCategory, 'Ready page chrono: hours')
	clonePresetToCategory('readout_chrono_m', 'ready_chrono_minutes', readyPageChronoCategory, 'Ready page chrono: minutes')
	clonePresetToCategory('readout_chrono_s', 'ready_chrono_seconds', readyPageChronoCategory, 'Ready page chrono: seconds')
	clonePresetToCategory('chrono_blink_toggle', 'ready_chrono_blink', readyPageChronoCategory, 'Ready page chrono: blink toggle')
	clonePresetToCategory('chrono_thresholds_on', 'ready_chrono_thresholds', readyPageChronoCategory, 'Ready page chrono: thresholds')

	clonePresetToCategory('audio_toggle', 'ready_audio_toggle', readyPageAudioCategory, 'Ready page audio: toggle')
	clonePresetToCategory('audio_stop', 'ready_audio_stop', readyPageAudioCategory, 'Ready page audio: stop')
	clonePresetToCategory('audio_stop_current_on_play', 'ready_audio_stop_current_on_play', readyPageAudioCategory, 'Ready page audio: stop current on play')
	clonePresetToCategory('audio_rules_enable', 'ready_audio_rules_enable', readyPageAudioCategory, 'Ready page audio: rules on')
	clonePresetToCategory('audio_volume_80', 'ready_audio_volume_80', readyPageAudioCategory, 'Ready page audio: volume 80')

	clonePresetToCategory('playlist_start', 'ready_playlist_start', readyPagePlaylistCategory, 'Ready page playlist: start')
	clonePresetToCategory('playlist_stop', 'ready_playlist_stop', readyPagePlaylistCategory, 'Ready page playlist: stop')
	clonePresetToCategory('playlist_prev', 'ready_playlist_prev', readyPagePlaylistCategory, 'Ready page playlist: previous')
	clonePresetToCategory('playlist_next', 'ready_playlist_next', readyPagePlaylistCategory, 'Ready page playlist: next')
	clonePresetToCategory('playlist_intermission_toggle', 'ready_playlist_intermission', readyPagePlaylistCategory, 'Ready page playlist: intermission')
	clonePresetToCategory('readout_playlist_session', 'ready_playlist_session', readyPagePlaylistCategory, 'Ready page playlist: current session')
	clonePresetToCategory('readout_playlist_chrono', 'ready_playlist_chrono', readyPagePlaylistCategory, 'Ready page playlist: chrono')
	clonePresetToCategory('readout_display_time', 'ready_playlist_display_time', readyPagePlaylistCategory, 'Ready page playlist: display time')
	clonePresetToCategory('readout_display_time_full', 'ready_playlist_display_time_full', readyPagePlaylistCategory, 'Ready page playlist: display time full')
	clonePresetToCategory('readout_display_time_h', 'ready_playlist_display_time_h', readyPagePlaylistCategory, 'Ready page playlist: display time hours')
	clonePresetToCategory('readout_display_time_m', 'ready_playlist_display_time_m', readyPagePlaylistCategory, 'Ready page playlist: display time minutes')
	clonePresetToCategory('readout_display_time_s', 'ready_playlist_display_time_s', readyPagePlaylistCategory, 'Ready page playlist: display time seconds')

	clonePresetToCategory('mode_timer', 'ready_show_mode_timer', readyPageShowCategory, 'Ready page show: timer mode')
	clonePresetToCategory('timer_start', 'ready_show_timer_start', readyPageShowCategory, 'Ready page show: timer start')
	clonePresetToCategory('timer_pause', 'ready_show_timer_pause', readyPageShowCategory, 'Ready page show: timer pause')
	clonePresetToCategory('timer_reset', 'ready_show_timer_reset', readyPageShowCategory, 'Ready page show: timer reset')
	clonePresetToCategory('message_show', 'ready_show_message_show', readyPageShowCategory, 'Ready page show: message show')
	clonePresetToCategory('message_set_pause', 'ready_show_message_pause', readyPageShowCategory, 'Ready page show: message pause')
	clonePresetToCategory('message_alert', 'ready_show_message_alert', readyPageShowCategory, 'Ready page show: message alert')
	clonePresetToCategory('audio_toggle', 'ready_show_audio_toggle', readyPageShowCategory, 'Ready page show: audio toggle')
	clonePresetToCategory('audio_stop', 'ready_show_audio_stop', readyPageShowCategory, 'Ready page show: audio stop')
	clonePresetToCategory('readout_timer_full', 'ready_show_timer_full', readyPageShowCategory, 'Ready page show: timer full')
	clonePresetToCategory('readout_clock_full', 'ready_show_clock_full', readyPageShowCategory, 'Ready page show: clock full')
	clonePresetToCategory('readout_message', 'ready_show_message_text', readyPageShowCategory, 'Ready page show: message text')
	clonePresetToCategory('readout_display_time', 'ready_show_display_time', readyPageShowCategory, 'Ready page show: display time')
	clonePresetToCategory('readout_display_time_full', 'ready_show_display_time_full', readyPageShowCategory, 'Ready page show: display time full')
	clonePresetToCategory('readout_display_time_h', 'ready_show_display_time_h', readyPageShowCategory, 'Ready page show: display time hours')
	clonePresetToCategory('readout_display_time_m', 'ready_show_display_time_m', readyPageShowCategory, 'Ready page show: display time minutes')
	clonePresetToCategory('readout_display_time_s', 'ready_show_display_time_s', readyPageShowCategory, 'Ready page show: display time seconds')

	clonePresetToCategory('mode_clock', 'ready_intermission_mode_clock', readyPageIntermissionCategory, 'Ready page intermission: clock mode')
	clonePresetToCategory('mode_logo', 'ready_intermission_mode_logo', readyPageIntermissionCategory, 'Ready page intermission: logo mode')
	clonePresetToCategory('playlist_intermission_toggle', 'ready_intermission_toggle', readyPageIntermissionCategory, 'Ready page intermission: toggle')
	clonePresetToCategory('message_set_pause', 'ready_intermission_message_pause', readyPageIntermissionCategory, 'Ready page intermission: pause message')
	clonePresetToCategory('message_clear', 'ready_intermission_message_clear', readyPageIntermissionCategory, 'Ready page intermission: clear message')
	clonePresetToCategory('audio_toggle', 'ready_intermission_audio_toggle', readyPageIntermissionCategory, 'Ready page intermission: audio toggle')
	clonePresetToCategory('audio_stop', 'ready_intermission_audio_stop', readyPageIntermissionCategory, 'Ready page intermission: audio stop')
	clonePresetToCategory('readout_clock_full', 'ready_intermission_clock_full', readyPageIntermissionCategory, 'Ready page intermission: clock full')
	clonePresetToCategory('readout_playlist_session', 'ready_intermission_session', readyPageIntermissionCategory, 'Ready page intermission: session')
	clonePresetToCategory('readout_playlist_chrono', 'ready_intermission_chrono', readyPageIntermissionCategory, 'Ready page intermission: chrono')
	clonePresetToCategory('readout_display_time', 'ready_intermission_display_time', readyPageIntermissionCategory, 'Ready page intermission: display time')
	clonePresetToCategory('readout_display_time_full', 'ready_intermission_display_time_full', readyPageIntermissionCategory, 'Ready page intermission: display time full')
	clonePresetToCategory('readout_display_time_h', 'ready_intermission_display_time_h', readyPageIntermissionCategory, 'Ready page intermission: display time hours')
	clonePresetToCategory('readout_display_time_m', 'ready_intermission_display_time_m', readyPageIntermissionCategory, 'Ready page intermission: display time minutes')
	clonePresetToCategory('readout_display_time_s', 'ready_intermission_display_time_s', readyPageIntermissionCategory, 'Ready page intermission: display time seconds')
	clonePresetToCategory('readout_display_time', 'display_display_time', 'Display', 'Display: current time readout')
	clonePresetToCategory('readout_display_time_full', 'display_display_time_full', 'Display', 'Display: current time full readout')
	clonePresetToCategory('readout_display_time_h', 'display_display_time_h', 'Display', 'Display: current time hours readout')
	clonePresetToCategory('readout_display_time_m', 'display_display_time_m', 'Display', 'Display: current time minutes readout')
	clonePresetToCategory('readout_display_time_s', 'display_display_time_s', 'Display', 'Display: current time seconds readout')

	for (const sound of self.getAvailableAudioSounds().slice(0, 8)) {
		const safeId = sound.id.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
		clonePresetToCategory(
			`audio_play_${safeId}`,
			`ready_audio_play_${safeId}`,
			readyPageAudioCategory,
			`Ready page audio: play ${sound.label}`
		)
		clonePresetToCategory(
			`audio_play_${safeId}`,
			`ready_show_audio_play_${safeId}`,
			readyPageShowCategory,
			`Ready page show: play ${sound.label}`
		)
	}

	applyFixedTextSizeToCategories(
		[
			'Timer',
			'Chrono',
			'Audio',
			'Playlist',
			readyPageTimerCategory,
			readyPageChronoCategory,
			readyPageAudioCategory,
			readyPagePlaylistCategory,
		],
		'14'
	)

	self.setPresetDefinitions(presets)
}

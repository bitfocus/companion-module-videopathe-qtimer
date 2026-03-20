import { InstanceBase, InstanceStatus, type SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import WebSocket from 'ws'
import { fetchJson, postJson, buildBaseUrl } from './api.js'
import { UpdateActions } from './actions.js'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import {
	clampNumber,
	countEnabledSessions,
	formatDuration,
	getActiveDisplayTimeState,
	getCurrentPlaylistSession,
	inferDisplayMode,
	parseClockParts,
	type QTimerAudioSettingsResponse,
	type QTimerAudioSound,
	type PlaylistSnapshot,
	type QTimerPlaylistStateResponse,
	type QTimerStateSnapshot,
	type QTimerStatusResponse,
	safeNumber,
	splitDurationParts,
} from './state.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateVariableDefinitions } from './variables.js'

interface RuntimeState {
	connected: boolean
	lastError: string | null
	serverUrl: string
	lastUpdated: string | null
	qtimer?: QTimerStateSnapshot
	playlist?: PlaylistSnapshot
	audioSounds?: QTimerAudioSound[]
}

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig
	runtimeState: RuntimeState = {
		connected: false,
		lastError: null,
		serverUrl: '',
		lastUpdated: null,
	}

	private pollTimer: NodeJS.Timeout | undefined
	private pollInFlight = false
	private websocket: WebSocket | undefined
	private websocketReconnectTimer: NodeJS.Timeout | undefined
	private websocketConnected = false
	private audioPresetSignature = ''

	constructor(internal: unknown) {
		super(internal)
	}

	get isConnected(): boolean {
		return this.runtimeState.connected
	}

	get progressPercent(): number {
		const duration = safeNumber(this.runtimeState.qtimer?.duration)
		const remaining = safeNumber(this.runtimeState.qtimer?.timeRemaining)
		if (duration <= 0) {
			return 0
		}

		const elapsed = clampNumber(duration - remaining, 0, duration)
		return Math.round((elapsed / duration) * 10000) / 100
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()
		this.updateVariablesFromState()

		this.startPolling(true)
		this.connectWebSocket()
	}

	async destroy(): Promise<void> {
		this.stopPolling()
		this.disconnectWebSocket(false)
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.startPolling(true)
		this.connectWebSocket()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	getAvailableAudioSounds(): QTimerAudioSound[] {
		return this.runtimeState.audioSounds ?? []
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	private hasValidConfig(): boolean {
		return !!this.config?.host?.trim() && safeNumber(this.config?.port) > 0
	}

	private stopPolling(): void {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}
	}

	private disconnectWebSocket(scheduleReconnect: boolean): void {
		if (this.websocketReconnectTimer) {
			clearTimeout(this.websocketReconnectTimer)
			this.websocketReconnectTimer = undefined
		}

		if (this.websocket) {
			this.websocket.removeAllListeners()
			this.websocket.terminate()
			this.websocket = undefined
		}

		this.websocketConnected = false
		this.updateVariablesFromState()
		this.checkFeedbacks()

		if (scheduleReconnect && this.hasValidConfig()) {
			this.websocketReconnectTimer = setTimeout(() => {
				this.websocketReconnectTimer = undefined
				this.connectWebSocket()
			}, 2000)
		}
	}

	private connectWebSocket(): void {
		this.disconnectWebSocket(false)

		if (!this.hasValidConfig()) {
			return
		}

		const wsUrl = `ws://${this.config.host}:${safeNumber(this.config.port, 2222)}/?client=companion-module`
		const websocket = new WebSocket(wsUrl)
		this.websocket = websocket

		websocket.on('open', () => {
			if (this.websocket !== websocket) {
				return
			}

			this.websocketConnected = true
			this.log('debug', `WebSocket connected: ${wsUrl}`)
			this.updateVariablesFromState()
			void this.refreshAllState()
		})

		websocket.on('message', (data) => {
			if (this.websocket !== websocket) {
				return
			}

			this.handleWebSocketMessage(data.toString())
		})

		websocket.on('close', () => {
			if (this.websocket !== websocket) {
				return
			}

			this.log('debug', 'WebSocket closed, scheduling reconnect')
			this.disconnectWebSocket(true)
		})

		websocket.on('error', (error) => {
			if (this.websocket !== websocket) {
				return
			}

			this.log('debug', `WebSocket error: ${this.formatError(error)}`)
		})
	}

	private handleWebSocketMessage(message: string): void {
		try {
			const payload = JSON.parse(message) as { type?: string; data?: unknown }

			if (payload.type !== 'state' || !payload.data || typeof payload.data !== 'object') {
				return
			}

			this.runtimeState = {
				...this.runtimeState,
				connected: true,
				lastError: null,
				serverUrl: this.runtimeState.serverUrl || this.getBaseUrl(),
				lastUpdated: new Date().toISOString(),
				qtimer: payload.data as QTimerStateSnapshot,
			}

			this.updateStatus(InstanceStatus.Ok)
			this.updateVariablesFromState()
			this.checkFeedbacks()
			this.refreshDynamicPresets()
		} catch (error) {
			this.log('debug', `WebSocket message parse failed: ${this.formatError(error)}`)
		}
	}

	private startPolling(runImmediately: boolean): void {
		this.stopPolling()

		if (!this.hasValidConfig()) {
			this.updateStatus(InstanceStatus.BadConfig)
			this.runtimeState = {
				...this.runtimeState,
				connected: false,
				lastError: 'Invalid module configuration',
			}
			this.updateVariablesFromState()
			this.checkFeedbacks()
			return
		}

		this.updateStatus(InstanceStatus.Connecting)

		const interval = Math.max(250, safeNumber(this.config.pollInterval, 1000))
		this.pollTimer = setInterval(() => {
			void this.refreshAllState()
		}, interval)

		if (runImmediately) {
			void this.refreshAllState()
		}
	}

	getBaseUrl(): string {
		return buildBaseUrl(this.config.host, safeNumber(this.config.port, 2222))
	}

	async refreshAllState(): Promise<void> {
		if (this.pollInFlight) {
			return
		}

		if (!this.hasValidConfig()) {
			this.updateStatus(InstanceStatus.BadConfig)
			return
		}

		this.pollInFlight = true

		try {
			const baseUrl = this.getBaseUrl()
			const [statusResponse, playlistResponse, audioResponse] = await Promise.all([
				fetchJson<QTimerStatusResponse>(`${baseUrl}/api/status`),
				fetchJson<QTimerPlaylistStateResponse>(`${baseUrl}/api/playlist/state`).catch((error) => {
					this.log('debug', `Playlist refresh failed: ${this.formatError(error)}`)
					return undefined
				}),
				fetchJson<QTimerAudioSettingsResponse>(`${baseUrl}/api/audio/settings`).catch((error) => {
					this.log('debug', `Audio refresh failed: ${this.formatError(error)}`)
					return undefined
				}),
			])

			const audioSettings = audioResponse?.audioSettings ?? statusResponse.state?.audioSettings
			const audioSounds = this.normalizeAudioSounds(audioResponse)

			this.runtimeState = {
				connected: true,
				lastError: null,
				serverUrl: statusResponse.network?.url || baseUrl,
				lastUpdated: statusResponse.timestamp || new Date().toISOString(),
				qtimer: {
					...statusResponse.state,
					audioSettings,
				},
				playlist: playlistResponse?.playlist ?? this.runtimeState.playlist,
				audioSounds,
			}

			this.updateStatus(InstanceStatus.Ok)
			this.updateVariablesFromState()
			this.checkFeedbacks()
			this.refreshDynamicPresets()
		} catch (error) {
			this.runtimeState = {
				...this.runtimeState,
				connected: false,
				lastError: this.formatError(error),
				serverUrl: this.getBaseUrl(),
			}

			this.updateStatus(InstanceStatus.ConnectionFailure)
			this.updateVariablesFromState()
			this.checkFeedbacks()
		} finally {
			this.pollInFlight = false
		}
	}

	async postCommand(path: string, body?: unknown): Promise<void> {
		if (!this.hasValidConfig()) {
			this.updateStatus(InstanceStatus.BadConfig)
			throw new Error('Invalid module configuration')
		}

		const baseUrl = this.getBaseUrl()
		try {
			await postJson<unknown>(`${baseUrl}${path}`, body)
			void this.refreshAllState()
		} catch (error) {
			const message = this.formatError(error)
			this.runtimeState = {
				...this.runtimeState,
				connected: false,
				lastError: message,
			}
			this.updateStatus(InstanceStatus.ConnectionFailure)
			this.updateVariablesFromState()
			this.checkFeedbacks()
			throw error
		}
	}

	private formatError(error: unknown): string {
		if (error instanceof Error) {
			return error.message
		}
		return String(error)
	}

	private normalizeAudioSounds(audioResponse: QTimerAudioSettingsResponse | undefined): QTimerAudioSound[] {
		const soundLabelOverrides = audioResponse?.audioSettings?.soundLabelOverrides ?? {}
		const rawSounds = [
			...(Array.isArray(audioResponse?.defaultSounds) ? audioResponse.defaultSounds : []),
			...(Array.isArray(audioResponse?.sounds) ? audioResponse.sounds : []),
			...(Array.isArray(audioResponse?.audioSettings?.customSounds) ? audioResponse.audioSettings.customSounds : []),
		]

		const dedupedSounds = new Map<string, QTimerAudioSound>()
		for (const rawSound of rawSounds) {
			const id = String(rawSound?.id ?? '').trim()
			if (!id || dedupedSounds.has(id)) {
				continue
			}

			const sourceType =
				rawSound?.sourceType === 'builtin' || rawSound?.sourceType === 'custom' || rawSound?.sourceType === 'default-file'
					? rawSound.sourceType
					: undefined

			const defaultLabel = String(rawSound?.label ?? rawSound?.fileName ?? id).trim() || id
			dedupedSounds.set(id, {
				id,
				label: String(soundLabelOverrides[id] ?? defaultLabel).trim() || id,
				src: typeof rawSound?.src === 'string' ? rawSound.src : undefined,
				sourceType,
				mimeType: typeof rawSound?.mimeType === 'string' ? rawSound.mimeType : undefined,
				fileName: typeof rawSound?.fileName === 'string' ? rawSound.fileName : undefined,
			})
		}

		return Array.from(dedupedSounds.values()).sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))
	}

	private refreshDynamicPresets(): void {
		const signature = (this.runtimeState.audioSounds ?? [])
			.map((sound) => `${sound.id}:${sound.label}`)
			.join('|')

		if (signature === this.audioPresetSignature) {
			return
		}

		this.audioPresetSignature = signature
		this.updatePresets()
	}

	private updateVariablesFromState(): void {
		const qtimer = this.runtimeState.qtimer
		const playlist = this.runtimeState.playlist
		const audioSettings = qtimer?.audioSettings
		const audioRules = audioSettings?.triggerRules ?? []
		const currentSession = getCurrentPlaylistSession(playlist)
		const duration = safeNumber(qtimer?.duration)
		const remaining = safeNumber(qtimer?.timeRemaining)
		const elapsed = clampNumber(duration - remaining, 0, Math.max(duration, 0))
		const remainingPercent = duration > 0 ? Math.round((remaining / duration) * 10000) / 100 : 0
		const chronoSeconds = safeNumber(qtimer?.chronoTime)
		const additionalTimeSeconds = safeNumber(qtimer?.additionalTimeValue)
		const playlistChronoStartTime = safeNumber(playlist?.playlistChronoStartTime, 0)
		const storedPlaylistChronoSeconds = safeNumber(playlist?.playlistChronoTime)
		const playlistChronoSeconds = playlistChronoStartTime > 0 && (playlist?.isRunning === true || playlist?.intermissionMode === true)
			? Math.max(storedPlaylistChronoSeconds, Math.floor((Date.now() - playlistChronoStartTime) / 1000))
			: storedPlaylistChronoSeconds
		const showHours = qtimer?.timerDisplayOptions?.showHours !== false
		const chronoShowHours = qtimer?.chronoDisplayOptions?.showHours !== false
		const displayMode = inferDisplayMode(qtimer)
		const displayTime = getActiveDisplayTimeState(qtimer)
		const timerParts = splitDurationParts(remaining)
		const durationParts = splitDurationParts(duration)
		const elapsedParts = splitDurationParts(elapsed)
		const chronoParts = splitDurationParts(chronoSeconds)
		const additionalTimeParts = splitDurationParts(additionalTimeSeconds)
		const playlistChronoParts = splitDurationParts(playlistChronoSeconds)
		const clockParts = parseClockParts(qtimer?.currentTime)

		this.setVariableValues({
			connection_status: this.runtimeState.connected ? 'ok' : this.runtimeState.lastError ? 'connection_failure' : 'disconnected',
			websocket_connected: this.websocketConnected,
			server_url: this.runtimeState.serverUrl || this.getBaseUrl(),
			display_mode: displayMode,
			display_time_source: displayTime.source,
			display_time_formatted: displayTime.formatted,
			display_time_full_formatted: displayTime.fullFormatted,
			display_time_hours: displayTime.parts.hoursText,
			display_time_minutes: displayTime.parts.minutesText,
			display_time_seconds: displayTime.parts.secondsText,
			timer_running: qtimer?.isRunning === true,
			timer_full_formatted: formatDuration(remaining, true),
			timer_blink_enabled: qtimer?.timerDisplayOptions?.blinkOnEnd === true,
			timer_blink_active: qtimer?.timerBlinkState === true,
			timer_hours: timerParts.hoursText,
			timer_minutes: timerParts.minutesText,
			timer_seconds: timerParts.secondsText,
			duration_seconds: duration,
			duration_formatted: formatDuration(duration, showHours),
			duration_full_formatted: formatDuration(duration, true),
			duration_hours: durationParts.hoursText,
			duration_minutes: durationParts.minutesText,
			duration_seconds_component: durationParts.secondsText,
			time_remaining_seconds: remaining,
			time_remaining_formatted: formatDuration(remaining, showHours),
			elapsed_seconds: elapsed,
			elapsed_formatted: formatDuration(elapsed, showHours),
			elapsed_full_formatted: formatDuration(elapsed, true),
			elapsed_hours: elapsedParts.hoursText,
			elapsed_minutes: elapsedParts.minutesText,
			elapsed_seconds_component: elapsedParts.secondsText,
			progress_percent: this.progressPercent,
			remaining_percent: remainingPercent,
			additional_time_enabled: qtimer?.additionalTimeEnabled === true,
			additional_time_running: qtimer?.additionalTimeRunning === true,
			additional_time_blink: qtimer?.additionalTimeBlink === true,
			additional_time_seconds: additionalTimeSeconds,
			additional_time_formatted: formatDuration(additionalTimeSeconds, true),
			additional_time_hours: additionalTimeParts.hoursText,
			additional_time_minutes: additionalTimeParts.minutesText,
			additional_time_seconds_component: additionalTimeParts.secondsText,
			message_text: qtimer?.message ?? '',
			message_color: qtimer?.messageColor ?? '',
			message_blinking: qtimer?.messageBlinking === true,
			clock_text: qtimer?.currentTime ?? '',
			clock_hours: clockParts.hoursText,
			clock_minutes: clockParts.minutesText,
			clock_seconds: clockParts.secondsText,
			clock_ampm: clockParts.ampm,
			chrono_seconds: chronoSeconds,
			chrono_formatted: formatDuration(chronoSeconds, chronoShowHours),
			chrono_full_formatted: formatDuration(chronoSeconds, true),
			chrono_blink_enabled: qtimer?.chronoDisplayOptions?.blinkOnEnd === true,
			chrono_blink_active: qtimer?.chronoDisplayOptions?.blinkState === true,
			chrono_color_thresholds_enabled: qtimer?.chronoDisplayOptions?.colorThresholdsEnabled === true,
			chrono_threshold1: safeNumber(qtimer?.chronoColorThresholds?.threshold1),
			chrono_threshold1_color: qtimer?.chronoColorThresholds?.color1 ?? '',
			chrono_threshold2: safeNumber(qtimer?.chronoColorThresholds?.threshold2),
			chrono_threshold2_color: qtimer?.chronoColorThresholds?.color2 ?? '',
			chrono_hours: chronoParts.hoursText,
			chrono_minutes: chronoParts.minutesText,
			chrono_seconds_component: chronoParts.secondsText,
			red_alert_active: qtimer?.redAlert?.isActive === true,
			red_alert_color: qtimer?.redAlert?.color ?? '',
			audio_enabled: audioSettings?.enabled === true,
			audio_master_volume_percent: Math.round(safeNumber(audioSettings?.masterVolume) * 100),
			audio_stop_current_on_play: audioSettings?.stopCurrentOnPlay !== false,
			audio_rule_count: audioRules.length,
			audio_enabled_rule_count: audioRules.filter((rule) => rule.enabled === true).length,
			playlist_running: playlist?.isRunning === true,
			playlist_intermission: playlist?.intermissionMode === true,
			playlist_session_count: playlist?.sessions?.length ?? 0,
			playlist_enabled_session_count: countEnabledSessions(playlist),
			playlist_current_session_index: safeNumber(playlist?.currentSessionIndex, -1),
			playlist_current_session_name: currentSession?.name ?? '',
			playlist_current_session_mode: currentSession?.mode ?? '',
			playlist_current_session_enabled: currentSession?.isEnabled !== false,
			playlist_chrono_seconds: playlistChronoSeconds,
			playlist_chrono_formatted: formatDuration(playlistChronoSeconds, true),
			playlist_chrono_hours: playlistChronoParts.hoursText,
			playlist_chrono_minutes: playlistChronoParts.minutesText,
			playlist_chrono_seconds_component: playlistChronoParts.secondsText,
		})
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
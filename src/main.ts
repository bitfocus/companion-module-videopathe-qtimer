import { InstanceBase, InstanceStatus, type SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import WebSocket, { type RawData } from 'ws'
import { AUTH_COOKIE_NAME, HttpStatusError, authenticateWithPin, buildBaseUrl, fetchJson } from './api.js'
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
	getNextEnabledPlaylistSession,
	getOutputLayoutPresetIndex,
	getOutputLayoutPresetName,
	getPlaylistEndAction,
	getScreen2Mode,
	inferDisplayMode,
	inferLayoutMode,
	isChronoColorThresholdsEnabled,
	isClock12HourFormat,
	isScreen2FollowingMain,
	parseClockParts,
	parseTimerPresetDuration,
	type QTimerAudioSettingsResponse,
	type QTimerAudioSound,
	type QTimerNdiStatus,
	type QTimerOmtStatus,
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
	ndi?: QTimerNdiStatus
	omt?: QTimerOmtStatus
}

export interface DynamicChoice {
	id: string
	label: string
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
	private fetchAbortController = new AbortController()
	private websocket: WebSocket | undefined
	private websocketReconnectTimer: NodeJS.Timeout | undefined
	private websocketConnected = false
	private dynamicDefinitionSignature = ''
	private authCookie = ''
	private authInFlight: Promise<boolean> | undefined
	private authFailed = false

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
		this.fetchAbortController.abort()
		this.pollInFlight = false
		this.stopPolling()
		this.disconnectWebSocket(false)
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.fetchAbortController.abort()
		this.fetchAbortController = new AbortController()
		this.pollInFlight = false
		this.config = config
		this.resetAuthentication()
		this.runtimeState = {
			connected: false,
			lastError: null,
			serverUrl: '',
			lastUpdated: null,
		}
		this.updateVariablesFromState()
		this.checkFeedbacks()
		this.refreshDynamicDefinitions()
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

	/** Audio trigger rules, labelled `event -> sound` because QTimer rules carry no name. */
	getAudioRuleChoices(): DynamicChoice[] {
		const sounds = new Map(this.getAvailableAudioSounds().map((sound) => [sound.id, sound.label]))

		return (this.runtimeState.qtimer?.audioSettings?.triggerRules ?? [])
			.filter((rule) => typeof rule.id === 'string' && rule.id.trim().length > 0)
			.map((rule, index) => {
				const id = String(rule.id).trim()
				const explicitLabel = (rule.label ?? rule.name ?? '').trim()
				if (explicitLabel) {
					return { id, label: explicitLabel }
				}

				const event = (rule as { event?: string }).event ?? `rule ${index + 1}`
				const soundLabel = rule.soundId ? (sounds.get(rule.soundId) ?? rule.soundId) : ''
				return { id, label: soundLabel ? `${event} -> ${soundLabel}` : String(event) }
			})
	}

	/** Timer presets exposed by QTimer, keyed by their index (the API only accepts indexes). */
	getTimerPresetChoices(): DynamicChoice[] {
		const presets = this.runtimeState.qtimer?.presets
		const labels = Array.isArray(presets) && presets.length > 0 ? presets : []

		if (labels.length === 0) {
			return Array.from({ length: 15 }, (_unused, index) => ({
				id: String(index),
				label: `Preset ${index + 1}`,
			}))
		}

		return labels.map((preset, index) => ({
			id: String(index),
			label: `${index + 1}. ${formatDuration(parseTimerPresetDuration(preset), true)}`,
		}))
	}

	getPresetMessageChoices(): DynamicChoice[] {
		return (this.runtimeState.qtimer?.presetMessages ?? [])
			.filter((message) => typeof message === 'string' && message.trim().length > 0)
			.map((message) => ({ id: message, label: message }))
	}

	getPlaylistSessionChoices(): DynamicChoice[] {
		return (this.runtimeState.playlist?.sessions ?? []).map((session, index) => ({
			id: String(index),
			label: `${index + 1}. ${session?.name?.trim() || 'Untitled session'}`,
		}))
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	private hasValidConfig(): boolean {
		return !!this.config?.host?.trim() && safeNumber(this.config?.port) > 0
	}

	private get apiPin(): string {
		return String(this.config?.apiPin ?? '').trim()
	}

	private resetAuthentication(): void {
		this.authCookie = ''
		this.authInFlight = undefined
		this.authFailed = false
	}

	/** Adds the QTimer session cookie to a request once the PIN has been exchanged for one. */
	private withAuth(init: RequestInit = {}): RequestInit {
		if (!this.authCookie) {
			return init
		}

		return {
			...init,
			headers: {
				...(init.headers ?? {}),
				cookie: `${AUTH_COOKIE_NAME}=${this.authCookie}`,
			},
		}
	}

	/**
	 * Exchanges the configured PIN for a session cookie. Concurrent callers share one request,
	 * so a poll that fires five parallel 401s only triggers a single authentication.
	 */
	private async authenticate(): Promise<boolean> {
		const pin = this.apiPin
		if (!pin) {
			return false
		}

		this.authInFlight ??= (async () => {
			try {
				const cookie = await authenticateWithPin(this.getBaseUrl(), pin)
				if (!cookie) {
					// QTimer accepted the call but issued no cookie, which means no PIN is set on it.
					this.log('debug', 'QTimer did not issue a session cookie; PIN protection appears to be off')
					this.authFailed = false
					return false
				}

				this.authCookie = cookie
				this.authFailed = false
				this.log('info', 'Authenticated against QTimer with the configured PIN')
				return true
			} catch (error) {
				this.authCookie = ''
				this.authFailed = true
				this.log('error', `PIN authentication failed: ${this.formatError(error)}`)
				return false
			} finally {
				this.authInFlight = undefined
			}
		})()

		return this.authInFlight
	}

	/**
	 * Performs a request, and on a 401 from QTimer's PIN middleware authenticates once and retries.
	 * The cookie QTimer issues lives 12 hours, so this is also what silently renews an expired one.
	 */
	private async apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
		const url = `${this.getBaseUrl()}${path}`

		try {
			return await fetchJson<T>(url, this.withAuth(init))
		} catch (error) {
			if (!(error instanceof HttpStatusError) || error.status !== 401) {
				throw error
			}

			if (!this.apiPin) {
				throw new Error(
					'QTimer requires a PIN for its API ("Protection API par PIN" is enabled). Set the API PIN in this connection config.',
				)
			}

			if (!(await this.authenticate())) {
				throw new Error('QTimer rejected the configured API PIN')
			}

			return await fetchJson<T>(url, this.withAuth(init))
		}
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
			this.updateStatus(InstanceStatus.Connecting)
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
		// QTimer's PIN middleware is Express-only and never sees the upgrade request, so the socket
		// stays reachable without a PIN. The cookie is sent anyway when we hold one, so the module
		// keeps working if QTimer ever starts guarding the upgrade too.
		const websocket = new WebSocket(wsUrl, {
			handshakeTimeout: 10000,
			headers: this.authCookie ? { cookie: `${AUTH_COOKIE_NAME}=${this.authCookie}` } : undefined,
		})
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

			this.handleWebSocketMessage(this.decodeWebSocketMessage(data))
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

			const message = this.formatError(error)
			this.log('error', `WebSocket error: ${message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, message)
		})
	}

	private handleWebSocketMessage(message: string): void {
		try {
			const payload = JSON.parse(message) as { type?: string; data?: unknown }

			if (
				payload.type !== 'state' ||
				typeof payload.data !== 'object' ||
				payload.data === null ||
				Array.isArray(payload.data)
			) {
				return
			}

			this.runtimeState = {
				...this.runtimeState,
				connected: true,
				lastError: null,
				serverUrl: this.runtimeState.serverUrl || this.getBaseUrl(),
				lastUpdated: new Date().toISOString(),
				qtimer: payload.data,
			}

			this.updateStatus(InstanceStatus.Ok)
			this.updateVariablesFromState()
			this.checkFeedbacks()
			this.refreshDynamicDefinitions()
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
		const requestController = this.fetchAbortController
		const signal = requestController.signal

		try {
			const baseUrl = this.getBaseUrl()
			const pollStreams = this.config.pollStreams !== false
			const optional = async <T>(path: string, label: string): Promise<T | undefined> =>
				this.apiFetch<T>(path, { signal }).catch((error) => {
					if (signal.aborted && error instanceof Error && error.name === 'AbortError') {
						return undefined
					}

					this.log('debug', `${label} refresh failed: ${this.formatError(error)}`)
					return undefined
				})

			const [statusResponse, playlistResponse, audioResponse, ndiResponse, omtResponse] = await Promise.all([
				this.apiFetch<QTimerStatusResponse>('/api/status', { signal }),
				optional<QTimerPlaylistStateResponse>('/api/playlist/state', 'Playlist'),
				optional<QTimerAudioSettingsResponse>('/api/audio/settings', 'Audio'),
				pollStreams ? optional<QTimerNdiStatus>('/api/ndi/status', 'NDI') : Promise.resolve(undefined),
				pollStreams ? optional<QTimerOmtStatus>('/api/omt/status', 'OMT') : Promise.resolve(undefined),
			])

			if (requestController !== this.fetchAbortController || signal.aborted) {
				return
			}

			const audioSettings = audioResponse?.audioSettings ?? statusResponse.state?.audioSettings
			const audioSounds =
				audioResponse !== undefined ? this.normalizeAudioSounds(audioResponse) : (this.runtimeState.audioSounds ?? [])

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
				ndi: pollStreams ? (ndiResponse ?? this.runtimeState.ndi) : undefined,
				omt: pollStreams ? (omtResponse ?? this.runtimeState.omt) : undefined,
			}

			this.updateStatus(InstanceStatus.Ok)
			this.updateVariablesFromState()
			this.checkFeedbacks()
			this.refreshDynamicDefinitions()
		} catch (error) {
			if (requestController !== this.fetchAbortController || requestController.signal.aborted) {
				return
			}

			this.runtimeState = {
				...this.runtimeState,
				connected: false,
				lastError: this.formatError(error),
				serverUrl: this.getBaseUrl(),
			}

			this.updateStatus(
				this.isAuthError(error) ? InstanceStatus.AuthenticationFailure : InstanceStatus.ConnectionFailure,
				this.runtimeState.lastError ?? undefined,
			)
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

		try {
			const init: RequestInit = { method: 'POST' }
			if (body !== undefined) {
				init.body = JSON.stringify(body)
			}

			await this.apiFetch<unknown>(path, init)
			void this.refreshAllState()
		} catch (error) {
			const message = this.formatError(error)
			this.runtimeState = {
				...this.runtimeState,
				connected: false,
				lastError: message,
			}
			this.updateStatus(
				this.isAuthError(error) ? InstanceStatus.AuthenticationFailure : InstanceStatus.ConnectionFailure,
			)
			this.updateVariablesFromState()
			this.checkFeedbacks()
			throw error
		}
	}

	private isAuthError(error: unknown): boolean {
		if (error instanceof HttpStatusError) {
			return error.status === 401 || error.status === 403
		}

		return this.authFailed
	}

	private formatError(error: unknown): string {
		if (error instanceof Error) {
			return error.message
		}
		return String(error)
	}

	private decodeWebSocketMessage(data: RawData): string {
		if (typeof data === 'string') {
			return data
		}

		if (Array.isArray(data)) {
			return Buffer.concat(data.map((chunk) => this.toBuffer(chunk))).toString('utf8')
		}

		return this.toBuffer(data).toString('utf8')
	}

	private toBuffer(data: ArrayBuffer | Buffer | ArrayBufferView): Buffer {
		if (Buffer.isBuffer(data)) {
			return data
		}

		if (ArrayBuffer.isView(data)) {
			return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
		}

		return Buffer.from(new Uint8Array(data))
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
			const id = typeof rawSound?.id === 'string' ? rawSound.id.trim() : ''
			if (!id || dedupedSounds.has(id)) {
				continue
			}

			const sourceType =
				rawSound?.sourceType === 'builtin' ||
				rawSound?.sourceType === 'custom' ||
				rawSound?.sourceType === 'default-file'
					? rawSound.sourceType
					: undefined

			const defaultLabelSource =
				typeof rawSound?.label === 'string'
					? rawSound.label
					: typeof rawSound?.fileName === 'string'
						? rawSound.fileName
						: id
			const defaultLabel = defaultLabelSource.trim() || id
			const overrideLabel = typeof soundLabelOverrides[id] === 'string' ? soundLabelOverrides[id].trim() : ''
			dedupedSounds.set(id, {
				id,
				label: overrideLabel || defaultLabel,
				src: typeof rawSound?.src === 'string' ? rawSound.src : undefined,
				sourceType,
				mimeType: typeof rawSound?.mimeType === 'string' ? rawSound.mimeType : undefined,
				fileName: typeof rawSound?.fileName === 'string' ? rawSound.fileName : undefined,
			})
		}

		return Array.from(dedupedSounds.values()).sort((left, right) =>
			left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
		)
	}

	/**
	 * Actions and presets embed live QTimer lists (sounds, audio rules, timer presets,
	 * preset messages, playlist sessions). Rebuild them only when one of those lists
	 * actually changed, so a 1 Hz poll does not churn the whole definition set.
	 */
	private refreshDynamicDefinitions(): void {
		const signature = [
			(this.runtimeState.audioSounds ?? []).map((sound) => `${sound.id}:${sound.label}`).join('|'),
			this.getAudioRuleChoices()
				.map((choice) => `${choice.id}:${choice.label}`)
				.join('|'),
			(this.runtimeState.qtimer?.presets ?? []).join('|'),
			(this.runtimeState.qtimer?.presetMessages ?? []).join('|'),
			(this.runtimeState.playlist?.sessions ?? []).map((session) => session?.name ?? '').join('|'),
		].join('||')

		if (signature === this.dynamicDefinitionSignature) {
			return
		}

		this.dynamicDefinitionSignature = signature
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
	}

	/** "Main layout", "#3", or "#3 - <preset name>" depending on what QTimer reports. */
	private formatOutputLayout(role: 'extended' | 'extended2' | 'network'): string {
		const presetIndex = getOutputLayoutPresetIndex(this.runtimeState.qtimer, role)
		if (presetIndex < 0) {
			return 'Main layout'
		}

		const name = getOutputLayoutPresetName(this.runtimeState.qtimer, role)
		return name ? `#${presetIndex + 1} - ${name}` : `#${presetIndex + 1}`
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
		const playlistChronoSeconds =
			playlistChronoStartTime > 0 && (playlist?.isRunning === true || playlist?.intermissionMode === true)
				? Math.max(storedPlaylistChronoSeconds, Math.floor((Date.now() - playlistChronoStartTime) / 1000))
				: storedPlaylistChronoSeconds
		const showHours = qtimer?.timerDisplayOptions?.showHours !== false
		const chronoShowHours = qtimer?.chronoDisplayOptions?.showHours !== false
		const displayMode = inferDisplayMode(qtimer)
		const displayTime = getActiveDisplayTimeState(qtimer)
		const ndi = this.runtimeState.ndi
		const omt = this.runtimeState.omt
		const nextSession = getNextEnabledPlaylistSession(playlist)
		const intermissionRemaining = safeNumber(playlist?.intersessionTimeRemaining)
		const timerParts = splitDurationParts(remaining)
		const durationParts = splitDurationParts(duration)
		const elapsedParts = splitDurationParts(elapsed)
		const chronoParts = splitDurationParts(chronoSeconds)
		const additionalTimeParts = splitDurationParts(additionalTimeSeconds)
		const playlistChronoParts = splitDurationParts(playlistChronoSeconds)
		const clockParts = parseClockParts(qtimer?.currentTime)

		this.setVariableValues({
			connection_status: this.runtimeState.connected
				? 'ok'
				: this.runtimeState.lastError
					? 'connection_failure'
					: 'disconnected',
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
			chrono_color_thresholds_enabled: isChronoColorThresholdsEnabled(qtimer),
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
			playlist_next_session_name: nextSession?.name ?? '',
			playlist_next_session_index: safeNumber(nextSession?.index, -1),
			playlist_end_action: getPlaylistEndAction(playlist),
			playlist_auto_mode: playlist?.autoModeChangeMode ?? '',
			playlist_auto_intermission: playlist?.autoIntermissionEnabled === true,
			playlist_intermission_duration: safeNumber(playlist?.intermissionDuration),
			playlist_intermission_remaining: intermissionRemaining,
			playlist_intermission_remaining_formatted: formatDuration(intermissionRemaining, false),
			playlist_default_session_duration: safeNumber(playlist?.defaultSessionDuration),
			playlist_default_additional_time: safeNumber(playlist?.defaultAdditionalTimeValue),
			playlist_session_log_count: playlist?.sessionLog?.length ?? 0,
			message_visible: qtimer?.messageVisible === true,
			intermission_active: qtimer?.intermissionActive === true,
			layout_mode: inferLayoutMode(qtimer) ?? 'none',
			clock_12h_format: isClock12HourFormat(qtimer),
			screen2_follow_main: isScreen2FollowingMain(qtimer),
			screen2_mode: getScreen2Mode(qtimer),
			screen2_independent_mode: qtimer?.screen2?.mode ?? '',
			output_layout_extended: this.formatOutputLayout('extended'),
			output_layout_extended2: this.formatOutputLayout('extended2'),
			output_layout_network: this.formatOutputLayout('network'),
			timer_preset_count: qtimer?.presets?.length ?? 0,
			preset_message_count: qtimer?.presetMessages?.length ?? 0,
			ndi_available: ndi?.ndiRuntimeAvailable === true,
			ndi_running: ndi?.running === true,
			ndi_test_pattern: ndi?.testPatternActive === true,
			ndi_source_name: ndi?.sourceName ?? '',
			ndi_resolution: ndi?.width && ndi?.height ? `${ndi.width}x${ndi.height}` : '',
			ndi_frame_rate: safeNumber(ndi?.actualFrameRate, safeNumber(ndi?.frameRate)),
			omt_available: omt?.runtimeAvailable === true || omt?.available === true,
			omt_running: omt?.running === true,
			omt_test_pattern: omt?.testPatternActive === true,
			omt_source_name: omt?.sourceName ?? '',
			omt_resolution: omt?.width && omt?.height ? `${omt.width}x${omt.height}` : '',
			omt_frame_rate: safeNumber(omt?.frameRate),
		})
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)

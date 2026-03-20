export const DISPLAY_MODE_CHOICES = [
	{ id: 'timer', label: 'Timer' },
	{ id: 'clock', label: 'Clock' },
	{ id: 'chrono', label: 'Chrono' },
	{ id: 'logo', label: 'Logo' },
	{ id: 'black', label: 'Black' },
	{ id: 'mire', label: 'Mire' },
] as const

export const TOGGLE_CHOICES = [
	{ id: 'toggle', label: 'Toggle' },
	{ id: 'on', label: 'Force on' },
	{ id: 'off', label: 'Force off' },
] as const

export const MODE_CHOICES_SECONDS_PERCENT = [
	{ id: 'seconds', label: 'Seconds' },
	{ id: 'percent', label: 'Percent' },
] as const

export const SESSION_MATCH_CHOICES = [
	{ id: 'exact', label: 'Exact match' },
	{ id: 'contains', label: 'Contains' },
] as const

export const COMPARISON_CHOICES = [
	{ id: 'lt', label: '<' },
	{ id: 'lte', label: '<=' },
	{ id: 'eq', label: '=' },
	{ id: 'gte', label: '>=' },
	{ id: 'gt', label: '>' },
] as const

export const END_ACTION_CHOICES = [
	{ id: 'disabled', label: 'Disabled' },
	{ id: 'stop-playlist', label: 'Stop playlist' },
	{ id: 'intermission', label: 'Intermission' },
	{ id: 'auto-mode', label: 'Auto mode change' },
] as const

export const PLAYLIST_AUTO_MODE_CHOICES = [
	{ id: 'clock', label: 'Clock' },
	{ id: 'logo', label: 'Logo' },
	{ id: 'black', label: 'Black' },
] as const

export const CHRONO_THRESHOLD_CHOICES = [
	{ id: 'threshold1', label: 'Threshold 1' },
	{ id: 'threshold2', label: 'Threshold 2' },
] as const

export const CHRONO_COLOR_CHOICES = [
	{ id: 'color1', label: 'Color 1' },
	{ id: 'color2', label: 'Color 2' },
] as const

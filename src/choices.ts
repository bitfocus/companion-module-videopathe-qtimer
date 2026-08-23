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

export const LAYOUT_MODE_CHOICES = [
	{ id: 'timer', label: 'Timer' },
	{ id: 'clock', label: 'Clock' },
	{ id: 'chrono', label: 'Chrono' },
	{ id: 'logo', label: 'Logo' },
] as const

export const LAYOUT_TARGET_CHOICES = [
	{ id: 'main', label: 'Main screen (+ extended & Key/Cut)' },
	{ id: 'extended2', label: 'Second extended screen' },
	{ id: 'network', label: 'Network stream (NDI / OMT)' },
] as const

export const OUTPUT_ROLE_CHOICES = [
	{ id: 'extended', label: 'Extended screen (+ Key/Cut)' },
	{ id: 'extended2', label: 'Second extended screen' },
	{ id: 'network', label: 'Network stream (NDI / OMT)' },
] as const

export const DISPLAY_ELEMENT_CHOICES = [
	{ id: 'timer', label: 'Timer' },
	{ id: 'progressBar', label: 'Progress bar' },
	{ id: 'message', label: 'Message' },
	{ id: 'clock', label: 'Clock (timer layout)' },
	{ id: 'clock2', label: 'Clock (full screen)' },
	{ id: 'chrono', label: 'Chrono' },
	{ id: 'additionalTime', label: 'Additional time' },
	{ id: 'logo', label: 'Logo (timer layout)' },
	{ id: 'logoFull', label: 'Logo (full screen)' },
	{ id: 'blackMode', label: 'Black' },
	{ id: 'testPattern', label: 'Test pattern' },
] as const

export const COLORED_DISPLAY_ELEMENT_CHOICES = [
	{ id: 'timer', label: 'Timer' },
	{ id: 'message', label: 'Message' },
	{ id: 'clock', label: 'Clock (timer layout)' },
	{ id: 'clock2', label: 'Clock (full screen)' },
	{ id: 'chrono', label: 'Chrono' },
	{ id: 'additionalTime', label: 'Additional time' },
] as const

export const OPERATOR_VIEW_CHOICES = [
	{ id: 'operator', label: 'Operator' },
	{ id: 'multiview', label: 'Multiview' },
	{ id: 'presenter', label: 'Presenter' },
	{ id: 'showcaller', label: 'Show caller' },
	{ id: 'mobile', label: 'Mobile' },
] as const

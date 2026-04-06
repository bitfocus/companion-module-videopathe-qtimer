import type { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	pollInterval: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'QTimer API',
			value: 'Point this module to the QTimer web server, usually available on port 2222.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'QTimer host',
			width: 8,
			default: '127.0.0.1',
		},
		{
			type: 'number',
			id: 'port',
			label: 'QTimer port',
			width: 4,
			default: 2222,
			min: 1,
			max: 65535,
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Poll interval (ms)',
			width: 4,
			default: 1000,
			min: 250,
			max: 10000,
		},
	]
}

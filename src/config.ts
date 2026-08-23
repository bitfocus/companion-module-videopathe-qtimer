import type { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	pollInterval: number
	pollStreams: boolean
	apiPin: string
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
		{
			type: 'secret-text',
			id: 'apiPin',
			label: 'API PIN',
			width: 4,
			default: '',
			regex: '/^([0-9]{4,8})?$/',
			tooltip:
				'Only needed when QTimer has both a PIN and its "Protection API par PIN" option enabled, and Companion runs on another machine. QTimer never asks a PIN of requests coming from its own machine, so leave this blank for a local 127.0.0.1 connection.',
		},
		{
			type: 'checkbox',
			id: 'pollStreams',
			label: 'Poll NDI / OMT stream status',
			width: 4,
			default: true,
		},
	]
}

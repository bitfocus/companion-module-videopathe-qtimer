export function buildBaseUrl(host: string, port: number): string {
	const normalizedHost = String(host || '').trim()
	return `http://${normalizedHost}:${port}`
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(init?.headers ?? {}),
		},
	})

	if (!response.ok) {
		const bodyText = await response.text()
		throw new Error(`HTTP ${response.status} ${response.statusText}${bodyText ? `: ${bodyText}` : ''}`)
	}

	return (await response.json()) as T
}

export async function postJson<T>(url: string, body?: unknown): Promise<T> {
	const init: RequestInit = {
		method: 'POST',
	}

	if (body !== undefined) {
		init.body = JSON.stringify(body)
	}

	return fetchJson<T>(url, init)
}

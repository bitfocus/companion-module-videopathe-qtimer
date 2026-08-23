/** Thrown for any non-2xx response, so callers can react to a 401 from QTimer's PIN middleware. */
export class HttpStatusError extends Error {
	readonly status: number

	constructor(status: number, statusText: string, body: string) {
		super(`HTTP ${status} ${statusText}${body ? `: ${body}` : ''}`)
		this.name = 'HttpStatusError'
		this.status = status
	}
}

export const AUTH_COOKIE_NAME = 'qtimer_auth'

export function buildBaseUrl(host: string, port: number): string {
	const normalizedHost = String(host || '').trim()
	return `http://${normalizedHost}:${port}`
}

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 10_000): Promise<T> {
	const controller = new AbortController()
	const abortSignal = init?.signal
	const onAbort = (): void => {
		controller.abort()
	}

	if (abortSignal) {
		if (abortSignal.aborted) {
			controller.abort()
		} else {
			abortSignal.addEventListener('abort', onAbort, { once: true })
		}
	}

	const timer = setTimeout(() => {
		controller.abort()
	}, timeoutMs)

	try {
		const response = await fetch(url, {
			...init,
			signal: controller.signal,
			headers: {
				'Content-Type': 'application/json',
				...(init?.headers ?? {}),
			},
		})

		if (!response.ok) {
			const bodyText = await response.text()
			throw new HttpStatusError(response.status, response.statusText, bodyText)
		}

		return (await response.json()) as T
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError' && !abortSignal?.aborted) {
			throw new Error(`Request timed out after ${timeoutMs}ms`)
		}

		throw error
	} finally {
		clearTimeout(timer)
		abortSignal?.removeEventListener('abort', onAbort)
	}
}

/**
 * Exchanges a PIN for QTimer's `qtimer_auth` session cookie.
 *
 * QTimer's PIN middleware exempts loopback requests entirely, and exempts the whole REST API
 * unless its "Protection API par PIN" option is on, so this is only needed for a remote
 * Companion talking to a QTimer that has both the PIN and that option enabled. The endpoint
 * itself is always exempt, and answers `{ success: true }` with no cookie when no PIN is set.
 *
 * Returns the cookie value, or undefined when the server did not hand one out.
 */
export async function authenticateWithPin(baseUrl: string, pin: string, timeoutMs = 10_000): Promise<string> {
	const controller = new AbortController()
	const timer = setTimeout(() => {
		controller.abort()
	}, timeoutMs)

	try {
		const response = await fetch(`${baseUrl}/api/auth/pin`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ pin }),
			signal: controller.signal,
		})

		if (!response.ok) {
			const bodyText = await response.text()
			throw new HttpStatusError(response.status, response.statusText, bodyText)
		}

		return extractAuthCookie(response.headers)
	} finally {
		clearTimeout(timer)
	}
}

function extractAuthCookie(headers: Headers): string {
	const raw: string[] =
		typeof headers.getSetCookie === 'function'
			? headers.getSetCookie()
			: [headers.get('set-cookie')].filter((value): value is string => typeof value === 'string')

	for (const entry of raw) {
		// Only the first pair of a Set-Cookie value is the cookie itself; the rest are attributes.
		const [pair] = entry.split(';')
		const separator = pair.indexOf('=')
		if (separator > 0 && pair.slice(0, separator).trim() === AUTH_COOKIE_NAME) {
			const value = pair.slice(separator + 1).trim()
			if (value) {
				return value
			}
		}
	}

	return ''
}

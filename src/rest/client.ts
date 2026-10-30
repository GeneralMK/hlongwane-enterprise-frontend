import { API_HOST } from "../utils/contants"


export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  token?: string | null
  body?: unknown
  signal?: AbortSignal
}

type ErrorResponse = {
  success?: boolean
  message?: string
  error?: {
    code?: string
    message?: string
  }
}

export async function request<T>(
  path: string,
  {
    method = 'GET',
    token,
    body,
    signal
  }: RequestOptions = {}
): Promise<T> {
  const headers = new Headers({
    Accept: 'application/json'
  })

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let requestBody: BodyInit | undefined

  if (body instanceof FormData) {
    requestBody = body
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  const response = await fetch(`${API_HOST}/api/v1${path}`, {
    method,
    headers,
    body: requestBody,
    signal
  })

  const text = await response.text()

  let parsed: unknown

  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      if (response.ok) {
        throw new ApiError(
          'The server returned an invalid JSON response.',
          response.status
        )
      }
    }
  }

  const errorBody = parsed as ErrorResponse | undefined

  if (!response.ok || errorBody?.success === false) {
    throw new ApiError(
      errorBody?.error?.message ??
        errorBody?.message ??
        `Request failed (${response.status})`,
      response.status,
      errorBody?.error?.code
    )
  }

  return parsed as T
}

export function requireToken(
  token?: string | null
): string {
  if (!token) {
    throw new ApiError('Authentication required.', 401)
  }

  return token
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected error occurred.'
}

export function queryString(
  values: Record<string, string | number | undefined>
): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }

  const result = params.toString()

  return result ? `?${result}` : ''
}
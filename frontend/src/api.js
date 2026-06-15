// Общий файл для запросов к серверу.
// apiRequest добавляет токен пользователя, выставляет JSON-заголовок
// и приводит ошибки backend к одному удобному виду.

const API_URL = '/api'
const TOKEN_KEY = 'petToken'

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function prepareHeaders(options) {
  const headers = new Headers(options.headers || {})
  const isFormData = options.body instanceof FormData

  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

function getErrorFromResponse(data, status) {
  const error = data?.error

  return new ApiError(
    error?.message || 'Не удалось выполнить запрос',
    status,
    error?.errors || error?.error || data,
  )
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: prepareHeaders(options),
  })

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw getErrorFromResponse(data, response.status)
  }

  return data
}

export function getErrorMessage(error) {
  if (!error?.details) {
    return error?.message || 'Произошла ошибка'
  }

  if (typeof error.details === 'string') {
    return error.details
  }

  const firstError = Object.values(error.details)[0]

  if (Array.isArray(firstError)) {
    return firstError[0]
  }

  return String(firstError || error.message)
}
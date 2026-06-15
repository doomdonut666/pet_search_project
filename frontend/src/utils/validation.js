// общий файл для валидации данных из форм

// Регулярки для проверки данных из форм
const NAME_PATTERN = /^[А-Яа-яЁё -]+$/u
const PHONE_PATTERN = /^\+7\d{10}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEGRAM_PATTERN = /^@[A-Za-z0-9_]{5,32}$/

export function normalizePhone(value) {
  const digits = value.replace(/\D/g, '')

  // Если пользователь ввёл номер через 8, заменяем на +7
  if (digits.startsWith('8')) {
    return `+7${digits.slice(1)}`
  }

  // Если пользователь ввёл 79991234567
  if (digits.startsWith('7')) {
    return `+${digits}`
  }

  // Если пользователь ввёл просто 9991234567
  return `+7${digits}`
}

export function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

export function normalizeTelegram(value) {
  const username = value
    .trim()
    .replace(/^https?:\/\/t\.me\//, '')
    .replace(/^t\.me\//, '')
    .replace(/^@/, '')

  return username ? `@${username}` : ''
}

export function isValidName(value) {
  return NAME_PATTERN.test(value.trim())
}

export function isValidPhone(value) {
  return PHONE_PATTERN.test(normalizePhone(value))
}

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(normalizeEmail(value))
}

export function isValidTelegram(value) {
  const telegram = normalizeTelegram(value)

  // Telegram необязательный, поэтому пустое значение пропускаем
  return !telegram || TELEGRAM_PATTERN.test(telegram)
}

export function isStrongPassword(value) {
  return (
    value.length >= 7
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
  )
}
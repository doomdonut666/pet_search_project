// регистрации пользователя 
// выполняется на странице /register, которая доступна только неавторизованным пользователям

import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { apiRequest, getErrorMessage } from '../api'
import Notice from '../components/Notice'
import { useAuth } from '../context/AuthContext'
import {
  isStrongPassword,
  isValidEmail,
  isValidName,
  isValidPhone,
  isValidTelegram,
  normalizeEmail,
  normalizePhone,
  normalizeTelegram,
} from '../utils/validation'

const initialForm = {
  name: '',
  phone: '',
  telegram: '',
  email: '',
  password: '',
  password_confirmation: '',
  confirm: false,
}

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const { user } = useAuth()
  const navigate = useNavigate()

  // Если пользователь уже вошёл, регистрация ему не нужна
  if (user) {
    return <Navigate to="/profile" replace />
  }

  function updateFormField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }
  // функция проверки формы регистрации
  function validateForm(name, phone, email, telegram) {
    if (!isValidName(name)) {
      setMessage({
        type: 'error',
        text: 'Имя можно вводить кириллицей, с пробелами и дефисом.',
      })
      return false
    }

    if (!isValidPhone(phone)) {
      setMessage({
        type: 'error',
        text: 'Введите российский номер телефона, например +79991234567.',
      })
      return false
    }

    if (!isValidEmail(email)) {
      setMessage({
        type: 'error',
        text: 'Введите корректный адрес электронной почты.',
      })
      return false
    }

    if (!isValidTelegram(telegram)) {
      setMessage({
        type: 'error',
        text: 'Telegram укажите в формате: @username.',
      })
      return false
    }

    if (!isStrongPassword(form.password)) {
      setMessage({
        type: 'error',
        text: 'Пароль: минимум 7 символов, одна заглавная и строчная латинская буква и одна цифра.',
      })
      return false
    }

    if (form.password !== form.password_confirmation) {
      setMessage({ type: 'error', text: 'Пароли не совпадают.' })
      return false
    }

    if (!form.confirm) {
      setMessage({
        type: 'error',
        text: 'Подтвердите согласие на обработку персональных данных.',
      })
      return false
    }

    return true
  }

  function createRequestBody(name, phone, email, telegram) {
    return {
      ...form,
      name,
      phone,
      email,
      telegram,
      confirm: 1,
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault()
    setMessage(null)

    const name = form.name.trim()
    const phone = normalizePhone(form.phone)
    const email = normalizeEmail(form.email)
    const telegram = normalizeTelegram(form.telegram)

    // Сначала проверяем данные на фронте, чтобы не отправлять заведомо неправильную форму
    if (!validateForm(name, phone, email, telegram)) {
      return
    }

    setSubmitting(true)

    try {
      await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify(createRequestBody(name, phone, email, telegram)),
      })

      // После регистрации отправляем пользователя на страницу входа
      navigate('/login', {
        replace: true,
        state: { registered: true },
      })
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page auth-page-register">
      <div className="auth-card auth-card-wide">
        <h1>Создание аккаунта</h1>

        {message && <Notice type={message.type}>{message.text}</Notice>}

        <form className="form-grid" noValidate onSubmit={handleFormSubmit}>
          <label className="field-wide">
            <span>Имя</span>
            <input
              required
              value={form.name}
              onChange={(event) => updateFormField('name', event.target.value)}
              placeholder="Антон"
            />
          </label>

          <label>
            <span>Телефон</span>
            <input
              inputMode="tel"
              required
              value={form.phone}
              onChange={(event) => updateFormField('phone', event.target.value)}
              placeholder="+79991234567"
            />
          </label>

          <label>
            <span>Telegram</span>
            <input
              value={form.telegram}
              onChange={(event) => updateFormField('telegram', event.target.value)}
              placeholder="@user (необязательно)"
            />
          </label>

          <label>
            <span>E-mail</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => updateFormField('email', event.target.value)}
              placeholder="mail@example.ru"
            />
          </label>

          <label>
            <span>Пароль</span>
            <input
              type="password"
              minLength="7"
              required
              value={form.password}
              onChange={(event) => updateFormField('password', event.target.value)}
              placeholder="Не менее 7 символов"
            />
          </label>

          <label>
            <span>Повторите пароль</span>
            <input
              type="password"
              required
              value={form.password_confirmation}
              onChange={(event) => updateFormField('password_confirmation', event.target.value)}
              placeholder="Повторите пароль"
            />
          </label>

          <label className="checkbox-field field-wide">
            <input
              type="checkbox"
              required
              checked={form.confirm}
              onChange={(event) => updateFormField('confirm', event.target.checked)}
            />
            <span>Я согласен на обработку персональных данных</span>
          </label>

          <button className="button button-full field-wide" disabled={submitting} type="submit">
            {submitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </section>
  )
}
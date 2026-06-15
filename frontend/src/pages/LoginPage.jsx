// Страница входа, если пользователь уже вошёл, его перенаправляет на профиль

import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import Notice from '../components/Notice'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { user, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Если пользователь уже вошёл, страницу входа ему показывать не нужно
  if (user) {
    return <Navigate to={user.isAdmin ? '/admin' : '/profile'} replace />
  }

  function updateField(field, value) {
    setForm({
      ...form,
      [field]: value,
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const profile = await login(form.email, form.password)

      // Если пользователя перекинуло на login с защищённой страницы,
      // после входа возвращаем его обратно
      const backUrl = location.state?.from?.pathname

      navigate(
        backUrl || (profile?.isAdmin ? '/admin' : '/profile'),
        { replace: true },
      )
    } catch {
      setError('Логин или пароль введены неверно')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Вход в личный кабинет</h1>

        {/* Сообщение после регистрации или создания объявления гостем */}
        {location.state?.registered && (
          <Notice type="success">
            {location.state.orderCreated
              ? 'Аккаунт создан, объявление отправлено на модерацию. Теперь войдите.'
              : 'Регистрация завершена. Теперь войдите в аккаунт.'}
          </Notice>
        )}

        {error && <Notice type="error">{error}</Notice>}

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            <span>Почта или логин</span>
            <input
              autoComplete="username"
              type="text"
              required
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="Введите e-mail или логин"
            />
          </label>

          <label>
            <span>Пароль</span>
            <input
              autoComplete="current-password"
              type="password"
              required
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Введите пароль"
            />
          </label>

          <button className="button button-full" disabled={submitting} type="submit">
            {submitting ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="auth-switch">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
      </div>
    </section>
  )
}
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function closeMenu() {
    setMenuOpen(false)
  }

  function toggleMenu() {
    setMenuOpen((currentValue) => !currentValue)
  }

  function handleLogout() {
    logout()
    closeMenu()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/" onClick={closeMenu}>
            <span className="brand-mark brand-mark-image">
              <img src="/assets/logo-header.png" alt="" />
            </span>
            <span>
              GETPET<span>BACK</span>
            </span>
          </Link>

          {/* Кнопка для мобильной версии, была кривая */}
          <button
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            className="menu-button"
            onClick={toggleMenu}
            type="button"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>

          <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
            <NavLink end to="/" onClick={closeMenu}>
              Главная
            </NavLink>
            <NavLink to="/search" onClick={closeMenu}>
              Найти питомца
            </NavLink>
            <NavLink to="/add-pet" onClick={closeMenu}>
              Добавить объявление
            </NavLink>

            <div className="nav-actions">
              {user ? (
                <>
                  {user.isAdmin && (
                    <NavLink to="/admin" onClick={closeMenu}>
                      Панель
                    </NavLink>
                  )}

                  <NavLink className="profile-link" to="/profile" onClick={closeMenu}>
                    <Icon name="user" size={19} />
                    {user.name}
                  </NavLink>

                  <button
                    className="icon-button"
                    onClick={handleLogout}
                    title="Выйти"
                    type="button"
                  >
                    <Icon name="logout" size={19} />
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" onClick={closeMenu}>
                    Войти
                  </NavLink>
                  <NavLink className="button button-small" to="/register" onClick={closeMenu}>
                    Регистрация
                  </NavLink>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Здесь отображается текущая страница из роутера */}
      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link className="brand brand-footer brand-footer-text" to="/">
              <span>
                GETPET<span>BACK</span>
              </span>
            </Link>
            <p>Помогаем пропавшим и найденным животным вернуться домой.</p>
          </div>

          <div>
            <h3>Навигация</h3>
            <Link to="/search">Поиск животных</Link>
            <Link to="/add-pet">Добавить объявление</Link>
            <Link to="/profile">Личный кабинет</Link>
          </div>
          {/* Нужно добавить тг */}
          <div>
            <h3>Контакты</h3>
            <a href="tel:+78005553535">8 800 555-35-35</a>
            <a href="mailto:help@getpetback.ru">help@getpetback.ru</a>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© 2026 GETPETBACK | Проект Hexlet</span>
        </div>
      </footer>
    </div>
  )
}

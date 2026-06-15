// Заглушка для 404

import { Link } from 'react-router-dom'

import Icon from '../components/Icon'

export default function NotFoundPage() {
  return (
    <section className="not-found-page">
      <div className="not-found-mark">
        <Icon name="search" size={72} />
      </div>

      <span>404</span>
      <h1>Такой страницы нет</h1>

      <p>
        Возможно, ссылка устарела или адрес введён с ошибкой.
      </p>

      <Link className="button" to="/">
        Вернуться на главную
      </Link>
    </section>
  )
}
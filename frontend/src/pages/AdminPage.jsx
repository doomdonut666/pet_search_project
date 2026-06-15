// Админ панель, где можно модерировать обьявления, менять статус и удалять их
// Нужно дорботать отклоение и удаления обьявлений, чтобы у пользвателей была причина отказа публикации
// А удаление обьявления не было безвозвратным, а переносило его в архив с указанием причины

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiRequest, getErrorMessage } from '../api'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import Notice from '../components/Notice'
import PageHero from '../components/PageHero'
import PetImage from '../components/PetImage'
import { loadWithDelay } from '../utils/loading'

const statusFilters = [
  ['onModeration', 'На модерации'],
  ['active', 'Активные'],
  ['wasFound', 'Хозяин найден'],
  ['archive', 'Отклонённые'],
  ['', 'Все'],
]

function getStatusLabel(status) {
  const currentStatus = statusFilters.find(([value]) => value === status)
  return currentStatus ? currentStatus[1] : status
}

function getStatusMessage(status) {
  if (status === 'active') {
    return 'Объявление опубликовано.'
  }

  if (status === 'wasFound') {
    return 'Объявление перенесено в истории возвращения домой.'
  }

  if (status === 'archive') {
    return 'Объявление отклонено.'
  }

  return 'Статус объявления изменён.'
}

function getOrderTitle(order) {
  if (order.report_type === 'lost') {
    return order.pet_name
  }

  return `найдено: ${order.kind}`
}

export default function AdminPage() {
  const [orders, setOrders] = useState([])
  const [counts, setCounts] = useState({})
  const [selectedStatus, setSelectedStatus] = useState('onModeration')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  async function loadOrders(status = selectedStatus) {
    setLoading(true)

    try {
      const query = status ? `?status=${status}` : ''
      const response = await loadWithDelay(
        apiRequest(`/admin/orders/${query}`),
      )

      setOrders(response.data.orders)
      setCounts(response.data.counts)
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(selectedStatus)
  }, [selectedStatus])

  async function changeStatus(id, status) {
    try {
      await apiRequest(`/admin/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      setMessage({
        type: 'success',
        text: getStatusMessage(status),
      })

      await loadOrders()
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    }
  }

  async function deleteOrder(order) {
    const orderTitle = getOrderTitle(order)

    if (!window.confirm(`Удалить объявление «${orderTitle}» без возможности восстановления?`)) {
      return
    }

    try {
      await apiRequest(`/admin/orders/${order.id}`, {
        method: 'DELETE',
      })

      setMessage({ type: 'success', text: 'Объявление удалено.' })
      await loadOrders()
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    }
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)

  return (
    <>
      <PageHero
        eyebrow="Админ-панель"
        title="Модерация объявлений"
        text="Проверка новых объявлений перед публикацией и управление существующими."
      />

      <section className="section admin-section">
        <div className="container">
          {message && <Notice type={message.type}>{message.text}</Notice>}

          <div className="admin-summary">
            <div>
              <span>Ожидают проверки</span>
              <strong>{counts.onModeration || 0}</strong>
            </div>

            <div>
              <span>Опубликовано</span>
              <strong>{counts.active || 0}</strong>
            </div>

            <div>
              <span>Всего объявлений</span>
              <strong>{total}</strong>
            </div>

            <Link className="button" to="/add-pet">
              <Icon name="plus" size={18} /> Добавить
            </Link>
          </div>

          {/* Фильтры по статусам объявлений */}
          <div className="admin-toolbar">
            {statusFilters.map(([status, label]) => (
              <button
                className={selectedStatus === status ? 'active' : ''}
                key={status || 'all'}
                onClick={() => setSelectedStatus(status)}
                type="button"
              >
                {label}
                {status && <span>{counts[status] || 0}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <Loader text="Загружаем объявления" />
          ) : orders.length ? (
            <div className="moderation-list">
              {orders.map((order) => {
                const isLost = order.report_type === 'lost'
                const telegramLink = order.telegram
                  ? `https://t.me/${order.telegram.replace('@', '')}`
                  : ''

                return (
                  <article className="moderation-card" key={order.id}>
                    <PetImage
                      className="moderation-photo"
                      src={order.photos?.[0]}
                      alt={isLost ? order.pet_name : order.kind}
                    />

                    <div className="moderation-content">
                      <div className="moderation-meta">
                        <span className={`pet-report pet-report-${order.report_type}`}>
                          {isLost ? 'Пропала' : 'Найдена'}
                        </span>

                        <span className={`status-badge status-${order.status}`}>
                          {getStatusLabel(order.status)}
                        </span>

                        <span>№{order.id}</span>
                        <span>{order.created_at}</span>
                      </div>

                      <h2>
                        {isLost ? order.pet_name : `Найдено: ${order.kind}`}
                      </h2>

                      <p>{order.description}</p>

                      {order.mark && (
                        <p>
                          <strong>Особая примета:</strong> {order.mark}
                        </p>
                      )}

                      <div className="moderation-details">
                        <span>{order.kind}</span>

                        <span>
                          <Icon name="pin" size={16} /> {order.district}
                        </span>

                        <span>
                          <Icon name="user" size={16} /> {order.name}
                        </span>

                        <a href={`tel:${order.phone}`}>
                          <Icon name="phone" size={16} /> {order.phone}
                        </a>

                        {order.telegram && (
                          <a href={telegramLink} target="_blank" rel="noreferrer">
                            <Icon name="telegram" size={16} /> {order.telegram}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Действия администратора с объявлением */}
                    <div className="moderation-actions">
                      <Link className="button button-light button-small" to={`/pets/${order.id}`}>
                        Открыть
                      </Link>

                      {order.status !== 'active' && (
                        <button
                          className="button button-small"
                          onClick={() => changeStatus(order.id, 'active')}
                          type="button"
                        >
                          Одобрить
                        </button>
                      )}

                      {order.status !== 'archive' && (
                        <button
                          className="button button-ghost button-small"
                          onClick={() => changeStatus(order.id, 'archive')}
                          type="button"
                        >
                          Отклонить
                        </button>
                      )}

                      {order.status !== 'wasFound' && (
                        <button
                          className="button button-warm button-small"
                          onClick={() => changeStatus(order.id, 'wasFound')}
                          type="button"
                        >
                          Найдено
                        </button>
                      )}

                      <button
                        className="icon-button danger"
                        onClick={() => deleteOrder(order)}
                        title="Удалить"
                        type="button"
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="check" size={48} />
              <h3>Здесь пока пусто</h3>
              <p>Объявлений с выбранным статусом нет.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

// страница личного кабинета, открывается у всех по адресу /profile
// здесь пользователь видит свои контактные данные и может их отредактировать
// а также видит список своих объявлений, может их редактировать и удалять

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { apiRequest, getErrorMessage } from '../api'
import ContactEditModal from '../components/ContactEditModal'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import Notice from '../components/Notice'
import OrderEditModal from '../components/OrderEditModal'
import PageHero from '../components/PageHero'
import PetImage from '../components/PetImage'
import { useAuth } from '../context/AuthContext'
import {
  isValidEmail,
  isValidPhone,
  isValidTelegram,
  normalizeEmail,
  normalizePhone,
  normalizeTelegram,
} from '../utils/validation'
import { loadWithDelay } from '../utils/loading'

const statusLabels = {
  active: 'Активные',
  wasFound: 'Хозяин найден',
  onModeration: 'На модерации',
  archive: 'Архив',
}

function daysSince(dateValue) {
  const [day, month, year] = dateValue.split('-').map(Number)
  const registered = new Date(year, month - 1, day)

  return Math.max(0, Math.floor((Date.now() - registered.getTime()) / 86400000))
}

function groupOrdersByStatus(orders) {
  const result = {}

  orders.forEach((group) => {
    const [status, values] = Object.entries(group)[0]
    result[status] = values
  })

  return result
}

function getOrderPhoto(order) {
  if (Array.isArray(order.photos)) {
    return order.photos[0]
  }

  return order.photos
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const location = useLocation()

  const [orders, setOrders] = useState([])
  const [activeStatus, setActiveStatus] = useState(location.state?.activeStatus || 'active')
  const [loadingOrders, setLoadingOrders] = useState(true)

  const [editingContact, setEditingContact] = useState(null)
  const [contactValue, setContactValue] = useState('')

  const [editingOrder, setEditingOrder] = useState(null)
  const [message, setMessage] = useState(location.state?.message || null)

  async function loadOrders() {
    setLoadingOrders(true)

    try {
      // Загружаем все объявления текущего пользователя
      const response = await loadWithDelay(
        apiRequest('/users/orders/'),
      )
      setOrders(response?.data.orders || [])
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  function openContactEditor(contactType) {
    setEditingContact(contactType)

    if (contactType === 'phone') {
      setContactValue(user.phone)
    } else {
      setContactValue(user[contactType] || '')
    }

    setMessage(null)
  }

  function getNormalizedContactValue() {
    if (editingContact === 'phone') {
      return normalizePhone(contactValue)
    }

    if (editingContact === 'email') {
      return normalizeEmail(contactValue)
    }

    return normalizeTelegram(contactValue)
  }

  function validateContact(value) {
    if (editingContact === 'phone' && !isValidPhone(value)) {
      setMessage({
        type: 'error',
        text: 'Введите российский номер телефона, например +79991234567.',
      })
      return false
    }

    if (editingContact === 'email' && !isValidEmail(value)) {
      setMessage({ type: 'error', text: 'Введите корректный адрес электронной почты.' })
      return false
    }

    if (editingContact === 'telegram' && !isValidTelegram(value)) {
      setMessage({ type: 'error', text: 'Telegram укажите в формате @username.' })
      return false
    }

    return true
  }

  async function handleContactSave(event) {
    event.preventDefault()

    const normalizedValue = getNormalizedContactValue()

    if (!validateContact(normalizedValue)) {
      return
    }

    try {
      // Сохраняем только то поле, которое сейчас редактируется
      await apiRequest(`/users/${editingContact}`, {
        method: 'PATCH',
        body: JSON.stringify({ [editingContact]: normalizedValue }),
      })

      await refreshUser()
      setEditingContact(null)
      setMessage({ type: 'success', text: 'Контактные данные обновлены.' })
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    }
  }

  async function handleOrderDelete(order) {
    const confirmed = window.confirm(`Удалить объявление «${order.description}»?`)

    if (!confirmed) {
      return
    }

    try {
      await apiRequest(`/users/orders/${order.id}`, {
        method: 'DELETE',
      })

      await loadOrders()
      await refreshUser()

      setMessage({ type: 'success', text: 'Объявление удалено.' })
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    }
  }

  async function handleMarkFound(order) {
    const confirmed = window.confirm(
      'Отметить, что животное найдено и объявление можно снять с поиска?',
    )

    if (!confirmed) {
      return
    }

    try {
      // После этого объявление переходит в раздел "Хозяин найден"
      await apiRequest(`/pets/${order.id}/found`, {
        method: 'PATCH',
      })

      await loadOrders()
      await refreshUser()

      setActiveStatus('wasFound')
      setMessage({
        type: 'success',
        text: 'Готово. Объявление перенесено в истории возвращения домой.',
      })
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    }
  }

  async function handleOrderSave(event) {
    event.preventDefault()

    const requestBody = new FormData(event.target)

    // Удаляем пустые поля, чтобы backend не перезаписывал старые данные пустотой
    for (const [key, value] of [...requestBody.entries()]) {
      const emptyFile = value instanceof File && value.size === 0
      const emptyOptionalField = value === '' && key !== 'mark'

      if (emptyFile || emptyOptionalField) {
        requestBody.delete(key)
      }
    }

    try {
      await apiRequest(`/pets/${editingOrder.id}`, {
        method: 'POST',
        body: requestBody,
      })

      setEditingOrder(null)
      await loadOrders()

      setMessage({ type: 'success', text: 'Объявление обновлено.' })
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    }
  }

  const groupedOrders = groupOrdersByStatus(orders)
  const currentOrders = groupedOrders[activeStatus] || []
  const editable = ['active', 'onModeration'].includes(activeStatus)

  return (
    <>
      <PageHero
        eyebrow="Личный кабинет"
        title={`Здравствуйте, ${user.name}`}
        text="Здесь находятся ваши контактные данные и объявления."
      />

      <section className="section profile-section">
        <div className="container">
          {message && <Notice type={message.type}>{message.text}</Notice>}

          <div className="profile-summary">
            <div className="profile-card profile-identity">
              <div className="profile-avatar">
                <Icon name="user" size={34} />
              </div>

              <div>
                <span>Пользователь</span>
                <h2>{user.name}</h2>
                <p>С нами уже {daysSince(user.registrationDate)} дней</p>
              </div>
            </div>

            <div className="profile-stat">
              <strong>{user.ordersCount}</strong>
              <span>объявлений добавлено</span>
            </div>

            <div className="profile-stat profile-stat-warm">
              <strong>{user.petsCount}</strong>
              <span>питомцев вернулись домой</span>
            </div>
          </div>

          <div className="profile-grid">
            <section className="profile-card contact-card">
              <div className="card-heading">
                <div>
                  <span className="eyebrow">Профиль</span>
                  <h2>Контактные данные</h2>
                </div>
              </div>

              {/* Контакты можно менять отдельно друг от друга */}
              <div className="contact-row">
                <span className="detail-icon">
                  <Icon name="phone" />
                </span>
                <div>
                  <small>Телефон</small>
                  <strong>{user.phone}</strong>
                </div>
                <button
                  className="icon-button"
                  onClick={() => openContactEditor('phone')}
                  type="button"
                >
                  <Icon name="edit" size={18} />
                </button>
              </div>

              <div className="contact-row">
                <span className="detail-icon">
                  <Icon name="mail" />
                </span>
                <div>
                  <small>E-mail</small>
                  <strong>{user.email}</strong>
                </div>
                <button
                  className="icon-button"
                  onClick={() => openContactEditor('email')}
                  type="button"
                >
                  <Icon name="edit" size={18} />
                </button>
              </div>

              <div className="contact-row">
                <span className="detail-icon">
                  <Icon name="telegram" />
                </span>
                <div>
                  <small>Telegram</small>
                  <strong>{user.telegram || 'Не указан'}</strong>
                </div>
                <button
                  className="icon-button"
                  onClick={() => openContactEditor('telegram')}
                  type="button"
                >
                  <Icon name="edit" size={18} />
                </button>
              </div>

              <div className="contact-row">
                <span className="detail-icon">
                  <Icon name="calendar" />
                </span>
                <div>
                  <small>Дата регистрации</small>
                  <strong>{user.registrationDate}</strong>
                </div>
              </div>
            </section>

            <section className="profile-card orders-card">
              <div className="card-heading orders-heading">
                <div>
                  <span className="eyebrow">Мои публикации</span>
                  <h2>Объявления</h2>
                </div>

                <Link className="button button-small" to="/add-pet">
                  <Icon name="plus" size={17} /> Добавить
                </Link>
              </div>

              {/* Вкладки делят объявления по статусам */}
              <div className="status-tabs">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <button
                    className={activeStatus === status ? 'active' : ''}
                    key={status}
                    onClick={() => setActiveStatus(status)}
                    type="button"
                  >
                    {label}
                    <span>{groupedOrders[status]?.length || 0}</span>
                  </button>
                ))}
              </div>

              {loadingOrders ? (
                <Loader />
              ) : currentOrders.length ? (
                <div className="user-order-list">
                  {currentOrders.map((order) => {
                    const isLost = order.report_type === 'lost'

                    return (
                      <article className="user-order" key={order.id}>
                        <PetImage src={getOrderPhoto(order)} alt={order.kind} />

                        <div className="user-order-content">
                          <div className="user-order-meta">
                            <span>{isLost ? 'Пропала' : 'Найдена'}</span>
                            <span>{order.kind}</span>
                            <span>{order.date}</span>
                          </div>

                          {isLost && <h3>{order.pet_name}</h3>}

                          <p className="user-order-description">{order.description}</p>

                          {order.mark && <p>Особая примета: {order.mark}</p>}

                          <p>
                            <Icon name="pin" size={15} /> {order.district}
                          </p>
                        </div>

                        <div className="user-order-actions">
                          <Link
                            className="icon-button"
                            title="Открыть"
                            to={`/pets/${order.id}`}
                          >
                            <Icon name="arrow" size={18} />
                          </Link>

                          {/* Редактировать можно только активные объявления и объявления на модерации */}
                          {editable && (
                            <>
                              {activeStatus === 'active' && (
                                <button
                                  className="button button-small button-warm"
                                  onClick={() => handleMarkFound(order)}
                                  type="button"
                                >
                                  <Icon name="check" size={16} /> Найдено
                                </button>
                              )}

                              <button
                                className="icon-button"
                                onClick={() => setEditingOrder(order)}
                                title="Редактировать"
                                type="button"
                              >
                                <Icon name="edit" size={18} />
                              </button>

                              <button
                                className="icon-button danger"
                                onClick={() => handleOrderDelete(order)}
                                title="Удалить"
                                type="button"
                              >
                                <Icon name="trash" size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state compact">
                  <Icon name="search" size={40} />
                  <h3>В этом разделе пока пусто</h3>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>

      {editingContact && (
        <ContactEditModal
          contactType={editingContact}
          contactValue={contactValue}
          onClose={() => setEditingContact(null)}
          onSubmit={handleContactSave}
          onValueChange={setContactValue}
        />
      )}

      {editingOrder && (
        <OrderEditModal
          order={editingOrder}
          onChange={setEditingOrder}
          onClose={() => setEditingOrder(null)}
          onSubmit={handleOrderSave}
        />
      )}
    </>
  )
}

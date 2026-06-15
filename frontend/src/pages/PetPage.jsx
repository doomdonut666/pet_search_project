// Страница конкретного объявления, открывается по типу /pets/123
// 123 - это id объявления, по которому грузим информацию о животном с сервера

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { apiRequest, getErrorMessage } from '../api'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import Notice from '../components/Notice'
import PetImage from '../components/PetImage'
import { useAuth } from '../context/AuthContext'
import { loadWithDelay } from '../utils/loading'

export default function PetPage() {
  const { id } = useParams()
  const { refreshUser } = useAuth()

  const [pet, setPet] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(null)

  async function loadPet() {
    try {
      // Загружаем одно объявление по id из адресной строки
      const response = await loadWithDelay(
        apiRequest(`/pets/${id}`),
      )
      const currentPet = response.data.pet?.[0]

      if (!currentPet) {
        setError('Объявление не найдено.')
        return
      }

      setPet(currentPet)
      setError('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  useEffect(() => {
    loadPet()
  }, [id])

  async function markFound() {
    const confirmed = window.confirm(
      'Отметить, что животное найдено и объявление можно снять с поиска?',
    )

    if (!confirmed) {
      return
    }

    try {
      // Меняем статус объявления на "хозяин найден"
      await apiRequest(`/pets/${id}/found`, {
        method: 'PATCH',
      })

      await loadPet()
      await refreshUser()

      setMessage({
        type: 'success',
        text: 'Готово. Объявление перенесено в истории возвращения домой.',
      })
    } catch (requestError) {
      setMessage({
        type: 'error',
        text: getErrorMessage(requestError),
      })
    }
  }

  if (error) {
    return (
      <section className="section">
        <div className="container narrow">
          <Notice type="error">{error}</Notice>
        </div>
      </section>
    )
  }

  if (!pet) {
    return <Loader text="Открываем карточку животного" />
  }

  const photos = pet.photos || []
  const isLost = pet.report_type === 'lost'
  const reportLabel = isLost ? 'Пропало животное' : 'Найдено животное'
  const districtLabel = isLost ? 'Район пропажи' : 'Район находки'

  const telegramLink = pet.telegram
    ? `https://t.me/${pet.telegram.replace('@', '')}`
    : ''

  return (
    <section className="section pet-detail-section">
      <div className="container">
        <Link className="back-link" to="/search">
          ← Вернуться к поиску
        </Link>

        <div className="pet-detail-grid">
          <div className="pet-gallery">
            <PetImage
              className="pet-main-photo"
              src={photos[activePhoto]}
              alt={pet.description}
            />

            {/* Миниатюры показываем только если фотографий больше одной */}
            {photos.length > 1 && (
              <div className="pet-thumbnails">
                {photos.map((photo, index) => (
                  <button
                    className={index === activePhoto ? 'active' : ''}
                    key={photo}
                    onClick={() => setActivePhoto(index)}
                    type="button"
                  >
                    <img src={photo} alt={`Фотография ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <article className="pet-detail-card">
            {message && <Notice type={message.type}>{message.text}</Notice>}

            <div className="pet-detail-topline">
              <div>
                <span className={`pet-report pet-report-${pet.report_type}`}>
                  {reportLabel}
                </span>
                <span className="pet-kind">{pet.kind}</span>
              </div>

              <span>
                <Icon name="calendar" size={17} /> {pet.date}
              </span>
            </div>

            {/* Кличка есть только у объявлений о пропаже */}
            {isLost && <h1>{pet.pet_name}</h1>}

            <p className="pet-detail-description">{pet.description}</p>

            <div className="detail-list">
              {pet.mark && (
                <div>
                  <span className="detail-icon">
                    <Icon name="search" />
                  </span>
                  <span>
                    <small>Особая примета</small>
                    <strong>{pet.mark}</strong>
                  </span>
                </div>
              )}

              <div>
                <span className="detail-icon">
                  <Icon name="pin" />
                </span>
                <span>
                  <small>{districtLabel}</small>
                  <strong>{pet.district}</strong>
                </span>
              </div>

              <div>
                <span className="detail-icon">
                  <Icon name="user" />
                </span>
                <span>
                  <small>Контактное лицо</small>
                  <strong>{pet.name}</strong>
                </span>
              </div>
            </div>

            {/* Контакты автора объявления */}
            <div className="contact-box">
              <h2>Связаться с автором</h2>

              <a className="button button-full" href={`tel:${pet.phone}`}>
                <Icon name="phone" size={19} /> {pet.phone}
              </a>

              <a className="button button-light button-full" href={`mailto:${pet.email}`}>
                <Icon name="mail" size={19} /> {pet.email}
              </a>

              {pet.telegram && (
                <a
                  className="button button-light button-full"
                  href={telegramLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="telegram" size={19} /> {pet.telegram}
                </a>
              )}
            </div>

            {/* Кнопка доступна только автору объявления или администратору */}
            {pet.can_mark_found && (
              <button
                className="button button-warm button-full found-action"
                onClick={markFound}
                type="button"
              >
                <Icon name="check" size={19} /> Животное найдено
              </button>
            )}

            <p className="safety-note">
              Не переводите деньги незнакомым людям и встречайтесь в безопасном месте.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

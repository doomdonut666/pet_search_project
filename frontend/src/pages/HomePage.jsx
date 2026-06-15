// Главная станица сайта с обзором возможностей, быстрым поиском (надо убрать) и последними объявлениями

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiRequest, getErrorMessage } from '../api'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import Notice from '../components/Notice'
import PetCard from '../components/PetCard'
import PetImage from '../components/PetImage'
import { loadWithDelay } from '../utils/loading'

// Блок: "Как работает сервис"
const serviceSteps = [
  ['01', 'Создайте объявление', 'Укажите, животное пропало или было найдено, добавьте район, описание и фотографии.'],
  ['02', 'Дождитесь модерации', 'После проверки объявление появится в общем поиске.'],
  ['03', 'Следите за откликами', 'Пользователи смогут связаться с Вами по указанным контактам.'],
]

export default function HomePage() {
  const [returnedPets, setReturnedPets] = useState([])
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [sliderLoading, setSliderLoading] = useState(true)

  const [recentPets, setRecentPets] = useState([])
  const [recentPetsLoading, setRecentPetsLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  const [subscriptionEmail, setSubscriptionEmail] = useState('')
  const [subscriptionState, setSubscriptionState] = useState(null)

  useEffect(() => {
    async function loadReturnedPets() {
      try {
        // Загружаем истории, где питомцев уже нашли
        const response = await loadWithDelay(
          apiRequest('/pets/slider'),
        )
        setReturnedPets(response?.data.pets || [])
      } catch {
        setReturnedPets([])
      } finally {
        setSliderLoading(false)
      }
    }

    async function loadRecentPets() {
      try {
        // Загрузка последних активных объявлений
        const response = await loadWithDelay(
          apiRequest('/pets'),
        )
        setRecentPets(response?.data.orders || [])
      } catch {
        setRecentPets([])
      } finally {
        setRecentPetsLoading(false)
      }
    }

    loadReturnedPets()
    loadRecentPets()
  }, [])

  useEffect(() => {
    const query = searchQuery.trim()

    if (query.length <= 3) {
      setSearchSuggestions([])
      setSearchLoading(false)
      return undefined
    }

    setSearchLoading(true)

    // Небольшая задержка, чтобы не отправлять запрос после каждой буквы
    const timeout = setTimeout(async () => {
      try {
        const response = await apiRequest(`/search?query=${encodeURIComponent(query)}`)
        setSearchSuggestions(response?.data.orders || [])
      } catch {
        setSearchSuggestions([])
      } finally {
        setSearchLoading(false)
      }
    }, 800)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  useEffect(() => {
    if (returnedPets.length < 2) {
      return undefined
    }

    // Автоматически переключаем слайды счастливых историй (Если более одного)
    const interval = setInterval(() => {
      setActiveSlideIndex((currentIndex) => (
        (currentIndex + 1) % returnedPets.length
      ))
    }, 6000)

    return () => clearInterval(interval)
  }, [returnedPets.length])

  function changeSlide(direction) {
    setActiveSlideIndex((currentIndex) => {
      const nextIndex = currentIndex + direction

      if (nextIndex < 0) {
        return returnedPets.length - 1
      }

      if (nextIndex >= returnedPets.length) {
        return 0
      }

      return nextIndex
    })
  }

  async function handleSubscriptionSubmit(event) {
    event.preventDefault()
    setSubscriptionState(null)

    try {
      await apiRequest('/subscription', {
        method: 'POST',
        body: JSON.stringify({ email: subscriptionEmail }),
      })

      setSubscriptionState({
        type: 'success',
        message: 'Вы успешно подписались на новые объявления.',
      })
      setSubscriptionEmail('')
    } catch (error) {
      setSubscriptionState({
        type: 'error',
        message: getErrorMessage(error),
      })
    }
  }

  const activeReturnedPet = returnedPets[activeSlideIndex]

  return (
    <>
      <section className="home-hero">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />

        <div className="container home-hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Сервис добрых встреч</span>

            <h1>
              Поможем питомцу <em>вернуться домой</em>
            </h1>

            <p>
              Публикуйте информацию о пропавших и найденных животных.
              А наше сообщество поможет найти питомца или его хозяина.
            </p>

            <div className="hero-actions">
              <Link className="button" to="/search">
                <Icon name="search" size={19} /> Найти питомца
              </Link>

              <Link className="button button-light" to="/add-pet">
                <Icon name="plus" size={19} /> Добавить объявление
              </Link>
            </div>

            <div className="hero-stats">
              <div>
                <strong>18</strong>
                <span>районов Санкт-Петербурга</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>объявления доступны</span>
              </div>

              <div>
                <strong>3</strong>
                <span>фото в карточке</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-photo-frame">
              <img
                className="hero-pet-image"
                src="/assets/pet-home.png"
                alt="Собака и кошка рядом с домом"
              />
            </div>

            <div className="floating-note note-top">
              <span className="note-icon">
                <Icon name="check" size={19} />
              </span>
              <span>
                <strong>Хозяин найден</strong>
                <small>Истории со счастливым концом</small>
              </span>
            </div>

            <div className="floating-note note-bottom">
              <span className="note-icon note-icon-warm">
                <Icon name="pin" size={19} />
              </span>
              <span>
                <strong>Поиск рядом</strong>
                <small>Фильтр по району</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Быстрый поиск на главной. Полный поиск на отдельной странице */}
      {/* Его нужно будет чем-то заменить, потому что есть отдельный*/}
      <section className="quick-search-section">
        <div className="container">
          <div className="quick-search-card">
            <div>
              <span className="eyebrow">Быстрый поиск</span>
              <h2>Опишите животное</h2>
              <p>Введите больше трёх символов, и появятся подходящие объявления.</p>
            </div>

            <div className="quick-search-box">
              <Icon name="search" />

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Пример: рыжая кошка в ошейнике"
              />

              {searchLoading && <span className="input-spinner" />}

              {(searchSuggestions.length > 0 || (searchQuery.length > 3 && !searchLoading)) && (
                <div className="suggestions">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.slice(0, 5).map((pet) => (
                      <Link key={pet.id} to={`/pets/${pet.id}`}>
                        <span className="suggestion-kind">
                          {pet.report_type === 'lost' ? 'Пропала' : 'Найдена'}: {pet.kind}
                        </span>
                        <span>{pet.description}</span>
                        <Icon name="arrow" size={16} />
                      </Link>
                    ))
                  ) : (
                    <div className="suggestion-empty">
                      Совпадений не найдено, попробуйте изменить запрос.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Секция с объявлениями, где животное уже вернулось домой */}
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Счастливые истории</span>
              <h2>Они уже вернулись домой</h2>
            </div>
            <p>Объявления, которые помогли владельцам найти своих питомцев</p>
          </div>

          {sliderLoading ? (
            <Loader text="Собираем счастливые истории" />
          ) : activeReturnedPet ? (
            <div className="story-slider">
              <PetImage
                className="story-image"
                src={activeReturnedPet.image}
                alt={activeReturnedPet.kind}
              />

              <div className="story-content">
                <span className="story-label">Хозяин найден</span>

                <h3>
                  {activeReturnedPet.report_type === 'lost'
                    ? activeReturnedPet.pet_name
                    : `Найдено: ${activeReturnedPet.kind}`}
                </h3>

                <p>{activeReturnedPet.description}</p>

                <div className="slider-controls">
                  <button
                    onClick={() => changeSlide(-1)}
                    type="button"
                    aria-label="Предыдущий слайд"
                  >
                    <Icon name="arrow" />
                  </button>

                  <div className="slider-dots">
                    {returnedPets.map((returnedPet, index) => (
                      <button
                        aria-label={`Слайд ${index + 1}`}
                        className={index === activeSlideIndex ? 'active' : ''}
                        key={returnedPet.id}
                        onClick={() => setActiveSlideIndex(index)}
                        type="button"
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => changeSlide(1)}
                    type="button"
                    aria-label="Следующий слайд"
                  >
                    <Icon name="arrow" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Notice>Пока нет завершённых историй. Первая обязательно появится.</Notice>
          )}
        </div>
      </section>

      {/* Последние активные объявления */}
      <section className="section section-soft">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Новые объявления</span>
              <h2>Пропавшие и найденные животные</h2>
            </div>

            <Link className="text-link" to="/search">
              Смотреть все <Icon name="arrow" size={17} />
            </Link>
          </div>

          {recentPetsLoading ? (
            <Loader />
          ) : recentPets.length ? (
            <div className="pet-grid">
              {recentPets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          ) : (
            <Notice>Активных объявлений пока нет.</Notice>
          )}
        </div>
      </section>

      {/* Короткое объяснение работы сервиса */}
      <section className="steps-section">
        <div className="container">
          <div className="section-heading centered">
            <div>
              <span className="eyebrow">Всё просто</span>
              <h2>Как работает наш сервис</h2>
            </div>
          </div>

          <div className="steps-grid">
            {serviceSteps.map(([number, title, text]) => (
              <article className="step-card" key={number}>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Подписка сохраняет почту, а сама рассылка должна выполняться на backend */}
      <section className="subscription-section">
        <div className="container subscription-card">
          <div>
            <h2>Получайте новые объявления на почту</h2>
            <p>
              Оставьте e-mail, чтобы получать уведомления о новых объявлениях
              по Санкт-Петербургу.
            </p>
          </div>

          <div className="subscription-form-wrap">
            {subscriptionState?.type === 'success' ? (
              <Notice type="success">{subscriptionState.message}</Notice>
            ) : (
              <>
                <form className="subscription-form" onSubmit={handleSubscriptionSubmit}>
                  <input
                    type="email"
                    required
                    value={subscriptionEmail}
                    onChange={(event) => setSubscriptionEmail(event.target.value)}
                    placeholder="your@email.ru"
                  />

                  <button className="button button-warm" type="submit">
                    Подписаться
                  </button>
                </form>

                {subscriptionState && (
                  <Notice type="error">{subscriptionState.message}</Notice>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

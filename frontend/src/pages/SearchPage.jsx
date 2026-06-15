// страница поиска объявлений

import { useEffect, useState } from 'react'

import { apiRequest, getErrorMessage } from '../api'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import Notice from '../components/Notice'
import PageHero from '../components/PageHero'
import PetCard from '../components/PetCard'
import { loadWithDelay } from '../utils/loading'

const emptyFilters = {
  query: '',
  kind: '',
  district: '',
}

export default function SearchPage() {
  const [kinds, setKinds] = useState([])
  const [districts, setDistricts] = useState([])

  const [filters, setFilters] = useState(emptyFilters)
  const [activeFilters, setActiveFilters] = useState(null)

  const [searchResults, setSearchResults] = useState([])
  const [pagination, setPagination] = useState(null)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadDictionaries()
  }, [])

  async function loadDictionaries() {
    try {
      // Справочники нужны для выпадающих списков "Вид животного" и "Район"
      const [kindResponse, districtResponse] = await Promise.all([
        apiRequest('/kinds'),
        apiRequest('/districts'),
      ])

      setKinds(kindResponse.data.kinds)
      setDistricts(districtResponse.data.districts)
    } catch {
      setMessage('Не удалось загрузить справочники.')
    }
  }

  function updateFilter(field, value) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function prepareFilters(searchFilters) {
    return {
      query: searchFilters.query.trim(),
      kind: searchFilters.kind,
      district: searchFilters.district,
    }
  }

  function createSearchParams(searchFilters, page) {
    const params = new URLSearchParams()
    params.set('page', String(page))

    if (searchFilters.query) {
      params.set('query', searchFilters.query)
    }

    if (searchFilters.kind) {
      params.set('kind', searchFilters.kind)
    }

    if (searchFilters.district) {
      params.set('district', searchFilters.district)
    }

    return params
  }

  async function runSearch(searchFilters, page = 1) {
    const preparedFilters = prepareFilters(searchFilters)
    const params = createSearchParams(preparedFilters, page)

    setLoading(true)
    setMessage('')

    try {
      // Отправляем фильтры на backend и получаем подходящие объявления
      const response = await loadWithDelay(
        apiRequest(`/search/?${params}`),
      )

      setActiveFilters(preparedFilters)

      if (!response?.data.orders?.length) {
        setSearchResults([])
        setPagination(null)
        setMessage('По вашему запросу объявления не найдены.')
        return
      }

      setSearchResults(response.data.orders)
      setPagination(response.data.pagination)
    } catch (error) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const hasQuery = filters.query.trim()
    const hasKind = filters.kind
    const hasDistrict = filters.district

    if (!hasQuery && !hasKind && !hasDistrict) {
      setMessage('Введите описание или выберите район или вид животного.')
      return
    }

    runSearch(filters)
  }

  function clearFilters() {
    setFilters(emptyFilters)
    setActiveFilters(null)
    setSearchResults([])
    setPagination(null)
    setMessage('')
  }

  return (
    <>
      <PageHero
        eyebrow="База объявлений"
        title="Поиск домашних животных"
        text="Введите описание животного обычными словами: цвет, приметы, ошейник, район или кличку. Мы покажем подходящие объявления."
      />

      <section className="section search-page-section">
        <div className="container">
          {/* Форма фильтров поиска */}
          <form className="filter-panel" onSubmit={handleSubmit}>
            <label className="field-wide">
              <span>Что ищем</span>
              <input
                value={filters.query}
                onChange={(event) => updateFilter('query', event.target.value)}
                placeholder="Например: рыжая кошка или серая собака с ошейником"
              />
            </label>

            <label>
              <span>Вид животного</span>
              <select
                value={filters.kind}
                onChange={(event) => updateFilter('kind', event.target.value)}
              >
                <option value="">Все</option>

                {kinds.map((item) => (
                  <option key={item.id} value={item.kind}>
                    {item.kind}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Район</span>
              <select
                value={filters.district}
                onChange={(event) => updateFilter('district', event.target.value)}
              >
                <option value="">Все районы</option>

                {districts.map((item) => (
                  <option key={item.id} value={item.district}>
                    {item.district}
                  </option>
                ))}
              </select>
            </label>

            <button className="button" type="submit">
              <Icon name="search" size={19} /> Найти
            </button>

            <button className="button button-ghost" onClick={clearFilters} type="button">
              Сбросить
            </button>
          </form>

          <div className="results-heading">
            <div>
              <span className="eyebrow">Результаты</span>
              <h2>
                {pagination
                  ? `Найдено объявлений: ${pagination.count}`
                  : 'Опишите животное и начните поиск'}
              </h2>
            </div>

            {/* Показываем фильтры, по которым сейчас выполнен поиск */}
            {activeFilters && (
              <div className="active-filters">
                {activeFilters.query && <span>{activeFilters.query}</span>}
                {activeFilters.kind && <span>{activeFilters.kind}</span>}
                {activeFilters.district && <span>{activeFilters.district}</span>}
              </div>
            )}
          </div>

          {loading ? (
            <Loader text="Ищем подходящие объявления" />
          ) : message ? (
            <Notice>{message}</Notice>
          ) : searchResults.length > 0 ? (
            <>
              <div className="pet-grid">
                {searchResults.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>

              {/* Пагинация нужна, если backend вернул больше одной страницы */}
              {pagination?.pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={!pagination.previous}
                    onClick={() => runSearch(activeFilters, pagination.page - 1)}
                    type="button"
                  >
                    Назад
                  </button>

                  {Array.from({ length: pagination.pages }, (_, index) => index + 1).map((page) => (
                    <button
                      className={page === pagination.page ? 'active' : ''}
                      key={page}
                      onClick={() => runSearch(activeFilters, page)}
                      type="button"
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={!pagination.next}
                    onClick={() => runSearch(activeFilters, pagination.page + 1)}
                    type="button"
                  >
                    Вперёд
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Icon name="search" size={52} />
              <h3>Здесь появятся результаты</h3>
              <p>Напишите приметы животного или выберите вид и район.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

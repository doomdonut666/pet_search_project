// Страница добавления нового объявления о пропавшем или найденном животном,
// Если пользователь не вошёл, ему нужно будет указать контактные данные и может создать аккаунт при добавлении объявления,
// Если пользователь уже вошёл, контактные данные подтянутся из его профиля

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiRequest, getErrorMessage } from '../api'
import GuestContactFields from '../components/GuestContactFields'
import Icon from '../components/Icon'
import Loader from '../components/Loader'
import Notice from '../components/Notice'
import PageHero from '../components/PageHero'
import PhotoUploadFields from '../components/PhotoUploadFields'
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

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  telegram: '',
  register: false,
  password: '',
  password_confirmation: '',
  report_type: '',
  pet_name: '',
  kind: '',
  district: '',
  mark: '',
  description: '',
  confirm: false,
}

export default function AddPetPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [files, setFiles] = useState([null, null, null])
  const [previews, setPreviews] = useState([null, null, null])
  const [kinds, setKinds] = useState([])
  const [districts, setDistricts] = useState([])
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Загружаем списки для выпадающих полей
    Promise.all([apiRequest('/kinds'), apiRequest('/districts')])
      .then(([kindResponse, districtResponse]) => {
        setKinds(kindResponse.data.kinds)
        setDistricts(districtResponse.data.districts)
      })
      .catch((error) => {
        setMessage({ type: 'error', text: getErrorMessage(error) })
      })
  }, [])

  useEffect(() => {
    const previewUrls = files.map((file) => {
      return file ? URL.createObjectURL(file) : null
    })

    setPreviews(previewUrls)

    return () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [files])

  if (authLoading) {
    return <Loader text="Проверяем данные пользователя" />
  }

  function updateFormField(field, value) {
    setForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
      }

      if (field === 'report_type' && value === 'found') {
        nextForm.pet_name = ''
      }

      if (field === 'register' && !value) {
        nextForm.password = ''
        nextForm.password_confirmation = ''
      }

      return nextForm
    })
  }

  function updatePhoto(photoIndex, file) {
    setFiles((current) => {
      const newFiles = [...current]
      newFiles[photoIndex] = file
      return newFiles
    })
  }
  // Валидация формы + сообщения об ошибке
  function validateForm(name, phone, email, telegram) {
    if (!user && !isValidName(name)) {
      setMessage({ type: 'error', text: 'Введите имя кириллицей.' })
      return false
    }

    if (!user && !isValidPhone(phone)) {
      setMessage({ type: 'error', text: 'Введите телефон в формате: +7XXXXXXXXXX' })
      return false
    }

    if (!user && !isValidEmail(email)) {
      setMessage({ type: 'error', text: 'Введите корректный адрес электронной почты.' })
      return false
    }

    if (!user && !isValidTelegram(telegram)) {
      setMessage({ type: 'error', text: 'Telegram укажите в формате: @username.' })
      return false
    }

    if (!user && form.register && !isStrongPassword(form.password)) {
      setMessage({
        type: 'error',
        text: 'Пароль: минимум 7 символов, одна заглавная и строчная латинская буква и одна цифра.',
      })
      return false
    }

    if (!user && form.register && form.password !== form.password_confirmation) {
      setMessage({ type: 'error', text: 'Пароли не совпадают.' })
      return false
    }

    if (!form.report_type) {
      setMessage({ type: 'error', text: 'Выберите, животное пропало или было найдено.' })
      return false
    }

    if (form.report_type === 'lost' && !form.pet_name.trim()) {
      setMessage({ type: 'error', text: 'Укажите кличку пропавшего животного.' })
      return false
    }

    if (!form.kind) {
      setMessage({ type: 'error', text: 'Выберите вид животного.' })
      return false
    }

    if (!form.district) {
      setMessage({ type: 'error', text: 'Выберите район.' })
      return false
    }

    if (form.description.trim().length < 30) {
      setMessage({ type: 'error', text: 'Описание должно содержать не менее 30 символов. Чем больше - тем лучше.' })
      return false
    }

    if (!files[0]) {
      setMessage({ type: 'error', text: 'Без фотографии нельзя добавить обьявление. Минимум одно фото.' })
      return false
    }

    if (!form.confirm) {
      setMessage({ type: 'error', text: 'Подтвердите согласие на обработку персональных данных.' })
      return false
    }

    return true
  }

  function createRequestBody(name, phone, email, telegram) {
    const requestBody = new FormData()

    requestBody.append('report_type', form.report_type)
    requestBody.append('pet_name', form.pet_name.trim())
    requestBody.append('kind', form.kind)
    requestBody.append('district', form.district)
    requestBody.append('mark', form.mark.trim())
    requestBody.append('description', form.description.trim())
    requestBody.append('confirm', form.confirm ? '1' : '0')

    // Если пользователь не вошёл, отправляем + контактные данные
    if (!user) {
      requestBody.append('name', name)
      requestBody.append('phone', phone)
      requestBody.append('email', email)
      requestBody.append('telegram', telegram)
      requestBody.append('register', form.register ? '1' : '0')

      if (form.register) {
        requestBody.append('password', form.password)
        requestBody.append('password_confirmation', form.password_confirmation)
      }
    }

    files.forEach((file, index) => {
      if (file) {
        requestBody.append(`photo${index + 1}`, file)
      }
    })

    return requestBody
  }

  function resetForm(formElement) {
    formElement.reset()
    setForm(emptyForm)
    setFiles([null, null, null])
  }

  async function handleFormSubmit(event) {
    event.preventDefault()
    setMessage(null)

    const formElement = event.currentTarget

    const name = form.name.trim()
    const phone = normalizePhone(form.phone)
    const email = normalizeEmail(form.email)
    const telegram = normalizeTelegram(form.telegram)

    if (!validateForm(name, phone, email, telegram)) {
      return
    }

    const requestBody = createRequestBody(name, phone, email, telegram)

    setSubmitting(true)

    try {
      await apiRequest('/pets/new', {
        method: 'POST',
        body: requestBody,
      })

      if (user) {
        navigate('/profile', {
          replace: true,
          state: {
            activeStatus: 'onModeration',
            message: {
              type: 'success',
              text: 'Ваше объявление успешно отправлено на модерацию. Постараемся выложить объявление как можно скорее.',
            },
          },
        })
        return
      }

      if (form.register) {
        navigate('/login', {
          replace: true,
          state: { registered: true, orderCreated: true },
        })
        return
      }

      resetForm(formElement)
      setMessage({
        type: 'success',
        text: 'Ваше объявление успешно отправлено на модерацию.',
      })
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const typeSectionNumber = user ? 1 : 2
  const infoSectionNumber = user ? 2 : 3
  const photoSectionNumber = user ? 3 : 4

  const descriptionPlaceholder = form.report_type === 'found'
    ? 'Где и когда вы нашли животное, его окрас, состояние и особые приметы...'
    : 'Где и когда животное пропало, его окрас, особые приметы и обстоятельства...'

  return (
    <>
      <PageHero
        eyebrow="Поиск питомца"
        title="Добавить объявление"
        text="Сообщите о пропавшем или найденном животном, добавьте фотографии и описание."
      />

      <section className="section form-page-section">
        <div className="container form-layout">
          <form className="large-form" noValidate onSubmit={handleFormSubmit}>
            {message && <Notice type={message.type}>{message.text}</Notice>}

            {!user && (
              <GuestContactFields form={form} onChange={updateFormField} />
            )}

            <fieldset>
              <legend>
                <span>{typeSectionNumber}</span> Тип объявления
              </legend>

              <div className="form-grid">
                <label className="field-wide">
                  <span>Что произошло?</span>
                  <select
                    required
                    value={form.report_type}
                    onChange={(event) => updateFormField('report_type', event.target.value)}
                  >
                    <option value="">Выберите вариант</option>
                    <option value="lost">Пропало животное</option>
                    <option value="found">Найдено животное</option>
                  </select>
                </label>

                {form.report_type === 'lost' && (
                  <label className="field-wide">
                    <span>Кличка питомца</span>
                    <input
                      required
                      maxLength="100"
                      value={form.pet_name}
                      onChange={(event) => updateFormField('pet_name', event.target.value)}
                      placeholder="Пример: Барсик"
                    />
                  </label>
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend>
                <span>{infoSectionNumber}</span> Информация о животном
              </legend>

              <div className="form-grid">
                <label>
                  <span>Вид животного</span>
                  <select
                    required
                    value={form.kind}
                    onChange={(event) => updateFormField('kind', event.target.value)}
                  >
                    <option value="">Выберите вид</option>
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
                    required
                    value={form.district}
                    onChange={(event) => updateFormField('district', event.target.value)}
                  >
                    <option value="">Выберите район</option>
                    {districts.map((item) => (
                      <option key={item.id} value={item.district}>
                        {item.district}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-wide">
                  <span>Особая примета</span>
                  <input
                    maxLength="100"
                    value={form.mark}
                    onChange={(event) => updateFormField('mark', event.target.value)}
                    placeholder="Например: белое пятно на груди (необязательно)"
                  />
                </label>

                <label className="field-wide">
                  <span>Описание</span>
                  <textarea
                    minLength="10"
                    required
                    rows="6"
                    value={form.description}
                    onChange={(event) => updateFormField('description', event.target.value)}
                    placeholder={descriptionPlaceholder}
                  />
                </label>
              </div>
            </fieldset>

            <PhotoUploadFields
              files={files}
              previews={previews}
              sectionNumber={photoSectionNumber}
              onFileChange={updatePhoto}
            />

            <label className="checkbox-field consent-field">
              <input
                type="checkbox"
                required
                checked={form.confirm}
                onChange={(event) => updateFormField('confirm', event.target.checked)}
              />
              <span>Я согласен на обработку персональных данных</span>
            </label>

            <button className="button button-full" disabled={submitting} type="submit">
              {submitting ? 'Отправляем...' : 'Добавить объявление'}
            </button>
          </form>

          <aside className="form-aside">
            <div className="aside-card">
              <span className="aside-icon">
                <Icon name="check" size={28} />
              </span>

              <h3>Как сделать хорошее объявление?</h3>
              <ul>
                <li>Добавьте чёткие фотографии, желательно горизонтальные</li>
                <li>Укажите район пропажи или находки животного</li>
                <li>Подробно опишите особые приметы и обстоятельства</li>
                <li>Проверьте контактные данные, их можно поменять в профиле</li>
              </ul>
            </div>

            <div className="aside-card aside-card-soft">
              <h3>Автор объявления</h3>

              {user ? (
                <>
                  <p>{user.name}</p>
                  <p>
                    {user.phone}
                    <br />
                    {user.email}
                  </p>
                  {user.telegram && <p>{user.telegram}</p>}
                </>
              ) : (
                <p>Поменять контактные данные можно в профиле.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
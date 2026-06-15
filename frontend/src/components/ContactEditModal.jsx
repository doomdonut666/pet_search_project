// Редактирования контактов в профиле

import Modal from './Modal'

// Настройки полей для разных контактов,
// Так не нужно делать отдельную модалку для телефона, почты и тг.
const contactFields = {
  phone: {
    title: 'Изменить телефон',
    label: 'Новый телефон',
    type: 'tel',
  },
  email: {
    title: 'Изменить e-mail',
    label: 'Новый e-mail',
    type: 'email',
  },
  telegram: {
    title: 'Изменить Telegram',
    label: 'Telegram',
    type: 'text',
  },
}

export default function ContactEditModal({
  contactType,
  contactValue,
  onClose,
  onSubmit,
  onValueChange,
}) {
  const field = contactFields[contactType]
  const isTelegram = contactType === 'telegram'

  function handleChange(event) {
    onValueChange(event.target.value)
  }

  return (
    <Modal title={field.title} onClose={onClose}>
      <form className="form-stack" noValidate onSubmit={onSubmit}>
        <label>
          <span>{field.label}</span>
          <input
            type={field.type}
            required={!isTelegram}
            value={contactValue}
            onChange={handleChange}
            placeholder={isTelegram ? '@username' : undefined}
          />
        </label>

        <button className="button button-full" type="submit">
          Сохранить
        </button>
      </form>
    </Modal>
  )
}
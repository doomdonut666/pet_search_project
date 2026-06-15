// Редактирование объявления в профиле

import Modal from './Modal'

export default function OrderEditModal({
  order,
  onChange,
  onClose,
  onSubmit,
}) {
  const isLost = order.report_type === 'lost'

  function handleTypeChange(event) {
    onChange({
      ...order,
      report_type: event.target.value,
    })
  }

  return (
    <Modal title="Редактировать объявление" onClose={onClose}>
      <form className="form-stack" noValidate onSubmit={onSubmit}>
        <label>
          <span>Тип объявления</span>
          <select
            name="report_type"
            value={order.report_type}
            onChange={handleTypeChange}
          >
            <option value="lost">Пропало животное</option>
            <option value="found">Найдено животное</option>
          </select>
        </label>

        {/* Кличка только при пропаже */}
        {isLost && (
          <label>
            <span>Кличка животного</span>
            <input
              defaultValue={order.pet_name === 'Неизвестно' ? '' : order.pet_name}
              name="pet_name"
              required
            />
          </label>
        )}

        <label>
          <span>Особая примета</span>
          <input
            defaultValue={order.mark}
            maxLength="100"
            name="mark"
          />
        </label>

        <label>
          <span>Описание</span>
          <textarea
            defaultValue={order.description}
            name="description"
            rows="5"
          />
        </label>

        {/* Фото можно не менять при редактировании */}
        <label>
          <span>Новые фотографии JPG или PNG</span>
          <input accept=".png,.jpg,.jpeg" name="photo1" type="file" />
          <small>Минимум одна фотография. Нельзя отправить объявление без фото.</small>
        </label>

        <label>
          <input accept=".png,.jpg,.jpeg" name="photo2" type="file" />
        </label>

        <label>
          <input accept=".png,.jpg,.jpeg" name="photo3" type="file" />
        </label>

        <button className="button button-full" type="submit">
          Сохранить изменения
        </button>
      </form>
    </Modal>
  )
}
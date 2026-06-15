// Контактные данные гостя, человек добавляет объявление без входа (Не исп.)

export default function GuestContactFields({ form, onChange }) {
  function updateField(field, value) {
    onChange(field, value)
  }

  return (
    <fieldset>
      <legend>
        <span>1</span> Контактные данные
      </legend>

      <div className="form-grid">
        {/* Объявление добавляет гость без аккаунта (Мб убрать) */}
        <label>
          <span>Имя</span>
          <input
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Антон"
          />
        </label>

        <label>
          <span>Телефон</span>
          <input
            inputMode="tel"
            required
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="+79001234567"
          />
        </label>

        <label>
          <span>E-mail</span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="mail@example.ru"
          />
        </label>

        <label>
          <span>Telegram</span>
          <input
            value={form.telegram}
            onChange={(event) => updateField('telegram', event.target.value)}
            placeholder="@user (необязательно)"
          />
        </label>

        <label className="checkbox-field field-wide">
          <input
            type="checkbox"
            checked={form.register}
            onChange={(event) => updateField('register', event.target.checked)}
          />
          <span>Создать личный кабинет</span>
        </label>

        {/* Пароль показывается только если пользователь хочет создать аккаунт */}
        {form.register && (
          <>
            <label>
              <span>Пароль</span>
              <input
                type="password"
                minLength="7"
                required
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Не менее 7 символов"
              />
            </label>

            <label>
              <span>Повторите пароль</span>
              <input
                type="password"
                required
                value={form.password_confirmation}
                onChange={(event) => updateField('password_confirmation', event.target.value)}
                placeholder="Повторите пароль"
              />
            </label>
          </>
        )}
      </div>
    </fieldset>
  )
}
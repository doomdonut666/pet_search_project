// общий компонент модального окна

import Icon from './Icon'

export default function Modal({ title, children, onClose }) {
  function stopClosing(event) {
    event.stopPropagation()
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <div className="modal" onMouseDown={stopClosing} role="dialog" aria-modal="true">
        <button
          aria-label="Закрыть"
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          <Icon name="close" />
        </button>

        <h2>{title}</h2>

        {/* cюда передаётся форма или друое содержимое модалки */}
        {children}
      </div>
    </div>
  )
}
// Уведомления на сайте, общие.

import Icon from './Icon'

export default function Notice({ type = 'info', children }) {
  const isSuccess = type === 'success'

  return (
    <div className={`notice notice-${type}`} role="status">
      {isSuccess && (
        <span className="notice-icon">
          <Icon name="check" size={18} />
        </span>
      )}

      <span>{children}</span>
    </div>
  )
}
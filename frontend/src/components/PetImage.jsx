// Вывод фотографий животного. Без фотки показывается заглушка с иконкой
// Добавил ещё "фото скоро появится" 

import Icon from './Icon'

export default function PetImage({ src, alt, className = '' }) {
  if (src) {
    return (
      <img
        className={className}
        src={src}
        alt={alt}
      />
    )
  }

  return (
    <div className={`pet-image-fallback ${className}`} aria-label="Фотография отсутствует">
      {/* Заглушка */}
      <Icon name="search" size={52} />
      <span>Фото скоро появится</span>
    </div>
  )
}
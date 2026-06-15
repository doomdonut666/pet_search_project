// Карточка животного, показывается в списке объявлений

import { Link } from 'react-router-dom'

import Icon from './Icon'
import PetImage from './PetImage'

export default function PetCard({ pet }) {
  const petLink = `/pets/${pet.id}`
  const reportLabel = pet.report_type === 'lost' ? 'Пропала' : 'Найдена'

  let photo = pet.photo
  if (!photo && Array.isArray(pet.photos)) {
    photo = pet.photos[0]
  } else if (!photo) {
    photo = pet.photos
  }

  return (
    <article className="pet-card reveal">
      <Link className="pet-card-image" to={petLink}>
        <PetImage src={photo} alt={`${pet.kind}: ${pet.description}`} />
        <span className="pet-kind">{pet.kind}</span>
        <span className={`pet-report pet-report-${pet.report_type}`}>
          {reportLabel}
        </span>
      </Link>

      <div className="pet-card-body">
        <div className="pet-meta">
          <span>
            <Icon name="pin" size={16} /> {pet.district}
          </span>
          <span>
            <Icon name="calendar" size={16} /> {pet.date}
          </span>
        </div>

        {/* Кличку показываем только для пропавших животных */}
        {/* Надо поправить, там большой отступ*/}
        {pet.report_type === 'lost' && <h3>{pet.pet_name}</h3>}

        <p className="pet-description">{pet.description}</p>

        <Link className="card-link" to={petLink}>
          Подробнее <Icon name="arrow" size={17} />
        </Link>
      </div>
    </article>
  )
}
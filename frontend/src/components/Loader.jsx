// Компонент для отображения загрузки, при поиске

// Вызов Icon для svg иконки, которая будет отображаться при загрузке данных
import Icon from './Icon'

export default function Loader({ text = 'Загружаем данные' }) {
  return (
    <div className="loader-wrap">
      <div className="loader-mark"><Icon name="search" size={34} /></div>
      <p>{text}</p>
    </div>
  )
}

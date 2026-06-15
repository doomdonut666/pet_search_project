// Загрузка фотографий для обяьвления, до 3-х фото + предпросмотр. 

// принимает список выбранных файлов и ссылки на превью, а так-же номер секции

import Icon from './Icon'

const photoSlots = [0, 1, 2]

export default function PhotoUploadFields({
  files,
  previews,
  sectionNumber,
  onFileChange,
}) {
  function handleFileChange(photoIndex, event) {
    onFileChange(photoIndex, event.target.files[0])
  }

  return (
    <fieldset>
      <legend>
        <span>{sectionNumber}</span> Фотографии
      </legend>

      <p className="field-hint">
        До трёх изображений JPG или PNG. Первая фотография обязательна.
      </p>

      <div className="photo-upload-grid">
        {photoSlots.map((photoIndex) => {
          const hasPreview = previews[photoIndex]
          const isRequired = photoIndex === 0

          return (
            <label
              className={`photo-upload ${files[photoIndex] ? 'has-file' : ''}`}
              key={photoIndex}
            >
              <input
                accept=".png,.jpg,.jpeg"
                required={isRequired}
                type="file"
                onChange={(event) => handleFileChange(photoIndex, event)}
              />

              {/* Превью фотографии */}
              {hasPreview ? (
                <>
                  <img
                    className="photo-upload-preview"
                    src={previews[photoIndex]}
                    alt={`Предпросмотр фотографии ${photoIndex + 1}`}
                  />

                  <span className="photo-upload-change">
                    <Icon name="edit" size={17} /> Заменить
                  </span>

                  <span className="photo-upload-name" title={files[photoIndex].name}>
                    {files[photoIndex].name}
                  </span>
                </>
              ) : (
                <span className="photo-upload-empty">
                  <Icon name="plus" size={28} />
                  <strong>Фото {photoIndex + 1}</strong>
                  <small>{isRequired ? 'Обязательно' : 'Необязательно'}</small>
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
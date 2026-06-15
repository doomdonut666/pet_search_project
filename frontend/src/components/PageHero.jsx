// верхний блок страницы

export default function PageHero({ eyebrow, title, text }) {
  return (
    <section className="page-hero">
      <div className="container">
        {eyebrow && (
          <span className="eyebrow">{eyebrow}</span>
        )}

        <h1>{title}</h1>

        {text && <p>{text}</p>}
      </div>
    </section>
  )
}

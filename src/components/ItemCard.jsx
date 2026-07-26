import CategoryChip from './CategoryChip'

function formatPrice(price, currency) {
  if (price == null) return null
  const symbol = currency === 'USD' ? 'US$' : '$'
  return `${symbol}${Number(price).toLocaleString('es-AR')}`
}

export default function ItemCard({ item, onOpen }) {
  const priceLabel = formatPrice(item.price, item.currency)
  const photos = item.photo_urls || []

  return (
    <div className="card" onClick={() => onOpen(item)}>
      <div className="card-media">
        {photos.length > 0 ? (
          <img src={photos[0]} alt={item.title || 'Artículo'} loading="lazy" />
        ) : (
          <div className="no-image">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        {priceLabel && <span className="price-badge">{priceLabel}</span>}
        {photos.length > 1 && <span className="photo-count-badge">+{photos.length - 1}</span>}
      </div>
      <div className="card-body">
        <CategoryChip category={item.category} />
        <div className="card-title">{item.title || 'Sin título'}</div>
        {item.link && (
          <a
            className="card-link"
            href={item.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Ver artículo →
          </a>
        )}
      </div>
    </div>
  )
}

import { CATEGORIES, categoryStyle } from '../lib/categories'
import { SUBCATEGORIES } from '../lib/subcategories'

export default function Toolbar({ search, onSearch, category, onCategory, subcategory, onSubcategory, sort, onSort }) {
  const subOptions = SUBCATEGORIES[category]

  return (
    <div>
      <div className="category-filter">
        <button
          className={`category-chip-btn ${category === '' ? 'active' : ''}`}
          style={{ background: '#EAEAEC', color: '#52525B' }}
          onClick={() => onCategory('')}
        >
          Todas
        </button>
        {CATEGORIES.map((c) => {
          const { bg, fg } = categoryStyle(c.value)
          return (
            <button
              key={c.value}
              className={`category-chip-btn ${category === c.value ? 'active' : ''}`}
              style={{ background: bg, color: fg }}
              onClick={() => onCategory(category === c.value ? '' : c.value)}
            >
              {c.value}
            </button>
          )
        })}
      </div>

      {subOptions && (
        <div className="category-filter subcategory-filter">
          <button
            className={`category-chip-btn subcategory-chip-btn ${subcategory === '' ? 'active' : ''}`}
            style={{ background: '#EAEAEC', color: '#52525B' }}
            onClick={() => onSubcategory('')}
          >
            Todas
          </button>
          {subOptions.map((s) => {
            const { bg, fg } = categoryStyle(category)
            return (
              <button
                key={s}
                className={`category-chip-btn subcategory-chip-btn ${subcategory === s ? 'active' : ''}`}
                style={{ background: bg, color: fg }}
                onClick={() => onSubcategory(subcategory === s ? '' : s)}
              >
                {s}
              </button>
            )
          })}
        </div>
      )}

      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <select className="select" value={sort} onChange={(e) => onSort(e.target.value)}>
          <option value="date_desc">Más recientes</option>
          <option value="date_asc">Más antiguos</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
      </div>
    </div>
  )
}

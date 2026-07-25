import { CATEGORIES } from '../lib/categories'

export default function Toolbar({ search, onSearch, category, onCategory, sort, onSort }) {
  return (
    <div className="toolbar">
      <input
        className="search-input"
        type="text"
        placeholder="Buscar..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <select className="select" value={category} onChange={(e) => onCategory(e.target.value)}>
        <option value="">Todas las categorías</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.value}
          </option>
        ))}
      </select>
      <select className="select" value={sort} onChange={(e) => onSort(e.target.value)}>
        <option value="date_desc">Más recientes</option>
        <option value="date_asc">Más antiguos</option>
        <option value="price_asc">Precio: menor a mayor</option>
        <option value="price_desc">Precio: mayor a menor</option>
      </select>
    </div>
  )
}

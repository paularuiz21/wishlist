import { useEffect, useMemo, useState } from 'react'
import Tabs from './components/Tabs'
import Toolbar from './components/Toolbar'
import ItemCard from './components/ItemCard'
import ItemForm from './components/ItemForm'
import ConfirmDialog from './components/ConfirmDialog'
import { listItems, createItem, updateItem, deleteItem, setPurchased } from './lib/items'
import { supabaseConfigured } from './lib/supabase'

export default function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [sort, setSort] = useState('date_desc')

  // Al cambiar de categoría, la subcategoría filtrada ya no aplica.
  function handleCategoryFilter(value) {
    setCategory(value)
    setSubcategory('')
  }
  const [editing, setEditing] = useState(null) // null = cerrado, {} = nuevo, item = editar
  const [pendingDelete, setPendingDelete] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    refresh()
  }, [])

  // Interceptar el botón físico de volver (Android) para cerrar el modal
  // en vez de salir de la app — mismo patrón que Lucilo.
  useEffect(() => {
    function handlePopState() {
      if (editing !== null) setEditing(null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [editing])

  function openEditing(item) {
    setEditing(item)
    window.history.pushState({ wishlist_sheet: 'item' }, '')
  }

  function closeEditing() {
    if (window.history.state?.wishlist_sheet === 'item') {
      window.history.back()
    } else {
      setEditing(null)
    }
  }

  async function refresh() {
    if (!supabaseConfigured) {
      setError('Falta configurar Supabase: copiá .env.example a .env.local y completá las variables (ver README).')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await listItems()
      setItems(data)
      setError('')
    } catch (err) {
      setError('No se pudieron cargar los artículos. Revisá la configuración de Supabase.')
    } finally {
      setLoading(false)
    }
  }

  const visible = useMemo(() => {
    let list = items.filter((i) => (tab === 'purchased' ? i.purchased : !i.purchased))
    if (category) list = list.filter((i) => i.category === category)
    if (subcategory) list = list.filter((i) => i.subcategory === subcategory)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (i) =>
          (i.title || '').toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q) ||
          (i.subcategory || '').toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      if (sort === 'price_asc') return (a.price ?? Infinity) - (b.price ?? Infinity)
      if (sort === 'price_desc') return (b.price ?? -Infinity) - (a.price ?? -Infinity)
      if (sort === 'date_asc') return new Date(a.created_at) - new Date(b.created_at)
      return new Date(b.created_at) - new Date(a.created_at)
    })
    return list
  }, [items, tab, category, subcategory, search, sort])

  async function handleSave(payload) {
    if (editing?.id) {
      const updated = await updateItem(editing.id, payload)
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    } else {
      const created = await createItem(payload)
      setItems((prev) => [created, ...prev])
    }
    closeEditing()
  }

  async function handleTogglePurchased(item) {
    const updated = await setPurchased(item.id, !item.purchased)
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    closeEditing()
  }

  async function handleDelete() {
    if (!pendingDelete) return
    await deleteItem(pendingDelete.id)
    setItems((prev) => prev.filter((i) => i.id !== pendingDelete.id))
    setPendingDelete(null)
    closeEditing()
  }

  return (
    <div className="app">
      <div className="app-header">
        <span className="app-title">Wishlist</span>
      </div>

      <Tabs active={tab} onChange={setTab} />
      <Toolbar
        search={search}
        onSearch={setSearch}
        category={category}
        onCategory={handleCategoryFilter}
        subcategory={subcategory}
        onSubcategory={setSubcategory}
        sort={sort}
        onSort={setSort}
      />

      {error && <div className="empty-state">{error}</div>}

      {!error && loading && <div className="empty-state">Cargando...</div>}

      {!error && !loading && visible.length === 0 && (
        <div className="empty-state">
          {tab === 'purchased' ? 'Todavía no compraste nada de la lista.' : 'No hay artículos. Agregá el primero con el botón +.'}
        </div>
      )}

      {!error && !loading && visible.length > 0 && (
        <div className="grid">
          {visible.map((item) => (
            <ItemCard key={item.id} item={item} onOpen={openEditing} />
          ))}
        </div>
      )}

      <button className="fab" onClick={() => openEditing({})} aria-label="Agregar artículo">
        +
      </button>

      {editing !== null && (
        <ItemForm
          item={editing.id ? editing : null}
          onSave={handleSave}
          onDelete={() => setPendingDelete(editing)}
          onTogglePurchased={handleTogglePurchased}
          onClose={closeEditing}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          message="¿Estás segura que querés borrar este artículo? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

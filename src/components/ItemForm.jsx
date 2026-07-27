import { useState } from 'react'
import { CATEGORIES } from '../lib/categories'
import { CURRENCIES } from '../lib/currencies'
import { SUBCATEGORIES } from '../lib/subcategories'
import { uploadPhoto } from '../lib/items'

const empty = {
  link: '',
  photo_urls: [],
  title: '',
  description: '',
  notes: '',
  price: '',
  currency: 'ARS',
  category: 'Otros',
  subcategory: '',
}

export default function ItemForm({ item, onSave, onDelete, onTogglePurchased, onClose }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState(item ? { ...empty, ...item } : empty)
  const [autoLoading, setAutoLoading] = useState(false)
  const [autoError, setAutoError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Al cambiar de categoría, la subcategoría vieja puede ya no aplicar
  // (ej. "Calzado" no tiene sentido si pasás de Accesorios a Libros).
  function handleCategoryChange(value) {
    setForm((f) => ({
      ...f,
      category: value,
      subcategory: (SUBCATEGORIES[value] || []).includes(f.subcategory) ? f.subcategory : '',
    }))
  }

  // El reconocimiento sale únicamente de las fotos subidas — el link es solo
  // una referencia (botón "Ver artículo"), no dispara autocompletado.
  async function runAutocomplete(imageBase64, mediaType) {
    setAutoLoading(true)
    setAutoError('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mediaType }),
      })
      if (!res.ok) throw new Error('No se pudo autocompletar')
      const data = await res.json()
      // Diagnóstico visible en pantalla (temporal, mientras afinamos el
      // auto-completado) — se muestra siempre, haya fallado o no.
      if (data._debug) {
        const ok = data._debug.startsWith('OK')
        setAutoError(ok ? `Debug: ${data._debug}` : `No se pudo autocompletar del todo (detalle: ${data._debug})`)
      }
      setForm((f) => ({
        ...f,
        title: f.title || data.title || '',
        description: f.description || data.description || '',
        price: f.price || data.price || '',
        currency: data.currency || f.currency,
      }))
    } catch (err) {
      setAutoError('No se pudo autocompletar automáticamente. Cargá los datos a mano.')
    } finally {
      setAutoLoading(false)
    }
  }

  async function handleImagePick(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const hadNoTitle = !form.title

    setUploadingPhoto(true)
    try {
      const urls = await Promise.all(files.map(uploadPhoto))
      setForm((f) => ({ ...f, photo_urls: [...f.photo_urls, ...urls] }))
    } catch {
      setAutoError('No se pudo subir alguna imagen.')
    } finally {
      setUploadingPhoto(false)
    }

    // Si todavía no había título, usamos la primera foto para autocompletar
    // (título/descripción/precio) además de guardarla en la galería.
    if (hadNoTitle) {
      const reader = new FileReader()
      reader.onload = () => {
        runAutocomplete(reader.result.split(',')[1], files[0].type)
      }
      reader.readAsDataURL(files[0])
    }
  }

  function handleRemovePhoto(idx) {
    setForm((f) => ({ ...f, photo_urls: f.photo_urls.filter((_, i) => i !== idx) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        ...form,
        price: form.price === '' ? null : Number(form.price),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Editar artículo' : 'Nuevo artículo'}</span>
          <button className="btn btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Link del producto</label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => set('link', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="field">
            <label>Fotos</label>
            <div className="photo-gallery">
              {form.photo_urls.map((url, idx) => (
                <div className="photo-gallery-item" key={url + idx}>
                  <img src={url} alt={`Foto ${idx + 1}`} />
                  <button
                    type="button"
                    className="photo-gallery-remove"
                    onClick={() => handleRemovePhoto(idx)}
                    aria-label="Quitar foto"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label className="photo-gallery-add">
                {uploadingPhoto ? <span className="spinner" /> : '+'}
                <input type="file" accept="image/*" multiple onChange={handleImagePick} />
              </label>
            </div>
            <p className="photo-gallery-hint">
              Subí una o más fotos del producto (o un screenshot) — se guardan todas y ayudan a autocompletar.
            </p>
          </div>

          {(autoLoading || autoError) && (
            <div className="autocomplete-status" style={autoError ? { color: '#DC2626' } : undefined}>
              {autoLoading && <span className="spinner" />}
              {autoLoading ? 'Autocompletando...' : autoError}
            </div>
          )}

          <div className="field">
            <label>Título</label>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          <div className="field">
            <label>Descripción</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Precio (opcional)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
            </div>
            <div className="field" style={{ maxWidth: 100 }}>
              <label>Moneda</label>
              <select value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Categoría</label>
              <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.value}
                  </option>
                ))}
              </select>
            </div>
            {SUBCATEGORIES[form.category] && (
              <div className="field">
                <label>Subcategoría</label>
                <select value={form.subcategory || ''} onChange={(e) => set('subcategory', e.target.value)}>
                  <option value="">Sin especificar</option>
                  {SUBCATEGORIES[form.category].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="field">
            <label>Notas propias</label>
            <textarea
              placeholder="Talle, color, para quién es..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          {isEdit && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: 4 }}
              onClick={() => onTogglePurchased(item)}
            >
              {item.purchased ? '↩ Volver a activos' : '✓ Marcar como comprado'}
            </button>
          )}

          <div className="modal-actions">
            {isEdit && (
              <button type="button" className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={onDelete}>
                Borrar
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

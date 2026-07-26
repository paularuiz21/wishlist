import { useState, useRef } from 'react'
import { CATEGORIES } from '../lib/categories'
import { uploadPhoto } from '../lib/items'

const empty = {
  link: '',
  photo_url: '',
  title: '',
  description: '',
  notes: '',
  price: '',
  currency: 'ARS',
  category: 'Otros',
}

export default function ItemForm({ item, onSave, onDelete, onTogglePurchased, onClose }) {
  const isEdit = Boolean(item)
  const [form, setForm] = useState(item ? { ...empty, ...item } : empty)
  const [autoLoading, setAutoLoading] = useState(false)
  const [autoError, setAutoError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const linkBlurHandled = useRef(false)
  // true cuando la foto actual viene de la página del link (limpia). Mientras
  // sea true, no la pisamos con un screenshot subido para autocompletar.
  const photoFromLink = useRef(Boolean(item?.link && item?.photo_url))

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function runAutocomplete(body, source) {
    setAutoLoading(true)
    setAutoError('')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('No se pudo autocompletar')
      const data = await res.json()
      if (source === 'link' && data.photo_url) photoFromLink.current = true
      setForm((f) => ({
        ...f,
        title: f.title || data.title || '',
        description: f.description || data.description || '',
        price: f.price || data.price || '',
        currency: data.currency || f.currency,
        // La foto de la página (link) siempre gana por sobre un screenshot
        // subido a mano; si no hay foto de página, se conserva la que ya haya.
        photo_url: source === 'link' && data.photo_url ? data.photo_url : f.photo_url || data.photo_url || '',
      }))
    } catch (err) {
      setAutoError('No se pudo autocompletar automáticamente. Cargá los datos a mano.')
    } finally {
      setAutoLoading(false)
    }
  }

  function handleLinkBlur() {
    if (linkBlurHandled.current) return
    if (!form.link || form.title) return
    linkBlurHandled.current = true
    runAutocomplete({ link: form.link }, 'link')
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const url = await uploadPhoto(file)
      // Si ya tenemos una foto limpia de la página del link, no la pisamos
      // con el screenshot — este solo se usa para ayudar a autocompletar.
      if (!photoFromLink.current) set('photo_url', url)
    } catch {
      setAutoError('No se pudo subir la imagen.')
      setUploadingPhoto(false)
      return
    }
    setUploadingPhoto(false)

    // Si todavía no hay título, intentamos leer la captura para autocompletar.
    if (!form.title) {
      const reader = new FileReader()
      reader.onload = () => {
        runAutocomplete({ imageBase64: reader.result.split(',')[1], mediaType: file.type }, 'image')
      }
      reader.readAsDataURL(file)
    }
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
              onBlur={handleLinkBlur}
              placeholder="https://..."
            />
          </div>

          <div className="field">
            <label>Foto</label>
            <label className="image-upload">
              {form.photo_url ? (
                <img src={form.photo_url} alt="preview" />
              ) : uploadingPhoto ? (
                'Subiendo...'
              ) : (
                'Tocá para subir una foto o screenshot'
              )}
              <input type="file" accept="image/*" onChange={handleImagePick} />
            </label>
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
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Categoría</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value}
                </option>
              ))}
            </select>
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

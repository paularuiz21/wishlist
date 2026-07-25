// Colores en gama "tierra" oscurecida — fondo pastel oscurecido + texto en negrita del mismo tono.
// Editable/ampliable: agregar una entrada acá alcanza para soportar una categoría nueva.
export const CATEGORIES = [
  { value: 'Ropa', bg: '#DCD4C9', fg: '#4A3D28' },
  { value: 'Muebles', bg: '#D9CDAE', fg: '#5C4713' },
  { value: 'Cocina', bg: '#C7D3C3', fg: '#2E4A2C' },
  { value: 'Electro', bg: '#C6D2DC', fg: '#233C4E' },
  { value: 'Belleza', bg: '#DCC6CC', fg: '#582A35' },
  { value: 'Libros', bg: '#D6D0C4', fg: '#453F2F' },
  { value: 'Otros', bg: '#D8D3D6', fg: '#3F383D' },
]

export function categoryStyle(value) {
  const cat = CATEGORIES.find((c) => c.value === value)
  if (!cat) return { bg: '#D8D3D6', fg: '#3F383D' }
  return { bg: cat.bg, fg: cat.fg }
}

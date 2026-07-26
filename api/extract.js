import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const EMPTY_RESULT = { title: null, description: null, price: null, currency: null, photo_url: null }

const SCHEMA = {
  type: 'object',
  properties: {
    title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    price: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    currency: { anyOf: [{ type: 'string', enum: ['ARS', 'USD'] }, { type: 'null' }] },
    photo_url: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
  required: ['title', 'description', 'price', 'currency', 'photo_url'],
  additionalProperties: false,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { link, imageBase64, mediaType } = req.body || {}

  try {
    let result
    if (link) {
      result = await extractFromLink(link)
    } else if (imageBase64) {
      result = await extractFromImage(imageBase64, mediaType || 'image/jpeg')
    } else {
      res.status(400).json({ error: 'Falta link o imageBase64' })
      return
    }
    res.status(200).json(result)
  } catch (err) {
    console.error('extract error:', err)
    // No bloqueamos el guardado del usuario: devolvemos vacío en vez de un error.
    res.status(200).json(EMPTY_RESULT)
  }
}

async function extractFromLink(link) {
  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    // Con tool use (web_fetch) + thinking por defecto, 2048 se quedaba corto
    // y el modelo se cortaba antes de escribir el JSON final. 4096 da margen
    // sin gastar de más: es un techo, no un piso — solo se cobra lo que
    // realmente se genera.
    max_tokens: 4096,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    tools: [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 1, max_content_tokens: 4000 }],
    messages: [
      {
        role: 'user',
        content: `Buscá esta página de producto y extraé sus datos: ${link}

Devolvé:
- title: nombre del producto, corto
- description: descripción breve del producto (1-2 oraciones)
- price: precio numérico (sin símbolo de moneda ni separadores de miles)
- currency: "ARS" o "USD" según corresponda a la tienda/página
- photo_url: URL absoluta de la imagen principal del producto (ej. meta tag og:image), o null si no se encuentra

Si algún dato no está disponible en la página, usá null para ese campo. No inventes datos. Respondé únicamente con el JSON, sin texto adicional antes ni después.`,
      },
    ],
  })
  return parseJsonResponse(response)
}

async function extractFromImage(imageBase64, mediaType) {
  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 3072,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
          {
            type: 'text',
            text: `Esta es una foto o screenshot de la página de un producto. Extraé:
- title: nombre del producto
- description: descripción breve (1-2 oraciones)
- price: precio numérico visible (sin símbolo ni separadores de miles)
- currency: "ARS" o "USD" según corresponda
- photo_url: siempre null (no aplica en este caso)

Si algún dato no es visible o legible en la imagen, usá null para ese campo. No inventes datos. Respondé únicamente con el JSON, sin texto adicional antes ni después.`,
          },
        ],
      },
    ],
  })
  return parseJsonResponse(response)
}

function parseJsonResponse(response) {
  if (response.stop_reason === 'refusal') return EMPTY_RESULT
  // Tomamos el ÚLTIMO bloque de texto, no el primero: si el modelo escribe
  // algo antes de llamar a la herramienta (server tool), ese texto también
  // es type "text" y quedaría antes del JSON final.
  const textBlocks = response.content.filter((b) => b.type === 'text')
  const textBlock = textBlocks[textBlocks.length - 1]
  if (!textBlock) return EMPTY_RESULT
  try {
    return { ...EMPTY_RESULT, ...JSON.parse(textBlock.text) }
  } catch {
    return EMPTY_RESULT
  }
}

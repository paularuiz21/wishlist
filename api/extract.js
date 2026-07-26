import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const EMPTY_RESULT = { title: null, description: null, price: null, currency: null, photo_url: null }

const IMAGE_SCHEMA = {
  type: 'object',
  properties: {
    title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    price: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    currency: { anyOf: [{ type: 'string', enum: ['ARS', 'USD'] }, { type: 'null' }] },
  },
  required: ['title', 'description', 'price', 'currency'],
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
    // No bloqueamos el guardado del usuario: devolvemos vacío en vez de un
    // error duro, pero incluimos el detalle en _debug para poder
    // diagnosticar desde el Network tab / la propia UI sin acceso a los
    // logs de Vercel.
    res.status(200).json({ ...EMPTY_RESULT, _debug: String((err && err.message) || err) })
  }
}

async function extractFromLink(link) {
  // Ojo: sin output_config.format acá a propósito — combinado con el tool
  // use de web_fetch daba resultados poco confiables. Le pedimos el JSON por
  // prompt y lo parseamos nosotros (más tolerante a variaciones).
  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 4096,
    output_config: { effort: 'low' },
    tools: [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 1, max_content_tokens: 4000 }],
    messages: [
      {
        role: 'user',
        content: `Buscá esta página de producto: ${link}

Después de leerla, respondé ÚNICAMENTE con un objeto JSON (sin bloque de código markdown, sin backticks, sin ningún texto antes o después) con exactamente estas claves:

{
  "title": string o null (nombre del producto, corto),
  "description": string o null (descripción breve, 1-2 oraciones),
  "price": number o null (precio numérico, sin símbolo ni separadores de miles),
  "currency": "ARS", "USD" o null (según corresponda a la tienda),
  "photo_url": string o null (URL absoluta de la imagen principal del producto, ej. meta tag og:image)
}

Si algún dato no está disponible en la página, usá null para ese campo. No inventes datos.`,
      },
    ],
  })
  return parseJsonResponse(response)
}

async function extractFromImage(imageBase64, mediaType) {
  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 3072,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: IMAGE_SCHEMA } },
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

Si algún dato no es visible o legible en la imagen, usá null para ese campo. No inventes datos.`,
          },
        ],
      },
    ],
  })
  return parseJsonResponse(response)
}

function parseJsonResponse(response) {
  if (response.stop_reason === 'refusal') {
    return { ...EMPTY_RESULT, _debug: `refusal: ${JSON.stringify(response.stop_details || {})}` }
  }
  // Tomamos el ÚLTIMO bloque de texto, no el primero: si el modelo escribe
  // algo antes de llamar a la herramienta (server tool), ese texto también
  // es type "text" y quedaría antes del JSON final.
  const textBlocks = response.content.filter((b) => b.type === 'text')
  const textBlock = textBlocks[textBlocks.length - 1]
  if (!textBlock) {
    return { ...EMPTY_RESULT, _debug: `sin bloque de texto en la respuesta (stop_reason=${response.stop_reason})` }
  }
  // El modelo a veces envuelve el JSON en un bloque de código markdown pese a
  // pedirle que no lo haga — lo sacamos si aparece.
  const raw = textBlock.text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
  try {
    return { ...EMPTY_RESULT, ...JSON.parse(raw) }
  } catch {
    return { ...EMPTY_RESULT, _debug: `no se pudo parsear la respuesta: ${raw.slice(0, 300)}` }
  }
}

import Anthropic from '@anthropic-ai/sdk'
import { CURRENCIES } from '../src/lib/currencies.js'

const client = new Anthropic()

const CURRENCY_CODES = CURRENCIES.map((c) => c.value)

const EMPTY_RESULT = { title: null, description: null, price: null, currency: null }

const SCHEMA = {
  type: 'object',
  properties: {
    title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    price: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    currency: { anyOf: [{ type: 'string', enum: CURRENCY_CODES }, { type: 'null' }] },
  },
  required: ['title', 'description', 'price', 'currency'],
  additionalProperties: false,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { imageBase64, mediaType } = req.body || {}
  if (!imageBase64) {
    res.status(400).json({ error: 'Falta imageBase64' })
    return
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 3072,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
            {
              type: 'text',
              text: `Esta es una foto o screenshot de la página de un producto. Extraé:
- title: nombre del producto
- description: descripción breve (1-2 oraciones)
- price: precio numérico visible (sin símbolo ni separadores de miles)
- currency: la moneda según el símbolo o contexto (${CURRENCY_CODES.join(', ')})

Si algún dato no es visible o legible en la imagen, usá null para ese campo. No inventes datos.`,
            },
          ],
        },
      ],
    })
    res.status(200).json(parseJsonResponse(response))
  } catch (err) {
    console.error('extract error:', err)
    // No bloqueamos el guardado del usuario: devolvemos vacío en vez de un
    // error duro, pero incluimos el detalle en _debug para poder
    // diagnosticar desde el Network tab / la propia UI sin acceso a los
    // logs de Vercel.
    res.status(200).json({ ...EMPTY_RESULT, _debug: String((err && err.message) || err) })
  }
}

function parseJsonResponse(response) {
  if (response.stop_reason === 'refusal') {
    return { ...EMPTY_RESULT, _debug: `refusal: ${JSON.stringify(response.stop_details || {})}` }
  }
  const textBlocks = response.content.filter((b) => b.type === 'text')
  const textBlock = textBlocks[textBlocks.length - 1]
  if (!textBlock) {
    return { ...EMPTY_RESULT, _debug: `sin bloque de texto (stop_reason=${response.stop_reason})` }
  }
  try {
    return { ...EMPTY_RESULT, ...JSON.parse(textBlock.text) }
  } catch {
    return { ...EMPTY_RESULT, _debug: `no se pudo parsear: ${textBlock.text.slice(0, 250)}` }
  }
}

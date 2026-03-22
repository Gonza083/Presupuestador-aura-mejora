import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

// Extract technical specs from a product PDF
export async function extractProductSpecs(pdfUrl) {
  // Fetch the PDF and convert to base64
  const response = await fetch(pdfUrl);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64
          }
        },
        {
          type: 'text',
          text: `Analizá esta ficha técnica de producto y extraé las especificaciones más relevantes.
Devolvé un JSON con los campos clave del producto (como potencia, voltaje, conectividad, dimensiones, peso, temperatura de operación, protocolos, compatibilidad, resolución, etc. — según lo que aplique).
También incluí un campo "resumen" con una descripción técnica breve de 2-3 oraciones.
Respondé SOLO con el JSON, sin texto adicional ni bloques de código.`
        }
      ]
    }]
  });

  return message.content[0]?.text || null;
}

// Generate budget suggestions based on requirements
export async function generateBudgetSuggestions(requirements, products) {
  const productList = products
    .filter(p => p.ai_specs || p.description)
    .map(p => {
      const specs = p.ai_specs || p.description || '';
      return `ID: ${p.id}
Nombre: ${p.name}
Código: ${p.code || 'N/A'}
Precio unitario: $${p.final_price || 0}
Especificaciones: ${specs}`;
    })
    .join('\n---\n');

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Sos un experto en instalaciones de domótica, seguridad, redes, iluminación y audio/video para Aura Hogar.

El cliente necesita: ${requirements}

Catálogo de productos disponibles:
${productList}

Seleccioná los productos más adecuados del catálogo para cumplir con el requerimiento y especificá la cantidad de cada uno.
Considerá compatibilidad, redundancia necesaria y buenas prácticas de instalación.

Respondé SOLO con un JSON en este formato exacto, sin texto adicional:
[
  {"id": "uuid-del-producto", "quantity": 2, "reason": "motivo breve de por qué este producto y esa cantidad"}
]`
    }]
  });

  const text = message.content.find(b => b.type === 'text')?.text || '[]';

  // Clean up the response in case it has markdown code blocks
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(cleaned);
}

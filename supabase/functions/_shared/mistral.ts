// Aufruf von Mistral – gemeinsam für die Edge Function `analyse` und das Testset (npm run ki:testset),
// damit beide mit denselben Einstellungen fragen.

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'
export const MISTRAL_STANDARDMODELL = 'mistral-small-latest'

export interface ChatNachricht {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function frageMistral(
  system: string,
  nachrichten: ChatNachricht[],
  zugang: { key: string; modell?: string | null },
  maxTokens = 700,
): Promise<unknown> {
  const res = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${zugang.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: zugang.modell || MISTRAL_STANDARDMODELL,
      temperature: 0.1,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, ...nachrichten],
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`Mistral ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const daten = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  return JSON.parse(daten.choices?.[0]?.message?.content ?? '{}')
}

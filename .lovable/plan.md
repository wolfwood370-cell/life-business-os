# Ottimizzazione routing modelli AI

Tre modifiche a un solo parametro `model` in altrettante edge function. Nessuna modifica a prompt, schema, persistenza o UI. Nessun cambio al frontend (`AiFollowupGenerator.tsx` chiama già `generate-sales-copy`, basta cambiare il modello nell'edge function).

## Modifiche

| File | Modello attuale | Nuovo modello | Motivazione |
|---|---|---|---|
| `supabase/functions/generate-global-cfo/index.ts` (riga 110) | `google/gemini-2.5-pro` | `google/gemini-3.1-pro-preview` | Briefing strategico CFO: serve top-tier reasoning su dati finanziari complessi |
| `supabase/functions/analyze-win-loss/index.ts` (riga 168) | `google/gemini-2.5-pro` | `google/gemini-3-flash-preview` | Sales Coach Win/Loss: bilanciato, più veloce ed economico mantenendo qualità di analisi |
| `supabase/functions/generate-sales-copy/index.ts` (riga 113) | `google/gemini-3-flash-preview` | `google/gemini-2.5-flash-lite` | Follow-up email/messaggi (usato da `AiFollowupGenerator.tsx`): testo breve, latenza minima e costo contenuto |

## Note tecniche

- Le edge function vengono ridepoiate automaticamente al salvataggio.
- I briefing già salvati in `finance_coach_config.latest_briefing` e i report in `sales_coach_config.latest_report` restano intatti — la modifica vale solo sulle nuove generazioni.
- Gli error handler 429 / 402 / 500 rimangono invariati.
- `google/gemini-3.1-pro-preview` è un preview di nuova generazione: qualità superiore, costo per token più alto del 2.5-pro. Se vuoi un'opzione più conservativa posso usare `google/gemini-3-flash-preview` anche per il CFO.

## Trade-off di costo (per generazione)

- CFO: leggermente **più caro** (preview top-tier) → giustificato dal valore strategico del briefing.
- Sales Coach: **più economico** e **più veloce** del 2.5-pro precedente.
- Follow-up: **molto più economico** e quasi istantaneo (Flash-Lite è il più rapido della famiglia 2.5).

Risultato netto: probabile riduzione dei costi AI complessivi, dato che follow-up e Sales Coach vengono usati più frequentemente del briefing CFO.

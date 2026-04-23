// Edge Function: analyze-win-loss
// Analizza le obiezioni reali dei clienti persi e genera un report AI in italiano.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LostClient {
  name?: string;
  lead_source?: string;
  objection_stated?: string;
  objection_real?: string;
  root_motivator?: string;
}

const SYSTEM_PROMPT = `Sei un coach di vendita esperto in personal training high-ticket.
Analizzi le trattative perse di un singolo Personal Trainer indipendente per identificare i pattern reali di rifiuto.

Devi produrre un report sintetico in italiano con DUE sezioni:
1) "perche_perdiamo": esattamente 3 bullet brevi (max 18 parole ciascuno) che identificano i pattern ricorrenti tra le obiezioni reali. Ogni bullet deve essere concreto, non generico.
2) "azioni_correttive": esattamente 3 bullet azionabili (max 22 parole ciascuno) che il PT può applicare la prossima settimana per migliorare il pitch. Niente teoria, solo cose da fare.

Rispondi SOLO chiamando la funzione "return_winloss_report".`;

const TOOL = {
  type: "function",
  function: {
    name: "return_winloss_report",
    description: "Restituisce il report Win/Loss strutturato.",
    parameters: {
      type: "object",
      properties: {
        perche_perdiamo: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3,
        },
        azioni_correttive: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3,
        },
        sintesi: {
          type: "string",
          description: "Una frase sintetica (max 25 parole) che riassume il pattern principale.",
        },
      },
      required: ["perche_perdiamo", "azioni_correttive", "sintesi"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY non configurata" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lost_clients } = (await req.json()) as { lost_clients: LostClient[] };
    if (!Array.isArray(lost_clients) || lost_clients.length === 0) {
      return new Response(JSON.stringify({ error: "Nessun cliente perso da analizzare" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formatted = lost_clients
      .map((c, i) => {
        return `Caso ${i + 1}:
- Fonte: ${c.lead_source ?? 'n/d'}
- Obiezione dichiarata: ${c.objection_stated || '—'}
- Obiezione reale: ${c.objection_real || '—'}
- Motivazione iniziale: ${c.root_motivator || '—'}`;
      })
      .join('\n\n');

    const userPrompt = `Ecco ${lost_clients.length} trattative perse da analizzare:\n\n${formatted}\n\nGenera il report seguendo le regole.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "return_winloss_report" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Limite di richieste raggiunto. Riprova tra qualche istante." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Crediti AI esauriti. Aggiungi fondi al workspace." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Errore del gateway AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("Risposta AI senza tool_call", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Risposta AI non valida" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: "JSON AI non parseable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ report: parsed, analyzed: lost_clients.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-win-loss error", e);
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

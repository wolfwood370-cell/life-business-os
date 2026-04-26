// Edge Function: generate-sales-copy
// Generates a 3-part Italian WhatsApp follow-up sequence using Lovable AI Gateway.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Payload {
  name?: string;
  lead_source?: string;
  root_motivator?: string;
  objection_stated?: string;
  objection_real?: string;
}

const SYSTEM_PROMPT = `Sei un High-Ticket Fitness Closer italiano, esperto in vendita consulenziale di percorsi di Personal Training premium. 
Il tuo stile è empatico, diretto, mai spammoso, mai aggressivo. Non usare emoji eccessive (massimo 1-2 per messaggio).
Non usare frasi da call center come "Spero tu stia bene" o "Volevo sapere se ti interessa ancora".
Scrivi come scriverebbe un coach di fiducia su WhatsApp: tono umano, frasi brevi, una sola call-to-action soft per messaggio.
Ogni messaggio deve essere autoconclusivo e leggibile in meno di 15 secondi.

Devi generare una sequenza di 3 messaggi WhatsApp (Giorno 1, Giorno 3, Giorno 7) per un follow-up post-trattativa.

Regole strategiche:
- Giorno 1: ricollegati alla "Motivazione Profonda" del cliente. Ricordagli perché ha iniziato a parlare con te. Nessuna pressione di vendita.
- Giorno 3: affronta l'OBIEZIONE REALE (non quella dichiarata). Riformulala come una preoccupazione comprensibile e mostra una prospettiva nuova. Inserisci una mini-prova sociale o un caso simile.
- Giorno 7: chiusura soft. Offri una scelta semplice (es. "ne riparliamo lunedì o preferisci che ti lasci spazio?"). Lascia la porta aperta senza implorare.

Rispondi SOLO chiamando la funzione "return_followup_sequence". Niente testo extra.`;

const TOOL = {
  type: "function",
  function: {
    name: "return_followup_sequence",
    description: "Restituisce la sequenza di 3 messaggi WhatsApp di follow-up.",
    parameters: {
      type: "object",
      properties: {
        day_1: {
          type: "object",
          properties: {
            title: { type: "string", description: "Titolo breve del messaggio (es. 'Aggancio Emotivo')" },
            message: { type: "string", description: "Testo del messaggio WhatsApp del Giorno 1" },
          },
          required: ["title", "message"],
          additionalProperties: false,
        },
        day_3: {
          type: "object",
          properties: {
            title: { type: "string" },
            message: { type: "string" },
          },
          required: ["title", "message"],
          additionalProperties: false,
        },
        day_7: {
          type: "object",
          properties: {
            title: { type: "string" },
            message: { type: "string" },
          },
          required: ["title", "message"],
          additionalProperties: false,
        },
      },
      required: ["day_1", "day_3", "day_7"],
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

    const payload = (await req.json()) as Payload;
    const name = (payload.name ?? "").trim();
    if (!name) {
      return new Response(JSON.stringify({ error: "Nome cliente mancante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Cliente: ${name}
Fonte contatto: ${payload.lead_source ?? "n/d"}
Motivazione Profonda (root_motivator): ${payload.root_motivator || "non specificata"}
Obiezione Dichiarata (di superficie): ${payload.objection_stated || "non specificata"}
Obiezione Reale (causa radice): ${payload.objection_real || "non specificata"}

Genera la sequenza di follow-up WhatsApp in italiano (Giorno 1, 3, 7) seguendo le regole strategiche.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "return_followup_sequence" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Limite di richieste raggiunto. Riprova tra qualche istante." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Crediti AI esauriti. Aggiungi fondi al workspace Lovable." }), {
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

    return new Response(JSON.stringify({ sequence: parsed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-sales-copy error", e);
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Edge Function: analyze-win-loss
// Sales Strategy Director: pattern recognition su trattative perse + nudge imprenditoriale.

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

interface GoalContext {
  title?: string;
  monthly_target?: number;
  current_monthly_revenue?: number;
  avg_deal_value?: number;
}

const SYSTEM_PROMPT = `Sei un Direttore Vendite / consulente strategico di un brand premium di Personal Training high-ticket in Italia.
Stai analizzando le trattative perse di un singolo Personal Trainer indipendente per individuare attriti ricorrenti e correggere il suo pitch la settimana successiva.

Hai accesso a TRE documenti operativi del PT:
1) Il suo SCRIPT DI VENDITA attuale
2) Il processo con cui gestisce le SESSIONI GRATUITE
3) Il processo con cui gestisce i PT PACK da 99€

Devi agire come un consulente che ha letto questi documenti e confronta le obiezioni reali dei clienti persi con lo script/processi. Quando uno schema emerge (es. più clienti con obiezione "budget" mentre lo script non gestisce bene il budget), DEVI citarlo esplicitamente.

Devi essere:
- Concreto: niente teoria generica, solo pattern osservabili nei casi forniti confrontati con lo script reale.
- Strategico: collega le obiezioni reali a un cambiamento specifico nello script o nei processi.
- Imprenditoriale: tieni conto del traguardo mensile del PT e quantifica il gap.

Rispondi SOLO chiamando la funzione "return_winloss_report".`;

const TOOL = {
  type: "function",
  function: {
    name: "return_winloss_report",
    description: "Restituisce il report Win/Loss strutturato con nudge imprenditoriale.",
    parameters: {
      type: "object",
      properties: {
        friction_points: {
          type: "array",
          description: "Esattamente 2 punti di attrito principali individuati nei pattern.",
          items: {
            type: "object",
            properties: {
              titolo: { type: "string", description: "Etichetta breve dell'attrito (max 6 parole)." },
              descrizione: { type: "string", description: "Spiegazione concreta in max 25 parole." },
            },
            required: ["titolo", "descrizione"],
            additionalProperties: false,
          },
          minItems: 2,
          maxItems: 2,
        },
        perche_perdiamo: {
          type: "array",
          description: "Esattamente 3 bullet brevi (max 18 parole) sui pattern ricorrenti tra le obiezioni reali.",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3,
        },
        azioni_correttive: {
          type: "array",
          description: "Esattamente 3 azioni concrete (max 22 parole) da applicare nel pitch iniziale in Fitactive la prossima settimana.",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3,
        },
        sintesi: {
          type: "string",
          description: "Una frase (max 25 parole) che riassume il pattern principale.",
        },
        entrepreneurial_nudge: {
          type: "string",
          description: "Frase motivazionale e quantitativa (max 35 parole) che lega il gap mensile al goal di vita (es. viaggio Tokyo): quanti deal ancora servono per restare in traiettoria. Tono diretto, professionale, non paternalistico.",
        },
      },
      required: ["friction_points", "perche_perdiamo", "azioni_correttive", "sintesi", "entrepreneurial_nudge"],
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

    const { lost_clients, goal_context, strategy_context } = (await req.json()) as {
      lost_clients: LostClient[];
      goal_context?: GoalContext;
      strategy_context?: {
        sales_script?: string;
        free_session_process?: string;
        pt_pack_process?: string;
      };
    };
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

    const goalBlock = goal_context
      ? `\n\nContesto imprenditoriale del PT:
- Obiettivo di vita attivo: ${goal_context.title || 'non specificato'}
- Target di fatturato mensile (€): ${goal_context.monthly_target ?? 'n/d'}
- Fatturato mensile attuale (€): ${goal_context.current_monthly_revenue ?? 'n/d'}
- Valore medio per deal (€/mese): ${goal_context.avg_deal_value ?? 'n/d'}

Calcola il gap rispetto al target e usalo per il campo "entrepreneurial_nudge" indicando quanti deal aggiuntivi servono per restare in traiettoria.`
      : '';

    const strategyBlock = strategy_context && (strategy_context.sales_script || strategy_context.free_session_process || strategy_context.pt_pack_process)
      ? `\n\n--- DOCUMENTI OPERATIVI DEL PT ---

SCRIPT DI VENDITA ATTUALE:
${strategy_context.sales_script?.trim() || '(non fornito)'}

PROCESSO SESSIONI GRATUITE:
${strategy_context.free_session_process?.trim() || '(non fornito)'}

PROCESSO PT PACK 99€:
${strategy_context.pt_pack_process?.trim() || '(non fornito)'}

IMPORTANTE: Confronta le obiezioni reali dei casi sopra con questi documenti. Se noti che lo script non affronta un'obiezione che è emersa più volte, citalo ESPLICITAMENTE nei campi "perche_perdiamo" o "azioni_correttive". Esempio: "Il tuo script non affronta l'obiezione budget emersa in 3 casi su 5".`
      : '';

    const userPrompt = `Ecco ${lost_clients.length} trattative perse da analizzare:\n\n${formatted}${goalBlock}${strategyBlock}\n\nGenera il report seguendo la struttura del tool.`;

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
      return new Response(JSON.stringify({ error: "Servizio AI momentaneamente non disponibile" }), {
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

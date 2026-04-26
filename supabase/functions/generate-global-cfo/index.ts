const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Payload {
  windowDays: number;
  ledger: {
    grossRevenue: number;
    businessExpenses: number;
    personalExpenses: number;
    personalIncomes: number;
    netBusiness: number;
    freeCashFlow: number;
    topPersonalCategories: Array<{ name: string; amount: number }>;
    topBusinessCategories: Array<{ name: string; amount: number }>;
    serviceMix?: Array<{ name: string; count: number; revenue: number }>;
  };
  goal: {
    title: string;
    target: number;
    current: number;
    deadline: string;
    monthsLeft: number;
  } | null;
  crm: {
    winRate: number;
    pitchedCount: number;
    closedWon: number;
    avgTicket: number;
    pipelineVolume: number;
    activeClients: number;
    expiringIn30?: number;
    expiringIn60?: number;
    expiringClients?: Array<{ name: string; service: string | null; end: string | null; daysLeft: number | null }>;
  };
  derived: {
    requiredMonthlyNet: number;
    requiredMonthlyGross: number;
    requiredClientsPerMonth: number;
    requiredLeadsPerMonth: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const payload = (await req.json()) as Payload;

    const systemPrompt = `You are an elite, ruthless, highly strategic AI CFO ("Orizzonte Strategico") for a freelance personal trainer. Analyze the provided financial ledger (business vs personal spending), the SERVICE MIX (which products are actually selling and at what revenue), the UPCOMING TRAINING EXPIRATIONS (active clients whose program ends soon), AND sales CRM metrics (Win rate, pipeline). Write a highly actionable, punchy 3-paragraph strategic briefing in Italian. Use Markdown headings (### Diagnosi, ### Strategia di Vendita, ### Strategia di Spesa). Paragraph 1: Diagnose the main bottleneck and ALWAYS warn about expiring training programs if any (e.g., "Hai 3 percorsi in scadenza nei prossimi 30 giorni, focalizzati sui rinnovi"). Paragraph 2: Define the exact sales strategy for this month with specific numbers (calls/week, leads needed) AND which service to push (referencing the service mix). Paragraph 3: Define the exact expense-cutting strategy citing the top categories. Be direct, professional, and use numbers in EUR.`;

    const userPrompt = `# Financial DNA — last ${payload.windowDays} days

## Ledger
- Gross Business Revenue: € ${payload.ledger.grossRevenue.toFixed(2)}
- Business Expenses: € ${payload.ledger.businessExpenses.toFixed(2)}
- Net Business: € ${payload.ledger.netBusiness.toFixed(2)}
- Personal Incomes: € ${payload.ledger.personalIncomes.toFixed(2)}
- Personal/Lifestyle Expenses: € ${payload.ledger.personalExpenses.toFixed(2)}
- Free Cash Flow: € ${payload.ledger.freeCashFlow.toFixed(2)}
- Top personal expense categories: ${payload.ledger.topPersonalCategories.map(c => `${c.name} (€${c.amount.toFixed(0)})`).join(", ") || "n/a"}
- Top business expense categories: ${payload.ledger.topBusinessCategories.map(c => `${c.name} (€${c.amount.toFixed(0)})`).join(", ") || "n/a"}
- Service mix sold: ${payload.ledger.serviceMix && payload.ledger.serviceMix.length > 0 ? payload.ledger.serviceMix.map(s => `${s.name} ×${s.count} (€${s.revenue.toFixed(0)})`).join(", ") : "n/a"}

## Active Goal
${payload.goal ? `- ${payload.goal.title}: € ${payload.goal.current.toFixed(0)} / € ${payload.goal.target.toFixed(0)} entro ${payload.goal.deadline} (${payload.goal.monthsLeft} mesi residui)` : "- Nessun obiettivo attivo"}

## CRM (last 90 days)
- Pitched clients: ${payload.crm.pitchedCount}
- Closed Won: ${payload.crm.closedWon}
- Win Rate: ${(payload.crm.winRate * 100).toFixed(1)}%
- Average Ticket Size: € ${payload.crm.avgTicket.toFixed(2)}
- Active pipeline volume (€ potenziale): € ${payload.crm.pipelineVolume.toFixed(2)}
- Active clients: ${payload.crm.activeClients}

## Training Expirations (active clients)
- Expiring in next 30 days: ${payload.crm.expiringIn30 ?? 0}
- Expiring in next 60 days: ${payload.crm.expiringIn60 ?? 0}
${payload.crm.expiringClients && payload.crm.expiringClients.length > 0
  ? payload.crm.expiringClients.slice(0, 8).map(c => `  • ${c.name}${c.service ? ` (${c.service})` : ''} — ${c.daysLeft ?? '?'}g (${c.end ?? '—'})`).join("\n")
  : "  • Nessuna scadenza imminente"}

## Required to hit goal
- Net needed/month: € ${payload.derived.requiredMonthlyNet.toFixed(2)}
- Gross needed/month: € ${payload.derived.requiredMonthlyGross.toFixed(2)}
- Clients to close/month: ${payload.derived.requiredClientsPerMonth.toFixed(1)}
- Leads needed/month: ${payload.derived.requiredLeadsPerMonth.toFixed(1)}

Genera il briefing strategico ora.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Limite di richieste superato. Riprova tra poco." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Credito AI esaurito. Aggiungi credito nelle impostazioni." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Errore AI gateway" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const briefing = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ briefing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-global-cfo error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

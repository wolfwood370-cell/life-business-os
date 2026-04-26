-- Phase 39: rinomina "PT Pack 99€" in "PT Pack Premium" e ricalcola le durate
-- contratto in mesi commerciali (1 mese = 28 giorni).

-- 1) Rinomina servizio nelle tabelle
UPDATE public.clients
   SET service_sold = 'PT Pack Premium'
 WHERE service_sold = 'PT Pack 99€';

UPDATE public.financial_movements
   SET service_sold = 'PT Pack Premium'
 WHERE service_sold = 'PT Pack 99€';

UPDATE public.services
   SET name = 'PT Pack Premium'
 WHERE name = 'PT Pack 99€';

-- 2) PT Pack Premium non ha durata: training_end_date a NULL
UPDATE public.clients
   SET training_end_date = NULL
 WHERE service_sold = 'PT Pack Premium';

-- 3) Ricalcola training_end_date come start + (mesi * 28 giorni) per i clienti
--    con servizio assegnato e date valorizzate. I servizi short (Founders Circle,
--    Programmazione Avanzata) restano fissi a 28 giorni.
WITH active AS (
  SELECT
    id,
    service_sold,
    training_start_date,
    training_end_date,
    CASE
      WHEN service_sold IN ('Founders Circle','Programmazione Avanzata') THEN 1
      ELSE GREATEST(1, ROUND((training_end_date - training_start_date)::numeric / 30.44))::int
    END AS raw_months
  FROM public.clients
  WHERE service_sold IS NOT NULL
    AND service_sold <> 'PT Pack Premium'
    AND training_start_date IS NOT NULL
    AND training_end_date IS NOT NULL
),
snapped AS (
  SELECT
    id,
    service_sold,
    training_start_date,
    CASE
      WHEN service_sold IN ('Founders Circle','Programmazione Avanzata') THEN 1
      WHEN raw_months <= 1 THEN 1
      WHEN raw_months <= 3 THEN 3
      WHEN raw_months <= 6 THEN 6
      ELSE 12
    END AS months
  FROM active
)
UPDATE public.clients c
   SET training_end_date = s.training_start_date + (s.months * 28)
  FROM snapped s
 WHERE c.id = s.id;
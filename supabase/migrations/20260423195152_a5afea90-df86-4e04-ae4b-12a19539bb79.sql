CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open access services"
ON public.services
FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO public.services (category, name, price, sort_order) VALUES
  ('Light', '3 Mesi', 450, 10),
  ('Light', '6 Mesi', 900, 11),
  ('Light', '12 Mesi', 1800, 12),
  ('Base', '3 Mesi', 555, 20),
  ('Base', '6 Mesi', 1110, 21),
  ('Base', '12 Mesi', 2220, 22),
  ('Premium', '3 Mesi', 855, 30),
  ('Premium', '6 Mesi', 1710, 31),
  ('Premium', '12 Mesi', 3420, 32),
  ('Plus', '3 Mesi', 1035, 40),
  ('Plus', '6 Mesi', 2070, 41),
  ('Plus', '12 Mesi', 4140, 42),
  ('NC Nutrition', 'Mensile', 34.90, 50),
  ('NC Nutrition', 'Trimestrale', 99, 51),
  ('NC Nutrition', 'Semestrale', 189, 52),
  ('Programmazione Avanzata', 'Mensile', 90, 60);
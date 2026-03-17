-- Industries master table
CREATE TABLE public.scoping_industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  examples text[] DEFAULT '{}',
  available boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Categories per industry
CREATE TABLE public.scoping_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id uuid REFERENCES public.scoping_industries(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Questions per category
CREATE TABLE public.scoping_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.scoping_categories(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  detail_prompt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.scoping_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoping_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoping_questions ENABLE ROW LEVEL SECURITY;

-- Read: public (clients need to load questions)
CREATE POLICY "Anyone can read industries" ON public.scoping_industries FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read categories" ON public.scoping_categories FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read questions" ON public.scoping_questions FOR SELECT TO public USING (true);

-- Write: authenticated only (admin)
CREATE POLICY "Auth can insert industries" ON public.scoping_industries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update industries" ON public.scoping_industries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete industries" ON public.scoping_industries FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth can insert categories" ON public.scoping_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update categories" ON public.scoping_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete categories" ON public.scoping_categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth can insert questions" ON public.scoping_questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update questions" ON public.scoping_questions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth can delete questions" ON public.scoping_questions FOR DELETE TO authenticated USING (true);
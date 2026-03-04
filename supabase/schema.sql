-- GardenPlot Database Schema

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  zone TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gardens
CREATE TABLE public.gardens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('indoor', 'outdoor')),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garden Beds
CREATE TABLE public.garden_beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id UUID NOT NULL REFERENCES public.gardens(id) ON DELETE CASCADE,
  shape TEXT NOT NULL CHECK (shape IN ('rectangle', 'l-shape', 'circle', 'raised')),
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  width REAL NOT NULL DEFAULT 200,
  height REAL NOT NULL DEFAULT 100,
  name TEXT NOT NULL DEFAULT 'New Bed'
);

-- Plants (placed in beds)
CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_bed_id UUID NOT NULL REFERENCES public.garden_beds(id) ON DELETE CASCADE,
  plant_type TEXT NOT NULL,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  planted_date DATE,
  notes TEXT
);

-- Plant Catalog (reference data)
CREATE TABLE public.plant_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  spacing INTEGER NOT NULL,
  companion_plants TEXT[] DEFAULT '{}',
  enemy_plants TEXT[] DEFAULT '{}',
  days_to_harvest INT4RANGE,
  sun_needs TEXT NOT NULL CHECK (sun_needs IN ('full', 'partial', 'shade')),
  water_needs TEXT NOT NULL CHECK (water_needs IN ('low', 'medium', 'high')),
  zones INT4RANGE
);

-- Weather Alerts
CREATE TABLE public.weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Conversations
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Garden History
CREATE TABLE public.garden_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id UUID NOT NULL REFERENCES public.gardens(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  notes TEXT,
  yield_data JSONB DEFAULT '{}'
);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garden_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garden_history ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own gardens" ON public.gardens FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own garden beds" ON public.garden_beds FOR ALL
  USING (garden_id IN (SELECT id FROM public.gardens WHERE user_id = auth.uid()));

CREATE POLICY "Users can CRUD own plants" ON public.plants FOR ALL
  USING (garden_bed_id IN (
    SELECT gb.id FROM public.garden_beds gb
    JOIN public.gardens g ON gb.garden_id = g.id
    WHERE g.user_id = auth.uid()
  ));

CREATE POLICY "Users can CRUD own weather alerts" ON public.weather_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own AI conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own garden history" ON public.garden_history FOR ALL
  USING (garden_id IN (SELECT id FROM public.gardens WHERE user_id = auth.uid()));

-- Plant catalog is readable by all authenticated users
CREATE POLICY "Plant catalog is readable" ON public.plant_catalog FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_gardens_user ON public.gardens(user_id);
CREATE INDEX idx_garden_beds_garden ON public.garden_beds(garden_id);
CREATE INDEX idx_plants_bed ON public.plants(garden_bed_id);
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id);

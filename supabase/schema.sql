-- ============================================================
-- GymBooking Schema — Humans.tech
-- Esegui nel SQL Editor del tuo progetto Supabase
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABELLE
-- ------------------------------------------------------------

-- Slot disponibili (generati dalla funzione generate_slots)
CREATE TABLE IF NOT EXISTS slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  max_capacity int NOT NULL DEFAULT 7,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, start_time, end_time)
);

-- Prenotazioni degli utenti
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid REFERENCES slots(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(slot_id, user_id)
);

-- Lista admin (email)
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. TRIGGER — BLOCCO DOMINIO @humans.tech
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_email_domain()
RETURNS trigger AS $$
BEGIN
  IF NEW.email NOT LIKE '%@humans.tech' THEN
    RAISE EXCEPTION 'Access denied: only @humans.tech accounts are allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_company_domain ON auth.users;
CREATE TRIGGER enforce_company_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_email_domain();

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------

ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Slots: tutti gli autenticati possono leggere
CREATE POLICY "slots_select_authenticated"
  ON slots FOR SELECT
  TO authenticated
  USING (true);

-- Bookings: l'utente vede solo le sue
CREATE POLICY "bookings_select_own"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Bookings: gli admin vedono tutto
CREATE POLICY "bookings_select_admin"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
  );

-- Bookings: l'utente può prenotare (con check capacità atomico)
CREATE POLICY "bookings_insert_own"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      SELECT COUNT(*) FROM bookings b WHERE b.slot_id = bookings.slot_id
    ) < (
      SELECT max_capacity FROM slots s WHERE s.id = bookings.slot_id
    )
  );

-- Bookings: l'utente può cancellare solo la sua
CREATE POLICY "bookings_delete_own"
  ON bookings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins: solo gli admin possono leggere la tabella
CREATE POLICY "admins_select"
  ON admins FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (SELECT email FROM admins)
  );

-- ------------------------------------------------------------
-- 4. FUNZIONE generate_slots
-- Genera slot per i prossimi N giorni (solo lun-ven)
-- Idempotente: usa ON CONFLICT DO NOTHING
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_slots(days_ahead int DEFAULT 14)
RETURNS void AS $$
DECLARE
  current_date date := CURRENT_DATE;
  target_date date;
  i int;
  slot_times time[][] := ARRAY[
    ARRAY['07:00'::time, '08:00'::time],
    ARRAY['08:00'::time, '09:00'::time],
    ARRAY['18:00'::time, '19:00'::time],
    ARRAY['19:00'::time, '20:00'::time],
    ARRAY['20:00'::time, '21:00'::time]
  ];
  slot_pair time[];
BEGIN
  FOR i IN 0..days_ahead - 1 LOOP
    target_date := current_date + i;
    -- Salta sabato (6) e domenica (0)
    IF EXTRACT(DOW FROM target_date) NOT IN (0, 6) THEN
      FOREACH slot_pair SLICE 1 IN ARRAY slot_times LOOP
        INSERT INTO slots (date, start_time, end_time, max_capacity)
        VALUES (target_date, slot_pair[1], slot_pair[2], 7)
        ON CONFLICT (date, start_time, end_time) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Genera subito gli slot per i prossimi 14 giorni
SELECT public.generate_slots(14);

-- ------------------------------------------------------------
-- 5. SEED ADMIN
-- Sostituisci con le email admin reali
-- ------------------------------------------------------------

INSERT INTO admins (email) VALUES
  ('admin@humans.tech')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- FINE SCHEMA
-- Dopo aver eseguito questo file:
--   1. Vai su Authentication > Providers > Google e abilita Google OAuth
--   2. Configura i Redirect URLs (vedi SETUP.md)
--   3. Aggiungi le env vars nel file .env.local
-- ============================================================

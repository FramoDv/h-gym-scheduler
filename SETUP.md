# GymBooking — Setup Guide

## 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un account se non ce l'hai
2. Crea un nuovo progetto (scegli una region EU)
3. Salva la **Project URL** e l'**anon public key** (Settings → API)

## 2. Configura le variabili d'ambiente

Copia il file `.env.local` e compila i valori reali:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Esegui lo schema SQL

1. Vai su **SQL Editor** nel dashboard Supabase
2. Copia e incolla tutto il contenuto di `supabase/schema.sql`
3. Clicca **Run**

Questo creerà:
- Tabelle `slots`, `bookings`, `admins`
- RLS policies
- Trigger che blocca email non `@humans.tech`
- Funzione `generate_slots` e genera i primi 14 giorni di slot
- Seed con `admin@humans.tech` (modifica con la tua email admin)

## 4. Abilita Google OAuth

1. Vai su **Authentication → Providers → Google**
2. Abilita il provider Google
3. Inserisci **Client ID** e **Client Secret** da Google Cloud Console

### Come ottenere le credenziali Google:
1. Vai su [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un progetto (o usa uno esistente)
3. Abilita l'API **Google Identity**
4. Crea credenziali OAuth 2.0 → Applicazione web
5. Aggiungi agli **Authorized redirect URIs**:
   - `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`
   - `http://localhost:5173/auth/callback` (per sviluppo locale)
   - `https://your-vercel-domain.vercel.app/auth/callback` (per produzione)

## 5. Configura Redirect URLs in Supabase

In **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:5173` (sviluppo) o il tuo dominio Vercel
- **Redirect URLs** (aggiungi tutti):
  - `http://localhost:5173/auth/callback`
  - `https://your-vercel-domain.vercel.app/auth/callback`

## 6. Aggiungi admin

Per aggiungere altri admin, esegui nel SQL Editor:

```sql
INSERT INTO admins (email) VALUES ('tuaemail@humans.tech');
```

## 7. Schedula la rigenerazione automatica degli slot

Esegui una volta nel SQL Editor il file `supabase/phase3_cron_regen_slots.sql`.
Lo script:
- abilita l'estensione `pg_cron`,
- schedula `generate_slots(30)` ogni giorno alle **03:00 UTC**,
- esegue subito un backfill di 30 giorni.

Lo script è idempotente: rieseguibile in sicurezza (sostituisce la schedulazione precedente).

Verifica registrazione del job:

```sql
SELECT jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'regen-slots-daily';
```

Fallback manuale d'emergenza (se il cron non gira o serve estendere subito la finestra):

```sql
SELECT public.generate_slots(30);
```

In alternativa, dal pannello admin il bottone **"Rigenera slot"** chiama la stessa funzione.

## 8. Deploy su Vercel

1. Pusha il repo su GitHub
2. Vai su [vercel.com](https://vercel.com) e importa il repository
3. Aggiungi le **Environment Variables** nel dashboard Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!
5. Copia il dominio Vercel e aggiornalo in:
   - Supabase → Authentication → URL Configuration → Site URL
   - Google Cloud Console → OAuth → Authorized redirect URIs

## 9. Verifica funzionamento

- [ ] Login con Google `@humans.tech` funziona
- [ ] Tentativo login con account non `@humans.tech` viene bloccato
- [ ] Dashboard mostra gli slot del giorno
- [ ] Prenotazione funziona e aggiorna il contatore
- [ ] Cancellazione prenotazione funziona
- [ ] Pagina "Le mie prenotazioni" mostra le prenotazioni future
- [ ] URL `/admin` è accessibile solo agli admin
- [ ] Export CSV nella pagina admin funziona

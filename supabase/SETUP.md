# Setting up the Giberish database (Supabase, free plan)

About 10 minutes. You only do this once.

## 1. Create the project
1. Go to [supabase.com](https://supabase.com) and sign up (the free plan is enough).
2. **New project**:
   - Name: `giberish`.
   - Database password: make a strong one and keep it somewhere safe. The website never uses it.
   - Region: **South Asia (Mumbai)**.

## 2. Create the tables
1. Open **SQL Editor → New query**.
2. Paste everything from `supabase/schema.sql` and press **Run**. It should say "Success".
3. Open a new query, paste everything from `supabase/seed.sql` and press **Run**. This copies today's 15 products and 31 notes into the database.

## 3. Make your admin login
1. Go to **Authentication → Sign In / Providers**. Turn **off** "Allow new users to sign up", so nobody else can create an account.
2. Go to **Authentication → Users → Add user → Create new user**. Enter your email and a password, tick **Auto Confirm User**, then save.
3. Go back to the **SQL Editor** and run this, with your email in lower case:
   ```sql
   insert into public.admins (email) values ('your-email@example.com') on conflict do nothing;
   ```
   To add another admin later, create them a user the same way and run the same line with their email.
4. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to `https://giberish.vercel.app` (or your own domain).
   - Under **Redirect URLs**, add `https://giberish.vercel.app/admin` and `http://localhost:5880/admin`. Password-reset links use these.

## 4. Connect the website
1. Open **Project Settings → API Keys** (on older projects it is **Project Settings → API**).
2. Copy:
   - the **Project URL**, for example `https://abcdefgh.supabase.co`;
   - the **publishable** key, which starts with `sb_publishable_`. On older projects this is the **anon public** key.
3. Put both into `assets/js/data.js`:
   ```js
   supabase: { url: 'https://abcdefgh.supabase.co', key: 'sb_publishable_…' },
   ```
   The publishable key is meant to be public. The security rules in `schema.sql` decide what it can do: add orders and readings, read the catalogue, and nothing more.
   **Never** put the `secret` or `service_role` key in the website.
4. Commit and push. Vercel deploys, and then:
   - every order and every Scent Kundli reading is saved;
   - `https://giberish.vercel.app/admin` is your admin panel;
   - the website reads products and notes from the database. Edits show up within about a minute.

## Good to know
- **Free plan pause.** A free project pauses after 7 days with no activity at all; normal traffic keeps it awake. If it ever pauses, open the Supabase dashboard and press **Restore project**. Your data is kept. While it is paused, the site falls back to the catalogue in `data.js`, and new orders still reach you on WhatsApp/Instagram as before.
- **Backups.** The free plan doesn't include downloadable backups. Use **Export CSV** in the admin panel now and then (orders and Kundlis).
- **Emails.** People who ticked "send me offers" are marked **Offers: yes**. The admin panel's **Copy emails** button only copies those people. Under India's DPDP Act, only email people who opted in, and remove anyone who asks.
- **Re-running `seed.sql`** overwrites admin-panel edits for the same products and notes. To refresh it from `data.js`, run `node tools/export-seed.mjs`.

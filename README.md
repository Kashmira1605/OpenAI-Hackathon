# Study Quest

Study Quest is a semester-based ADHD study companion built with Next.js. Students organize materials by class and convert them into small quests, quiz cards, and mission-based progress.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

If Supabase or OpenAI secrets are missing, the app still runs using the local mock quest parser.

## Supabase setup

1. Create a Supabase project.
2. Run the SQL in [supabase/schema.sql](/Users/kashmira/OpenAI-Hackathon/supabase/schema.sql).
3. Create a storage bucket named `study-materials` or match `SUPABASE_STORAGE_BUCKET`.
4. Set the bucket policy to allow authenticated uploads if you later add auth-gated browser uploads.
5. In Supabase Auth, enable email sign-in so the `/auth` magic-link flow works.

The current server routes use the service role key for server-side persistence.

## Current integration behavior

- `/auth` sends a Supabase magic link and `/auth/callback` exchanges the code for a session.
- On a user's first successful sign-in, the app seeds that account with demo semesters, classes, materials, quests, and badges in Supabase.
- `/api/materials/upload` uploads an optional file to Supabase Storage when configured.
- `/api/generate-quest` calls OpenAI for structured quest JSON when `OPENAI_API_KEY` is present.
- If OpenAI is unavailable or returns invalid JSON, the route falls back to the local parser.
- If Supabase is configured, generated materials and quests are inserted into the `materials` and `study_quests` tables.

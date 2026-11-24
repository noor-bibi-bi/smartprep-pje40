# Vercel Deployment

## Prerequisites

- GitHub repository connected to Vercel
- Supabase project configured with the standalone SmartPrep migration
- Groq API key
- Supabase Email authentication enabled

## Supabase

1. Apply `supabase/migrations/0004_smartprep_schema.sql`.
2. Add the Vercel production URL to Supabase Authentication redirect URLs.
3. Disable Email confirmation only if it is not required for the intended deployment.

## Vercel

Use the Next.js framework preset and set the following environment variables:

| Variable | Scope | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous API key, constrained by RLS |
| `GROQ_API_KEY` | Sensitive | Server-only Groq API key |

Do not add a Supabase service-role key. SmartPrep uses RLS and the user session for all database access.

## Verification

Before opening the deployment, verify:

```powershell
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm run secrets:scan
```

After deployment, test account creation, sign-in, PDF and text generation,
study-set editing, saving, quiz attempts, flashcard scheduling, printing,
account isolation, and offline save recovery.

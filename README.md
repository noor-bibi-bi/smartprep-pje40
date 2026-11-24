# SmartPrep

SmartPrep is a full-stack study application that converts PDF documents and pasted lecture notes into editable quizzes, interactive assessments, and spaced-repetition flashcards.

It extends the open-source baseline with account-based access, persistent study libraries, mastery analytics, and print-ready exam sheets.

## Features

- Email/password authentication through Supabase Auth
- PDF and pasted-text study material
- Cloud question generation through Groq
- Deterministic offline question generation fallback
- Editable questions and answer keys
- Interactive quiz sessions
- SM-2 spaced-repetition flashcards
- Module tags and dashboard filtering
- Attempt history and mastery analytics
- Printable exam sheets
- Browser queue for failed study-set saves
- Responsive light and dark themes

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS |
| Authentication | Supabase Auth with `@supabase/ssr` |
| Database | Supabase PostgreSQL |
| Security | Row-Level Security |
| AI generation | Groq SDK |
| Offline generation | Deterministic TypeScript generator |
| PDF extraction | pdf-parse |
| Testing | Vitest |

## Project Structure

```text
app/
  api/generate-quiz/       Server-side PDF/text generation API
  auth/                    Authentication server actions
  create/                  Study-set generation and saving
  dashboard/               Library, analytics, and offline sync
  quiz/[id]/               Quiz, flashcard, and print views
components/                Application UI
lib/groq/                  Cloud generation and prompt handling
lib/offlineQuizGenerator.ts
                           Deterministic offline generation
lib/sm2.ts                SM-2 scheduling
supabase/migrations/       Standalone PostgreSQL migration
tests/                    Unit and resilience tests
```

## Local Development

Requirements:

- Node.js 24 or later
- npm
- A Supabase project
- A Groq API key

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Configure `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GROQ_API_KEY=gsk_your-groq-api-key
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project.
2. Enable Email authentication.
3. Apply `supabase/migrations/0004_smartprep_schema.sql` through the Supabase SQL Editor.
4. Configure the site's local and production URLs in Supabase Authentication URL settings.

The migration creates profiles, quizzes, questions, and quiz attempts with owner-based Row-Level Security policies.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm test` | Run the Vitest suite |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run strict TypeScript validation |
| `npm run secrets:scan` | Scan Git-tracked files for secret patterns |

## Security

- Supabase RLS isolates user-owned records.
- Server Actions require authentication.
- Attempt scores are recalculated from stored question answers.
- Question and attempt inserts verify parent quiz ownership.
- Groq credentials remain server-side.
- PDF uploads are validated and processed in memory.
- Pasted text and generation parameters are bounded.
- Authentication redirects are restricted to local application routes.

## Baseline Attribution

SmartPrep is derived from the public [PDF-to-Quiz repository](https://github.com/Nour-yahyaoui/pdf-to-quiz) created by Nour Yahyaoui. SmartPrep contains substantial authentication, database, generation, study, analytics, and user-experience extensions.

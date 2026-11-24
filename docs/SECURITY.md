# Security Notes

## Access model

SmartPrep uses Supabase email/password authentication. Server Components,
Server Actions, and the API route obtain the authenticated user through the
Supabase SSR session.

The profiles, quizzes, questions, and quiz_attempts tables have Row-Level
Security. Question and attempt insert policies also verify that the referenced
quiz belongs to the authenticated user.

## Attempt integrity

The quiz completion action ignores browser-provided scores and correctness.
It loads the user's stored questions and verifies selected answers against the
stored correct option index before inserting the attempt.

## Input protection

- PDF uploads are checked for size, extension, and `%PDF` magic bytes.
- Pasted text is capped at 100,000 characters.
- Generated and manually edited questions are Zod-validated.
- The generation endpoint applies an IP-based in-process rate limit.
- Authentication redirects are restricted to local application routes.

## AI and privacy

The Groq API key exists only on the server. PDFs are parsed in memory and are
not stored in Supabase Storage or written to disk. Generated quizzes are
persisted in the authenticated user's account.

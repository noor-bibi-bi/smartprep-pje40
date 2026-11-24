import Link from "next/link";

export function SiteFooter({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <footer className="mt-20 border-t border-rule">
      <div className="container-sheet flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg text-ink">SmartPrep</p>
          <p className="mt-1 text-sm text-mute">
            AI quizzes, spaced-repetition flashcards, and exam practice saved privately to your account.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
          {isAuthenticated ? (
            <>
              <Link href="/create" className="text-mute hover:text-accent">
                Create a study set
              </Link>
              <Link href="/dashboard" className="text-mute hover:text-accent">
                Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="text-mute hover:text-accent">
                Create free account
              </Link>
              <Link href="/login" className="text-mute hover:text-accent">
                Sign in
              </Link>
            </>
          )}
          <a
            href="https://console.groq.com"
            target="_blank"
            rel="noreferrer"
            className="text-mute hover:text-accent"
          >
            Groq AI
          </a>
        </nav>
      </div>
    </footer>
  );
}

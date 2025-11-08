import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Speed Monorepo Starter',
  description: 'Starter Next.js frontend for the monorepo'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="site-nav">
            <Link href="/">Home</Link>
            <Link href="/submit">Submit</Link>
            <Link href="/moderation">Moderation</Link>
            <Link href="/analysis">Analysis</Link>
            <Link href="/search/practices">Search</Link>
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}


import '@platform/ui/theme.css';
import './globals.css';
import { MockUserSwitcher } from '@platform/auth';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { APP_NAME } from '@/resources/app';

export const metadata: Metadata = {
  title: APP_NAME,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6">
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="font-semibold">
                {APP_NAME}
              </Link>
              <Link href="/refunds" className="text-muted-foreground hover:text-foreground">
                Refunds
              </Link>
            </nav>
            <MockUserSwitcher />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

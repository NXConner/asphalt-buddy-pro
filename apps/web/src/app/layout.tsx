import './globals.css';
import type { ReactNode } from 'react';
export const metadata = {
  title: 'Acme Web',
  description: 'Next.js App Router baseline'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}


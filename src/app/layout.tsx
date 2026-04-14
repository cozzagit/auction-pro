import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ribasta — Aste al Ribasso per Servizi',
  description: 'La piattaforma italiana dove trovi il professionista giusto al miglior prezzo. Pubblica il tuo lavoro, ricevi offerte, scegli il meglio.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'GameRoom | Minijuegos Multijugador',
    description: 'Crea salas privadas y juega con tus amigos en tiempo real. Tres en línea, Batalla Naval, Ajedrez y más.',
    keywords: ['juegos', 'multijugador', 'tiempo real', 'tres en línea', 'gameroom'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className="min-h-screen overflow-x-hidden">
                {/* Animated background orbs */}
                <div className="bg-orb bg-orb-1" />
                <div className="bg-orb bg-orb-2" />
                <div className="bg-orb bg-orb-3" />

                {/* Main content */}
                <main className="relative z-10 min-h-screen flex flex-col">
                    {children}
                </main>
            </body>
        </html>
    );
}

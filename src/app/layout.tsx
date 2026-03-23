import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AsliNewz — Real News, Real Fast',
  description: "India's AI-powered news. Short, crisp, real.",
  manifest: '/manifest.json',
}
export const viewport: Viewport = {
  themeColor: '#050B18', width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#050B18] text-white antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-center" toastOptions={{
            style: { background: '#0D1626', color: '#fff', border: '1px solid rgba(233,30,140,0.3)', borderRadius: '12px', fontSize: '13px' },
            success: { iconTheme: { primary: '#00E5FF', secondary: '#050B18' } },
            error: { iconTheme: { primary: '#E91E8C', secondary: '#050B18' } },
          }} />
        </Providers>
      </body>
    </html>
  )
}

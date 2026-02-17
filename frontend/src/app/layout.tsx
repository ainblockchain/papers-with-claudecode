import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hackathon LMS',
  description: 'Learning Management System for Hackathon',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}

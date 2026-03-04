import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GardenPlot — Plan Your Perfect Garden',
  description: 'Drag-and-drop garden planner with companion planting, AI expert advice, and planting calendars.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}

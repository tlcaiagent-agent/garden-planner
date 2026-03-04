'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <nav className={`w-full z-50 ${transparent ? 'absolute top-0 left-0' : 'bg-white/80 backdrop-blur-md border-b border-garden-green/10'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-garden-dark font-display text-xl font-bold">
            <span className="text-2xl">🌱</span> GardenPlot
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-garden-dark/70 hover:text-garden-dark transition-colors">Dashboard</Link>
            <Link href="/ask" className="text-garden-dark/70 hover:text-garden-dark transition-colors">AI Expert</Link>
            <Link href="/dashboard" className="btn-primary text-sm !py-2 !px-4">Get Started</Link>
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden text-garden-dark p-2">
            {open ? '✕' : '☰'}
          </button>
        </div>
        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            <Link href="/dashboard" className="text-garden-dark/70 hover:text-garden-dark">Dashboard</Link>
            <Link href="/ask" className="text-garden-dark/70 hover:text-garden-dark">AI Expert</Link>
            <Link href="/dashboard" className="btn-primary text-sm text-center">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  )
}

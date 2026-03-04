'use client'
import { useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import { mockGardens } from '@/data/mock'
import { plantMap } from '@/data/plants'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function SharePage() {
  const params = useParams()
  const gardenId = params.id as string
  const garden = mockGardens.find(g => g.id === gardenId) || mockGardens[0]
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<'light' | 'dark' | 'earth'>('light')
  const [copied, setCopied] = useState(false)

  const allPlants = [...new Set(garden.beds.flatMap(b => b.plants.map(p => p.plantType)))]
  const totalPlants = garden.beds.reduce((a, b) => a + b.plants.length, 0)

  const styles = {
    light: { bg: 'bg-gradient-to-br from-garden-cream to-garden-sand', text: 'text-garden-dark', sub: 'text-garden-dark/60', accent: 'bg-garden-green/10' },
    dark: { bg: 'bg-gradient-to-br from-garden-dark to-gray-900', text: 'text-white', sub: 'text-white/60', accent: 'bg-white/10' },
    earth: { bg: 'bg-gradient-to-br from-garden-brown to-garden-earth', text: 'text-white', sub: 'text-white/60', accent: 'bg-white/10' },
  }

  const s = styles[style]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://gardenplot.app/shared/${gardenId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    // In production, use html2canvas or similar
    alert('In production, this would download a PNG of your garden card using html2canvas. For now, take a screenshot!')
  }

  return (
    <div className="min-h-screen bg-garden-cream/50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href={`/garden/${gardenId}/plan`} className="text-garden-dark/50 text-sm hover:text-garden-dark">← Back to Planner</Link>
        <h1 className="font-display text-3xl text-garden-dark mt-2 mb-2">🔗 Share Your Garden</h1>
        <p className="text-garden-dark/50 mb-8">Generate a beautiful card to share with friends and fellow gardeners.</p>

        {/* Style selector */}
        <div className="flex gap-3 mb-6">
          {(['light', 'dark', 'earth'] as const).map(s => (
            <button key={s} onClick={() => setStyle(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${style === s ? 'bg-garden-green text-white shadow-garden' : 'bg-white text-garden-dark/60 hover:bg-garden-cream border border-garden-green/10'}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Card preview */}
        <div ref={cardRef} className={`${s.bg} rounded-3xl p-8 shadow-garden-lg mb-8`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🌱</span>
            <div>
              <h2 className={`font-display text-2xl ${s.text}`}>{garden.name}</h2>
              <p className={`text-sm ${s.sub}`}>{garden.type} • {garden.year} • Zone 7b</p>
            </div>
          </div>

          {/* Plant grid */}
          <div className={`${s.accent} rounded-2xl p-6 mb-6`}>
            <div className="flex flex-wrap gap-3 justify-center">
              {allPlants.map(id => {
                const plant = plantMap.get(id)
                if (!plant) return null
                return (
                  <div key={id} className="flex flex-col items-center gap-1">
                    <span className="text-3xl">{plant.emoji}</span>
                    <span className={`text-xs ${s.sub}`}>{plant.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-around">
            {[
              { label: 'Beds', value: garden.beds.length },
              { label: 'Plants', value: totalPlants },
              { label: 'Varieties', value: allPlants.length },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`text-2xl font-bold ${s.text}`}>{stat.value}</div>
                <div className={`text-xs ${s.sub}`}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div className={`text-center mt-6 pt-4 border-t ${style === 'light' ? 'border-garden-dark/10' : 'border-white/10'}`}>
            <p className={`text-xs ${s.sub}`}>Made with 🌱 GardenPlot</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleDownload} className="btn-primary flex-1">
            📥 Download Image
          </button>
          <button onClick={handleCopyLink} className="btn-secondary flex-1">
            {copied ? '✅ Copied!' : '🔗 Copy Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

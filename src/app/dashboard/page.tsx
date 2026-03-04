'use client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { mockGardens, mockConversations, userProfile } from '@/data/mock'
import { plantMap } from '@/data/plants'

const weatherData = {
  temp: 58,
  condition: '⛅ Partly Cloudy',
  high: 63,
  low: 45,
  rain: '20%',
  humidity: '65%',
  forecast: [
    { day: 'Wed', emoji: '⛅', high: 63 },
    { day: 'Thu', emoji: '🌧️', high: 55 },
    { day: 'Fri', emoji: '☀️', high: 62 },
    { day: 'Sat', emoji: '☀️', high: 67 },
    { day: 'Sun', emoji: '🌤️', high: 64 },
  ],
}

const todayTasks = [
  { emoji: '💧', task: 'Water indoor herbs — soil looks dry', done: false },
  { emoji: '🌱', task: 'Start tomato seeds indoors (6 weeks to last frost!)', done: false },
  { emoji: '📋', task: 'Check on overwintering garlic', done: true },
  { emoji: '🧪', task: 'Test soil pH in raised bed', done: false },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-garden-cream/50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-garden-dark">Your Garden Dashboard</h1>
            <p className="text-garden-dark/50 mt-1">Zone {userProfile.zone} • {userProfile.location}</p>
          </div>
          <button className="btn-primary !py-2 !px-4 text-sm">+ New Garden</button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gardens */}
            <div>
              <h2 className="font-display text-xl text-garden-dark mb-4">🌿 Your Gardens</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {mockGardens.map(garden => (
                  <Link key={garden.id} href={`/garden/${garden.id}/plan`} className="card hover:shadow-garden-lg transition-all hover:-translate-y-1 group cursor-pointer">
                    <div className="bg-gradient-to-br from-garden-cream to-garden-sand rounded-xl p-4 mb-4 min-h-[120px] flex items-center justify-center relative overflow-hidden">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {garden.beds.flatMap(b => b.plants.slice(0, 4)).map((p, i) => {
                          const plant = plantMap.get(p.plantType)
                          return <span key={i} className="text-2xl">{plant?.emoji || '🌱'}</span>
                        })}
                      </div>
                      <div className="absolute top-2 right-2 text-xs bg-garden-green/10 text-garden-dark/60 px-2 py-1 rounded-full">
                        {garden.type}
                      </div>
                    </div>
                    <h3 className="font-display text-lg text-garden-dark group-hover:text-garden-green transition-colors">{garden.name}</h3>
                    <p className="text-garden-dark/50 text-sm">{garden.beds.length} beds • {garden.beds.reduce((a, b) => a + b.plants.length, 0)} plants • {garden.year}</p>
                  </Link>
                ))}
                <button className="card border-2 border-dashed border-garden-green/20 hover:border-garden-green/40 flex flex-col items-center justify-center min-h-[200px] transition-colors text-garden-dark/40 hover:text-garden-dark/60">
                  <span className="text-4xl mb-2">+</span>
                  <span className="font-semibold">Create New Garden</span>
                </button>
              </div>
            </div>

            {/* What to do today */}
            <div className="card">
              <h2 className="font-display text-xl text-garden-dark mb-4">📋 What To Do Today</h2>
              <div className="space-y-3">
                {todayTasks.map((t, i) => (
                  <label key={i} className={`flex items-center gap-3 p-3 rounded-xl hover:bg-garden-cream/50 transition-colors cursor-pointer ${t.done ? 'opacity-50' : ''}`}>
                    <input type="checkbox" defaultChecked={t.done} className="w-5 h-5 rounded accent-garden-green" />
                    <span className="text-xl">{t.emoji}</span>
                    <span className={`text-garden-dark/80 ${t.done ? 'line-through' : ''}`}>{t.task}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weather */}
            <div className="card bg-gradient-to-br from-white to-garden-cream/50">
              <h2 className="font-display text-xl text-garden-dark mb-4">🌤️ Weather</h2>
              <div className="text-center mb-4">
                <div className="text-4xl mb-1">{weatherData.condition}</div>
                <div className="text-3xl font-bold text-garden-dark">{weatherData.temp}°F</div>
                <div className="text-sm text-garden-dark/50">H: {weatherData.high}° L: {weatherData.low}° • Rain: {weatherData.rain}</div>
              </div>
              <div className="flex justify-between border-t border-garden-green/10 pt-4">
                {weatherData.forecast.map((d, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xs text-garden-dark/50">{d.day}</div>
                    <div className="text-lg">{d.emoji}</div>
                    <div className="text-xs font-semibold text-garden-dark">{d.high}°</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent AI Q&A */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-garden-dark">🤖 Recent Questions</h2>
                <Link href="/ask" className="text-garden-green text-sm hover:underline">Ask more →</Link>
              </div>
              <div className="space-y-4">
                {mockConversations.map(conv => (
                  <Link href="/ask" key={conv.id} className="block p-3 rounded-xl hover:bg-garden-cream/50 transition-colors">
                    <p className="text-sm font-semibold text-garden-dark line-clamp-1">{conv.question}</p>
                    <p className="text-xs text-garden-dark/50 mt-1 line-clamp-2">{conv.answer}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card bg-garden-dark text-white">
              <h2 className="font-display text-xl mb-4">🌱 Season Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Gardens', value: '2' },
                  { label: 'Plants', value: '13' },
                  { label: 'Days to Spring', value: '18' },
                  { label: 'Zone', value: '7b' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold text-garden-lime">{s.value}</div>
                    <div className="text-xs text-white/60">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

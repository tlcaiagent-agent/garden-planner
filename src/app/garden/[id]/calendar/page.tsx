'use client'
import { useState, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { plantCatalog, plantMap, PlantData } from '@/data/plants'
import { mockGardens } from '@/data/mock'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Zone 7b last frost: ~Apr 15, first frost: ~Oct 15
const LAST_FROST_WEEK = 15 // week of year (~Apr 15)
const FIRST_FROST_WEEK = 41 // week of year (~Oct 15)

type ActionType = 'seed-indoor' | 'transplant' | 'direct-sow' | 'harvest'

interface CalendarEvent {
  plant: PlantData
  action: ActionType
  startWeek: number
  endWeek: number
}

const actionColors: Record<ActionType, { bg: string; text: string; label: string }> = {
  'seed-indoor': { bg: 'bg-purple-100', text: 'text-purple-700', label: '🏠 Start Indoors' },
  'transplant': { bg: 'bg-blue-100', text: 'text-blue-700', label: '🌱 Transplant' },
  'direct-sow': { bg: 'bg-green-100', text: 'text-green-700', label: '🌰 Direct Sow' },
  'harvest': { bg: 'bg-amber-100', text: 'text-amber-700', label: '🧺 Harvest' },
}

function getEvents(plant: PlantData): CalendarEvent[] {
  const events: CalendarEvent[] = []
  if (plant.seedIndoors) {
    const start = LAST_FROST_WEEK - plant.seedIndoors[1]
    const end = LAST_FROST_WEEK - plant.seedIndoors[0]
    events.push({ plant, action: 'seed-indoor', startWeek: start, endWeek: end })
  }
  if (plant.transplant) {
    const start = LAST_FROST_WEEK + plant.transplant[0]
    const end = LAST_FROST_WEEK + plant.transplant[1]
    events.push({ plant, action: 'transplant', startWeek: start, endWeek: end })
  }
  if (plant.directSow) {
    const start = LAST_FROST_WEEK + plant.directSow[0]
    const end = LAST_FROST_WEEK + plant.directSow[1]
    events.push({ plant, action: 'direct-sow', startWeek: start, endWeek: end })
  }
  // Harvest estimate
  const plantingWeek = plant.transplant
    ? LAST_FROST_WEEK + plant.transplant[0]
    : plant.directSow
      ? LAST_FROST_WEEK + plant.directSow[0]
      : LAST_FROST_WEEK
  const harvestStart = plantingWeek + Math.floor(plant.daysToHarvest[0] / 7)
  const harvestEnd = plantingWeek + Math.floor(plant.daysToHarvest[1] / 7)
  events.push({ plant, action: 'harvest', startWeek: harvestStart, endWeek: Math.min(harvestEnd, 48) })

  return events
}

export default function CalendarPage() {
  const params = useParams()
  const gardenId = params.id as string
  const garden = mockGardens.find(g => g.id === gardenId) || mockGardens[0]

  const gardenPlantIds = [...new Set(garden.beds.flatMap(b => b.plants.map(p => p.plantType)))]
  const [showAll, setShowAll] = useState(false)
  const [filterAction, setFilterAction] = useState<ActionType | 'all'>('all')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())

  const plantsToShow = showAll ? plantCatalog : plantCatalog.filter(p => gardenPlantIds.includes(p.id))

  const allEvents = useMemo(() =>
    plantsToShow.flatMap(getEvents).filter(e =>
      filterAction === 'all' || e.action === filterAction
    ),
    [plantsToShow, filterAction]
  )

  // Calendar grid for selected month
  const year = 2026
  const firstDay = new Date(year, selectedMonth, 1).getDay()
  const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate()
  const monthStartWeek = Math.floor((new Date(year, selectedMonth, 1).getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  const monthEndWeek = Math.floor((new Date(year, selectedMonth, daysInMonth).getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))

  const monthEvents = allEvents.filter(e =>
    (e.startWeek <= monthEndWeek && e.endWeek >= monthStartWeek)
  )

  // Helper: which events fall on a specific day
  const getEventsForDay = (day: number) => {
    const dayOfYear = Math.floor((new Date(year, selectedMonth, day).getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000))
    const week = Math.floor(dayOfYear / 7)
    return allEvents.filter(e => week >= e.startWeek && week <= e.endWeek)
  }

  return (
    <div className="min-h-screen bg-garden-cream/50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href={`/garden/${gardenId}/plan`} className="text-garden-dark/50 text-sm hover:text-garden-dark">← Back to Planner</Link>
            <h1 className="font-display text-3xl text-garden-dark mt-1">📅 Planting Calendar</h1>
            <p className="text-garden-dark/50 text-sm mt-1">{garden.name} • Zone 7b • Last frost: ~Apr 15</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="accent-garden-green rounded" />
            <span className="text-sm text-garden-dark/70">Show all plants</span>
          </label>
        </div>

        {/* Action filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilterAction('all')}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${filterAction === 'all' ? 'bg-garden-green text-white' : 'bg-white text-garden-dark/60 hover:bg-garden-cream'}`}>
            All Actions
          </button>
          {(Object.entries(actionColors) as [ActionType, typeof actionColors[ActionType]][]).map(([key, val]) => (
            <button key={key} onClick={() => setFilterAction(key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${filterAction === key ? 'bg-garden-green text-white' : `${val.bg} ${val.text} hover:opacity-80`}`}>
              {val.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <div className="lg:col-span-2">
            <div className="card">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelectedMonth(m => Math.max(0, m - 1))} className="text-garden-dark/50 hover:text-garden-dark p-2">←</button>
                <h2 className="font-display text-2xl text-garden-dark">{MONTH_FULL[selectedMonth]} {year}</h2>
                <button onClick={() => setSelectedMonth(m => Math.min(11, m + 1))} className="text-garden-dark/50 hover:text-garden-dark p-2">→</button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-garden-dark/40 py-1">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const events = getEventsForDay(day)
                  const isToday = selectedMonth === 2 && day === 4 // March 4 2026
                  return (
                    <div key={day} className={`h-24 rounded-xl border p-1 overflow-hidden transition-colors ${isToday ? 'border-garden-green bg-garden-green/5' : 'border-garden-green/10 hover:bg-garden-cream/30'}`}>
                      <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-garden-green' : 'text-garden-dark/50'}`}>{day}</div>
                      <div className="space-y-0.5">
                        {events.slice(0, 3).map((e, j) => (
                          <div key={j} className={`text-[10px] px-1 rounded ${actionColors[e.action].bg} ${actionColors[e.action].text} truncate`}>
                            {e.plant.emoji} {e.plant.name}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-[10px] text-garden-dark/40">+{events.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Timeline sidebar */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-display text-lg text-garden-dark mb-3">This Month&apos;s Actions</h3>
              {monthEvents.length === 0 ? (
                <p className="text-sm text-garden-dark/40">No events this month.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-auto">
                  {monthEvents.map((e, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-xl ${actionColors[e.action].bg}`}>
                      <span className="text-lg">{e.plant.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${actionColors[e.action].text}`}>{e.plant.name}</div>
                        <div className="text-xs text-garden-dark/50">{actionColors[e.action].label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legend / Frost dates */}
            <div className="card bg-garden-dark text-white">
              <h3 className="font-display text-lg mb-3">🌡️ Frost Dates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Last Spring Frost</span>
                  <span className="font-semibold">Apr 15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">First Fall Frost</span>
                  <span className="font-semibold">Oct 15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Growing Season</span>
                  <span className="font-semibold text-garden-lime">~183 days</span>
                </div>
              </div>
            </div>

            {/* Yearly timeline */}
            <div className="card">
              <h3 className="font-display text-lg text-garden-dark mb-3">📊 Year Overview</h3>
              <div className="space-y-2">
                {plantsToShow.slice(0, 8).map(plant => {
                  const events = getEvents(plant).filter(e => filterAction === 'all' || e.action === filterAction)
                  return (
                    <div key={plant.id} className="flex items-center gap-2">
                      <span className="text-sm w-20 truncate">{plant.emoji} {plant.name}</span>
                      <div className="flex-1 h-4 bg-garden-cream rounded-full relative overflow-hidden">
                        {events.map((e, i) => {
                          const left = (e.startWeek / 52) * 100
                          const width = Math.max(2, ((e.endWeek - e.startWeek) / 52) * 100)
                          const colors: Record<ActionType, string> = {
                            'seed-indoor': '#9333ea',
                            transplant: '#2563eb',
                            'direct-sow': '#16a34a',
                            harvest: '#d97706',
                          }
                          return (
                            <div key={i} className="absolute top-0 h-full rounded-full opacity-70"
                              style={{ left: `${left}%`, width: `${width}%`, backgroundColor: colors[e.action] }}
                              title={`${actionColors[e.action].label}: weeks ${e.startWeek}-${e.endWeek}`} />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-garden-dark/30">
                {MONTHS.map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

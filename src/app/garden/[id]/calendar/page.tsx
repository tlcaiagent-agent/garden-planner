'use client'
import { useState, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { plantMap, PlantData } from '@/data/plants'
import { mockGardens, mockGardenLog, GardenLogEntry, LogCategory } from '@/data/mock'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// ── Zone 8b: last frost ~March 15, first frost ~Nov 15 ──
const LAST_FROST = new Date(2026, 2, 15) // March 15
const FIRST_FROST = new Date(2026, 10, 15) // Nov 15
const YEAR = 2026

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// ── Task types and colors ──
type TaskType = 'start-indoors' | 'direct-sow' | 'transplant' | 'harvest' | 'fertilize' | 'prune'
type Tab = 'calendar' | 'log'

const taskMeta: Record<TaskType, { bg: string; text: string; border: string; label: string; emoji: string }> = {
  'start-indoors': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', label: 'Start Indoors', emoji: '🏠' },
  'direct-sow':    { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  label: 'Direct Sow',    emoji: '🌰' },
  'transplant':    { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  label: 'Transplant',    emoji: '🌱' },
  'harvest':       { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'Harvest',       emoji: '🧺' },
  'fertilize':     { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   label: 'Fertilize',     emoji: '💧' },
  'prune':         { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   label: 'Prune',         emoji: '✂️' },
}

const logCategoryMeta: Record<LogCategory, { bg: string; text: string; emoji: string; label: string }> = {
  planted:    { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '🌱', label: 'Planted' },
  watered:    { bg: 'bg-blue-100',   text: 'text-blue-700',   emoji: '💧', label: 'Watered' },
  fertilized: { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '🧪', label: 'Fertilized' },
  harvested:  { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '🧺', label: 'Harvested' },
  note:       { bg: 'bg-gray-100',   text: 'text-gray-700',   emoji: '📝', label: 'Note' },
}

// ── Helpers ──
function addDays(d: Date, days: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + days)
  return r
}
function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks * 7)
}
function dateToStr(d: Date): string {
  return d.toISOString().split('T')[0]
}
function weekOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.floor((d.getTime() - start.getTime()) / (7 * 86400000))
}
function isSameWeek(a: Date, b: Date): boolean {
  const wa = weekOfYear(a)
  const wb = weekOfYear(b)
  return wa === wb && a.getFullYear() === b.getFullYear()
}

// ── Task generation for a plant ──
interface CalendarTask {
  plant: PlantData
  type: TaskType
  startDate: Date
  endDate: Date
  description: string
}

function generateTasks(plant: PlantData): CalendarTask[] {
  const tasks: CalendarTask[] = []

  // Start indoors
  if (plant.seedIndoors) {
    const start = addWeeks(LAST_FROST, -plant.seedIndoors[1])
    const end = addWeeks(LAST_FROST, -plant.seedIndoors[0])
    tasks.push({ plant, type: 'start-indoors', startDate: start, endDate: end, description: `Start ${plant.name} seeds indoors ${plant.seedIndoors[0]}-${plant.seedIndoors[1]} weeks before last frost` })
  }

  // Direct sow
  if (plant.directSow) {
    const start = addWeeks(LAST_FROST, plant.directSow[0])
    const end = addWeeks(LAST_FROST, plant.directSow[1])
    tasks.push({ plant, type: 'direct-sow', startDate: start, endDate: end, description: `Direct sow ${plant.name} outdoors` })
  }

  // Transplant
  if (plant.transplant) {
    const start = addWeeks(LAST_FROST, plant.transplant[0])
    const end = addWeeks(LAST_FROST, plant.transplant[1])
    tasks.push({ plant, type: 'transplant', startDate: start, endDate: end, description: `Transplant ${plant.name} outdoors` })
  }

  // Harvest window — based on planting date + days to harvest
  const plantingDate = plant.transplant
    ? addWeeks(LAST_FROST, plant.transplant[0])
    : plant.directSow
      ? addWeeks(LAST_FROST, plant.directSow[0])
      : LAST_FROST
  const harvestStart = addDays(plantingDate, plant.daysToHarvest[0])
  const harvestEnd = addDays(plantingDate, plant.daysToHarvest[1])
  if (harvestStart < FIRST_FROST) {
    tasks.push({ plant, type: 'harvest', startDate: harvestStart, endDate: harvestEnd < FIRST_FROST ? harvestEnd : FIRST_FROST, description: `Harvest ${plant.name} (${plant.daysToHarvest[0]}-${plant.daysToHarvest[1]} days from planting)` })
  }

  // Fertilize reminders
  if (plant.fertilizeIntervalWeeks) {
    const growStart = plant.transplant ? addWeeks(LAST_FROST, plant.transplant[0]) : plant.directSow ? addWeeks(LAST_FROST, plant.directSow[0]) : LAST_FROST
    let fertDate = addWeeks(growStart, plant.fertilizeIntervalWeeks)
    let count = 0
    while (fertDate < FIRST_FROST && count < 8) {
      tasks.push({ plant, type: 'fertilize', startDate: fertDate, endDate: addDays(fertDate, 3), description: `Fertilize ${plant.name}` })
      fertDate = addWeeks(fertDate, plant.fertilizeIntervalWeeks)
      count++
    }
  }

  // Pruning (for plants that need it)
  if (plant.needsPruning) {
    const growStart = plant.transplant ? addWeeks(LAST_FROST, plant.transplant[0]) : LAST_FROST
    let pruneDate = addWeeks(growStart, 3)
    let count = 0
    while (pruneDate < FIRST_FROST && count < 6) {
      tasks.push({ plant, type: 'prune', startDate: pruneDate, endDate: addDays(pruneDate, 3), description: `Prune/sucker ${plant.name}` })
      pruneDate = addWeeks(pruneDate, 3)
      count++
    }
  }

  return tasks
}

// ── Component ──
export default function CalendarPage() {
  const params = useParams()
  const gardenId = params.id as string
  const garden = mockGardens.find(g => g.id === gardenId) || mockGardens[0]
  const today = new Date(2026, 2, 4) // March 4 2026

  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all')
  const [logEntries, setLogEntries] = useState<GardenLogEntry[]>(mockGardenLog.filter(l => l.gardenId === gardenId))
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState({ date: dateToStr(today), category: 'note' as LogCategory, plantType: '', note: '' })

  // Get unique plants from garden
  const gardenPlantIds = useMemo(() => {
    const ids = new Set<string>()
    garden.beds.forEach(b => b.plants.forEach(p => ids.add(p.plantType)))
    if (garden.loosePlants) garden.loosePlants.forEach(p => ids.add(p.plantType))
    return [...ids]
  }, [garden])

  const gardenPlants = useMemo(() =>
    gardenPlantIds.map(id => plantMap.get(id)).filter((p): p is PlantData => !!p),
    [gardenPlantIds]
  )

  // Generate all tasks
  const allTasks = useMemo(() =>
    gardenPlants.flatMap(generateTasks),
    [gardenPlants]
  )

  const filteredTasks = useMemo(() =>
    filterType === 'all' ? allTasks : allTasks.filter(t => t.type === filterType),
    [allTasks, filterType]
  )

  // Tasks for selected month
  const monthStart = new Date(YEAR, selectedMonth, 1)
  const monthEnd = new Date(YEAR, selectedMonth + 1, 0)
  const monthTasks = filteredTasks.filter(t => t.startDate <= monthEnd && t.endDate >= monthStart)

  // This week's tasks
  const thisWeekTasks = filteredTasks.filter(t => {
    const taskStart = t.startDate
    const taskEnd = t.endDate
    // Check if this week falls within the task range
    const weekStart = addDays(today, -today.getDay())
    const weekEnd = addDays(weekStart, 6)
    return taskStart <= weekEnd && taskEnd >= weekStart
  })

  // Log entries for the month
  const monthLogEntries = logEntries.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === selectedMonth && d.getFullYear() === YEAR
  })

  // Add log entry
  const addLogEntry = () => {
    if (!logForm.note.trim()) return
    const entry: GardenLogEntry = {
      id: `log-${Date.now()}`,
      gardenId,
      date: logForm.date,
      category: logForm.category,
      plantType: logForm.plantType || undefined,
      note: logForm.note.trim(),
      createdAt: new Date().toISOString(),
    }
    setLogEntries(prev => [entry, ...prev])
    setLogForm({ date: dateToStr(today), category: 'note', plantType: '', note: '' })
    setShowLogForm(false)
  }

  // ── Render helpers ──
  const renderTaskBadge = (task: CalendarTask, compact = false) => {
    const meta = taskMeta[task.type]
    if (compact) {
      return (
        <div className={`text-[10px] px-1 rounded ${meta.bg} ${meta.text} truncate`}>
          {task.plant.emoji} {task.plant.name}
        </div>
      )
    }
    return (
      <div className={`flex items-start gap-2 p-3 rounded-xl ${meta.bg} border ${meta.border}`}>
        <span className="text-lg shrink-0">{task.plant.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${meta.text}`}>{task.plant.name}</div>
          <div className="text-xs text-garden-dark/60">{meta.emoji} {meta.label}</div>
          <div className="text-xs text-garden-dark/40 mt-0.5">{task.description}</div>
        </div>
      </div>
    )
  }

  const getTasksForDay = (day: number) => {
    const d = new Date(YEAR, selectedMonth, day)
    return filteredTasks.filter(t => d >= t.startDate && d <= t.endDate)
  }

  const getLogsForDay = (day: number) => {
    const dateStr = `${YEAR}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return logEntries.filter(e => e.date === dateStr)
  }

  // Calendar grid
  const firstDay = new Date(YEAR, selectedMonth, 1).getDay()
  const daysInMonth = new Date(YEAR, selectedMonth + 1, 0).getDate()

  // ── Year overview bar chart data ──
  const yearBarData = gardenPlants.map(plant => {
    const tasks = generateTasks(plant).filter(t => filterType === 'all' || t.type === filterType)
    return { plant, tasks }
  })

  return (
    <div className="min-h-screen bg-garden-cream/50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <Link href={`/garden/${gardenId}/plan`} className="text-garden-dark/50 text-sm hover:text-garden-dark">← Back to Planner</Link>
            <h1 className="font-display text-2xl sm:text-3xl text-garden-dark mt-1">📅 Garden Calendar</h1>
            <p className="text-garden-dark/50 text-sm mt-0.5">{garden.name} • Zone 8b • Last frost: ~Mar 15</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-garden-green/10 w-fit">
          <button onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'calendar' ? 'bg-garden-green text-white' : 'text-garden-dark/60 hover:bg-garden-cream'}`}>
            📅 Calendar
          </button>
          <button onClick={() => setActiveTab('log')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'log' ? 'bg-garden-green text-white' : 'text-garden-dark/60 hover:bg-garden-cream'}`}>
            📓 Garden Log
          </button>
        </div>

        {activeTab === 'calendar' ? (
          <>
            {/* This Week Banner */}
            {thisWeekTasks.length > 0 && (
              <div className="card mb-5 border-2 border-garden-green/30 bg-garden-green/5">
                <h2 className="font-display text-lg text-garden-dark mb-3 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-garden-green animate-pulse" />
                  This Week
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {thisWeekTasks.slice(0, 9).map((t, i) => (
                    <div key={i}>{renderTaskBadge(t)}</div>
                  ))}
                  {thisWeekTasks.length > 9 && (
                    <div className="text-sm text-garden-dark/40 flex items-center">+{thisWeekTasks.length - 9} more tasks</div>
                  )}
                </div>
              </div>
            )}

            {/* Filter pills */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <button onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${filterType === 'all' ? 'bg-garden-green text-white' : 'bg-white text-garden-dark/60 hover:bg-garden-cream border border-garden-green/10'}`}>
                All
              </button>
              {(Object.entries(taskMeta) as [TaskType, typeof taskMeta[TaskType]][]).map(([key, val]) => (
                <button key={key} onClick={() => setFilterType(key)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${filterType === key ? 'bg-garden-green text-white' : `${val.bg} ${val.text} hover:opacity-80`}`}>
                  {val.emoji} {val.label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              {/* Calendar grid */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setSelectedMonth(m => Math.max(0, m - 1))} className="text-garden-dark/50 hover:text-garden-dark p-2 text-lg">←</button>
                    <h2 className="font-display text-xl sm:text-2xl text-garden-dark">{MONTH_FULL[selectedMonth]} {YEAR}</h2>
                    <button onClick={() => setSelectedMonth(m => Math.min(11, m + 1))} className="text-garden-dark/50 hover:text-garden-dark p-2 text-lg">→</button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-center text-xs font-semibold text-garden-dark/40 py-1">{d}</div>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`e-${i}`} className="h-20 sm:h-24" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1
                      const dayTasks = getTasksForDay(day)
                      const dayLogs = getLogsForDay(day)
                      const isToday = selectedMonth === today.getMonth() && day === today.getDate()
                      const d = new Date(YEAR, selectedMonth, day)
                      const isThisWeek = isSameWeek(d, today)
                      return (
                        <div key={day} className={`h-20 sm:h-24 rounded-xl border p-1 overflow-hidden transition-colors ${isToday ? 'border-garden-green border-2 bg-garden-green/10' : isThisWeek ? 'border-garden-green/30 bg-garden-green/5' : 'border-garden-green/10 hover:bg-garden-cream/30'}`}>
                          <div className={`text-xs font-semibold mb-0.5 flex items-center gap-1 ${isToday ? 'text-garden-green' : 'text-garden-dark/50'}`}>
                            {day}
                            {isToday && <span className="text-[8px] bg-garden-green text-white px-1 rounded">today</span>}
                          </div>
                          <div className="space-y-0.5">
                            {dayTasks.slice(0, 2).map((t, j) => (
                              <div key={j} className={`text-[10px] px-1 rounded ${taskMeta[t.type].bg} ${taskMeta[t.type].text} truncate`}>
                                {t.plant.emoji} {t.plant.name}
                              </div>
                            ))}
                            {dayLogs.slice(0, 1).map((l, j) => (
                              <div key={`l-${j}`} className="text-[10px] px-1 rounded bg-garden-sand text-garden-brown truncate">
                                {logCategoryMeta[l.category].emoji} {l.note.slice(0, 20)}
                              </div>
                            ))}
                            {(dayTasks.length + dayLogs.length) > 3 && (
                              <div className="text-[9px] text-garden-dark/40">+{dayTasks.length + dayLogs.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Year overview */}
                <div className="card mt-5">
                  <h3 className="font-display text-lg text-garden-dark mb-3">📊 Year Overview</h3>
                  <div className="space-y-2">
                    {yearBarData.map(({ plant, tasks }) => (
                      <div key={plant.id} className="flex items-center gap-2">
                        <span className="text-sm w-24 truncate shrink-0">{plant.emoji} {plant.name}</span>
                        <div className="flex-1 h-5 bg-garden-cream rounded-full relative overflow-hidden">
                          {tasks.map((t, i) => {
                            const startDay = Math.max(0, Math.floor((t.startDate.getTime() - new Date(YEAR, 0, 1).getTime()) / 86400000))
                            const endDay = Math.min(365, Math.floor((t.endDate.getTime() - new Date(YEAR, 0, 1).getTime()) / 86400000))
                            const left = (startDay / 365) * 100
                            const width = Math.max(1, ((endDay - startDay) / 365) * 100)
                            const colors: Record<TaskType, string> = {
                              'start-indoors': '#9333ea',
                              'direct-sow': '#16a34a',
                              transplant: '#16a34a',
                              harvest: '#ea580c',
                              fertilize: '#2563eb',
                              prune: '#2563eb',
                            }
                            return (
                              <div key={i} className="absolute top-0 h-full rounded-full opacity-60"
                                style={{ left: `${left}%`, width: `${width}%`, backgroundColor: colors[t.type] }}
                                title={`${taskMeta[t.type].label}: ${dateToStr(t.startDate)} – ${dateToStr(t.endDate)}`} />
                            )
                          })}
                          {/* Today marker */}
                          <div className="absolute top-0 h-full w-0.5 bg-garden-dark/40"
                            style={{ left: `${(Math.floor((today.getTime() - new Date(YEAR, 0, 1).getTime()) / 86400000) / 365) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-garden-dark/30">
                    {MONTHS.map(m => <span key={m}>{m}</span>)}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Month tasks list */}
                <div className="card">
                  <h3 className="font-display text-lg text-garden-dark mb-3">{MONTH_FULL[selectedMonth]} Tasks</h3>
                  {monthTasks.length === 0 ? (
                    <p className="text-sm text-garden-dark/40">No tasks this month.</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-auto">
                      {monthTasks.map((t, i) => (
                        <div key={i}>{renderTaskBadge(t)}</div>
                      ))}
                    </div>
                  )}

                  {/* Log entries for the month */}
                  {monthLogEntries.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-garden-green/10">
                      <h4 className="text-sm font-semibold text-garden-dark mb-2">📓 Log Entries</h4>
                      <div className="space-y-2">
                        {monthLogEntries.map(entry => {
                          const cat = logCategoryMeta[entry.category]
                          const plant = entry.plantType ? plantMap.get(entry.plantType) : null
                          return (
                            <div key={entry.id} className={`p-2 rounded-xl ${cat.bg} border border-garden-green/10`}>
                              <div className="flex items-center gap-1 text-xs text-garden-dark/50 mb-0.5">
                                <span>{cat.emoji}</span>
                                <span className={`font-semibold ${cat.text}`}>{cat.label}</span>
                                {plant && <span>• {plant.emoji} {plant.name}</span>}
                                <span className="ml-auto">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                              <div className="text-xs text-garden-dark/70">{entry.note}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Frost dates */}
                <div className="card bg-garden-dark text-white">
                  <h3 className="font-display text-lg mb-3">🌡️ Frost Dates</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Last Spring Frost</span>
                      <span className="font-semibold">Mar 15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">First Fall Frost</span>
                      <span className="font-semibold">Nov 15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Growing Season</span>
                      <span className="font-semibold text-garden-lime">~245 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">USDA Zone</span>
                      <span className="font-semibold">8b</span>
                    </div>
                  </div>
                </div>

                {/* Plants in garden */}
                <div className="card">
                  <h3 className="font-display text-lg text-garden-dark mb-3">🌱 Your Plants</h3>
                  <div className="space-y-1">
                    {gardenPlants.map(p => (
                      <div key={p.id} className="flex items-center gap-2 text-sm py-1">
                        <span>{p.emoji}</span>
                        <span className="text-garden-dark">{p.name}</span>
                        <span className="text-xs text-garden-dark/40 ml-auto">{p.daysToMaturity}d</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── LOG TAB ── */
          <div className="max-w-2xl">
            {/* Add entry button */}
            <div className="mb-4">
              {!showLogForm ? (
                <button onClick={() => setShowLogForm(true)} className="btn-primary text-sm">
                  + Add Log Entry
                </button>
              ) : (
                <div className="card">
                  <h3 className="font-display text-lg text-garden-dark mb-3">New Log Entry</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Date</label>
                        <input type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                          className="w-full border border-garden-green/20 rounded-xl px-3 py-2 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Category</label>
                        <select value={logForm.category} onChange={e => setLogForm(f => ({ ...f, category: e.target.value as LogCategory }))}
                          className="w-full border border-garden-green/20 rounded-xl px-3 py-2 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30">
                          {Object.entries(logCategoryMeta).map(([k, v]) => (
                            <option key={k} value={k}>{v.emoji} {v.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Plant (optional)</label>
                      <select value={logForm.plantType} onChange={e => setLogForm(f => ({ ...f, plantType: e.target.value }))}
                        className="w-full border border-garden-green/20 rounded-xl px-3 py-2 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30">
                        <option value="">— None —</option>
                        {gardenPlants.map(p => (
                          <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Note</label>
                      <textarea value={logForm.note} onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))}
                        rows={3} placeholder="What happened in the garden today?"
                        className="w-full border border-garden-green/20 rounded-xl px-3 py-2 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30 resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addLogEntry} className="btn-primary text-sm py-2">Save Entry</button>
                      <button onClick={() => setShowLogForm(false)} className="btn-secondary text-sm py-2">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Log entries list */}
            <div className="space-y-3">
              {logEntries.length === 0 ? (
                <div className="card text-center py-12">
                  <div className="text-4xl mb-3">📓</div>
                  <p className="text-garden-dark/50 text-sm">No log entries yet</p>
                  <p className="text-garden-dark/30 text-xs mt-1">Start recording your garden activities!</p>
                </div>
              ) : (
                logEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(entry => {
                    const cat = logCategoryMeta[entry.category]
                    const plant = entry.plantType ? plantMap.get(entry.plantType) : null
                    return (
                      <div key={entry.id} className="card !p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${cat.bg} ${cat.text}`}>
                            {cat.emoji} {cat.label}
                          </span>
                          {plant && (
                            <span className="text-xs text-garden-dark/50">{plant.emoji} {plant.name}</span>
                          )}
                          <span className="text-xs text-garden-dark/30 ml-auto">
                            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-sm text-garden-dark/80 leading-relaxed">{entry.note}</p>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

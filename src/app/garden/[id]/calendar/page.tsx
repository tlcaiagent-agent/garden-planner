'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { plantMap, PlantData } from '@/data/plants'
import { mockGardens, mockGardenLog, GardenLogEntry, LogCategory } from '@/data/mock'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// ── Constants ──
const LAST_FROST = new Date(2026, 2, 15)
const FIRST_FROST = new Date(2026, 10, 15)
const YEAR = 2026
const TODAY = new Date(2026, 2, 4)
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ── Types ──
type TaskType = 'planting-window' | 'indoor-window' | 'outdoor-window' | 'harvest' | 'fertilize' | 'prune'
type Tab = 'today' | 'timeline' | 'log'

interface CalendarTask {
  id: string
  plantIds: string[]
  plants: PlantData[]
  type: TaskType
  startDate: Date
  endDate: Date
  description: string
}

interface SingleTask {
  plant: PlantData
  type: TaskType
  startDate: Date
  endDate: Date
}

const taskMeta: Record<TaskType, { color: string; bg: string; text: string; border: string; label: string; emoji: string; barColor: string }> = {
  'planting-window': { color: 'green', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Planting Window', emoji: '🌱', barColor: '#16a34a' },
  'indoor-window':   { color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Start Indoors', emoji: '🏠', barColor: '#9333ea' },
  'outdoor-window':  { color: 'green', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Plant Outdoors', emoji: '☀️', barColor: '#16a34a' },
  'harvest':       { color: 'orange', bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  label: 'Harvest',      emoji: '🧺', barColor: '#ea580c' },
  'fertilize':     { color: 'blue',   bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    label: 'Fertilize',    emoji: '💧', barColor: '#2563eb' },
  'prune':         { color: 'blue',   bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     label: 'Prune',        emoji: '✂️', barColor: '#0284c7' },
}

const logCategoryMeta: Record<LogCategory, { bg: string; text: string; emoji: string; label: string }> = {
  planted:    { bg: 'bg-emerald-50',  text: 'text-emerald-700', emoji: '🌱', label: 'Planted' },
  watered:    { bg: 'bg-blue-50',     text: 'text-blue-700',    emoji: '💧', label: 'Watered' },
  fertilized: { bg: 'bg-amber-50',    text: 'text-amber-700',   emoji: '🧪', label: 'Fertilized' },
  harvested:  { bg: 'bg-orange-50',   text: 'text-orange-700',  emoji: '🧺', label: 'Harvested' },
  note:       { bg: 'bg-gray-50',     text: 'text-gray-600',    emoji: '📝', label: 'Note' },
}

// ── Helpers ──
function addDays(d: Date, days: number): Date { const r = new Date(d); r.setDate(r.getDate() + days); return r }
function addWeeks(d: Date, weeks: number): Date { return addDays(d, weeks * 7) }
function dateToStr(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function daysBetween(a: Date, b: Date): number { return Math.floor((b.getTime() - a.getTime()) / 86400000) }
function startOfDay(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
function formatDateShort(d: Date): string { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
function startOfWeek(d: Date): Date { const r = new Date(d); r.setDate(r.getDate() - r.getDay()); return startOfDay(r) }
function endOfWeek(d: Date): Date { return addDays(startOfWeek(d), 6) }

// ── Planting advice helper ──
function getPlantingAdvice(plant: PlantData, today: Date): string {
  const daysToFrost = daysBetween(today, LAST_FROST)
  const pastFrost = today >= LAST_FROST

  if (!pastFrost && plant.seedIndoors) {
    return `🌡️ Start indoors for a head start — ${Math.ceil(daysToFrost / 7)} weeks until last frost`
  }
  if (pastFrost && (plant.directSow || plant.transplant)) {
    return `☀️ Safe to plant outdoors — past last frost date`
  }
  if (!pastFrost && plant.directSow && plant.directSow[0] <= 0) {
    return `Can direct sow now (cold-hardy) or start indoors`
  }
  return `🌱 Planting window open`
}

// ── Task generation (single plant) ──
function generateSingleTasks(plant: PlantData): SingleTask[] {
  const tasks: SingleTask[] = []

  // Compute merged planting window
  const windowStarts: Date[] = []
  const windowEnds: Date[] = []

  if (plant.seedIndoors) {
    windowStarts.push(addWeeks(LAST_FROST, -plant.seedIndoors[1]))
    windowEnds.push(addWeeks(LAST_FROST, -plant.seedIndoors[0]))
  }
  if (plant.directSow) {
    windowStarts.push(addWeeks(LAST_FROST, plant.directSow[0]))
    windowEnds.push(addWeeks(LAST_FROST, plant.directSow[1]))
  }
  if (plant.transplant) {
    windowStarts.push(addWeeks(LAST_FROST, plant.transplant[0]))
    windowEnds.push(addWeeks(LAST_FROST, plant.transplant[1]))
  }

  if (windowStarts.length > 0) {
    const earliest = new Date(Math.min(...windowStarts.map(d => d.getTime())))
    const latest = new Date(Math.max(...windowEnds.map(d => d.getTime())))
    tasks.push({ plant, type: 'planting-window', startDate: earliest, endDate: latest })
  }

  // Harvest based on "if planted today"
  const plantingDate = TODAY
  const harvestStart = addDays(plantingDate, plant.daysToHarvest[0])
  const harvestEnd = addDays(plantingDate, plant.daysToHarvest[1])
  if (harvestStart < FIRST_FROST) {
    tasks.push({ plant, type: 'harvest', startDate: harvestStart, endDate: harvestEnd < FIRST_FROST ? harvestEnd : FIRST_FROST })
  }

  if (plant.fertilizeIntervalWeeks) {
    const growStart = TODAY
    let fertDate = addWeeks(growStart, plant.fertilizeIntervalWeeks)
    let count = 0
    while (fertDate < FIRST_FROST && count < 8) {
      tasks.push({ plant, type: 'fertilize', startDate: fertDate, endDate: addDays(fertDate, 3) })
      fertDate = addWeeks(fertDate, plant.fertilizeIntervalWeeks)
      count++
    }
  }

  if (plant.needsPruning) {
    const growStart = plant.transplant ? addWeeks(LAST_FROST, plant.transplant[0]) : LAST_FROST
    let pruneDate = addWeeks(growStart, 3)
    let count = 0
    while (pruneDate < FIRST_FROST && count < 6) {
      tasks.push({ plant, type: 'prune', startDate: pruneDate, endDate: addDays(pruneDate, 3) })
      pruneDate = addWeeks(pruneDate, 3)
      count++
    }
  }

  return tasks
}

// ── Group tasks by type + overlapping date range ──
function groupTasks(singleTasks: SingleTask[]): CalendarTask[] {
  const byTypeAndDate = new Map<string, SingleTask[]>()

  for (const t of singleTasks) {
    const key = `${t.type}|${dateToStr(t.startDate)}|${dateToStr(t.endDate)}`
    const arr = byTypeAndDate.get(key) || []
    arr.push(t)
    byTypeAndDate.set(key, arr)
  }

  const grouped: CalendarTask[] = []
  let idx = 0
  for (const [, tasks] of byTypeAndDate) {
    const first = tasks[0]
    const plants = tasks.map(t => t.plant)
    const plantIds = plants.map(p => p.id)
    const meta = taskMeta[first.type]
    grouped.push({
      id: `task-${idx++}`,
      plantIds,
      plants,
      type: first.type,
      startDate: first.startDate,
      endDate: first.endDate,
      description: plants.length > 1
        ? `${meta.label}: ${plants.map(p => p.name).join(', ')}`
        : `${meta.label} ${plants[0].name}`,
    })
  }

  return grouped.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
}

// ── Urgency helpers ──
type Urgency = 'overdue' | 'due-today' | 'this-week' | 'next-week' | 'upcoming'
function getUrgency(task: CalendarTask, today: Date): Urgency {
  const t = startOfDay(today)
  const start = startOfDay(task.startDate)
  const end = startOfDay(task.endDate)
  if (end < t) return 'overdue'
  if (start <= t && end >= t) return 'due-today'
  const weekEnd = endOfWeek(t)
  if (start <= weekEnd) return 'this-week'
  const nextWeekEnd = addDays(weekEnd, 7)
  if (start <= nextWeekEnd) return 'next-week'
  return 'upcoming'
}

const urgencyOrder: Record<Urgency, number> = { overdue: 0, 'due-today': 1, 'this-week': 2, 'next-week': 3, upcoming: 4 }
const urgencyStyle: Record<Urgency, { badge: string; border: string }> = {
  overdue:    { badge: 'bg-red-100 text-red-700',     border: 'border-red-200' },
  'due-today': { badge: 'bg-green-100 text-green-700', border: 'border-green-200' },
  'this-week': { badge: 'bg-blue-100 text-blue-700',   border: 'border-blue-200' },
  'next-week': { badge: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-200' },
  upcoming:    { badge: 'bg-gray-100 text-gray-600',    border: 'border-gray-200' },
}
const urgencyLabel: Record<Urgency, string> = {
  overdue: 'Overdue', 'due-today': 'Today', 'this-week': 'This week', 'next-week': 'Next week', upcoming: 'Upcoming',
}

// ── Component ──
export default function CalendarPage() {
  const params = useParams()
  const gardenId = params.id as string
  const garden = mockGardens.find(g => g.id === gardenId) || mockGardens[0]

  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const [logEntries, setLogEntries] = useState<GardenLogEntry[]>(mockGardenLog.filter(l => l.gardenId === gardenId))
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteForm, setNoteForm] = useState({ date: dateToStr(TODAY), plantType: '', note: '' })
  const [logFilter, setLogFilter] = useState<LogCategory | 'all'>('all')
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState({ date: dateToStr(TODAY), category: 'note' as LogCategory, plantType: '', note: '' })
  const [timelinePopup, setTimelinePopup] = useState<{ plant: PlantData; type: TaskType; start: Date; end: Date } | null>(null)
  const [expandThisWeek, setExpandThisWeek] = useState(true)
  const [expandNextWeek, setExpandNextWeek] = useState(false)
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set())
  const timelineRef = useRef<HTMLDivElement>(null)

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

  const singleTasks = useMemo(() => gardenPlants.flatMap(generateSingleTasks), [gardenPlants])
  const groupedTasks = useMemo(() => groupTasks(singleTasks), [singleTasks])

  // Scroll timeline to today on mount
  useEffect(() => {
    if (activeTab === 'timeline' && timelineRef.current) {
      const dayOfYear = daysBetween(new Date(YEAR, 0, 1), TODAY)
      const pxPerDay = 3
      timelineRef.current.scrollLeft = Math.max(0, dayOfYear * pxPerDay - 120)
    }
  }, [activeTab])

  // ── Today tab helpers ──
  const relevantTasks = useMemo(() => {
    return groupedTasks
      .filter(t => getUrgency(t, TODAY) !== 'upcoming' || daysBetween(TODAY, t.startDate) <= 30)
      .map(t => ({ ...t, urgency: getUrgency(t, TODAY) }))
      .sort((a, b) => {
        const done_a = completedTasks.has(a.id) ? 1 : 0
        const done_b = completedTasks.has(b.id) ? 1 : 0
        if (done_a !== done_b) return done_a - done_b
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      })
  }, [groupedTasks, completedTasks])

  const heroTasks = useMemo(() =>
    relevantTasks.filter(t => !completedTasks.has(t.id)).slice(0, 5),
    [relevantTasks, completedTasks]
  )

  const thisWeekGrouped = useMemo(() => {
    const weekTasks = relevantTasks.filter(t => t.urgency === 'this-week' || t.urgency === 'due-today')
    const byAction = new Map<string, { emoji: string; label: string; names: string[] }>()
    const actionGroups: [string, string, string][] = [
      ['planting-window', '🌱', 'Planting window'],
      ['harvest', '🧺', 'Ready to harvest'],
      ['fertilize', '💧', 'Fertilize'],
      ['prune', '✂️', 'Prune'],
    ]
    for (const [type, emoji, label] of actionGroups) {
      const matching = weekTasks.filter(t => t.type === type && !completedTasks.has(t.id))
      if (matching.length > 0) {
        const names = [...new Set(matching.flatMap(t => t.plants.map(p => p.name)))]
        byAction.set(type, { emoji, label, names })
      }
    }
    return byAction
  }, [relevantTasks, completedTasks])

  const nextWeekGrouped = useMemo(() => {
    const weekTasks = relevantTasks.filter(t => t.urgency === 'next-week')
    const byAction = new Map<string, { emoji: string; label: string; names: string[] }>()
    const actionGroups: [string, string, string][] = [
      ['planting-window', '🌱', 'Planting window'],
      ['harvest', '🧺', 'Ready to harvest'],
      ['fertilize', '💧', 'Fertilize'],
      ['prune', '✂️', 'Prune'],
    ]
    for (const [type, emoji, label] of actionGroups) {
      const matching = weekTasks.filter(t => t.type === type && !completedTasks.has(t.id))
      if (matching.length > 0) {
        const names = [...new Set(matching.flatMap(t => t.plants.map(p => p.name)))]
        byAction.set(type, { emoji, label, names })
      }
    }
    return byAction
  }, [relevantTasks, completedTasks])

  // ── Actions ──
  function completeTask(task: CalendarTask) {
    setCompletedTasks(prev => {
      const next = new Set(prev)
      next.add(task.id)
      return next
    })
    // Auto-create log entry
    const catMap: Partial<Record<TaskType, LogCategory>> = {
      'planting-window': 'planted',
      harvest: 'harvested', fertilize: 'fertilized',
    }
    const cat = catMap[task.type] || 'note'
    const entry: GardenLogEntry = {
      id: `log-auto-${Date.now()}`,
      gardenId,
      date: dateToStr(TODAY),
      category: cat,
      plantType: task.plantIds[0],
      note: `✅ ${task.description}`,
      createdAt: new Date().toISOString(),
    }
    setLogEntries(prev => [entry, ...prev])
  }

  function uncompleteTask(taskId: string) {
    setCompletedTasks(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }

  function addNote() {
    if (!noteForm.note.trim()) return
    const entry: GardenLogEntry = {
      id: `log-${Date.now()}`,
      gardenId,
      date: noteForm.date,
      category: 'note',
      plantType: noteForm.plantType || undefined,
      note: noteForm.note.trim(),
      createdAt: new Date().toISOString(),
    }
    setLogEntries(prev => [entry, ...prev])
    setNoteForm({ date: dateToStr(TODAY), plantType: '', note: '' })
    setShowNoteForm(false)
  }

  function addLogEntry() {
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
    setLogForm({ date: dateToStr(TODAY), category: 'note', plantType: '', note: '' })
    setShowLogForm(false)
  }

  // ── Log tab helpers ──
  const filteredLog = useMemo(() => {
    const sorted = [...logEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    if (logFilter === 'all') return sorted
    return sorted.filter(e => e.category === logFilter)
  }, [logEntries, logFilter])

  const logByMonth = useMemo(() => {
    const groups = new Map<string, GardenLogEntry[]>()
    for (const entry of filteredLog) {
      const d = new Date(entry.date)
      const key = `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`
      const arr = groups.get(key) || []
      arr.push(entry)
      groups.set(key, arr)
    }
    return groups
  }, [filteredLog])

  // ── Timeline data (per-plant, for swim lanes) ──
  const timelinePlants = useMemo(() => {
    return gardenPlants.map(plant => {
      const bars: { type: TaskType; startDay: number; endDay: number; start: Date; end: Date }[] = []
      const yearStart = new Date(YEAR, 0, 1)

      // Indoor window (seedIndoors)
      if (plant.seedIndoors) {
        const start = addWeeks(LAST_FROST, -plant.seedIndoors[1])
        const end = addWeeks(LAST_FROST, -plant.seedIndoors[0])
        bars.push({ type: 'indoor-window', startDay: daysBetween(yearStart, start), endDay: daysBetween(yearStart, end), start, end })
      }

      // Outdoor window (directSow + transplant merged)
      const outdoorStarts: Date[] = []
      const outdoorEnds: Date[] = []
      if (plant.directSow) {
        outdoorStarts.push(addWeeks(LAST_FROST, plant.directSow[0]))
        outdoorEnds.push(addWeeks(LAST_FROST, plant.directSow[1]))
      }
      if (plant.transplant) {
        outdoorStarts.push(addWeeks(LAST_FROST, plant.transplant[0]))
        outdoorEnds.push(addWeeks(LAST_FROST, plant.transplant[1]))
      }
      if (outdoorStarts.length > 0) {
        const start = new Date(Math.min(...outdoorStarts.map(d => d.getTime())))
        const end = new Date(Math.max(...outdoorEnds.map(d => d.getTime())))
        bars.push({ type: 'outdoor-window', startDay: daysBetween(yearStart, start), endDay: daysBetween(yearStart, end), start, end })
      }

      // Harvest
      const tasks = generateSingleTasks(plant)
      for (const t of tasks) {
        if (t.type === 'harvest') {
          bars.push({ type: 'harvest', startDay: daysBetween(yearStart, t.startDate), endDay: daysBetween(yearStart, t.endDate), start: t.startDate, end: t.endDate })
        }
      }

      return { plant, bars }
    })
  }, [gardenPlants])

  const yearStart = new Date(YEAR, 0, 1)
  const todayDay = daysBetween(yearStart, TODAY)
  const lastFrostDay = daysBetween(yearStart, LAST_FROST)
  const firstFrostDay = daysBetween(yearStart, FIRST_FROST)
  const totalDays = 365
  const pxPerDay = 3

  return (
    <div className="min-h-screen bg-garden-cream/50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
        {/* Header */}
        <div className="mb-4">
          <Link href={`/garden/${gardenId}/plan`} className="text-garden-dark/40 text-sm hover:text-garden-dark transition-colors">
            ← Back to Plan
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl text-garden-dark mt-1">📅 Garden Calendar</h1>
          <p className="text-garden-dark/50 text-sm">{garden.name} • Zone 8b • {formatDateShort(TODAY)}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-2xl p-1 border border-garden-green/10 w-full sm:w-fit">
          {([['today', '☀️ Today'], ['timeline', '📊 Timeline'], ['log', '📓 Log']] as [Tab, string][]).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${activeTab === tab ? 'bg-garden-green text-white shadow-sm' : 'text-garden-dark/60 hover:bg-garden-cream'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ═══════ TODAY TAB ═══════ */}
        {activeTab === 'today' && (
          <div className="space-y-5">
            {/* Hero: What needs attention */}
            <div className="bg-white rounded-2xl border-2 border-garden-green/20 p-4 sm:p-5 shadow-sm">
              <h2 className="font-display text-lg text-garden-dark mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-garden-green animate-pulse" />
                What needs attention
              </h2>
              {heroTasks.length === 0 ? (
                <p className="text-garden-dark/40 text-sm py-4 text-center">🎉 All caught up! Nothing urgent right now.</p>
              ) : (
                <div className="space-y-2.5">
                  {heroTasks.map(task => {
                    const meta = taskMeta[task.type]
                    const urgency = getUrgency(task, TODAY)
                    const uStyle = urgencyStyle[urgency]
                    const advice = task.type === 'planting-window' && task.plants.length > 0
                      ? getPlantingAdvice(task.plants[0], TODAY)
                      : null
                    return (
                      <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border ${uStyle.border} bg-white transition-all`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                              {meta.emoji} {meta.label}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${uStyle.badge}`}>
                              {urgencyLabel[urgency]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {task.plants.slice(0, 4).map(p => (
                              <span key={p.id} className="text-base">{p.emoji}</span>
                            ))}
                            <span className="text-sm font-semibold text-garden-dark">{task.plants.map(p => p.name).join(', ')}</span>
                          </div>
                          {advice ? (
                            <p className="text-xs text-emerald-600 font-medium">{advice}</p>
                          ) : (
                            <p className="text-xs text-garden-dark/50">{formatDateShort(task.startDate)} – {formatDateShort(task.endDate)}</p>
                          )}
                          {task.type === 'planting-window' && task.plants.some(p => p.plantingTip) && (
                            <div className="mt-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedTips(prev => { const next = new Set(prev); next.has(task.id) ? next.delete(task.id) : next.add(task.id); return next }) }}
                                className="text-xs text-garden-dark/40 hover:text-garden-dark/60 transition-colors font-medium"
                              >
                                {expandedTips.has(task.id) ? 'Hide tips ▾' : 'Show tips ▸'}
                              </button>
                              {expandedTips.has(task.id) && (
                                <div className="mt-1.5 space-y-2">
                                  {task.plants.filter(p => p.plantingTip).map(p => (
                                    <div key={p.id} className="bg-garden-cream/50 rounded-lg p-2.5 text-xs space-y-0.5">
                                      {task.plants.length > 1 && <p className="font-semibold text-garden-dark">{p.emoji} {p.name}</p>}
                                      {p.soilTempMin != null && p.soilTempOptimal && <p className="text-garden-dark/60">🌡️ Soil temp: Min {p.soilTempMin}°F, optimal {p.soilTempOptimal[0]}–{p.soilTempOptimal[1]}°F</p>}
                                      {p.daysToGermination && <p className="text-garden-dark/60">🌱 Germination: {p.daysToGermination[0]}–{p.daysToGermination[1]} days</p>}
                                      {p.plantingDepth && <p className="text-garden-dark/60">📏 Planting depth: {p.plantingDepth}</p>}
                                      {p.plantingTip && <p className="text-garden-dark/70 font-medium">💡 {p.plantingTip}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button onClick={() => completeTask(task)}
                          className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-garden-green/10 hover:bg-garden-green/20 text-garden-green font-bold text-sm transition-colors active:scale-95">
                          ✅
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* This Week */}
            {thisWeekGrouped.size > 0 && (
              <div className="bg-white rounded-2xl border border-garden-green/10 overflow-hidden">
                <button onClick={() => setExpandThisWeek(v => !v)}
                  className="w-full flex items-center justify-between p-4 min-h-[44px] text-left">
                  <h3 className="font-display text-base text-garden-dark flex items-center gap-2">
                    📋 This Week
                    <span className="text-xs font-normal text-garden-dark/40">{formatDateShort(startOfWeek(TODAY))} – {formatDateShort(endOfWeek(TODAY))}</span>
                  </h3>
                  <span className="text-garden-dark/40 text-lg">{expandThisWeek ? '▾' : '▸'}</span>
                </button>
                {expandThisWeek && (
                  <div className="px-4 pb-4 space-y-2">
                    {[...thisWeekGrouped.entries()].map(([type, { emoji, label, names }]) => (
                      <div key={type} className={`p-3 rounded-xl ${taskMeta[type as TaskType]?.bg || 'bg-gray-50'} flex items-start gap-2`}>
                        <span className="text-base">{emoji}</span>
                        <div>
                          <span className={`text-sm font-semibold ${taskMeta[type as TaskType]?.text || ''}`}>{label}:</span>
                          <span className="text-sm text-garden-dark/70 ml-1">{names.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Next Week */}
            {nextWeekGrouped.size > 0 && (
              <div className="bg-white rounded-2xl border border-garden-green/10 overflow-hidden">
                <button onClick={() => setExpandNextWeek(v => !v)}
                  className="w-full flex items-center justify-between p-4 min-h-[44px] text-left">
                  <h3 className="font-display text-base text-garden-dark flex items-center gap-2">
                    🔜 Next Week
                    <span className="text-xs font-normal text-garden-dark/40">{formatDateShort(addDays(startOfWeek(TODAY), 7))} – {formatDateShort(addDays(endOfWeek(TODAY), 7))}</span>
                  </h3>
                  <span className="text-garden-dark/40 text-lg">{expandNextWeek ? '▾' : '▸'}</span>
                </button>
                {expandNextWeek && (
                  <div className="px-4 pb-4 space-y-2">
                    {[...nextWeekGrouped.entries()].map(([type, { emoji, label, names }]) => (
                      <div key={type} className={`p-3 rounded-xl ${taskMeta[type as TaskType]?.bg || 'bg-gray-50'} flex items-start gap-2`}>
                        <span className="text-base">{emoji}</span>
                        <div>
                          <span className={`text-sm font-semibold ${taskMeta[type as TaskType]?.text || ''}`}>{label}:</span>
                          <span className="text-sm text-garden-dark/70 ml-1">{names.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Completed tasks */}
            {relevantTasks.filter(t => completedTasks.has(t.id)).length > 0 && (
              <div className="bg-white rounded-2xl border border-garden-green/10 p-4">
                <h3 className="font-display text-base text-garden-dark/50 mb-3">✅ Completed</h3>
                <div className="space-y-2">
                  {relevantTasks.filter(t => completedTasks.has(t.id)).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 opacity-60">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-garden-dark line-through">
                          {task.plants.map(p => p.emoji).join('')} {task.description}
                        </p>
                      </div>
                      <button onClick={() => uncompleteTask(task.id)}
                        className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-garden-dark/30 hover:text-garden-dark/60 text-sm transition-colors">
                        ↩️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Note floating form */}
            {showNoteForm && (
              <div className="fixed inset-0 bg-black/30 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowNoteForm(false)}>
                <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                  <h3 className="font-display text-lg text-garden-dark mb-4">📝 Add a Note</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Date</label>
                      <input type="date" value={noteForm.date} onChange={e => setNoteForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full border border-garden-green/20 rounded-xl px-3 py-2.5 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30 min-h-[44px]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Plant (optional)</label>
                      <select value={noteForm.plantType} onChange={e => setNoteForm(f => ({ ...f, plantType: e.target.value }))}
                        className="w-full border border-garden-green/20 rounded-xl px-3 py-2.5 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30 min-h-[44px]">
                        <option value="">— None —</option>
                        {gardenPlants.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Note</label>
                      <textarea value={noteForm.note} onChange={e => setNoteForm(f => ({ ...f, note: e.target.value }))}
                        rows={3} placeholder="What's happening in the garden?"
                        className="w-full border border-garden-green/20 rounded-xl px-3 py-2.5 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30 resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addNote} className="flex-1 bg-garden-green text-white font-semibold rounded-xl py-2.5 text-sm min-h-[44px] hover:bg-garden-green/90 transition-colors">Save</button>
                      <button onClick={() => setShowNoteForm(false)} className="flex-1 border border-garden-green/20 text-garden-dark/60 font-semibold rounded-xl py-2.5 text-sm min-h-[44px] hover:bg-garden-cream transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ TIMELINE TAB ═══════ */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs text-garden-dark/60">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{backgroundColor: '#9333ea'}} /> Start Indoors</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Plant Outdoors</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500" /> Harvest</span>
              <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-red-500" /> Today</span>
              <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-blue-400 border border-dashed" /> Frost dates</span>
            </div>

            <div className="bg-white rounded-2xl border border-garden-green/10 overflow-hidden">
              <div ref={timelineRef} className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div style={{ width: totalDays * pxPerDay + 140, minHeight: gardenPlants.length * 44 + 60 }} className="relative">
                  {/* Month headers */}
                  <div className="flex sticky top-0 z-10 bg-white border-b border-garden-green/10" style={{ paddingLeft: 140 }}>
                    {MONTHS.map((m, i) => {
                      const daysInMonth = new Date(YEAR, i + 1, 0).getDate()
                      return (
                        <div key={m} className="text-xs font-semibold text-garden-dark/50 border-r border-garden-green/5 flex items-center justify-center"
                          style={{ width: daysInMonth * pxPerDay, height: 28 }}>
                          {m}
                        </div>
                      )
                    })}
                  </div>

                  {/* Today line */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20" style={{ left: 140 + todayDay * pxPerDay }} />

                  {/* Frost lines */}
                  <div className="absolute top-0 bottom-0 z-10" style={{ left: 140 + lastFrostDay * pxPerDay, width: 2, background: 'repeating-linear-gradient(to bottom, #60a5fa 0, #60a5fa 4px, transparent 4px, transparent 8px)' }} />
                  <div className="absolute top-0 bottom-0 z-10" style={{ left: 140 + firstFrostDay * pxPerDay, width: 2, background: 'repeating-linear-gradient(to bottom, #60a5fa 0, #60a5fa 4px, transparent 4px, transparent 8px)' }} />

                  {/* Swim lanes */}
                  {timelinePlants.map(({ plant, bars }, idx) => (
                    <div key={plant.id} className={`flex items-center h-[40px] ${idx % 2 === 0 ? 'bg-white' : 'bg-garden-cream/30'}`} style={{ marginTop: idx === 0 ? 28 : 0 }}>
                      {/* Label */}
                      <div className="w-[140px] shrink-0 flex items-center gap-1.5 px-3 text-sm sticky left-0 z-10 bg-inherit">
                        <span>{plant.emoji}</span>
                        <span className="truncate text-garden-dark font-medium text-xs">{plant.name}</span>
                      </div>
                      {/* Bars */}
                      <div className="relative flex-1" style={{ width: totalDays * pxPerDay }}>
                        {bars.map((bar, bi) => {
                          const left = bar.startDay * pxPerDay
                          const width = Math.max(6, (bar.endDay - bar.startDay) * pxPerDay)
                          return (
                            <button key={bi}
                              onClick={() => setTimelinePopup({ plant, type: bar.type, start: bar.start, end: bar.end })}
                              className="absolute top-1 h-[24px] rounded-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer min-w-[6px]"
                              style={{ left, width, backgroundColor: taskMeta[bar.type].barColor }}
                              title={`${taskMeta[bar.type].label}: ${formatDateShort(bar.start)} – ${formatDateShort(bar.end)}`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline popup */}
            {timelinePopup && (
              <div className="fixed inset-x-0 bottom-0 z-50 p-4" onClick={() => setTimelinePopup(null)}>
                <div className="bg-white rounded-2xl shadow-xl border border-garden-green/10 p-4 max-w-md mx-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{timelinePopup.plant.emoji}</span>
                      <span className="font-display text-lg text-garden-dark">{timelinePopup.plant.name}</span>
                    </div>
                    <button onClick={() => setTimelinePopup(null)} className="text-garden-dark/40 hover:text-garden-dark min-w-[44px] min-h-[44px] flex items-center justify-center">✕</button>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${taskMeta[timelinePopup.type].bg} ${taskMeta[timelinePopup.type].text}`}>
                    {taskMeta[timelinePopup.type].emoji} {taskMeta[timelinePopup.type].label}
                  </div>
                  {timelinePopup.type === 'planting-window' && (
                    <p className="text-sm text-emerald-600 font-medium mt-2">{getPlantingAdvice(timelinePopup.plant, TODAY)}</p>
                  )}
                  <p className="text-sm text-garden-dark/60 mt-2">{formatDateShort(timelinePopup.start)} – {formatDateShort(timelinePopup.end)}</p>
                  <p className="text-xs text-garden-dark/40 mt-1">{timelinePopup.plant.daysToMaturity} days to maturity • {timelinePopup.plant.sunNeeds} sun • {timelinePopup.plant.waterNeeds} water</p>
                  {timelinePopup.type === 'planting-window' && timelinePopup.plant.plantingTip && (
                    <div className="mt-2 bg-garden-cream/50 rounded-lg p-2.5 text-xs space-y-0.5">
                      {timelinePopup.plant.soilTempMin != null && timelinePopup.plant.soilTempOptimal && <p className="text-garden-dark/60">🌡️ Soil temp: Min {timelinePopup.plant.soilTempMin}°F, optimal {timelinePopup.plant.soilTempOptimal[0]}–{timelinePopup.plant.soilTempOptimal[1]}°F</p>}
                      {timelinePopup.plant.daysToGermination && <p className="text-garden-dark/60">🌱 Germination: {timelinePopup.plant.daysToGermination[0]}–{timelinePopup.plant.daysToGermination[1]} days</p>}
                      {timelinePopup.plant.plantingDepth && <p className="text-garden-dark/60">📏 Planting depth: {timelinePopup.plant.plantingDepth}</p>}
                      <p className="text-garden-dark/70 font-medium">💡 {timelinePopup.plant.plantingTip}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ LOG TAB ═══════ */}
        {activeTab === 'log' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'planted', 'watered', 'fertilized', 'harvested', 'note'] as const).map(cat => (
                <button key={cat} onClick={() => setLogFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors min-h-[36px] ${logFilter === cat ? 'bg-garden-green text-white' : 'bg-white text-garden-dark/60 hover:bg-garden-cream border border-garden-green/10'}`}>
                  {cat === 'all' ? 'All' : `${logCategoryMeta[cat].emoji} ${logCategoryMeta[cat].label}`}
                </button>
              ))}
            </div>

            {/* Add entry button / form */}
            {!showLogForm ? (
              <button onClick={() => setShowLogForm(true)}
                className="w-full sm:w-auto bg-garden-green text-white font-semibold rounded-xl px-5 py-2.5 text-sm min-h-[44px] hover:bg-garden-green/90 transition-colors">
                + Add Entry
              </button>
            ) : (
              <div className="bg-white rounded-2xl border border-garden-green/10 p-4">
                <h3 className="font-display text-base text-garden-dark mb-3">New Log Entry</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Date</label>
                      <input type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                        className="w-full border border-garden-green/20 rounded-xl px-3 py-2.5 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30 min-h-[44px]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Category</label>
                      <select value={logForm.category} onChange={e => setLogForm(f => ({ ...f, category: e.target.value as LogCategory }))}
                        className="w-full border border-garden-green/20 rounded-xl px-3 py-2.5 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30 min-h-[44px]">
                        {Object.entries(logCategoryMeta).map(([k, v]) => (
                          <option key={k} value={k}>{v.emoji} {v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Plant (optional)</label>
                    <select value={logForm.plantType} onChange={e => setLogForm(f => ({ ...f, plantType: e.target.value }))}
                      className="w-full border border-garden-green/20 rounded-xl px-3 py-2.5 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30 min-h-[44px]">
                      <option value="">— None —</option>
                      {gardenPlants.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-garden-dark/60 block mb-1">Note</label>
                    <textarea value={logForm.note} onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))}
                      rows={3} placeholder="What happened in the garden?"
                      className="w-full border border-garden-green/20 rounded-xl px-3 py-2.5 text-sm text-garden-dark bg-white focus:outline-none focus:ring-2 focus:ring-garden-green/30 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addLogEntry} className="flex-1 bg-garden-green text-white font-semibold rounded-xl py-2.5 text-sm min-h-[44px] hover:bg-garden-green/90 transition-colors">Save</button>
                    <button onClick={() => setShowLogForm(false)} className="flex-1 border border-garden-green/20 text-garden-dark/60 font-semibold rounded-xl py-2.5 text-sm min-h-[44px] hover:bg-garden-cream transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Log entries grouped by month */}
            {filteredLog.length === 0 ? (
              <div className="bg-white rounded-2xl border border-garden-green/10 text-center py-12 px-4">
                <div className="text-4xl mb-3">📓</div>
                <p className="text-garden-dark/50 text-sm">No log entries yet</p>
                <p className="text-garden-dark/30 text-xs mt-1">Start recording your garden activities!</p>
              </div>
            ) : (
              [...logByMonth.entries()].map(([monthLabel, entries]) => (
                <div key={monthLabel}>
                  <h3 className="font-display text-sm text-garden-dark/50 mb-2 px-1">{monthLabel}</h3>
                  <div className="space-y-2">
                    {entries.map(entry => {
                      const cat = logCategoryMeta[entry.category]
                      const plant = entry.plantType ? plantMap.get(entry.plantType) : null
                      return (
                        <div key={entry.id} className="bg-white rounded-xl border border-garden-green/10 p-3.5">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                              {cat.emoji} {cat.label}
                            </span>
                            {plant && (
                              <span className="text-xs text-garden-dark/50">{plant.emoji} {plant.name}</span>
                            )}
                            <span className="text-xs text-garden-dark/30 ml-auto">
                              {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-garden-dark/80 leading-relaxed">{entry.note}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Add Note button (Today tab only) */}
      {activeTab === 'today' && !showNoteForm && (
        <button onClick={() => setShowNoteForm(true)}
          className="fixed bottom-6 right-6 z-40 bg-garden-green text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-garden-green/90 transition-all active:scale-95 text-xl">
          📝
        </button>
      )}
    </div>
  )
}

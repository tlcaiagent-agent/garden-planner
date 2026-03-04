'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { plantCatalog, plantMap, PlantData } from '@/data/plants'
import { mockGardens, GardenBed, PlacedPlant } from '@/data/mock'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const GRID_SIZE = 20
const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

const pxToFeetInches = (px: number) => {
  const inches = (px / 20) * 6
  const feet = Math.floor(inches / 12)
  const rem = Math.round(inches % 12)
  if (feet === 0) return `${rem}"`
  if (rem === 0) return `${feet}'`
  return `${feet}'${rem}"`
}

const getPlantSize = (spacing: number) => Math.max(20, Math.min(80, spacing * 1.5))

type BedShape = 'rectangle' | 'l-shape' | 'circle' | 'raised'

interface DragState {
  type: 'plant-move' | 'loose-plant-move' | 'bed-move' | 'bed-resize' | 'bed-rotate'
  plantId?: string
  bedId?: string
  offsetX: number
  offsetY: number
  startRotation?: number
  startAngle?: number
}

export default function GardenPlanPage() {
  const params = useParams()
  const gardenId = params.id as string
  const garden = mockGardens.find(g => g.id === gardenId) || mockGardens[0]

  const [beds, setBeds] = useState<GardenBed[]>(garden.beds)
  const [loosePlants, setLoosePlants] = useState<PlacedPlant[]>(garden.loosePlants || [])
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null)
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [selectedLoosePlantId, setSelectedLoosePlantId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [showCompanion, setShowCompanion] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'plants' | 'beds'>('plants')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [pendingPlantId, setPendingPlantId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLElement>(null)

  const selectedBed = beds.find(b => b.id === selectedBedId)

  const getCompanionStatus = useCallback((plantType: string, bedId: string) => {
    const plant = plantMap.get(plantType)
    if (!plant) return { companions: [] as string[], enemies: [] as string[] }
    const bed = beds.find(b => b.id === bedId)
    if (!bed) return { companions: [] as string[], enemies: [] as string[] }
    const neighbors = bed.plants.filter(p => p.plantType !== plantType).map(p => p.plantType)
    return {
      companions: [...new Set(neighbors.filter(n => plant.companionPlants.includes(n)))],
      enemies: [...new Set(neighbors.filter(n => plant.enemyPlants.includes(n)))],
    }
  }, [beds])

  const canvasXY = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  // Lock/unlock scroll on the overflow container when dragging
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    if (dragState) {
      el.style.overflow = 'hidden'
      // Also prevent touch scrolling
      const prevent = (e: TouchEvent) => { if (dragState) e.preventDefault() }
      el.addEventListener('touchmove', prevent, { passive: false })
      return () => {
        el.style.overflow = 'auto'
        el.removeEventListener('touchmove', prevent)
      }
    } else {
      el.style.overflow = 'auto'
    }
  }, [dragState])

  const addBed = (shape: BedShape) => {
    // Place bed in visible area
    const el = scrollContainerRef.current
    const scrollX = el ? el.scrollLeft : 0
    const scrollY = el ? el.scrollTop : 0
    const newBed: GardenBed = {
      id: `bed-${Date.now()}`,
      name: `New ${shape} bed`,
      shape,
      x: snap(scrollX + 100),
      y: snap(scrollY + 100),
      width: shape === 'circle' ? 160 : 260,
      height: shape === 'circle' ? 160 : 160,
      rotation: 0,
      plants: [],
    }
    setBeds(prev => [...prev, newBed])
    setSelectedBedId(newBed.id)
    setSelectedPlantId(null)
    setSelectedLoosePlantId(null)
    setBottomSheetOpen(false)
  }

  const deleteBed = (bedId: string) => {
    setBeds(prev => prev.filter(b => b.id !== bedId))
    if (selectedBedId === bedId) setSelectedBedId(null)
  }

  const deletePlant = (bedId: string, plantId: string) => {
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, plants: b.plants.filter(p => p.id !== plantId) } : b))
    setSelectedPlantId(null)
  }

  const deleteLoosePlant = (plantId: string) => {
    setLoosePlants(prev => prev.filter(p => p.id !== plantId))
    setSelectedLoosePlantId(null)
  }

  const rotateBed = (bedId: string, degrees: number) => {
    setBeds(prev => prev.map(b =>
      b.id === bedId ? { ...b, rotation: ((b.rotation || 0) + degrees + 360) % 360 } : b
    ))
  }

  // --- Mouse/touch handlers ---

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only fire on the canvas background itself
    if (e.target !== canvasRef.current) return

    if (pendingPlantId) {
      // Place plant on canvas (anywhere!)
      const { x, y } = canvasXY(e.clientX, e.clientY)
      const plantData = plantMap.get(pendingPlantId)
      const sz = plantData ? getPlantSize(plantData.spacing) : 30

      // Check if inside a bed first
      const targetBed = beds.find(b =>
        x >= b.x && x <= b.x + b.width &&
        y >= b.y && y <= b.y + b.height
      )

      if (targetBed) {
        const newPlant: PlacedPlant = {
          id: `plant-${Date.now()}`,
          plantType: pendingPlantId,
          x: snap(x - targetBed.x - sz / 2),
          y: snap(y - targetBed.y - sz / 2),
        }
        setBeds(prev => prev.map(b =>
          b.id === targetBed.id ? { ...b, plants: [...b.plants, newPlant] } : b
        ))
      } else {
        // Place as loose plant on canvas
        const newPlant: PlacedPlant = {
          id: `plant-${Date.now()}`,
          plantType: pendingPlantId,
          x: snap(x - sz / 2),
          y: snap(y - sz / 2),
        }
        setLoosePlants(prev => [...prev, newPlant])
      }
      return
    }

    // Deselect everything
    setSelectedBedId(null)
    setSelectedPlantId(null)
    setSelectedLoosePlantId(null)
  }

  // Also handle clicks on beds for placing plants
  const handleBedClick = (e: React.MouseEvent, bed: GardenBed) => {
    if (!pendingPlantId) return
    e.stopPropagation()
    const { x, y } = canvasXY(e.clientX, e.clientY)
    const plantData = plantMap.get(pendingPlantId)
    const sz = plantData ? getPlantSize(plantData.spacing) : 30
    const newPlant: PlacedPlant = {
      id: `plant-${Date.now()}`,
      plantType: pendingPlantId,
      x: snap(x - bed.x - sz / 2),
      y: snap(y - bed.y - sz / 2),
    }
    setBeds(prev => prev.map(b =>
      b.id === bed.id ? { ...b, plants: [...b.plants, newPlant] } : b
    ))
  }

  const startDrag = (ds: DragState) => {
    setDragState(ds)
  }

  const handleBedPointerDown = (e: React.MouseEvent | React.TouchEvent, bed: GardenBed) => {
    if (pendingPlantId) return // don't start bed drag if placing a plant
    e.stopPropagation()
    const client = 'touches' in e ? e.touches[0] : e
    const { x, y } = canvasXY(client.clientX, client.clientY)
    setSelectedBedId(bed.id)
    setSelectedPlantId(null)
    setSelectedLoosePlantId(null)
    startDrag({ type: 'bed-move', bedId: bed.id, offsetX: x - bed.x, offsetY: y - bed.y })
  }

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, bed: GardenBed) => {
    e.stopPropagation()
    startDrag({ type: 'bed-resize', bedId: bed.id, offsetX: 0, offsetY: 0 })
  }

  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent, bed: GardenBed) => {
    e.stopPropagation()
    const client = 'touches' in e ? e.touches[0] : e
    const { x, y } = canvasXY(client.clientX, client.clientY)
    const cx = bed.x + bed.width / 2
    const cy = bed.y + bed.height / 2
    const startAngle = Math.atan2(y - cy, x - cx) * 180 / Math.PI
    startDrag({
      type: 'bed-rotate', bedId: bed.id,
      offsetX: cx, offsetY: cy,
      startAngle, startRotation: bed.rotation || 0,
    })
  }

  const handlePlantPointerDown = (e: React.MouseEvent | React.TouchEvent, plant: PlacedPlant, bedId: string) => {
    e.stopPropagation()
    const bed = beds.find(b => b.id === bedId)!
    const client = 'touches' in e ? e.touches[0] : e
    const { x, y } = canvasXY(client.clientX, client.clientY)
    setSelectedPlantId(plant.id)
    setSelectedBedId(bedId)
    setSelectedLoosePlantId(null)
    startDrag({
      type: 'plant-move', plantId: plant.id, bedId,
      offsetX: x - bed.x - plant.x, offsetY: y - bed.y - plant.y,
    })
  }

  const handleLoosePlantPointerDown = (e: React.MouseEvent | React.TouchEvent, plant: PlacedPlant) => {
    e.stopPropagation()
    const client = 'touches' in e ? e.touches[0] : e
    const { x, y } = canvasXY(client.clientX, client.clientY)
    setSelectedLoosePlantId(plant.id)
    setSelectedPlantId(null)
    setSelectedBedId(null)
    startDrag({
      type: 'loose-plant-move', plantId: plant.id,
      offsetX: x - plant.x, offsetY: y - plant.y,
    })
  }

  // HTML5 drag from desktop sidebar
  const handlePaletteDragStart = (e: React.DragEvent, plant: PlantData) => {
    e.dataTransfer.setData('plantId', plant.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const plantId = e.dataTransfer.getData('plantId')
    if (!plantId) return
    const { x: dropX, y: dropY } = canvasXY(e.clientX, e.clientY)
    const plantData = plantMap.get(plantId)
    const sz = plantData ? getPlantSize(plantData.spacing) : 30

    // Check if inside a bed
    const targetBed = beds.find(b =>
      dropX >= b.x && dropX <= b.x + b.width &&
      dropY >= b.y && dropY <= b.y + b.height
    )

    if (targetBed) {
      const newPlant: PlacedPlant = {
        id: `plant-${Date.now()}`,
        plantType: plantId,
        x: snap(dropX - targetBed.x - sz / 2),
        y: snap(dropY - targetBed.y - sz / 2),
      }
      setBeds(prev => prev.map(b =>
        b.id === targetBed.id ? { ...b, plants: [...b.plants, newPlant] } : b
      ))
    } else {
      // Drop as loose plant
      const newPlant: PlacedPlant = {
        id: `plant-${Date.now()}`,
        plantType: plantId,
        x: snap(dropX - sz / 2),
        y: snap(dropY - sz / 2),
      }
      setLoosePlants(prev => [...prev, newPlant])
    }
  }

  // --- Drag movement ---
  useEffect(() => {
    if (!dragState) return

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) return
      // Prevent scrolling while dragging
      if ('touches' in e) e.preventDefault()

      const client = 'touches' in e ? e.touches[0] : e
      const { x, y } = canvasXY(client.clientX, client.clientY)

      if (dragState.type === 'bed-move' && dragState.bedId) {
        setBeds(prev => prev.map(b =>
          b.id === dragState.bedId ? { ...b, x: snap(x - dragState.offsetX), y: snap(y - dragState.offsetY) } : b
        ))
      } else if (dragState.type === 'bed-resize' && dragState.bedId) {
        setBeds(prev => prev.map(b => {
          if (b.id !== dragState.bedId) return b
          const newW = snap(Math.max(20, x - b.x))
          const newH = snap(Math.max(20, y - b.y))
          if (b.shape === 'circle') {
            const r = Math.max(20, Math.max(newW, newH))
            return { ...b, width: r, height: r }
          }
          return { ...b, width: newW, height: newH }
        }))
      } else if (dragState.type === 'bed-rotate' && dragState.bedId) {
        const angle = Math.atan2(y - dragState.offsetY, x - dragState.offsetX) * 180 / Math.PI
        const delta = angle - (dragState.startAngle || 0)
        const newRot = ((dragState.startRotation || 0) + delta + 360) % 360
        const snapped = Math.round(newRot / 15) * 15
        setBeds(prev => prev.map(b =>
          b.id === dragState.bedId ? { ...b, rotation: snapped } : b
        ))
      } else if (dragState.type === 'plant-move' && dragState.plantId && dragState.bedId) {
        const bed = beds.find(b => b.id === dragState.bedId)!
        setBeds(prev => prev.map(b =>
          b.id === dragState.bedId
            ? {
              ...b,
              plants: b.plants.map(p =>
                p.id === dragState.plantId
                  ? { ...p, x: snap(x - bed.x - dragState.offsetX), y: snap(y - bed.y - dragState.offsetY) }
                  : p
              ),
            }
            : b
        ))
      } else if (dragState.type === 'loose-plant-move' && dragState.plantId) {
        setLoosePlants(prev => prev.map(p =>
          p.id === dragState.plantId
            ? { ...p, x: snap(x - dragState.offsetX), y: snap(y - dragState.offsetY) }
            : p
        ))
      }
    }

    const onUp = (e: MouseEvent | TouchEvent) => {
      // Check if we need to snap plant into/out of a bed
      if (dragState.type === 'loose-plant-move' && dragState.plantId) {
        // Loose plant might have been dragged into a bed
        const plant = loosePlants.find(p => p.id === dragState.plantId)
        if (plant) {
          const plantData = plantMap.get(plant.plantType)
          const sz = plantData ? getPlantSize(plantData.spacing) : 30
          const cx = plant.x + sz / 2
          const cy = plant.y + sz / 2
          const targetBed = beds.find(b =>
            cx >= b.x && cx <= b.x + b.width &&
            cy >= b.y && cy <= b.y + b.height
          )
          if (targetBed) {
            // Convert loose plant → bed plant
            const bedPlant: PlacedPlant = {
              ...plant,
              x: snap(plant.x - targetBed.x),
              y: snap(plant.y - targetBed.y),
            }
            setLoosePlants(prev => prev.filter(p => p.id !== plant.id))
            setBeds(prev => prev.map(b =>
              b.id === targetBed.id ? { ...b, plants: [...b.plants, bedPlant] } : b
            ))
            setSelectedLoosePlantId(null)
            setSelectedPlantId(plant.id)
            setSelectedBedId(targetBed.id)
          }
        }
      } else if (dragState.type === 'plant-move' && dragState.plantId && dragState.bedId) {
        // Bed plant might have been dragged out of its bed
        const bed = beds.find(b => b.id === dragState.bedId)
        const plant = bed?.plants.find(p => p.id === dragState.plantId)
        if (bed && plant) {
          const plantData = plantMap.get(plant.plantType)
          const sz = plantData ? getPlantSize(plantData.spacing) : 30
          // Plant position is relative to bed
          const absX = bed.x + plant.x
          const absY = bed.y + plant.y
          const cx = absX + sz / 2
          const cy = absY + sz / 2
          const isInsideBed = cx >= bed.x && cx <= bed.x + bed.width &&
                              cy >= bed.y && cy <= bed.y + bed.height
          if (!isInsideBed) {
            // Convert bed plant → loose plant
            const loosePlant: PlacedPlant = {
              ...plant,
              x: snap(absX),
              y: snap(absY),
            }
            setBeds(prev => prev.map(b =>
              b.id === bed.id ? { ...b, plants: b.plants.filter(p => p.id !== plant.id) } : b
            ))
            setLoosePlants(prev => [...prev, loosePlant])
            setSelectedPlantId(null)
            setSelectedLoosePlantId(plant.id)
            setSelectedBedId(null)
          }
        }
      }
      setDragState(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragState, beds, loosePlants])

  const filteredPlants = filterCategory === 'all'
    ? plantCatalog
    : plantCatalog.filter(p => p.category === filterCategory)

  // --- Shared UI pieces ---
  const renderPlantPalette = (isMobile: boolean) => (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">
        {['all', 'vegetable', 'herb', 'fruit', 'flower'].map(cat => (
          <button key={cat} onClick={() => setFilterCategory(cat)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${filterCategory === cat ? 'bg-garden-green text-white' : 'bg-garden-cream text-garden-dark/60 hover:bg-garden-sand'}`}>
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {pendingPlantId && (
        <div className="bg-garden-green/10 border border-garden-green rounded-xl p-2 text-sm text-garden-dark flex items-center justify-between">
          <span>🌱 <b>{plantMap.get(pendingPlantId)?.name}</b> — tap anywhere to place</span>
          <button onClick={() => setPendingPlantId(null)} className="text-red-400 hover:text-red-600 px-2">✕</button>
        </div>
      )}

      <div className={`space-y-1 ${isMobile ? 'max-h-60 overflow-y-auto' : ''}`}>
        {filteredPlants.map(plant => (
          <div key={plant.id}
            draggable={!isMobile}
            onDragStart={!isMobile ? (e) => handlePaletteDragStart(e, plant) : undefined}
            onClick={() => { setPendingPlantId(plant.id); if (isMobile) setBottomSheetOpen(false) }}
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors group touch-manipulation ${pendingPlantId === plant.id ? 'bg-garden-green/10 ring-1 ring-garden-green' : 'hover:bg-garden-cream/50'}`}>
            <span className="text-2xl">{plant.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-garden-dark truncate">{plant.name}</div>
              <div className="text-xs text-garden-dark/40">{plant.spacing}&quot; spacing • {plant.sunNeeds} sun</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderBedPalette = () => (
    <div className="space-y-3">
      <p className="text-xs text-garden-dark/50">Tap to add a new bed:</p>
      <div className="grid grid-cols-2 gap-2">
        {([
          { shape: 'rectangle' as BedShape, emoji: '▭', name: 'Rectangle' },
          { shape: 'raised' as BedShape, emoji: '📦', name: 'Raised Bed' },
          { shape: 'circle' as BedShape, emoji: '⬭', name: 'Circle' },
          { shape: 'l-shape' as BedShape, emoji: '⌐', name: 'L-Shape' },
        ]).map(b => (
          <button key={b.shape} onClick={() => addBed(b.shape)}
            className="flex items-center gap-2 p-3 rounded-xl bg-garden-cream/50 hover:bg-garden-cream transition-colors text-left">
            <span className="text-xl">{b.emoji}</span>
            <span className="text-sm font-semibold text-garden-dark">{b.name}</span>
          </button>
        ))}
      </div>
      {beds.length > 0 && (
        <div className="pt-3 border-t border-garden-green/10">
          <p className="text-xs text-garden-dark/50 mb-2">Your beds:</p>
          {beds.map(bed => (
            <div key={bed.id}
              className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${selectedBedId === bed.id ? 'bg-garden-green/10' : 'hover:bg-garden-cream/50'}`}
              onClick={() => { setSelectedBedId(bed.id); setBottomSheetOpen(false) }}>
              <div>
                <div className="text-sm font-semibold text-garden-dark">{bed.name}</div>
                <div className="text-xs text-garden-dark/40">{bed.plants.length} plants • {pxToFeetInches(bed.width)} × {pxToFeetInches(bed.height)}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteBed(bed.id) }}
                className="text-red-400 hover:text-red-600 text-sm px-2 py-1">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Info for selected loose plant
  const selectedLoosePlant = loosePlants.find(p => p.id === selectedLoosePlantId)
  const selectedLoosePlantData = selectedLoosePlant ? plantMap.get(selectedLoosePlant.plantType) : null

  return (
    <div className="min-h-screen bg-garden-cream/50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden relative">

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-72 bg-white border-r border-garden-green/10 flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-garden-green/10">
            <Link href="/dashboard" className="text-garden-dark/50 text-sm hover:text-garden-dark">← Dashboard</Link>
            <h2 className="font-display text-lg text-garden-dark mt-2">{garden.name}</h2>
          </div>
          <div className="flex border-b border-garden-green/10">
            <button onClick={() => setSidebarTab('plants')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${sidebarTab === 'plants' ? 'text-garden-green border-b-2 border-garden-green' : 'text-garden-dark/50'}`}>
              🌱 Plants
            </button>
            <button onClick={() => setSidebarTab('beds')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${sidebarTab === 'beds' ? 'text-garden-green border-b-2 border-garden-green' : 'text-garden-dark/50'}`}>
              📐 Beds
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {sidebarTab === 'plants' ? renderPlantPalette(false) : renderBedPalette()}
          </div>
          <div className="p-3 border-t border-garden-green/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showCompanion} onChange={e => setShowCompanion(e.target.checked)} className="rounded accent-garden-green" />
              <span className="text-sm text-garden-dark/70">Show companion indicators</span>
            </label>
          </div>
        </aside>

        {/* Canvas area */}
        <main ref={scrollContainerRef as any} className="flex-1 overflow-auto bg-garden-cream/30 relative">

          {/* Mobile top bar */}
          <div className="md:hidden absolute top-3 left-3 right-3 z-20 flex gap-2">
            <button onClick={() => { setSidebarTab('plants'); setBottomSheetOpen(true) }}
              className="bg-white/90 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-md border border-garden-green/10 min-h-[44px]">
              🌱 Plants
            </button>
            <button onClick={() => { setSidebarTab('beds'); setBottomSheetOpen(true) }}
              className="bg-white/90 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-md border border-garden-green/10 min-h-[44px]">
              📐 Beds
            </button>
            <Link href={`/garden/${gardenId}/calendar`}
              className="bg-white/90 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-md border border-garden-green/10 min-h-[44px] flex items-center">
              📅
            </Link>
          </div>

          {/* Desktop top bar */}
          <div className="hidden md:flex absolute top-4 left-4 z-10 gap-2">
            <Link href={`/garden/${gardenId}/calendar`} className="bg-white/80 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-sm hover:bg-white transition-colors border border-garden-green/10">📅 Calendar</Link>
            <button className="bg-white/80 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-sm hover:bg-white transition-colors border border-garden-green/10">💾 Save</button>
            <button className="bg-white/80 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-sm hover:bg-white transition-colors border border-garden-green/10">🔗 Share</button>
          </div>

          {/* Scale bar */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-garden-green/10 shadow-sm pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-10 h-0.5 bg-garden-dark"></div>
              <span className="text-xs text-garden-dark/70 font-mono">1 ft</span>
            </div>
          </div>

          {/* Pending plant banner */}
          {pendingPlantId && (
            <div className="absolute top-16 md:top-4 left-1/2 -translate-x-1/2 z-20 bg-garden-green text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
              <span>{plantMap.get(pendingPlantId)?.emoji} Tap anywhere to place {plantMap.get(pendingPlantId)?.name}</span>
              <button onClick={() => setPendingPlantId(null)} className="ml-1 hover:text-red-200 text-lg leading-none">×</button>
            </div>
          )}

          {/* Desktop info panels */}
          {selectedPlantId && selectedBedId && (() => {
            const bed = beds.find(b => b.id === selectedBedId)
            const plant = bed?.plants.find(p => p.id === selectedPlantId)
            const plantData = plant ? plantMap.get(plant.plantType) : null
            if (!plantData || !plant) return null
            const { companions, enemies } = getCompanionStatus(plant.plantType, selectedBedId)
            return (
              <div className="hidden md:block absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl p-4 w-64 shadow-lg border border-garden-green/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{plantData.emoji}</span>
                  <h3 className="font-display text-lg text-garden-dark">{plantData.name}</h3>
                </div>
                <div className="text-xs space-y-1 text-garden-dark/60">
                  <p>Spacing: {plantData.spacing}&quot; • {plantData.sunNeeds} sun • {plantData.waterNeeds} water</p>
                  <p>Harvest: {plantData.daysToHarvest[0]}-{plantData.daysToHarvest[1]} days</p>
                </div>
                {showCompanion && companions.length > 0 && (
                  <div className="mt-2 text-xs"><span className="text-green-600 font-semibold">✓ </span>{companions.map(c => plantMap.get(c)?.emoji + ' ' + plantMap.get(c)?.name).join(', ')}</div>
                )}
                {showCompanion && enemies.length > 0 && (
                  <div className="mt-1 text-xs"><span className="text-red-500 font-semibold">✗ </span>{enemies.map(c => plantMap.get(c)?.emoji + ' ' + plantMap.get(c)?.name).join(', ')}</div>
                )}
                <button onClick={() => deletePlant(selectedBedId!, selectedPlantId!)} className="mt-3 text-red-400 hover:text-red-600 text-xs">Remove</button>
              </div>
            )
          })()}

          {/* Loose plant info */}
          {selectedLoosePlantId && selectedLoosePlantData && (
            <div className="hidden md:block absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl p-4 w-64 shadow-lg border border-garden-green/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{selectedLoosePlantData.emoji}</span>
                <h3 className="font-display text-lg text-garden-dark">{selectedLoosePlantData.name}</h3>
              </div>
              <div className="text-xs text-garden-dark/60">
                <p>Spacing: {selectedLoosePlantData.spacing}&quot; • {selectedLoosePlantData.sunNeeds} sun</p>
              </div>
              <button onClick={() => deleteLoosePlant(selectedLoosePlantId)} className="mt-3 text-red-400 hover:text-red-600 text-xs">Remove</button>
            </div>
          )}

          {/* Bed info */}
          {selectedBedId && !selectedPlantId && selectedBed && (
            <div className="hidden md:block absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-2xl p-4 w-64 shadow-lg border border-garden-green/10">
              <div className="text-sm font-semibold text-garden-dark mb-1">{selectedBed.name}</div>
              <div className="text-xs text-garden-dark/60 mb-3">
                {pxToFeetInches(selectedBed.width)} × {pxToFeetInches(selectedBed.height)}
                {(selectedBed.rotation || 0) !== 0 && ` • ${selectedBed.rotation}°`}
                {' • '}{selectedBed.plants.length} plants
              </div>
              <div className="text-xs text-garden-dark/50 mb-1">Rotate:</div>
              <div className="flex gap-1 mb-3">
                <button onClick={() => rotateBed(selectedBedId, -90)} className="bg-garden-cream hover:bg-garden-sand text-garden-dark px-2 py-1 rounded text-xs">−90°</button>
                <button onClick={() => rotateBed(selectedBedId, -15)} className="bg-garden-cream hover:bg-garden-sand text-garden-dark px-2 py-1 rounded text-xs">−15°</button>
                <button onClick={() => rotateBed(selectedBedId, 15)} className="bg-garden-cream hover:bg-garden-sand text-garden-dark px-2 py-1 rounded text-xs">+15°</button>
                <button onClick={() => rotateBed(selectedBedId, 90)} className="bg-garden-cream hover:bg-garden-sand text-garden-dark px-2 py-1 rounded text-xs">+90°</button>
              </div>
              <button onClick={() => deleteBed(selectedBedId)} className="text-red-400 hover:text-red-600 text-xs">Delete bed</button>
            </div>
          )}

          {/* Mobile bottom info bar for beds */}
          {selectedBedId && !selectedPlantId && selectedBed && (
            <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-white border-t border-garden-green/20 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-garden-dark">{selectedBed.name}</div>
                  <div className="text-xs text-garden-dark/60">
                    {pxToFeetInches(selectedBed.width)} × {pxToFeetInches(selectedBed.height)}
                    {(selectedBed.rotation || 0) !== 0 && ` • ${selectedBed.rotation}°`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => rotateBed(selectedBedId, -15)} className="bg-garden-cream text-garden-dark w-10 h-10 rounded-lg flex items-center justify-center text-lg">↺</button>
                  <button onClick={() => rotateBed(selectedBedId, 15)} className="bg-garden-cream text-garden-dark w-10 h-10 rounded-lg flex items-center justify-center text-lg">↻</button>
                  <button onClick={() => deleteBed(selectedBedId)} className="bg-red-50 text-red-500 w-10 h-10 rounded-lg flex items-center justify-center">🗑️</button>
                </div>
              </div>
            </div>
          )}

          {/* ====== THE CANVAS ====== */}
          <div ref={canvasRef}
            className="relative select-none"
            style={{
              minWidth: '1400px',
              minHeight: '900px',
              backgroundImage: 'radial-gradient(circle, #4A7C2E15 1px, transparent 1px)',
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              touchAction: dragState ? 'none' : 'auto',
            }}
            onClick={handleCanvasClick}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
          >
            {/* Loose plants (not in any bed) */}
            {loosePlants.map(plant => {
              const plantData = plantMap.get(plant.plantType)
              if (!plantData) return null
              const sz = getPlantSize(plantData.spacing)
              const isSelected = selectedLoosePlantId === plant.id
              return (
                <div key={plant.id}
                  className={`absolute flex items-center justify-center rounded-full transition-all select-none
                    ${isSelected ? 'ring-2 ring-garden-dark scale-110 z-30' : 'hover:scale-105 z-20'}
                    bg-white/60 shadow-sm`}
                  style={{
                    left: plant.x, top: plant.y,
                    width: sz, height: sz,
                    fontSize: Math.max(14, sz * 0.55),
                    cursor: dragState?.type === 'loose-plant-move' && dragState.plantId === plant.id ? 'grabbing' : 'grab',
                    touchAction: 'none',
                  }}
                  onMouseDown={(e) => handleLoosePlantPointerDown(e, plant)}
                  onTouchStart={(e) => handleLoosePlantPointerDown(e, plant)}
                  title={plantData.name}
                >
                  {plantData.emoji}
                </div>
              )
            })}

            {/* Beds */}
            {beds.map(bed => {
              const isSelected = selectedBedId === bed.id
              return (
                <div key={bed.id}
                  className={`absolute group transition-shadow ${isSelected ? 'ring-2 ring-garden-green shadow-lg z-10' : 'shadow hover:shadow-md'}`}
                  style={{
                    left: bed.x, top: bed.y,
                    width: bed.width, height: bed.height,
                    transform: `rotate(${bed.rotation || 0}deg)`,
                    transformOrigin: 'center',
                    borderRadius: bed.shape === 'circle' ? '50%' : bed.shape === 'raised' ? '12px' : '8px',
                    background: bed.shape === 'raised'
                      ? 'linear-gradient(135deg, #8B6914 0%, #A67C52 100%)'
                      : 'linear-gradient(135deg, #6B9B4E22 0%, #4A7C2E33 100%)',
                    border: bed.shape === 'raised' ? '3px solid #8B691480' : '2px solid #4A7C2E40',
                    cursor: pendingPlantId ? 'crosshair' : (dragState?.type === 'bed-move' && dragState.bedId === bed.id ? 'grabbing' : 'grab'),
                    touchAction: 'none',
                  }}
                  onClick={(e) => handleBedClick(e, bed)}
                  onMouseDown={(e) => handleBedPointerDown(e, bed)}
                  onTouchStart={(e) => handleBedPointerDown(e, bed)}
                >
                  {/* Label */}
                  <div className={`absolute -top-6 left-1 text-xs font-semibold ${bed.shape === 'raised' ? 'text-amber-700' : 'text-garden-green'} whitespace-nowrap pointer-events-none`}>
                    {bed.name}
                  </div>

                  {/* Measurements (selected only) */}
                  {isSelected && (
                    <>
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-garden-dark/70 bg-white/90 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                        {pxToFeetInches(bed.width)}
                      </div>
                      <div className="absolute top-1/2 -right-5 translate-x-full -translate-y-1/2 text-[10px] font-mono text-garden-dark/70 bg-white/90 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                        {pxToFeetInches(bed.height)}
                      </div>
                    </>
                  )}

                  {/* Rotation handle */}
                  {isSelected && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-7 h-7 bg-garden-green rounded-full cursor-pointer hover:bg-garden-green/80 flex items-center justify-center text-white text-sm shadow-md"
                      style={{ touchAction: 'none' }}
                      onMouseDown={(e) => handleRotateStart(e, bed)}
                      onTouchStart={(e) => handleRotateStart(e, bed)}
                      title="Drag to rotate">↻</div>
                  )}

                  {/* Plants in bed */}
                  {bed.plants.map(plant => {
                    const plantData = plantMap.get(plant.plantType)
                    if (!plantData) return null
                    const sz = getPlantSize(plantData.spacing)
                    const { companions, enemies } = showCompanion ? getCompanionStatus(plant.plantType, bed.id) : { companions: [], enemies: [] }
                    const hasEnemy = enemies.length > 0
                    const hasCompanion = companions.length > 0 && !hasEnemy

                    return (
                      <div key={plant.id}
                        className={`absolute flex items-center justify-center rounded-full transition-all select-none
                          ${selectedPlantId === plant.id ? 'ring-2 ring-garden-dark scale-110 z-20' : 'hover:scale-105'}
                          ${showCompanion && hasEnemy ? 'ring-2 ring-red-400 bg-red-50' : ''}
                          ${showCompanion && hasCompanion ? 'ring-2 ring-green-400 bg-green-50' : ''}`}
                        style={{
                          left: plant.x, top: plant.y,
                          width: sz, height: sz,
                          fontSize: Math.max(14, sz * 0.55),
                          cursor: 'grab',
                          touchAction: 'none',
                          transform: bed.rotation ? `rotate(${-(bed.rotation)}deg)` : undefined,
                        }}
                        onMouseDown={(e) => handlePlantPointerDown(e, plant, bed.id)}
                        onTouchStart={(e) => handlePlantPointerDown(e, plant, bed.id)}
                        title={`${plantData.name} (${plantData.spacing}" spacing)`}
                      >
                        {plantData.emoji}
                      </div>
                    )
                  })}

                  {/* Resize handle */}
                  {isSelected && (
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-garden-green rounded-full cursor-se-resize opacity-70 hover:opacity-100 shadow-sm flex items-center justify-center"
                      style={{ touchAction: 'none' }}
                      onMouseDown={(e) => handleResizeStart(e, bed)}
                      onTouchStart={(e) => handleResizeStart(e, bed)}>
                      <svg width="10" height="10" viewBox="0 0 10 10" className="text-white"><path d="M8 2L2 8M8 5L5 8M8 8L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                  )}
                </div>
              )
            })}

            {beds.length === 0 && loosePlants.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-garden-dark/30">
                  <div className="text-6xl mb-4">🌱</div>
                  <p className="text-xl font-display">Start planning your garden</p>
                  <p className="text-sm mt-2">Select a plant and tap anywhere to place it, or add beds first</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom sheet */}
      {bottomSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setBottomSheetOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[75vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-garden-green/10">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex gap-2 justify-center">
                <button onClick={() => setSidebarTab('plants')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${sidebarTab === 'plants' ? 'bg-garden-green text-white' : 'text-garden-dark/60'}`}>🌱 Plants</button>
                <button onClick={() => setSidebarTab('beds')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${sidebarTab === 'beds' ? 'bg-garden-green text-white' : 'text-garden-dark/60'}`}>📐 Beds</button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(75vh-80px)]">
              {sidebarTab === 'plants' ? renderPlantPalette(true) : renderBedPalette()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

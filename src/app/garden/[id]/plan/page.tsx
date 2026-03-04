'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { plantCatalog, plantMap, PlantData } from '@/data/plants'
import { mockGardens, GardenBed, PlacedPlant } from '@/data/mock'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const GRID_SIZE = 20
const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

// Helper function to convert pixels to feet and inches
const pxToFeetInches = (px: number) => {
  const inches = (px / 20) * 6 // 20px = 6 inches
  const feet = Math.floor(inches / 12)
  const remainingInches = Math.round(inches % 12)
  if (feet === 0) return `${remainingInches}"`
  if (remainingInches === 0) return `${feet}'`
  return `${feet}'${remainingInches}"`
}

// Calculate plant size based on spacing
const getPlantSize = (spacing: number) => {
  return Math.max(20, Math.min(80, spacing * 1.5))
}

type BedShape = 'rectangle' | 'l-shape' | 'circle' | 'raised'

interface DragState {
  type: 'plant-new' | 'plant-move' | 'bed-move' | 'bed-resize' | 'bed-rotate'
  plantData?: PlantData
  plantId?: string
  bedId?: string
  offsetX: number
  offsetY: number
}

interface TouchDragState {
  active: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  type?: 'plant' | 'bed'
  targetId?: string
}

export default function GardenPlanPage() {
  const params = useParams()
  const gardenId = params.id as string
  const garden = mockGardens.find(g => g.id === gardenId) || mockGardens[0]

  const [beds, setBeds] = useState<GardenBed[]>(garden.beds)
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null)
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [showCompanion, setShowCompanion] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'plants' | 'beds'>('plants')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [touchDrag, setTouchDrag] = useState<TouchDragState>({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 })
  const [canvasScale, setCanvasScale] = useState(1)
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const selectedBed = beds.find(b => b.id === selectedBedId)
  const allPlacedPlants = beds.flatMap(b => b.plants)

  // Find companion/enemy relationships for a plant in context
  const getCompanionStatus = useCallback((plantType: string, bedId: string): { companions: string[], enemies: string[] } => {
    const plant = plantMap.get(plantType)
    if (!plant) return { companions: [], enemies: [] }
    const bed = beds.find(b => b.id === bedId)
    if (!bed) return { companions: [], enemies: [] }
    const neighbors = bed.plants.filter(p => p.plantType !== plantType).map(p => p.plantType)
    const companions = [...new Set(neighbors.filter(n => plant.companionPlants.includes(n)))]
    const enemies = [...new Set(neighbors.filter(n => plant.enemyPlants.includes(n)))]
    return { companions, enemies }
  }, [beds])

  const addBed = (shape: BedShape) => {
    const newBed: GardenBed = {
      id: `bed-${Date.now()}`,
      name: `New ${shape} bed`,
      shape,
      x: snap(50),
      y: snap(50),
      width: shape === 'circle' ? 150 : 250,
      height: shape === 'circle' ? 150 : 150,
      rotation: 0,
      plants: [],
    }
    setBeds(prev => [...prev, newBed])
    setSelectedBedId(newBed.id)
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

  const rotateBed = (bedId: string, degrees: number) => {
    setBeds(prev => prev.map(b => 
      b.id === bedId ? { ...b, rotation: ((b.rotation || 0) + degrees + 360) % 360 } : b
    ))
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedBedId(null)
      setSelectedPlantId(null)
      // Start panning
      setIsPanning(true)
      setPanStart({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y })
    }
  }

  const handleBedMouseDown = (e: React.MouseEvent, bed: GardenBed) => {
    e.stopPropagation()
    const rect = canvasRef.current!.getBoundingClientRect()
    setSelectedBedId(bed.id)
    setSelectedPlantId(null)
    setDragState({
      type: 'bed-move',
      bedId: bed.id,
      offsetX: (e.clientX - rect.left) / canvasScale - canvasPan.x - bed.x,
      offsetY: (e.clientY - rect.top) / canvasScale - canvasPan.y - bed.y,
    })
  }

  const handleResizeMouseDown = (e: React.MouseEvent, bed: GardenBed) => {
    e.stopPropagation()
    setIsResizing(true)
    setDragState({
      type: 'bed-resize',
      bedId: bed.id,
      offsetX: 0,
      offsetY: 0,
    })
  }

  const handleRotateMouseDown = (e: React.MouseEvent, bed: GardenBed) => {
    e.stopPropagation()
    setDragState({
      type: 'bed-rotate',
      bedId: bed.id,
      offsetX: bed.x + bed.width / 2,
      offsetY: bed.y + bed.height / 2,
    })
  }

  const handlePlantMouseDown = (e: React.MouseEvent, plant: PlacedPlant, bedId: string) => {
    e.stopPropagation()
    const bed = beds.find(b => b.id === bedId)!
    const rect = canvasRef.current!.getBoundingClientRect()
    setSelectedPlantId(plant.id)
    setSelectedBedId(bedId)
    setDragState({
      type: 'plant-move',
      plantId: plant.id,
      bedId,
      offsetX: (e.clientX - rect.left) / canvasScale - canvasPan.x - bed.x - plant.x,
      offsetY: (e.clientY - rect.top) / canvasScale - canvasPan.y - bed.y - plant.y,
    })
  }

  // Touch events for mobile drag and drop
  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchDrag({
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    })
    e.preventDefault()
  }

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (!touchDrag.active) return
    const touch = e.touches[0]
    setTouchDrag(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }))
    e.preventDefault()
  }

  const handleCanvasTouchEnd = (e: React.TouchEvent) => {
    if (!touchDrag.active) return
    setTouchDrag({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 })
    e.preventDefault()
  }

  // Palette drag start
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
    const rect = canvasRef.current!.getBoundingClientRect()
    const dropX = ((e.clientX - rect.left) / canvasScale - canvasPan.x)
    const dropY = ((e.clientY - rect.top) / canvasScale - canvasPan.y)

    // Find which bed was dropped on
    const targetBed = beds.find(b =>
      dropX >= b.x && dropX <= b.x + b.width &&
      dropY >= b.y && dropY <= b.y + b.height
    )

    if (targetBed) {
      const plantData = plantMap.get(plantId)
      const plantSize = plantData ? getPlantSize(plantData.spacing) : 30
      const newPlant: PlacedPlant = {
        id: `plant-${Date.now()}`,
        plantType: plantId,
        x: snap(dropX - targetBed.x - plantSize/2),
        y: snap(dropY - targetBed.y - plantSize/2),
      }
      setBeds(prev => prev.map(b =>
        b.id === targetBed.id ? { ...b, plants: [...b.plants, newPlant] } : b
      ))
    }
  }

  // Pinch to zoom for mobile
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY * -0.01
      const newScale = Math.min(Math.max(0.25, canvasScale + delta), 3)
      setCanvasScale(newScale)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning && !dragState) {
        setCanvasPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        })
        return
      }

      if (!dragState || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / canvasScale - canvasPan.x
      const y = (e.clientY - rect.top) / canvasScale - canvasPan.y

      if (dragState.type === 'bed-move' && dragState.bedId) {
        setBeds(prev => prev.map(b =>
          b.id === dragState.bedId ? { ...b, x: snap(x - dragState.offsetX), y: snap(y - dragState.offsetY) } : b
        ))
      } else if (dragState.type === 'bed-resize' && dragState.bedId) {
        setBeds(prev => prev.map(b => {
          if (b.id !== dragState.bedId) return b
          const newW = snap(Math.max(80, x - b.x))
          const newH = snap(Math.max(60, y - b.y))
          if (b.shape === 'circle') {
            const newRadius = Math.max(40, Math.min(newW, newH) / 2)
            return { ...b, width: newRadius * 2, height: newRadius * 2 }
          }
          return { ...b, width: newW, height: newH }
        }))
      } else if (dragState.type === 'bed-rotate' && dragState.bedId) {
        const centerX = dragState.offsetX
        const centerY = dragState.offsetY
        const angle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI
        const snappedAngle = Math.round(angle / 15) * 15
        setBeds(prev => prev.map(b =>
          b.id === dragState.bedId ? { ...b, rotation: snappedAngle } : b
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
      }
    }

    const handleMouseUp = () => {
      setDragState(null)
      setIsPanning(false)
      setIsResizing(false)
    }

    if (dragState || isPanning) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, beds, canvasScale, canvasPan, isPanning, panStart])

  const filteredPlants = filterCategory === 'all'
    ? plantCatalog
    : plantCatalog.filter(p => p.category === filterCategory)

  // Mobile bottom sheet content
  const renderBottomSheetContent = () => {
    if (sidebarTab === 'plants') {
      return (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'vegetable', 'herb', 'fruit', 'flower'].map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${filterCategory === cat ? 'bg-garden-green text-white' : 'bg-garden-cream text-garden-dark/60 hover:bg-garden-sand'}`}>
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          {/* Plant palette */}
          <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
            {filteredPlants.map(plant => (
              <div key={plant.id} draggable onDragStart={(e) => handlePaletteDragStart(e, plant)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-garden-cream/50 cursor-grab active:cursor-grabbing transition-colors bg-white border border-garden-green/10">
                <span className="text-3xl">{plant.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-garden-dark truncate">{plant.name}</div>
                  <div className="text-sm text-garden-dark/60">{plant.spacing}&quot; spacing • {plant.sunNeeds} sun</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    } else {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {([
              { shape: 'rectangle' as BedShape, emoji: '▭', name: 'Rectangle' },
              { shape: 'raised' as BedShape, emoji: '📦', name: 'Raised Bed' },
              { shape: 'circle' as BedShape, emoji: '⬭', name: 'Circle' },
              { shape: 'l-shape' as BedShape, emoji: '⌐', name: 'L-Shape' },
            ]).map(b => (
              <button key={b.shape} onClick={() => addBed(b.shape)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-garden-cream/50 hover:bg-garden-cream transition-colors text-center border border-garden-green/10">
                <span className="text-3xl">{b.emoji}</span>
                <span className="text-sm font-semibold text-garden-dark">{b.name}</span>
              </button>
            ))}
          </div>

          {beds.length > 0 && (
            <div className="pt-4 border-t border-garden-green/10">
              <p className="text-sm text-garden-dark/70 mb-3 font-semibold">Your beds:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {beds.map(bed => (
                  <div key={bed.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors border ${selectedBedId === bed.id ? 'bg-garden-green/10 border-garden-green' : 'bg-white border-garden-green/10 hover:bg-garden-cream/50'}`}
                    onClick={() => setSelectedBedId(bed.id)}>
                    <div>
                      <div className="text-sm font-semibold text-garden-dark">{bed.name}</div>
                      <div className="text-xs text-garden-dark/60">{bed.plants.length} plants • {bed.shape}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteBed(bed.id) }}
                      className="text-red-400 hover:text-red-600 text-lg px-2 min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-garden-cream/50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-72 bg-white border-r border-garden-green/10 flex-col overflow-hidden">
          <div className="p-4 border-b border-garden-green/10">
            <Link href="/dashboard" className="text-garden-dark/50 text-sm hover:text-garden-dark">← Dashboard</Link>
            <h2 className="font-display text-lg text-garden-dark mt-2">{garden.name}</h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-garden-green/10">
            <button onClick={() => setSidebarTab('plants')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${sidebarTab === 'plants' ? 'text-garden-green border-b-2 border-garden-green' : 'text-garden-dark/50'}`}>
              🌱 Plants
            </button>
            <button onClick={() => setSidebarTab('beds')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${sidebarTab === 'beds' ? 'text-garden-green border-b-2 border-garden-green' : 'text-garden-dark/50'}`}>
              📐 Beds
            </button>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {renderBottomSheetContent()}
          </div>

          {/* Companion toggle */}
          <div className="p-3 border-t border-garden-green/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showCompanion} onChange={e => setShowCompanion(e.target.checked)}
                className="rounded accent-garden-green" />
              <span className="text-sm text-garden-dark/70">Show companion indicators</span>
            </label>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-hidden bg-garden-cream/30 relative" onMouseDown={handleCanvasMouseDown}>
          {/* Mobile Toolbar */}
          <div className="md:hidden absolute top-4 left-4 right-4 z-20 flex gap-2 justify-between">
            <div className="flex gap-2">
              <button onClick={() => setBottomSheetOpen(true)} 
                className="bg-white/90 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-lg border border-garden-green/10 min-h-[44px]">
                {sidebarTab === 'plants' ? '🌱 Plants' : '📐 Beds'}
              </button>
              <Link href={`/garden/${gardenId}/calendar`} 
                className="bg-white/90 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-lg hover:bg-white transition-colors border border-garden-green/10 min-h-[44px] flex items-center">
                📅
              </Link>
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-garden-green/10">
                <input type="checkbox" checked={showCompanion} onChange={e => setShowCompanion(e.target.checked)}
                  className="rounded accent-garden-green" />
                <span className="text-xs">🤝</span>
              </label>
            </div>
          </div>

          {/* Desktop Toolbar */}
          <div className="hidden md:block absolute top-4 left-4 z-10">
            <div className="flex gap-2">
              <Link href={`/garden/${gardenId}/calendar`} className="bg-white/80 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-sm hover:bg-white transition-colors border border-garden-green/10">
                📅 Calendar
              </Link>
              <button className="bg-white/80 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-sm hover:bg-white transition-colors border border-garden-green/10">
                💾 Save
              </button>
              <button className="bg-white/80 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-sm hover:bg-white transition-colors border border-garden-green/10">
                🔗 Share
              </button>
            </div>
          </div>

          {/* Scale bar */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-garden-green/10 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-0.5 bg-garden-dark"></div>
              <span className="text-xs text-garden-dark/70 font-mono">1 ft</span>
            </div>
          </div>

          {/* Mobile Selected Plant/Bed Info Bar */}
          {(selectedPlantId || selectedBedId) && (
            <div className="md:hidden absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-garden-green/20 p-4">
              {selectedPlantId && selectedBedId && (() => {
                const bed = beds.find(b => b.id === selectedBedId)
                const plant = bed?.plants.find(p => p.id === selectedPlantId)
                const plantData = plant ? plantMap.get(plant.plantType) : null
                if (!plantData || !plant) return null
                const { companions, enemies } = getCompanionStatus(plant.plantType, selectedBedId)
                return (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{plantData.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-garden-dark">{plantData.name}</h3>
                      <p className="text-xs text-garden-dark/60">
                        {plantData.spacing}&quot; spacing • {plantData.sunNeeds} sun
                      </p>
                      {showCompanion && (companions.length > 0 || enemies.length > 0) && (
                        <p className="text-xs mt-1">
                          {companions.length > 0 && <span className="text-green-600">✓ Good neighbors </span>}
                          {enemies.length > 0 && <span className="text-red-500">✗ Bad neighbors</span>}
                        </p>
                      )}
                    </div>
                    <button onClick={() => deletePlant(selectedBedId!, selectedPlantId!)}
                      className="text-red-400 hover:text-red-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                      🗑️
                    </button>
                  </div>
                )
              })()}
              {selectedBedId && !selectedPlantId && selectedBed && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {selectedBed.shape === 'raised' ? '📦' : 
                       selectedBed.shape === 'circle' ? '⬭' : 
                       selectedBed.shape === 'l-shape' ? '⌐' : '▭'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-garden-dark">{selectedBed.name}</h3>
                      <p className="text-xs text-garden-dark/60">
                        {pxToFeetInches(selectedBed.width)} × {pxToFeetInches(selectedBed.height)}
                        {selectedBed.rotation !== 0 && ` • ${selectedBed.rotation}°`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => rotateBed(selectedBedId, -15)}
                      className="bg-garden-cream text-garden-dark px-3 py-2 rounded-lg text-xs min-h-[44px]">↺</button>
                    <button onClick={() => rotateBed(selectedBedId, 15)}
                      className="bg-garden-cream text-garden-dark px-3 py-2 rounded-lg text-xs min-h-[44px]">↻</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop Selection info */}
          {selectedPlantId && selectedBedId && (() => {
            const bed = beds.find(b => b.id === selectedBedId)
            const plant = bed?.plants.find(p => p.id === selectedPlantId)
            const plantData = plant ? plantMap.get(plant.plantType) : null
            if (!plantData || !plant) return null
            const { companions, enemies } = getCompanionStatus(plant.plantType, selectedBedId)
            return (
              <div className="hidden md:block absolute top-4 right-4 z-10 card !p-4 w-64 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{plantData.emoji}</span>
                  <h3 className="font-display text-lg text-garden-dark">{plantData.name}</h3>
                </div>
                <div className="text-xs space-y-1 text-garden-dark/60">
                  <p>Spacing: {plantData.spacing}&quot; • {plantData.sunNeeds} sun • {plantData.waterNeeds} water</p>
                  <p>Harvest: {plantData.daysToHarvest[0]}-{plantData.daysToHarvest[1]} days</p>
                  <p>Zones: {plantData.zones[0]}-{plantData.zones[1]}</p>
                </div>
                {showCompanion && companions.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="text-green-600 font-semibold">✓ Good neighbors: </span>
                    {companions.map(c => plantMap.get(c)?.emoji + ' ' + plantMap.get(c)?.name).join(', ')}
                  </div>
                )}
                {showCompanion && enemies.length > 0 && (
                  <div className="mt-1 text-xs">
                    <span className="text-red-500 font-semibold">✗ Bad neighbors: </span>
                    {enemies.map(c => plantMap.get(c)?.emoji + ' ' + plantMap.get(c)?.name).join(', ')}
                  </div>
                )}
                <button onClick={() => deletePlant(selectedBedId!, selectedPlantId!)}
                  className="mt-3 text-red-400 hover:text-red-600 text-xs">Remove plant</button>
              </div>
            )
          })()}

          {/* Desktop Bed Rotation Controls */}
          {selectedBedId && !selectedPlantId && selectedBed && (
            <div className="hidden md:block absolute top-20 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-garden-green/10">
              <div className="text-sm font-semibold text-garden-dark mb-2">{selectedBed.name}</div>
              <div className="text-xs text-garden-dark/60 mb-3">
                {pxToFeetInches(selectedBed.width)} × {pxToFeetInches(selectedBed.height)}
                {selectedBed.rotation !== 0 && ` • ${selectedBed.rotation}°`}
              </div>
              <div className="flex gap-2">
                <button onClick={() => rotateBed(selectedBedId, -90)}
                  className="bg-garden-cream hover:bg-garden-sand text-garden-dark px-2 py-1 rounded text-xs">-90°</button>
                <button onClick={() => rotateBed(selectedBedId, -15)}
                  className="bg-garden-cream hover:bg-garden-sand text-garden-dark px-2 py-1 rounded text-xs">-15°</button>
                <button onClick={() => rotateBed(selectedBedId, 15)}
                  className="bg-garden-cream hover:bg-garden-sand text-garden-dark px-2 py-1 rounded text-xs">+15°</button>
                <button onClick={() => rotateBed(selectedBedId, 90)}
                  className="bg-garden-cream hover:bg-garden-sand text-garden-dark px-2 py-1 rounded text-xs">+90°</button>
              </div>
            </div>
          )}

          {/* Mobile FABs for adding beds */}
          <div className="md:hidden absolute bottom-20 right-4 z-20 flex flex-col gap-2">
            {([
              { shape: 'rectangle' as BedShape, emoji: '▭' },
              { shape: 'raised' as BedShape, emoji: '📦' },
              { shape: 'circle' as BedShape, emoji: '⬭' },
              { shape: 'l-shape' as BedShape, emoji: '⌐' },
            ]).map(b => (
              <button key={b.shape} onClick={() => addBed(b.shape)}
                className="bg-garden-green text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-garden-green/90 active:scale-95 transition-all">
                {b.emoji}
              </button>
            ))}
          </div>

          <div ref={canvasRef}
            className="relative min-h-full cursor-grab active:cursor-grabbing"
            style={{ 
              minWidth: '1200px', 
              minHeight: '800px', 
              backgroundImage: 'radial-gradient(circle, #4A7C2E15 1px, transparent 1px)', 
              backgroundSize: `${GRID_SIZE * canvasScale}px ${GRID_SIZE * canvasScale}px`,
              transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasScale})`,
              transformOrigin: '0 0'
            }}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            onWheel={handleWheel}
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
          >
            {beds.map(bed => (
              <div key={bed.id}
                className={`absolute group cursor-move transition-shadow ${selectedBedId === bed.id ? 'ring-2 ring-garden-green shadow-garden-lg' : 'shadow-garden hover:shadow-garden-lg'}`}
                style={{
                  left: bed.x,
                  top: bed.y,
                  width: bed.width,
                  height: bed.height,
                  transform: `rotate(${bed.rotation || 0}deg)`,
                  transformOrigin: 'center',
                  borderRadius: bed.shape === 'circle' ? '50%' : bed.shape === 'raised' ? '12px' : '8px',
                  background: bed.shape === 'raised'
                    ? 'linear-gradient(135deg, #8B6914 0%, #A67C52 100%)'
                    : 'linear-gradient(135deg, #6B9B4E22 0%, #4A7C2E33 100%)',
                  border: bed.shape === 'raised' ? '3px solid #8B691480' : '2px solid #4A7C2E40',
                }}
                onMouseDown={(e) => handleBedMouseDown(e, bed)}
              >
                {/* Bed label */}
                <div className={`absolute -top-6 left-1 text-xs font-semibold ${bed.shape === 'raised' ? 'text-garden-brown' : 'text-garden-green'} whitespace-nowrap`}>
                  {bed.name}
                </div>

                {/* Measurements when selected */}
                {selectedBedId === bed.id && (
                  <>
                    {/* Width measurement */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-garden-dark/70 bg-white/80 px-2 py-1 rounded whitespace-nowrap">
                      {pxToFeetInches(bed.width)}
                    </div>
                    {/* Height measurement */}
                    <div className="absolute top-1/2 -left-12 -translate-y-1/2 -rotate-90 text-xs text-garden-dark/70 bg-white/80 px-2 py-1 rounded whitespace-nowrap">
                      {pxToFeetInches(bed.height)}
                    </div>
                  </>
                )}

                {/* Rotation handle when selected */}
                {selectedBedId === bed.id && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-garden-green/80 rounded-full cursor-pointer hover:bg-garden-green flex items-center justify-center text-white text-xs"
                    onMouseDown={(e) => handleRotateMouseDown(e, bed)}
                    title="Drag to rotate">
                    ↻
                  </div>
                )}

                {/* Plants in this bed */}
                {bed.plants.map(plant => {
                  const plantData = plantMap.get(plant.plantType)
                  if (!plantData) return null
                  const plantSize = getPlantSize(plantData.spacing)
                  const { companions, enemies } = showCompanion ? getCompanionStatus(plant.plantType, bed.id) : { companions: [], enemies: [] }
                  const hasEnemy = enemies.length > 0
                  const hasCompanion = companions.length > 0 && !hasEnemy

                  return (
                    <div key={plant.id}
                      className={`absolute flex items-center justify-center rounded-full cursor-grab active:cursor-grabbing transition-all hover:scale-110 ${selectedPlantId === plant.id ? 'ring-2 ring-garden-dark scale-110' : ''} ${showCompanion && hasEnemy ? 'ring-2 ring-red-400 bg-red-50' : ''} ${showCompanion && hasCompanion ? 'ring-2 ring-green-400 bg-green-50' : ''}`}
                      style={{ 
                        left: plant.x, 
                        top: plant.y,
                        width: `${plantSize}px`,
                        height: `${plantSize}px`,
                        fontSize: `${Math.max(16, plantSize * 0.6)}px`
                      }}
                      onMouseDown={(e) => handlePlantMouseDown(e, plant, bed.id)}
                      title={`${plantData.name}${hasCompanion ? ' ✓ good companions' : ''}${hasEnemy ? ' ✗ bad neighbors!' : ''}`}
                    >
                      {plantData.emoji}
                    </div>
                  )
                })}

                {/* Resize handle */}
                {selectedBedId === bed.id && (
                  <div className={`absolute bottom-0 right-0 ${isResizing ? 'w-8 h-8' : 'w-6 h-6 md:w-4 md:h-4'} bg-garden-green rounded-tl-lg cursor-se-resize opacity-60 hover:opacity-100 touch-manipulation`}
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    onMouseDown={(e) => handleResizeMouseDown(e, bed)} />
                )}
              </div>
            ))}

            {beds.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-garden-dark/30">
                  <div className="text-6xl mb-4">🌱</div>
                  <p className="text-xl font-display">Start by adding a bed</p>
                  <p className="text-sm mt-2">
                    <span className="hidden md:inline">Use the sidebar to add beds, then drag plants onto them</span>
                    <span className="md:hidden">Tap the floating buttons to add beds</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Sheet */}
      {bottomSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setBottomSheetOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-garden-green/10 bg-garden-cream/30">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="flex justify-center gap-1">
                <button onClick={() => setSidebarTab('plants')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${sidebarTab === 'plants' ? 'bg-garden-green text-white' : 'text-garden-dark/70'}`}>
                  🌱 Plants
                </button>
                <button onClick={() => setSidebarTab('beds')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${sidebarTab === 'beds' ? 'bg-garden-green text-white' : 'text-garden-dark/70'}`}>
                  📐 Beds
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {renderBottomSheetContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
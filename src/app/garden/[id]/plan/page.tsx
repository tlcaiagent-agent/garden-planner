'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { plantCatalog, plantMap, PlantData } from '@/data/plants'
import { mockGardens, GardenBed, PlacedPlant } from '@/data/mock'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const GRID_SIZE = 20
const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

type BedShape = 'rectangle' | 'l-shape' | 'circle' | 'raised'

interface DragState {
  type: 'plant-new' | 'plant-move' | 'bed-move' | 'bed-resize'
  plantData?: PlantData
  plantId?: string
  bedId?: string
  offsetX: number
  offsetY: number
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
      plants: [],
    }
    setBeds(prev => [...prev, newBed])
    setSelectedBedId(newBed.id)
  }

  const deleteBed = (bedId: string) => {
    setBeds(prev => prev.filter(b => b.id !== bedId))
    if (selectedBedId === bedId) setSelectedBedId(null)
  }

  const deletePlant = (bedId: string, plantId: string) => {
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, plants: b.plants.filter(p => p.id !== plantId) } : b))
    setSelectedPlantId(null)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedBedId(null)
      setSelectedPlantId(null)
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
      offsetX: e.clientX - rect.left - bed.x,
      offsetY: e.clientY - rect.top - bed.y,
    })
  }

  const handleResizeMouseDown = (e: React.MouseEvent, bed: GardenBed) => {
    e.stopPropagation()
    const rect = canvasRef.current!.getBoundingClientRect()
    setDragState({
      type: 'bed-resize',
      bedId: bed.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
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
      offsetX: e.clientX - rect.left - bed.x - plant.x,
      offsetY: e.clientY - rect.top - bed.y - plant.y,
    })
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
    const dropX = e.clientX - rect.left
    const dropY = e.clientY - rect.top

    // Find which bed was dropped on
    const targetBed = beds.find(b =>
      dropX >= b.x && dropX <= b.x + b.width &&
      dropY >= b.y && dropY <= b.y + b.height
    )

    if (targetBed) {
      const newPlant: PlacedPlant = {
        id: `plant-${Date.now()}`,
        plantType: plantId,
        x: snap(dropX - targetBed.x - 15),
        y: snap(dropY - targetBed.y - 15),
      }
      setBeds(prev => prev.map(b =>
        b.id === targetBed.id ? { ...b, plants: [...b.plants, newPlant] } : b
      ))
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (dragState.type === 'bed-move' && dragState.bedId) {
        setBeds(prev => prev.map(b =>
          b.id === dragState.bedId ? { ...b, x: snap(x - dragState.offsetX), y: snap(y - dragState.offsetY) } : b
        ))
      } else if (dragState.type === 'bed-resize' && dragState.bedId) {
        setBeds(prev => prev.map(b => {
          if (b.id !== dragState.bedId) return b
          const newW = snap(Math.max(80, x - b.x))
          const newH = snap(Math.max(60, y - b.y))
          return { ...b, width: newW, height: newH }
        }))
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

    const handleMouseUp = () => setDragState(null)

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, beds])

  const filteredPlants = filterCategory === 'all'
    ? plantCatalog
    : plantCatalog.filter(p => p.category === filterCategory)

  return (
    <div className="min-h-screen bg-garden-cream/50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-garden-green/10 flex flex-col overflow-hidden">
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

          {sidebarTab === 'plants' ? (
            <div className="flex-1 overflow-auto">
              {/* Filter */}
              <div className="p-3 flex gap-1 flex-wrap">
                {['all', 'vegetable', 'herb', 'fruit', 'flower'].map(cat => (
                  <button key={cat} onClick={() => setFilterCategory(cat)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${filterCategory === cat ? 'bg-garden-green text-white' : 'bg-garden-cream text-garden-dark/60 hover:bg-garden-sand'}`}>
                    {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
              {/* Plant palette */}
              <div className="px-3 pb-3 space-y-1">
                {filteredPlants.map(plant => (
                  <div key={plant.id} draggable onDragStart={(e) => handlePaletteDragStart(e, plant)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-garden-cream/50 cursor-grab active:cursor-grabbing transition-colors group">
                    <span className="text-2xl">{plant.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-garden-dark truncate">{plant.name}</div>
                      <div className="text-xs text-garden-dark/40">{plant.spacing}&quot; spacing • {plant.sunNeeds} sun</div>
                    </div>
                    <span className="text-garden-dark/20 group-hover:text-garden-dark/40 text-xs">drag</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-3 space-y-3">
              <p className="text-xs text-garden-dark/50 mb-2">Click to add a new bed to your garden:</p>
              {([
                { shape: 'rectangle' as BedShape, emoji: '▭', name: 'Rectangle Bed' },
                { shape: 'raised' as BedShape, emoji: '📦', name: 'Raised Bed' },
                { shape: 'circle' as BedShape, emoji: '⬭', name: 'Circle Bed' },
                { shape: 'l-shape' as BedShape, emoji: '⌐', name: 'L-Shaped Bed' },
              ]).map(b => (
                <button key={b.shape} onClick={() => addBed(b.shape)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-garden-cream/50 hover:bg-garden-cream transition-colors text-left">
                  <span className="text-2xl">{b.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-garden-dark">{b.name}</div>
                    <div className="text-xs text-garden-dark/40">Click to add</div>
                  </div>
                </button>
              ))}

              {beds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-garden-green/10">
                  <p className="text-xs text-garden-dark/50 mb-2">Your beds:</p>
                  {beds.map(bed => (
                    <div key={bed.id} className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${selectedBedId === bed.id ? 'bg-garden-green/10' : 'hover:bg-garden-cream/50'}`}
                      onClick={() => setSelectedBedId(bed.id)}>
                      <div>
                        <div className="text-sm font-semibold text-garden-dark">{bed.name}</div>
                        <div className="text-xs text-garden-dark/40">{bed.plants.length} plants • {bed.shape}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteBed(bed.id) }}
                        className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
        <main className="flex-1 overflow-auto bg-garden-cream/30 relative" onMouseDown={handleCanvasMouseDown}>
          {/* Toolbar */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
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

          {/* Selection info */}
          {selectedPlantId && selectedBedId && (() => {
            const bed = beds.find(b => b.id === selectedBedId)
            const plant = bed?.plants.find(p => p.id === selectedPlantId)
            const plantData = plant ? plantMap.get(plant.plantType) : null
            if (!plantData || !plant) return null
            const { companions, enemies } = getCompanionStatus(plant.plantType, selectedBedId)
            return (
              <div className="absolute top-4 right-4 z-10 card !p-4 w-64 bg-white/95 backdrop-blur-sm">
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

          <div ref={canvasRef}
            className="relative min-h-full"
            style={{ minWidth: '1200px', minHeight: '800px', backgroundImage: 'radial-gradient(circle, #4A7C2E15 1px, transparent 1px)', backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
          >
            {beds.map(bed => (
              <div key={bed.id}
                className={`absolute group cursor-move transition-shadow ${selectedBedId === bed.id ? 'ring-2 ring-garden-green shadow-garden-lg' : 'shadow-garden hover:shadow-garden-lg'}`}
                style={{
                  left: bed.x,
                  top: bed.y,
                  width: bed.width,
                  height: bed.height,
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

                {/* Plants in this bed */}
                {bed.plants.map(plant => {
                  const plantData = plantMap.get(plant.plantType)
                  if (!plantData) return null
                  const { companions, enemies } = showCompanion ? getCompanionStatus(plant.plantType, bed.id) : { companions: [], enemies: [] }
                  const hasEnemy = enemies.length > 0
                  const hasCompanion = companions.length > 0 && !hasEnemy

                  return (
                    <div key={plant.id}
                      className={`absolute w-[30px] h-[30px] flex items-center justify-center text-lg rounded-full cursor-grab active:cursor-grabbing transition-all hover:scale-125 ${selectedPlantId === plant.id ? 'ring-2 ring-garden-dark scale-125' : ''} ${showCompanion && hasEnemy ? 'ring-2 ring-red-400 bg-red-50' : ''} ${showCompanion && hasCompanion ? 'ring-2 ring-green-400 bg-green-50' : ''}`}
                      style={{ left: plant.x, top: plant.y }}
                      onMouseDown={(e) => handlePlantMouseDown(e, plant, bed.id)}
                      title={`${plantData.name}${hasCompanion ? ' ✓ good companions' : ''}${hasEnemy ? ' ✗ bad neighbors!' : ''}`}
                    >
                      {plantData.emoji}
                    </div>
                  )
                })}

                {/* Resize handle */}
                {selectedBedId === bed.id && bed.shape !== 'circle' && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-garden-green rounded-tl-lg cursor-se-resize opacity-60 hover:opacity-100"
                    onMouseDown={(e) => handleResizeMouseDown(e, bed)} />
                )}
              </div>
            ))}

            {beds.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-garden-dark/30">
                  <div className="text-6xl mb-4">🌱</div>
                  <p className="text-xl font-display">Start by adding a bed</p>
                  <p className="text-sm mt-2">Use the sidebar to add beds, then drag plants onto them</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

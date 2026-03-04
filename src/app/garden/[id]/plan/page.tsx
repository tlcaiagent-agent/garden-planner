'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { plantCatalog, plantMap, PlantData } from '@/data/plants'
import { mockGardens, GardenBed, PlacedPlant } from '@/data/mock'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const GRID_SIZE = 20
const snap = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

// Rotate a point around a center by -angle (to get local coords of a rotated bed)
const rotatePoint = (px: number, py: number, cx: number, cy: number, angleDeg: number) => {
  const rad = (-angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = px - cx
  const dy = py - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

// Check if a canvas point is inside a (possibly rotated) bed, returns local bed coords if inside
const pointInBed = (px: number, py: number, bed: GardenBed): { inside: boolean; localX: number; localY: number } => {
  const cx = bed.x + bed.width / 2
  const cy = bed.y + bed.height / 2
  const rot = bed.rotation || 0
  // Rotate the point into the bed's local (unrotated) space
  const local = rot ? rotatePoint(px, py, cx, cy, rot) : { x: px, y: py }
  const inside = local.x >= bed.x && local.x <= bed.x + bed.width &&
                 local.y >= bed.y && local.y <= bed.y + bed.height
  return { inside, localX: local.x - bed.x, localY: local.y - bed.y }
}

const pxToFeetInches = (px: number) => {
  const inches = (px / 20) * 6
  const feet = Math.floor(inches / 12)
  const rem = Math.round(inches % 12)
  if (feet === 0) return `${rem}"`
  if (rem === 0) return `${feet}'`
  return `${feet}'${rem}"`
}

const getPlantSize = (spacing: number) => Math.max(20, Math.min(80, spacing * 1.5))

type BedShape = 'rectangle' | 'l-shape' | 'circle' | 'raised' | 'pot'

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
  const [sidebarTab, setSidebarTab] = useState<'plants' | 'beds' | 'list'>('plants')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [pendingPlantId, setPendingPlantId] = useState<string | null>(null)
  const [pendingVarietyId, setPendingVarietyId] = useState<string | null>(null)
  const [showVarietyPicker, setShowVarietyPicker] = useState(false)
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
      width: shape === 'circle' || shape === 'pot' ? (shape === 'pot' ? 40 : 160) : 260,
      height: shape === 'circle' || shape === 'pot' ? (shape === 'pot' ? 40 : 160) : 160,
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

      // Check if inside a bed first (rotation-aware)
      let targetBed: GardenBed | undefined
      let localHit = { localX: 0, localY: 0 }
      for (const b of beds) {
        const hit = pointInBed(x, y, b)
        if (hit.inside) { targetBed = b; localHit = hit; break }
      }

      if (targetBed) {
        const newPlant: PlacedPlant = {
          id: `plant-${Date.now()}`,
          plantType: pendingPlantId,
          x: snap(localHit.localX - sz / 2),
          y: snap(localHit.localY - sz / 2),
          varietyId: pendingVarietyId || undefined,
        }
        setBeds(prev => prev.map(b =>
          b.id === targetBed!.id ? { ...b, plants: [...b.plants, newPlant] } : b
        ))
      } else {
        // Place as loose plant on canvas
        const newPlant: PlacedPlant = {
          id: `plant-${Date.now()}`,
          plantType: pendingPlantId,
          x: snap(x - sz / 2),
          y: snap(y - sz / 2),
          varietyId: pendingVarietyId || undefined,
        }
        setLoosePlants(prev => [...prev, newPlant])
      }
      setPendingPlantId(null)
      setPendingVarietyId(null)
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
    const hit = pointInBed(x, y, bed)
    const newPlant: PlacedPlant = {
      id: `plant-${Date.now()}`,
      plantType: pendingPlantId,
      x: snap(hit.localX - sz / 2),
      y: snap(hit.localY - sz / 2),
      varietyId: pendingVarietyId || undefined,
    }
    setBeds(prev => prev.map(b =>
      b.id === bed.id ? { ...b, plants: [...b.plants, newPlant] } : b
    ))
    setPendingPlantId(null)
    setPendingVarietyId(null)
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

    // Check if inside a bed (rotation-aware)
    let targetBed: GardenBed | undefined
    let localHit = { localX: 0, localY: 0 }
    for (const b of beds) {
      const hit = pointInBed(dropX, dropY, b)
      if (hit.inside) { targetBed = b; localHit = hit; break }
    }

    if (targetBed) {
      const newPlant: PlacedPlant = {
        id: `plant-${Date.now()}`,
        plantType: plantId,
        x: snap(localHit.localX - sz / 2),
        y: snap(localHit.localY - sz / 2),
      }
      setBeds(prev => prev.map(b =>
        b.id === targetBed!.id ? { ...b, plants: [...b.plants, newPlant] } : b
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
          if (b.shape === 'circle' || b.shape === 'pot') {
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
          // Rotation-aware hit test
          let targetBed: GardenBed | undefined
          let localHit = { localX: 0, localY: 0 }
          for (const b of beds) {
            const hit = pointInBed(cx, cy, b)
            if (hit.inside) { targetBed = b; localHit = hit; break }
          }
          if (targetBed) {
            // Convert loose plant → bed plant (use local coords)
            const bedPlant: PlacedPlant = {
              ...plant,
              x: snap(localHit.localX - sz / 2),
              y: snap(localHit.localY - sz / 2),
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
          // Plant position is relative to bed (local coords)
          // Check if local center is still within bed bounds
          const localCx = plant.x + sz / 2
          const localCy = plant.y + sz / 2
          const isInsideBed = localCx >= 0 && localCx <= bed.width &&
                              localCy >= 0 && localCy <= bed.height
          if (!isInsideBed) {
            // Convert bed plant → loose plant (transform local back to canvas coords)
            const rot = bed.rotation || 0
            const bedCx = bed.x + bed.width / 2
            const bedCy = bed.y + bed.height / 2
            // Local offset from bed center
            const lx = (bed.x + plant.x) - bedCx
            const ly = (bed.y + plant.y) - bedCy
            // Rotate back to canvas space
            const rad = (rot * Math.PI) / 180
            const cos = Math.cos(rad)
            const sin = Math.sin(rad)
            const canvasX = bedCx + lx * cos - ly * sin
            const canvasY = bedCy + lx * sin + ly * cos
            const loosePlant: PlacedPlant = {
              ...plant,
              x: snap(canvasX),
              y: snap(canvasY),
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

  // --- Plant inventory helpers ---
  const getAllPlants = () => {
    const allPlants: { plant: PlacedPlant; location: 'bed' | 'loose'; bedName?: string }[] = []
    
    // Add bed plants
    beds.forEach(bed => {
      bed.plants.forEach(plant => {
        allPlants.push({ plant, location: 'bed', bedName: bed.name })
      })
    })
    
    // Add loose plants
    loosePlants.forEach(plant => {
      allPlants.push({ plant, location: 'loose' })
    })
    
    return allPlants
  }

  const groupPlantsByType = () => {
    const allPlants = getAllPlants()
    const grouped: { [plantType: string]: { plant: PlacedPlant; location: 'bed' | 'loose'; bedName?: string }[] } = {}
    
    allPlants.forEach(item => {
      if (!grouped[item.plant.plantType]) {
        grouped[item.plant.plantType] = []
      }
      grouped[item.plant.plantType].push(item)
    })
    
    return grouped
  }

  const renderPlantList = () => {
    const groupedPlants = groupPlantsByType()
    const plantTypes = Object.keys(groupedPlants)

    if (plantTypes.length === 0) {
      return (
        <div className="text-center py-8 text-garden-dark/50">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm">No plants yet</p>
          <p className="text-xs mt-1">Add some plants to see your inventory</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-garden-dark">Plant Inventory</h3>
        {plantTypes.map(plantType => {
          const plantData = plantMap.get(plantType)
          const items = groupedPlants[plantType]
          if (!plantData) return null

          // Group by variety
          const byVariety: { [varietyId: string]: typeof items } = { 'generic': [] }
          items.forEach(item => {
            const varId = item.plant.varietyId || 'generic'
            if (!byVariety[varId]) byVariety[varId] = []
            byVariety[varId].push(item)
          })

          return (
            <div key={plantType} className="bg-garden-cream/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{plantData.emoji}</span>
                  <span className="text-sm font-semibold text-garden-dark">{plantData.name}</span>
                </div>
                <span className="text-xs bg-garden-green/10 px-2 py-1 rounded-full text-garden-dark/70">
                  × {items.length}
                </span>
              </div>
              
              {Object.entries(byVariety).map(([varietyId, varietyItems]) => {
                const variety = plantData.varieties?.find(v => v.id === varietyId)
                const varietyName = variety ? variety.name : 'Generic'
                
                if (varietyItems.length === 0) return null
                
                return (
                  <div key={varietyId} className="text-xs text-garden-dark/60 ml-6 mb-1">
                    <span className="font-medium">{varietyName}</span> × {varietyItems.length}
                    {varietyItems.length <= 3 && (
                      <div className="mt-1 space-y-1">
                        {varietyItems.map(item => (
                          <div 
                            key={item.plant.id} 
                            className="cursor-pointer hover:text-garden-green transition-colors"
                            onClick={() => {
                              if (item.location === 'bed') {
                                const bed = beds.find(b => b.plants.some(p => p.id === item.plant.id))
                                if (bed) {
                                  setSelectedBedId(bed.id)
                                  setSelectedPlantId(item.plant.id)
                                  setSelectedLoosePlantId(null)
                                }
                              } else {
                                setSelectedLoosePlantId(item.plant.id)
                                setSelectedPlantId(null)
                                setSelectedBedId(null)
                              }
                            }}
                          >
                            {item.location === 'bed' ? `${item.bedName}` : 'Canvas'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

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

      {pendingPlantId && !showVarietyPicker && (
        <div className="bg-garden-green/10 border border-garden-green rounded-xl p-2 text-sm text-garden-dark flex items-center justify-between">
          <span>
            🌱 <b>{plantMap.get(pendingPlantId)?.name}</b>
            {pendingVarietyId && (() => {
              const variety = plantMap.get(pendingPlantId)?.varieties?.find(v => v.id === pendingVarietyId)
              return variety ? ` (${variety.name})` : ''
            })()} — tap anywhere to place
          </span>
          <button onClick={() => { setPendingPlantId(null); setPendingVarietyId(null) }} className="text-red-400 hover:text-red-600 px-2">✕</button>
        </div>
      )}

      <div className={`space-y-1 ${isMobile ? 'max-h-60 overflow-y-auto' : ''}`}>
        {filteredPlants.map(plant => (
          <div key={plant.id}
            draggable={!isMobile}
            onDragStart={!isMobile ? (e) => handlePaletteDragStart(e, plant) : undefined}
            onClick={() => { 
              if (plant.varieties && plant.varieties.length > 0) {
                setPendingPlantId(plant.id);
                setShowVarietyPicker(true);
              } else {
                setPendingPlantId(plant.id);
                setPendingVarietyId(null);
                if (isMobile) setBottomSheetOpen(false);
              }
            }}
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors group touch-manipulation ${pendingPlantId === plant.id ? 'bg-garden-green/10 ring-1 ring-garden-green' : 'hover:bg-garden-cream/50'}`}>
            <span className="text-2xl">{plant.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-garden-dark truncate flex items-center gap-1">
                {plant.name}
                {plant.varieties && plant.varieties.length > 0 && (
                  <span className="text-xs bg-garden-green/20 text-garden-green px-1.5 py-0.5 rounded-full">
                    {plant.varieties.length} varieties
                  </span>
                )}
              </div>
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
          { shape: 'pot' as BedShape, emoji: '🪴', name: 'Pot' },
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
            <button onClick={() => setSidebarTab('list')} className={`flex-1 py-3 text-sm font-semibold transition-colors ${sidebarTab === 'list' ? 'text-garden-green border-b-2 border-garden-green' : 'text-garden-dark/50'}`}>
              📋 List
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {sidebarTab === 'plants' ? renderPlantPalette(false) : sidebarTab === 'beds' ? renderBedPalette() : renderPlantList()}
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
            <button onClick={() => { setSidebarTab('list'); setBottomSheetOpen(true) }}
              className="bg-white/90 backdrop-blur-sm text-garden-dark text-sm px-3 py-2 rounded-xl shadow-md border border-garden-green/10 min-h-[44px]">
              📋 List
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
          {pendingPlantId && !showVarietyPicker && (
            <div className="absolute top-16 md:top-4 left-1/2 -translate-x-1/2 z-20 bg-garden-green text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
              <span>
                {plantMap.get(pendingPlantId)?.emoji} Tap anywhere to place {plantMap.get(pendingPlantId)?.name}
                {pendingVarietyId && (() => {
                  const variety = plantMap.get(pendingPlantId)?.varieties?.find(v => v.id === pendingVarietyId)
                  return variety ? ` (${variety.name})` : ''
                })()}
              </span>
              <button onClick={() => { setPendingPlantId(null); setPendingVarietyId(null) }} className="ml-1 hover:text-red-200 text-lg leading-none">×</button>
            </div>
          )}

          {/* Desktop seed packet info card */}
          {selectedPlantId && selectedBedId && (() => {
            const bed = beds.find(b => b.id === selectedBedId)
            const plant = bed?.plants.find(p => p.id === selectedPlantId)
            const plantData = plant ? plantMap.get(plant.plantType) : null
            if (!plantData || !plant) return null
            const { companions, enemies } = getCompanionStatus(plant.plantType, selectedBedId)
            const variety = plant.varietyId ? plantData.varieties?.find(v => v.id === plant.varietyId) : null
            const displayName = variety ? `${plantData.name} - ${variety.name}` : plantData.name
            const harvestDays = variety ? variety.daysToHarvest : plantData.daysToHarvest
            
            const getPlantingTime = () => {
              if (plantData.seedIndoors && plantData.transplant) {
                return `Start seeds ${plantData.seedIndoors[0]}-${plantData.seedIndoors[1]} weeks before last frost, transplant ${Math.abs(plantData.transplant[0])}-${Math.abs(plantData.transplant[1])} weeks ${plantData.transplant[0] < 0 ? 'before' : 'after'} last frost`
              } else if (plantData.directSow) {
                return `Direct sow ${Math.abs(plantData.directSow[0])}-${Math.abs(plantData.directSow[1])} weeks ${plantData.directSow[0] < 0 ? 'before' : 'after'} last frost`
              } else if (plantData.transplant) {
                return `Transplant ${Math.abs(plantData.transplant[0])}-${Math.abs(plantData.transplant[1])} weeks ${plantData.transplant[0] < 0 ? 'before' : 'after'} last frost`
              }
              return 'Check seed packet for timing'
            }

            return (
              <div className="hidden md:block absolute top-4 right-4 z-10 w-80 shadow-xl border-2 border-garden-green/20 overflow-hidden rounded-2xl bg-white">
                {/* Seed packet header */}
                <div 
                  className="px-4 py-3 text-white relative"
                  style={{ 
                    background: variety?.color || plantData.color,
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl drop-shadow-sm">{plantData.emoji}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg leading-tight drop-shadow-sm">{displayName}</h3>
                      <div className="text-sm opacity-90 font-medium">Premium Garden Seeds</div>
                    </div>
                  </div>
                </div>

                {/* Seed packet body */}
                <div className="p-4 bg-gradient-to-b from-garden-cream/20 to-white">
                  {variety && (
                    <div className="mb-3 p-2 bg-garden-green/5 rounded-lg border border-garden-green/10">
                      <div className="text-sm font-semibold text-garden-dark mb-1">{variety.name}</div>
                      <div className="text-xs text-garden-dark/70">{variety.description}</div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <div className="font-bold text-garden-dark">📏 Spacing</div>
                      <div className="text-garden-dark/70">{plantData.spacing} inches</div>
                    </div>
                    <div>
                      <div className="font-bold text-garden-dark">☀️ Sun</div>
                      <div className="text-garden-dark/70 capitalize">{plantData.sunNeeds}</div>
                    </div>
                    <div>
                      <div className="font-bold text-garden-dark">💧 Water</div>
                      <div className="text-garden-dark/70 capitalize">{plantData.waterNeeds}</div>
                    </div>
                    <div>
                      <div className="font-bold text-garden-dark">⏰ Harvest</div>
                      <div className="text-garden-dark/70">{harvestDays[0]}-{harvestDays[1]} days</div>
                    </div>
                    <div>
                      <div className="font-bold text-garden-dark">🌡️ Zones</div>
                      <div className="text-garden-dark/70">{plantData.zones[0]}-{plantData.zones[1]}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="font-bold text-garden-dark text-xs mb-1">🌱 When to Plant</div>
                    <div className="text-xs text-garden-dark/70 leading-relaxed">{getPlantingTime()}</div>
                  </div>

                  {showCompanion && companions.length > 0 && (
                    <div className="mb-2">
                      <div className="font-bold text-green-600 text-xs mb-1">✓ Companion Plants</div>
                      <div className="text-xs text-garden-dark/70">
                        {companions.map(c => `${plantMap.get(c)?.emoji} ${plantMap.get(c)?.name}`).join(' • ')}
                      </div>
                    </div>
                  )}

                  {showCompanion && enemies.length > 0 && (
                    <div className="mb-3">
                      <div className="font-bold text-red-500 text-xs mb-1">✗ Avoid Planting Near</div>
                      <div className="text-xs text-garden-dark/70">
                        {enemies.map(c => `${plantMap.get(c)?.emoji} ${plantMap.get(c)?.name}`).join(' • ')}
                      </div>
                    </div>
                  )}

                  <button onClick={() => deletePlant(selectedBedId!, selectedPlantId!)} className="w-full text-red-500 hover:text-red-700 text-xs font-semibold py-2 px-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                    Remove Plant
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Loose plant seed packet info */}
          {selectedLoosePlantId && selectedLoosePlantData && (
            <div className="hidden md:block absolute top-4 right-4 z-10 w-80 shadow-xl border-2 border-garden-green/20 overflow-hidden rounded-2xl bg-white">
              {(() => {
                const plant = loosePlants.find(p => p.id === selectedLoosePlantId)
                const variety = plant?.varietyId ? selectedLoosePlantData.varieties?.find(v => v.id === plant.varietyId) : null
                const displayName = variety ? `${selectedLoosePlantData.name} - ${variety.name}` : selectedLoosePlantData.name
                const harvestDays = variety ? variety.daysToHarvest : selectedLoosePlantData.daysToHarvest
                
                const getPlantingTime = () => {
                  if (selectedLoosePlantData.seedIndoors && selectedLoosePlantData.transplant) {
                    return `Start seeds ${selectedLoosePlantData.seedIndoors[0]}-${selectedLoosePlantData.seedIndoors[1]} weeks before last frost, transplant ${Math.abs(selectedLoosePlantData.transplant[0])}-${Math.abs(selectedLoosePlantData.transplant[1])} weeks ${selectedLoosePlantData.transplant[0] < 0 ? 'before' : 'after'} last frost`
                  } else if (selectedLoosePlantData.directSow) {
                    return `Direct sow ${Math.abs(selectedLoosePlantData.directSow[0])}-${Math.abs(selectedLoosePlantData.directSow[1])} weeks ${selectedLoosePlantData.directSow[0] < 0 ? 'before' : 'after'} last frost`
                  } else if (selectedLoosePlantData.transplant) {
                    return `Transplant ${Math.abs(selectedLoosePlantData.transplant[0])}-${Math.abs(selectedLoosePlantData.transplant[1])} weeks ${selectedLoosePlantData.transplant[0] < 0 ? 'before' : 'after'} last frost`
                  }
                  return 'Check seed packet for timing'
                }

                return (
                  <>
                    {/* Seed packet header */}
                    <div 
                      className="px-4 py-3 text-white relative"
                      style={{ 
                        background: variety?.color || selectedLoosePlantData.color,
                        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl drop-shadow-sm">{selectedLoosePlantData.emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg leading-tight drop-shadow-sm">{displayName}</h3>
                          <div className="text-sm opacity-90 font-medium">Premium Garden Seeds</div>
                        </div>
                      </div>
                    </div>

                    {/* Seed packet body */}
                    <div className="p-4 bg-gradient-to-b from-garden-cream/20 to-white">
                      {variety && (
                        <div className="mb-3 p-2 bg-garden-green/5 rounded-lg border border-garden-green/10">
                          <div className="text-sm font-semibold text-garden-dark mb-1">{variety.name}</div>
                          <div className="text-xs text-garden-dark/70">{variety.description}</div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                        <div>
                          <div className="font-bold text-garden-dark">📏 Spacing</div>
                          <div className="text-garden-dark/70">{selectedLoosePlantData.spacing} inches</div>
                        </div>
                        <div>
                          <div className="font-bold text-garden-dark">☀️ Sun</div>
                          <div className="text-garden-dark/70 capitalize">{selectedLoosePlantData.sunNeeds}</div>
                        </div>
                        <div>
                          <div className="font-bold text-garden-dark">💧 Water</div>
                          <div className="text-garden-dark/70 capitalize">{selectedLoosePlantData.waterNeeds}</div>
                        </div>
                        <div>
                          <div className="font-bold text-garden-dark">⏰ Harvest</div>
                          <div className="text-garden-dark/70">{harvestDays[0]}-{harvestDays[1]} days</div>
                        </div>
                        <div>
                          <div className="font-bold text-garden-dark">🌡️ Zones</div>
                          <div className="text-garden-dark/70">{selectedLoosePlantData.zones[0]}-{selectedLoosePlantData.zones[1]}</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="font-bold text-garden-dark text-xs mb-1">🌱 When to Plant</div>
                        <div className="text-xs text-garden-dark/70 leading-relaxed">{getPlantingTime()}</div>
                      </div>

                      <button onClick={() => deleteLoosePlant(selectedLoosePlantId)} className="w-full text-red-500 hover:text-red-700 text-xs font-semibold py-2 px-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                        Remove Plant
                      </button>
                    </div>
                  </>
                )
              })()}
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
                    borderRadius: bed.shape === 'circle' || bed.shape === 'pot' ? '50%' : bed.shape === 'raised' ? '12px' : '8px',
                    background: bed.shape === 'raised'
                      ? 'linear-gradient(135deg, #8B6914 0%, #A67C52 100%)'
                      : bed.shape === 'pot'
                      ? 'linear-gradient(135deg, #C67A4B 0%, #A85D3A 100%)'
                      : 'linear-gradient(135deg, #6B9B4E22 0%, #4A7C2E33 100%)',
                    border: bed.shape === 'raised' ? '3px solid #8B691480' : bed.shape === 'pot' ? '3px solid #8B4513' : '2px solid #4A7C2E40',
                    cursor: pendingPlantId ? 'crosshair' : (dragState?.type === 'bed-move' && dragState.bedId === bed.id ? 'grabbing' : 'grab'),
                    touchAction: 'none',
                  }}
                  onClick={(e) => handleBedClick(e, bed)}
                  onMouseDown={(e) => handleBedPointerDown(e, bed)}
                  onTouchStart={(e) => handleBedPointerDown(e, bed)}
                >
                  {/* Label */}
                  <div className={`absolute -top-6 left-1 text-xs font-semibold ${bed.shape === 'raised' ? 'text-amber-700' : bed.shape === 'pot' ? 'text-amber-800' : 'text-garden-green'} whitespace-nowrap pointer-events-none`}>
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

      {/* Variety Picker Modal */}
      {showVarietyPicker && pendingPlantId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowVarietyPicker(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-garden-green/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display text-garden-dark">Choose Variety</h3>
                <button onClick={() => setShowVarietyPicker(false)} className="text-garden-dark/50 hover:text-garden-dark text-xl">×</button>
              </div>
              {(() => {
                const plantData = plantMap.get(pendingPlantId)
                if (!plantData) return null
                return (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-2xl">{plantData.emoji}</span>
                    <div>
                      <div className="font-semibold text-garden-dark">{plantData.name}</div>
                      <div className="text-xs text-garden-dark/60">Select a variety to plant</div>
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {/* Generic option */}
                <button
                  onClick={() => {
                    setPendingVarietyId(null)
                    setShowVarietyPicker(false)
                    if (bottomSheetOpen) setBottomSheetOpen(false)
                  }}
                  className="w-full text-left p-3 rounded-xl bg-garden-cream/30 hover:bg-garden-cream/50 transition-colors"
                >
                  <div className="font-semibold text-garden-dark">Generic</div>
                  <div className="text-xs text-garden-dark/60">Standard variety</div>
                </button>
                
                {/* Variety options */}
                {(() => {
                  const plantData = plantMap.get(pendingPlantId)
                  if (!plantData?.varieties) return null
                  return plantData.varieties.map(variety => (
                    <button
                      key={variety.id}
                      onClick={() => {
                        setPendingVarietyId(variety.id)
                        setShowVarietyPicker(false)
                        if (bottomSheetOpen) setBottomSheetOpen(false)
                      }}
                      className="w-full text-left p-3 rounded-xl bg-garden-cream/30 hover:bg-garden-cream/50 transition-colors"
                    >
                      <div className="font-semibold text-garden-dark">{variety.name}</div>
                      <div className="text-xs text-garden-dark/60 mb-1">{variety.description}</div>
                      <div className="text-xs text-garden-dark/50">
                        {variety.daysToHarvest[0]}-{variety.daysToHarvest[1]} days to harvest
                      </div>
                    </button>
                  ))
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {bottomSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setBottomSheetOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[75vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-garden-green/10">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex gap-2 justify-center">
                <button onClick={() => setSidebarTab('plants')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${sidebarTab === 'plants' ? 'bg-garden-green text-white' : 'text-garden-dark/60'}`}>🌱 Plants</button>
                <button onClick={() => setSidebarTab('beds')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${sidebarTab === 'beds' ? 'bg-garden-green text-white' : 'text-garden-dark/60'}`}>📐 Beds</button>
                <button onClick={() => setSidebarTab('list')} className={`px-3 py-2 rounded-lg text-sm font-semibold ${sidebarTab === 'list' ? 'bg-garden-green text-white' : 'text-garden-dark/60'}`}>📋 List</button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(75vh-80px)]">
              {sidebarTab === 'plants' ? renderPlantPalette(true) : sidebarTab === 'beds' ? renderBedPalette() : renderPlantList()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

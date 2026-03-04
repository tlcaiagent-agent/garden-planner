import { plantCatalog } from './plants'

export interface Garden {
  id: string
  name: string
  type: 'indoor' | 'outdoor'
  year: number
  beds: GardenBed[]
  loosePlants?: PlacedPlant[] // plants placed directly on canvas, not in beds
}

export interface GardenBed {
  id: string
  name: string
  shape: 'rectangle' | 'l-shape' | 'circle' | 'raised' | 'pot'
  x: number
  y: number
  width: number
  height: number
  rotation?: number // rotation in degrees
  plants: PlacedPlant[]
}

export interface PlacedPlant {
  id: string
  plantType: string
  x: number
  y: number
  varietyId?: string
  plantedDate?: string
  notes?: string
}

export interface AIConversation {
  id: string
  question: string
  answer: string
  sources: { title: string; url: string }[]
  createdAt: string
}

export const mockGardens: Garden[] = [
  {
    id: 'garden-1',
    name: 'Backyard Veggie Garden',
    type: 'outdoor',
    year: 2026,
    beds: [
      {
        id: 'bed-1',
        name: 'Main Raised Bed',
        shape: 'raised',
        x: 50,
        y: 50,
        width: 300,
        height: 150,
        plants: [
          { id: 'p1', plantType: 'tomato', x: 30, y: 30 },
          { id: 'p2', plantType: 'basil', x: 80, y: 30 },
          { id: 'p3', plantType: 'pepper', x: 130, y: 30 },
          { id: 'p4', plantType: 'marigold', x: 180, y: 30 },
          { id: 'p5', plantType: 'carrot', x: 30, y: 90 },
          { id: 'p6', plantType: 'lettuce', x: 80, y: 90 },
        ],
      },
      {
        id: 'bed-2',
        name: 'Herb Corner',
        shape: 'circle',
        x: 400,
        y: 100,
        width: 120,
        height: 120,
        plants: [
          { id: 'p7', plantType: 'rosemary', x: 30, y: 30 },
          { id: 'p8', plantType: 'thyme', x: 60, y: 60 },
          { id: 'p9', plantType: 'mint', x: 30, y: 60 },
        ],
      },
    ],
  },
  {
    id: 'garden-2',
    name: 'Kitchen Window Herbs',
    type: 'indoor',
    year: 2026,
    beds: [
      {
        id: 'bed-3',
        name: 'Window Box',
        shape: 'rectangle',
        x: 50,
        y: 50,
        width: 400,
        height: 80,
        plants: [
          { id: 'p10', plantType: 'basil', x: 30, y: 20 },
          { id: 'p11', plantType: 'cilantro', x: 80, y: 20 },
          { id: 'p12', plantType: 'parsley', x: 130, y: 20 },
          { id: 'p13', plantType: 'chive', x: 180, y: 20 },
        ],
      },
    ],
  },
]

export const mockConversations: AIConversation[] = [
  {
    id: 'conv-1',
    question: 'When should I start tomato seeds indoors in zone 7?',
    answer: 'In USDA Zone 7, start tomato seeds indoors 6-8 weeks before your last frost date, which is typically mid-April. That means starting seeds in late February to early March. Use a seed starting mix and keep soil temperature at 70-80°F for best germination.',
    sources: [
      { title: 'Clemson Extension — Growing Tomatoes', url: 'https://hgic.clemson.edu/factsheet/tomato/' },
      { title: 'USDA Plant Hardiness Zone Map', url: 'https://planthardiness.ars.usda.gov/' },
    ],
    createdAt: '2026-03-01T10:30:00Z',
  },
  {
    id: 'conv-2',
    question: 'Can I plant basil next to tomatoes?',
    answer: 'Absolutely! Basil and tomatoes are one of the best companion planting pairs. Basil can help repel aphids, whiteflies, and tomato hornworms. Some gardeners even say basil improves the flavor of tomatoes. Plant basil between your tomato plants, spacing about 12 inches apart.',
    sources: [
      { title: 'Cornell Extension — Companion Planting', url: 'https://gardening.cals.cornell.edu/lessons/companion-planting/' },
    ],
    createdAt: '2026-03-02T14:15:00Z',
  },
]

export type LogCategory = 'planted' | 'watered' | 'fertilized' | 'harvested' | 'note'

export interface GardenLogEntry {
  id: string
  gardenId: string
  date: string // ISO date string
  category: LogCategory
  plantType?: string // optional reference to plant id
  note: string
  createdAt: string
}

export const mockGardenLog: GardenLogEntry[] = [
  {
    id: 'log-1',
    gardenId: 'garden-1',
    date: '2026-02-15',
    category: 'note',
    note: 'Ordered seeds for the spring season. Got tomato, pepper, and basil varieties.',
    createdAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'log-2',
    gardenId: 'garden-1',
    date: '2026-02-20',
    category: 'planted',
    plantType: 'tomato',
    note: 'Started Cherokee Purple tomato seeds indoors under grow lights.',
    createdAt: '2026-02-20T09:30:00Z',
  },
  {
    id: 'log-3',
    gardenId: 'garden-1',
    date: '2026-02-20',
    category: 'planted',
    plantType: 'pepper',
    note: 'Started bell pepper seeds indoors. Using heat mat for germination.',
    createdAt: '2026-02-20T09:45:00Z',
  },
  {
    id: 'log-4',
    gardenId: 'garden-1',
    date: '2026-02-28',
    category: 'note',
    note: 'Tomato seedlings sprouted! About 1 inch tall.',
    createdAt: '2026-02-28T08:00:00Z',
  },
  {
    id: 'log-5',
    gardenId: 'garden-1',
    date: '2026-03-01',
    category: 'watered',
    plantType: 'tomato',
    note: 'Watered seedlings. Soil was getting dry under grow lights.',
    createdAt: '2026-03-01T07:30:00Z',
  },
  {
    id: 'log-6',
    gardenId: 'garden-1',
    date: '2026-03-03',
    category: 'fertilized',
    plantType: 'tomato',
    note: 'First light fertilizer application — quarter strength fish emulsion.',
    createdAt: '2026-03-03T10:00:00Z',
  },
]

export const userProfile = {
  zone: '8b',
  location: 'Portland, OR',
}

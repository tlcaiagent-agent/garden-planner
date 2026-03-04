export interface PlantData {
  id: string
  name: string
  emoji: string
  category: 'vegetable' | 'herb' | 'fruit' | 'flower'
  spacing: number // inches
  companionPlants: string[]
  enemyPlants: string[]
  daysToHarvest: [number, number]
  sunNeeds: 'full' | 'partial' | 'shade'
  waterNeeds: 'low' | 'medium' | 'high'
  zones: [number, number]
  seedIndoors?: [number, number] // weeks before last frost [start, end]
  transplant?: [number, number] // weeks relative to last frost
  directSow?: [number, number]
  color: string
}

export const plantCatalog: PlantData[] = [
  // VEGETABLES
  { id: 'tomato', name: 'Tomato', emoji: '🍅', category: 'vegetable', spacing: 24, companionPlants: ['basil', 'carrot', 'marigold', 'parsley', 'pepper'], enemyPlants: ['fennel', 'cabbage', 'kohlrabi'], daysToHarvest: [60, 85], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 11], seedIndoors: [6, 8], transplant: [2, 4], color: '#E53935' },
  { id: 'pepper', name: 'Pepper', emoji: '🫑', category: 'vegetable', spacing: 18, companionPlants: ['basil', 'tomato', 'carrot', 'onion', 'spinach'], enemyPlants: ['fennel', 'kohlrabi'], daysToHarvest: [60, 90], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 11], seedIndoors: [8, 10], transplant: [2, 4], color: '#43A047' },
  { id: 'hot-pepper', name: 'Hot Pepper', emoji: '🌶️', category: 'vegetable', spacing: 18, companionPlants: ['basil', 'tomato', 'carrot', 'onion'], enemyPlants: ['fennel', 'kohlrabi'], daysToHarvest: [70, 100], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 11], seedIndoors: [8, 10], transplant: [2, 4], color: '#D32F2F' },
  { id: 'lettuce', name: 'Lettuce', emoji: '🥬', category: 'vegetable', spacing: 8, companionPlants: ['carrot', 'radish', 'strawberry', 'chive'], enemyPlants: [], daysToHarvest: [30, 60], sunNeeds: 'partial', waterNeeds: 'high', zones: [2, 11], directSow: [-4, -2], color: '#7CB342' },
  { id: 'zucchini', name: 'Zucchini', emoji: '🥒', category: 'vegetable', spacing: 36, companionPlants: ['corn', 'bean', 'nasturtium', 'marigold'], enemyPlants: ['potato'], daysToHarvest: [45, 65], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 11], directSow: [1, 3], color: '#558B2F' },
  { id: 'cucumber', name: 'Cucumber', emoji: '🥒', category: 'vegetable', spacing: 12, companionPlants: ['bean', 'corn', 'pea', 'sunflower', 'lettuce'], enemyPlants: ['potato', 'aromatic-herbs'], daysToHarvest: [50, 70], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 11], directSow: [1, 3], color: '#33691E' },
  { id: 'carrot', name: 'Carrot', emoji: '🥕', category: 'vegetable', spacing: 3, companionPlants: ['tomato', 'lettuce', 'onion', 'pea', 'rosemary'], enemyPlants: ['dill'], daysToHarvest: [60, 80], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 10], directSow: [-3, -1], color: '#EF6C00' },
  { id: 'bean', name: 'Green Bean', emoji: '🫘', category: 'vegetable', spacing: 6, companionPlants: ['corn', 'cucumber', 'carrot', 'lettuce', 'pea'], enemyPlants: ['onion', 'garlic', 'fennel'], daysToHarvest: [50, 60], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 10], directSow: [1, 3], color: '#2E7D32' },
  { id: 'pea', name: 'Pea', emoji: '🫛', category: 'vegetable', spacing: 4, companionPlants: ['carrot', 'corn', 'cucumber', 'bean', 'radish'], enemyPlants: ['onion', 'garlic'], daysToHarvest: [55, 70], sunNeeds: 'full', waterNeeds: 'medium', zones: [2, 9], directSow: [-6, -4], color: '#4CAF50' },
  { id: 'corn', name: 'Corn', emoji: '🌽', category: 'vegetable', spacing: 12, companionPlants: ['bean', 'zucchini', 'cucumber', 'pea', 'sunflower'], enemyPlants: ['tomato'], daysToHarvest: [60, 100], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 11], directSow: [1, 3], color: '#FDD835' },
  { id: 'onion', name: 'Onion', emoji: '🧅', category: 'vegetable', spacing: 4, companionPlants: ['carrot', 'lettuce', 'tomato', 'pepper', 'strawberry'], enemyPlants: ['bean', 'pea'], daysToHarvest: [90, 120], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 9], seedIndoors: [8, 10], transplant: [-4, -2], color: '#F9A825' },
  { id: 'garlic', name: 'Garlic', emoji: '🧄', category: 'vegetable', spacing: 6, companionPlants: ['tomato', 'pepper', 'lettuce', 'carrot'], enemyPlants: ['bean', 'pea'], daysToHarvest: [90, 120], sunNeeds: 'full', waterNeeds: 'low', zones: [3, 8], directSow: [-6, -4], color: '#EFEBE9' },
  { id: 'potato', name: 'Potato', emoji: '🥔', category: 'vegetable', spacing: 12, companionPlants: ['bean', 'corn', 'cabbage', 'marigold', 'horseradish'], enemyPlants: ['tomato', 'cucumber', 'zucchini', 'sunflower'], daysToHarvest: [70, 120], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 10], directSow: [-2, 0], color: '#8D6E63' },
  { id: 'spinach', name: 'Spinach', emoji: '🥬', category: 'vegetable', spacing: 6, companionPlants: ['strawberry', 'pea', 'bean', 'lettuce'], enemyPlants: [], daysToHarvest: [35, 50], sunNeeds: 'partial', waterNeeds: 'high', zones: [2, 9], directSow: [-6, -4], color: '#1B5E20' },
  { id: 'kale', name: 'Kale', emoji: '🥗', category: 'vegetable', spacing: 18, companionPlants: ['bean', 'onion', 'potato', 'dill'], enemyPlants: ['strawberry', 'tomato'], daysToHarvest: [55, 75], sunNeeds: 'full', waterNeeds: 'medium', zones: [2, 9], directSow: [-4, -2], color: '#2E7D32' },
  { id: 'radish', name: 'Radish', emoji: '🔴', category: 'vegetable', spacing: 2, companionPlants: ['lettuce', 'pea', 'bean', 'carrot', 'spinach'], enemyPlants: [], daysToHarvest: [22, 30], sunNeeds: 'full', waterNeeds: 'medium', zones: [2, 10], directSow: [-4, -2], color: '#C62828' },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'vegetable', spacing: 18, companionPlants: ['onion', 'garlic', 'rosemary', 'dill', 'lettuce'], enemyPlants: ['tomato', 'strawberry'], daysToHarvest: [55, 80], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 10], seedIndoors: [6, 8], transplant: [-2, 0], color: '#388E3C' },
  { id: 'cabbage', name: 'Cabbage', emoji: '🥬', category: 'vegetable', spacing: 18, companionPlants: ['bean', 'onion', 'garlic', 'dill'], enemyPlants: ['tomato', 'strawberry'], daysToHarvest: [70, 100], sunNeeds: 'full', waterNeeds: 'high', zones: [2, 10], seedIndoors: [6, 8], transplant: [-2, 0], color: '#66BB6A' },
  { id: 'eggplant', name: 'Eggplant', emoji: '🍆', category: 'vegetable', spacing: 24, companionPlants: ['bean', 'pepper', 'spinach', 'marigold'], enemyPlants: ['fennel'], daysToHarvest: [65, 85], sunNeeds: 'full', waterNeeds: 'medium', zones: [5, 11], seedIndoors: [8, 10], transplant: [2, 4], color: '#4A148C' },
  { id: 'sweet-potato', name: 'Sweet Potato', emoji: '🍠', category: 'vegetable', spacing: 12, companionPlants: ['bean', 'corn', 'dill'], enemyPlants: ['tomato'], daysToHarvest: [90, 120], sunNeeds: 'full', waterNeeds: 'medium', zones: [5, 11], transplant: [2, 4], color: '#E65100' },
  // HERBS
  { id: 'basil', name: 'Basil', emoji: '🌿', category: 'herb', spacing: 12, companionPlants: ['tomato', 'pepper', 'lettuce', 'marigold'], enemyPlants: ['sage'], daysToHarvest: [25, 30], sunNeeds: 'full', waterNeeds: 'medium', zones: [4, 10], seedIndoors: [6, 8], transplant: [1, 3], color: '#2E7D32' },
  { id: 'rosemary', name: 'Rosemary', emoji: '🌱', category: 'herb', spacing: 24, companionPlants: ['bean', 'carrot', 'cabbage', 'broccoli'], enemyPlants: [], daysToHarvest: [80, 90], sunNeeds: 'full', waterNeeds: 'low', zones: [7, 10], seedIndoors: [10, 12], transplant: [0, 2], color: '#558B2F' },
  { id: 'mint', name: 'Mint', emoji: '🍃', category: 'herb', spacing: 18, companionPlants: ['tomato', 'cabbage', 'pea'], enemyPlants: [], daysToHarvest: [30, 40], sunNeeds: 'partial', waterNeeds: 'high', zones: [3, 8], transplant: [0, 2], color: '#00C853' },
  { id: 'cilantro', name: 'Cilantro', emoji: '🌿', category: 'herb', spacing: 6, companionPlants: ['bean', 'pea', 'lettuce', 'tomato'], enemyPlants: ['fennel'], daysToHarvest: [21, 30], sunNeeds: 'partial', waterNeeds: 'medium', zones: [2, 11], directSow: [-2, 0], color: '#4CAF50' },
  { id: 'dill', name: 'Dill', emoji: '🌾', category: 'herb', spacing: 12, companionPlants: ['cabbage', 'lettuce', 'onion', 'cucumber'], enemyPlants: ['carrot'], daysToHarvest: [40, 60], sunNeeds: 'full', waterNeeds: 'medium', zones: [2, 9], directSow: [-2, 0], color: '#9CCC65' },
  { id: 'parsley', name: 'Parsley', emoji: '🌿', category: 'herb', spacing: 8, companionPlants: ['tomato', 'corn', 'carrot', 'pepper'], enemyPlants: ['lettuce'], daysToHarvest: [30, 40], sunNeeds: 'partial', waterNeeds: 'medium', zones: [3, 9], seedIndoors: [8, 10], transplant: [-2, 0], color: '#388E3C' },
  { id: 'lavender', name: 'Lavender', emoji: '💜', category: 'herb', spacing: 18, companionPlants: ['rosemary', 'sage', 'thyme', 'marigold'], enemyPlants: [], daysToHarvest: [90, 200], sunNeeds: 'full', waterNeeds: 'low', zones: [5, 9], seedIndoors: [10, 12], transplant: [2, 4], color: '#7B1FA2' },
  { id: 'thyme', name: 'Thyme', emoji: '🌱', category: 'herb', spacing: 12, companionPlants: ['cabbage', 'tomato', 'eggplant', 'strawberry'], enemyPlants: [], daysToHarvest: [14, 21], sunNeeds: 'full', waterNeeds: 'low', zones: [4, 9], seedIndoors: [6, 8], transplant: [-2, 0], color: '#689F38' },
  { id: 'sage', name: 'Sage', emoji: '🍃', category: 'herb', spacing: 24, companionPlants: ['rosemary', 'cabbage', 'carrot', 'tomato'], enemyPlants: ['basil', 'cucumber'], daysToHarvest: [75, 90], sunNeeds: 'full', waterNeeds: 'low', zones: [4, 8], seedIndoors: [6, 8], transplant: [0, 2], color: '#78909C' },
  { id: 'chive', name: 'Chive', emoji: '🌱', category: 'herb', spacing: 6, companionPlants: ['carrot', 'tomato', 'lettuce', 'strawberry'], enemyPlants: ['bean', 'pea'], daysToHarvest: [30, 40], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 9], seedIndoors: [8, 10], transplant: [-2, 0], color: '#7CB342' },
  // FRUITS
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', category: 'fruit', spacing: 12, companionPlants: ['lettuce', 'spinach', 'onion', 'thyme', 'borage'], enemyPlants: ['cabbage', 'broccoli'], daysToHarvest: [60, 90], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 10], transplant: [-4, -2], color: '#E53935' },
  { id: 'watermelon', name: 'Watermelon', emoji: '🍉', category: 'fruit', spacing: 60, companionPlants: ['corn', 'sunflower', 'nasturtium'], enemyPlants: ['potato'], daysToHarvest: [70, 90], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 11], directSow: [1, 3], color: '#C62828' },
  // FLOWERS
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', category: 'flower', spacing: 12, companionPlants: ['cucumber', 'corn', 'bean', 'lettuce'], enemyPlants: ['potato'], daysToHarvest: [55, 70], sunNeeds: 'full', waterNeeds: 'low', zones: [2, 11], directSow: [0, 2], color: '#FDD835' },
  { id: 'marigold', name: 'Marigold', emoji: '🏵️', category: 'flower', spacing: 8, companionPlants: ['tomato', 'pepper', 'eggplant', 'zucchini', 'potato', 'basil'], enemyPlants: [], daysToHarvest: [45, 60], sunNeeds: 'full', waterNeeds: 'low', zones: [2, 11], seedIndoors: [6, 8], transplant: [0, 2], color: '#FF8F00' },
  { id: 'nasturtium', name: 'Nasturtium', emoji: '🌺', category: 'flower', spacing: 12, companionPlants: ['tomato', 'cucumber', 'zucchini', 'bean', 'cabbage'], enemyPlants: [], daysToHarvest: [35, 50], sunNeeds: 'full', waterNeeds: 'low', zones: [2, 11], directSow: [0, 2], color: '#FF6D00' },
  { id: 'borage', name: 'Borage', emoji: '💙', category: 'flower', spacing: 18, companionPlants: ['tomato', 'strawberry', 'zucchini', 'cabbage'], enemyPlants: [], daysToHarvest: [40, 60], sunNeeds: 'full', waterNeeds: 'low', zones: [2, 11], directSow: [-2, 0], color: '#1565C0' },
]

export const plantMap = new Map(plantCatalog.map(p => [p.id, p]))

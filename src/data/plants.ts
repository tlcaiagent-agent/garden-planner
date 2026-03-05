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
  varieties?: { id: string; name: string; daysToHarvest: [number, number]; description: string; color?: string }[]
  // Planting tips
  soilTempMin?: number
  soilTempOptimal?: [number, number]
  daysToGermination?: [number, number]
  plantingDepth?: string
  plantingTip?: string
  // Enhanced fields for calendar
  daysToMaturity: number
  startIndoorsWeeks?: number // weeks before last frost to start indoors
  directSowOffset?: number // weeks relative to last frost, negative = before
  needsPruning?: boolean
  fertilizeIntervalWeeks?: number // how often to fertilize during growing season
}

export const plantCatalog: PlantData[] = [
  // VEGETABLES
  { 
    id: 'tomato', name: 'Tomato', emoji: '🍅', category: 'vegetable', spacing: 24, 
    companionPlants: ['basil', 'carrot', 'marigold', 'parsley', 'pepper'], 
    enemyPlants: ['fennel', 'cabbage', 'kohlrabi'], 
    daysToHarvest: [60, 85], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 11], 
    seedIndoors: [6, 8], transplant: [2, 4], color: '#E53935',
    soilTempMin: 50, soilTempOptimal: [65, 85], daysToGermination: [5, 10], plantingDepth: '1/4 inch', plantingTip: "Bury stem deep when transplanting — roots grow along buried stem",
    daysToMaturity: 75, startIndoorsWeeks: 7, directSowOffset: undefined,
    needsPruning: true, fertilizeIntervalWeeks: 3,
    varieties: [
      { id: 'cherokee-purple', name: 'Cherokee Purple', daysToHarvest: [70, 85], description: 'Heirloom with deep purple color and complex sweet flavor', color: '#4A148C' },
      { id: 'roma', name: 'Roma', daysToHarvest: [60, 75], description: 'Determinate paste tomato, perfect for sauces and canning', color: '#C62828' },
      { id: 'san-marzano', name: 'San Marzano', daysToHarvest: [75, 90], description: 'Italian heirloom, elongated shape, excellent for sauce', color: '#D32F2F' },
      { id: 'sweet-100', name: 'Sweet 100', daysToHarvest: [55, 70], description: 'Cherry tomato with incredible sweetness and high yields', color: '#E53935' },
      { id: 'brandywine', name: 'Brandywine', daysToHarvest: [80, 95], description: 'Large pink heirloom with exceptional flavor', color: '#EC407A' }
    ]
  },
  { 
    id: 'pepper', name: 'Pepper', emoji: '🫑', category: 'vegetable', spacing: 18, 
    companionPlants: ['basil', 'tomato', 'carrot', 'onion', 'spinach'], 
    enemyPlants: ['fennel', 'kohlrabi'], 
    daysToHarvest: [60, 90], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 11], 
    seedIndoors: [8, 10], transplant: [2, 4], color: '#43A047',
    soilTempMin: 60, soilTempOptimal: [65, 85], daysToGermination: [7, 14], plantingDepth: '1/4 inch', plantingTip: "Peppers love warm soil — wait until nights are consistently above 55°F",
    daysToMaturity: 75, startIndoorsWeeks: 9, directSowOffset: undefined,
    fertilizeIntervalWeeks: 3,
    varieties: [
      { id: 'bell', name: 'Bell Pepper', daysToHarvest: [60, 75], description: 'Classic sweet pepper, thick walls, great for stuffing', color: '#43A047' },
      { id: 'poblano', name: 'Poblano', daysToHarvest: [65, 80], description: 'Mild heat, perfect for chiles rellenos', color: '#2E7D32' },
      { id: 'banana', name: 'Banana Pepper', daysToHarvest: [60, 70], description: 'Sweet and tangy, light yellow color', color: '#FBC02D' },
      { id: 'jalapeno', name: 'Jalapeño', daysToHarvest: [70, 85], description: 'Medium heat, versatile for cooking and pickling', color: '#388E3C' }
    ]
  },
  { 
    id: 'hot-pepper', name: 'Hot Pepper', emoji: '🌶️', category: 'vegetable', spacing: 18, 
    companionPlants: ['basil', 'tomato', 'carrot', 'onion'], 
    enemyPlants: ['fennel', 'kohlrabi'], 
    daysToHarvest: [70, 100], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 11], 
    seedIndoors: [8, 10], transplant: [2, 4], color: '#D32F2F',
    soilTempMin: 65, soilTempOptimal: [70, 90], daysToGermination: [14, 28], plantingDepth: '1/4 inch', plantingTip: "Super-hots need extra patience — germination can take 4+ weeks",
    daysToMaturity: 90, startIndoorsWeeks: 10, directSowOffset: undefined,
    fertilizeIntervalWeeks: 3,
    varieties: [
      { id: 'carolina-reaper', name: 'Carolina Reaper', daysToHarvest: [90, 110], description: 'Extremely hot (2.2M Scoville), wrinkled appearance', color: '#B71C1C' },
      { id: 'ghost', name: 'Ghost Pepper', daysToHarvest: [85, 105], description: 'Super hot (1M Scoville), smoky flavor', color: '#C62828' },
      { id: 'thai', name: 'Thai Chili', daysToHarvest: [70, 85], description: 'Small but fiery, essential for Thai cuisine', color: '#D32F2F' },
      { id: 'serrano', name: 'Serrano', daysToHarvest: [75, 90], description: 'Hotter than jalapeño, bright crisp flavor', color: '#388E3C' }
    ]
  },
  { 
    id: 'lettuce', name: 'Lettuce', emoji: '🥬', category: 'vegetable', spacing: 8, 
    companionPlants: ['carrot', 'radish', 'strawberry', 'chive'], enemyPlants: [], 
    daysToHarvest: [30, 60], sunNeeds: 'partial', waterNeeds: 'high', zones: [2, 11], 
    directSow: [-4, -2], color: '#7CB342',
    soilTempMin: 35, soilTempOptimal: [45, 65], daysToGermination: [2, 10], plantingDepth: '1/8 inch (surface sow)', plantingTip: "Needs light to germinate — don't cover seeds deeply",
    daysToMaturity: 45, startIndoorsWeeks: undefined, directSowOffset: -3,
    fertilizeIntervalWeeks: 4,
    varieties: [
      { id: 'butterhead', name: 'Butterhead', daysToHarvest: [30, 45], description: 'Soft, tender leaves with sweet flavor', color: '#7CB342' },
      { id: 'romaine', name: 'Romaine', daysToHarvest: [35, 50], description: 'Crisp, elongated leaves, perfect for Caesar salad', color: '#689F38' },
      { id: 'iceberg', name: 'Iceberg', daysToHarvest: [40, 55], description: 'Classic crunchy lettuce with tight heads', color: '#8BC34A' },
      { id: 'red-leaf', name: 'Red Leaf', daysToHarvest: [30, 45], description: 'Beautiful burgundy edges, mild flavor', color: '#C62828' }
    ]
  },
  { 
    id: 'zucchini', name: 'Zucchini', emoji: '🥒', category: 'vegetable', spacing: 36, 
    companionPlants: ['corn', 'bean', 'nasturtium', 'marigold'], enemyPlants: ['potato'], 
    daysToHarvest: [45, 65], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 11], 
    directSow: [1, 3], color: '#558B2F',
    soilTempMin: 60, soilTempOptimal: [70, 95], daysToGermination: [4, 8], plantingDepth: '1 inch', plantingTip: "Harvest when 6-8 inches — oversized zucchini get seedy and bland",
    daysToMaturity: 55, startIndoorsWeeks: undefined, directSowOffset: 2,
    fertilizeIntervalWeeks: 4,
    varieties: [
      { id: 'black-beauty', name: 'Black Beauty', daysToHarvest: [45, 60], description: 'Classic dark green zucchini, prolific producer', color: '#1B5E20' },
      { id: 'golden', name: 'Golden Zucchini', daysToHarvest: [50, 65], description: 'Bright yellow color, sweet flavor', color: '#FBC02D' },
      { id: 'costata-romanesco', name: 'Costata Romanesco', daysToHarvest: [50, 65], description: 'Italian heirloom with ribbed skin and nutty flavor', color: '#689F38' }
    ]
  },
  { 
    id: 'cucumber', name: 'Cucumber', emoji: '🥒', category: 'vegetable', spacing: 12, 
    companionPlants: ['bean', 'corn', 'pea', 'sunflower', 'lettuce'], 
    enemyPlants: ['potato', 'aromatic-herbs'], 
    daysToHarvest: [50, 70], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 11], 
    directSow: [1, 3], color: '#33691E',
    soilTempMin: 60, soilTempOptimal: [65, 85], daysToGermination: [3, 10], plantingDepth: '1/2 inch', plantingTip: "Trellis vines vertically for straighter fruit and better airflow",
    daysToMaturity: 60, startIndoorsWeeks: undefined, directSowOffset: 2,
    fertilizeIntervalWeeks: 3,
    varieties: [
      { id: 'english', name: 'English Cucumber', daysToHarvest: [50, 65], description: 'Long, seedless, thin skin, mild flavor', color: '#2E7D32' },
      { id: 'pickling', name: 'Pickling Cucumber', daysToHarvest: [45, 60], description: 'Short, bumpy skin, perfect for pickles', color: '#388E3C' },
      { id: 'armenian', name: 'Armenian Cucumber', daysToHarvest: [55, 70], description: 'Actually a melon, ribbed and curved', color: '#4CAF50' }
    ]
  },
  { 
    id: 'carrot', name: 'Carrot', emoji: '🥕', category: 'vegetable', spacing: 3, 
    companionPlants: ['tomato', 'lettuce', 'onion', 'pea', 'rosemary'], enemyPlants: ['dill'], 
    daysToHarvest: [60, 80], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 10], 
    directSow: [-3, -1], color: '#EF6C00',
    soilTempMin: 40, soilTempOptimal: [45, 85], daysToGermination: [14, 21], plantingDepth: '1/4 inch', plantingTip: "Keep soil consistently moist until germination — be patient",
    daysToMaturity: 70, startIndoorsWeeks: undefined, directSowOffset: -2,
    fertilizeIntervalWeeks: 4,
    varieties: [
      { id: 'nantes', name: 'Nantes', daysToHarvest: [60, 75], description: 'Classic cylindrical shape, sweet and crisp', color: '#FF9800' },
      { id: 'danvers', name: 'Danvers', daysToHarvest: [65, 80], description: 'Conical shape, good for heavy soils', color: '#EF6C00' },
      { id: 'imperator', name: 'Imperator', daysToHarvest: [70, 85], description: 'Long and tapered, store-bought type', color: '#E65100' },
      { id: 'chantenay', name: 'Chantenay', daysToHarvest: [60, 70], description: 'Short and broad, perfect for containers', color: '#F57C00' }
    ]
  },
  { 
    id: 'bean', name: 'Green Bean', emoji: '🫘', category: 'vegetable', spacing: 6, 
    companionPlants: ['corn', 'cucumber', 'carrot', 'lettuce', 'pea'], 
    enemyPlants: ['onion', 'garlic', 'fennel'], 
    daysToHarvest: [50, 60], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 10], 
    directSow: [1, 3], color: '#2E7D32',
    soilTempMin: 60, soilTempOptimal: [65, 85], daysToGermination: [6, 10], plantingDepth: '1 inch', plantingTip: "Don't soak bean seeds before planting — they can crack and rot",
    daysToMaturity: 55, startIndoorsWeeks: undefined, directSowOffset: 1,
    fertilizeIntervalWeeks: 4,
    varieties: [
      { id: 'blue-lake', name: 'Blue Lake', daysToHarvest: [50, 60], description: 'Bush variety, tender pods, reliable producer', color: '#2E7D32' },
      { id: 'kentucky-wonder', name: 'Kentucky Wonder', daysToHarvest: [55, 65], description: 'Pole bean, heirloom variety, stringless when young', color: '#388E3C' },
      { id: 'provider', name: 'Provider', daysToHarvest: [45, 55], description: 'Cold tolerant, early maturing bush bean', color: '#4CAF50' }
    ]
  },
  { id: 'pea', name: 'Pea', emoji: '🫛', category: 'vegetable', spacing: 4, companionPlants: ['carrot', 'corn', 'cucumber', 'bean', 'radish'], enemyPlants: ['onion', 'garlic'], daysToHarvest: [55, 70], sunNeeds: 'full', waterNeeds: 'medium', zones: [2, 9], directSow: [-6, -4], color: '#4CAF50',
    soilTempMin: 40, soilTempOptimal: [45, 65], daysToGermination: [7, 14], plantingDepth: '1 inch', plantingTip: "Inoculate seeds with rhizobium bacteria for bigger yields",
    daysToMaturity: 65, startIndoorsWeeks: undefined, directSowOffset: -5,
    fertilizeIntervalWeeks: 4 },
  { id: 'corn', name: 'Corn', emoji: '🌽', category: 'vegetable', spacing: 12, companionPlants: ['bean', 'zucchini', 'cucumber', 'pea', 'sunflower'], enemyPlants: ['tomato'], daysToHarvest: [60, 100], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 11], directSow: [1, 3], color: '#FDD835',
    soilTempMin: 50, soilTempOptimal: [60, 95], daysToGermination: [4, 10], plantingDepth: '1.5 inches', plantingTip: "Plant in blocks of at least 4×4 for proper wind pollination",
    daysToMaturity: 80, startIndoorsWeeks: undefined, directSowOffset: 2,
    fertilizeIntervalWeeks: 3 },
  { id: 'onion', name: 'Onion', emoji: '🧅', category: 'vegetable', spacing: 4, companionPlants: ['carrot', 'lettuce', 'tomato', 'pepper', 'strawberry'], enemyPlants: ['bean', 'pea'], daysToHarvest: [90, 120], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 9], seedIndoors: [8, 10], transplant: [-4, -2], color: '#F9A825',
    soilTempMin: 35, soilTempOptimal: [50, 75], daysToGermination: [7, 10], plantingDepth: '1/4 inch', plantingTip: "Choose short-day, long-day, or day-neutral varieties based on your latitude",
    daysToMaturity: 105, startIndoorsWeeks: 10, directSowOffset: undefined,
    fertilizeIntervalWeeks: 4 },
  { id: 'garlic', name: 'Garlic', emoji: '🧄', category: 'vegetable', spacing: 6, companionPlants: ['tomato', 'pepper', 'lettuce', 'carrot'], enemyPlants: ['bean', 'pea'], daysToHarvest: [90, 120], sunNeeds: 'full', waterNeeds: 'low', zones: [3, 8], directSow: [-6, -4], color: '#EFEBE9',
    soilTempMin: 32, soilTempOptimal: [50, 65], daysToGermination: [7, 14], plantingDepth: '2 inches', plantingTip: "Plant cloves pointy-end up in fall for biggest bulbs",
    daysToMaturity: 240, startIndoorsWeeks: undefined, directSowOffset: -5,
    fertilizeIntervalWeeks: 6 },
  { id: 'potato', name: 'Potato', emoji: '🥔', category: 'vegetable', spacing: 12, companionPlants: ['bean', 'corn', 'cabbage', 'marigold', 'horseradish'], enemyPlants: ['tomato', 'cucumber', 'zucchini', 'sunflower'], daysToHarvest: [70, 120], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 10], directSow: [-2, 0], color: '#8D6E63',
    soilTempMin: 40, soilTempOptimal: [60, 70], daysToGermination: [14, 21], plantingDepth: '4 inches', plantingTip: "Hill soil around stems as they grow to increase tuber production",
    daysToMaturity: 90, startIndoorsWeeks: undefined, directSowOffset: -1,
    fertilizeIntervalWeeks: 4 },
  { id: 'spinach', name: 'Spinach', emoji: '🥬', category: 'vegetable', spacing: 6, companionPlants: ['strawberry', 'pea', 'bean', 'lettuce'], enemyPlants: [], daysToHarvest: [35, 50], sunNeeds: 'partial', waterNeeds: 'high', zones: [2, 9], directSow: [-6, -4], color: '#1B5E20',
    soilTempMin: 35, soilTempOptimal: [45, 65], daysToGermination: [5, 9], plantingDepth: '1/2 inch', plantingTip: "Bolts in heat — grow in spring/fall or provide afternoon shade",
    daysToMaturity: 42, startIndoorsWeeks: undefined, directSowOffset: -5,
    fertilizeIntervalWeeks: 3 },
  { id: 'kale', name: 'Kale', emoji: '🥗', category: 'vegetable', spacing: 18, companionPlants: ['bean', 'onion', 'potato', 'dill'], enemyPlants: ['strawberry', 'tomato'], daysToHarvest: [55, 75], sunNeeds: 'full', waterNeeds: 'medium', zones: [2, 9], directSow: [-4, -2], color: '#2E7D32',
    soilTempMin: 40, soilTempOptimal: [55, 75], daysToGermination: [5, 8], plantingDepth: '1/4 inch', plantingTip: "Flavor sweetens after a light frost — leave in the ground into fall",
    daysToMaturity: 65, startIndoorsWeeks: 6, directSowOffset: -3,
    fertilizeIntervalWeeks: 4 },
  { id: 'radish', name: 'Radish', emoji: '🔴', category: 'vegetable', spacing: 2, companionPlants: ['lettuce', 'pea', 'bean', 'carrot', 'spinach'], enemyPlants: [], daysToHarvest: [22, 30], sunNeeds: 'full', waterNeeds: 'medium', zones: [2, 10], directSow: [-4, -2], color: '#C62828',
    soilTempMin: 40, soilTempOptimal: [45, 65], daysToGermination: [3, 5], plantingDepth: '1/2 inch', plantingTip: "Succession sow every 2 weeks for continuous harvest",
    daysToMaturity: 25, startIndoorsWeeks: undefined, directSowOffset: -3,
    fertilizeIntervalWeeks: undefined },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', category: 'vegetable', spacing: 18, companionPlants: ['onion', 'garlic', 'rosemary', 'dill', 'lettuce'], enemyPlants: ['tomato', 'strawberry'], daysToHarvest: [55, 80], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 10], seedIndoors: [6, 8], transplant: [-2, 0], color: '#388E3C',
    soilTempMin: 40, soilTempOptimal: [55, 75], daysToGermination: [4, 7], plantingDepth: '1/4 inch', plantingTip: "Harvest main head before flowers open — side shoots will keep producing",
    daysToMaturity: 70, startIndoorsWeeks: 7, directSowOffset: undefined,
    fertilizeIntervalWeeks: 3 },
  { id: 'cabbage', name: 'Cabbage', emoji: '🥬', category: 'vegetable', spacing: 18, companionPlants: ['bean', 'onion', 'garlic', 'dill'], enemyPlants: ['tomato', 'strawberry'], daysToHarvest: [70, 100], sunNeeds: 'full', waterNeeds: 'high', zones: [2, 10], seedIndoors: [6, 8], transplant: [-2, 0], color: '#66BB6A',
    soilTempMin: 40, soilTempOptimal: [55, 75], daysToGermination: [4, 10], plantingDepth: '1/4 inch', plantingTip: "Consistent watering prevents heads from splitting",
    daysToMaturity: 85, startIndoorsWeeks: 7, directSowOffset: undefined,
    fertilizeIntervalWeeks: 3 },
  { id: 'eggplant', name: 'Eggplant', emoji: '🍆', category: 'vegetable', spacing: 24, companionPlants: ['bean', 'pepper', 'spinach', 'marigold'], enemyPlants: ['fennel'], daysToHarvest: [65, 85], sunNeeds: 'full', waterNeeds: 'medium', zones: [5, 11], seedIndoors: [8, 10], transplant: [2, 4], color: '#4A148C',
    soilTempMin: 60, soilTempOptimal: [70, 90], daysToGermination: [7, 14], plantingDepth: '1/4 inch', plantingTip: "Harvest when skin is glossy — dull skin means overripe and bitter",
    daysToMaturity: 75, startIndoorsWeeks: 9, directSowOffset: undefined,
    fertilizeIntervalWeeks: 3 },
  { id: 'sweet-potato', name: 'Sweet Potato', emoji: '🍠', category: 'vegetable', spacing: 12, companionPlants: ['bean', 'corn', 'dill'], enemyPlants: ['tomato'], daysToHarvest: [90, 120], sunNeeds: 'full', waterNeeds: 'medium', zones: [5, 11], transplant: [2, 4], color: '#E65100',
    soilTempMin: 60, soilTempOptimal: [65, 85], daysToGermination: [7, 14], plantingDepth: '3 inches (slips)', plantingTip: "Grow slips from a sweet potato in water 6 weeks before planting",
    daysToMaturity: 105, startIndoorsWeeks: 8, directSowOffset: undefined,
    fertilizeIntervalWeeks: 4 },
  // HERBS
  { 
    id: 'basil', name: 'Basil', emoji: '🌿', category: 'herb', spacing: 12, 
    companionPlants: ['tomato', 'pepper', 'lettuce', 'marigold'], enemyPlants: ['sage'], 
    daysToHarvest: [25, 30], sunNeeds: 'full', waterNeeds: 'medium', zones: [4, 10], 
    seedIndoors: [6, 8], transplant: [1, 3], color: '#2E7D32',
    soilTempMin: 50, soilTempOptimal: [65, 85], daysToGermination: [5, 10], plantingDepth: '1/4 inch', plantingTip: "Pinch off flower buds to keep leaves coming all season",
    daysToMaturity: 28, startIndoorsWeeks: 6, directSowOffset: undefined,
    fertilizeIntervalWeeks: 4,
    varieties: [
      { id: 'sweet', name: 'Sweet Basil', daysToHarvest: [25, 30], description: 'Classic Genovese type, perfect for pesto', color: '#2E7D32' },
      { id: 'thai', name: 'Thai Basil', daysToHarvest: [30, 35], description: 'Anise flavor, purple stems, essential for Asian dishes', color: '#4A148C' },
      { id: 'purple', name: 'Purple Ruffles', daysToHarvest: [25, 30], description: 'Ornamental with deep purple leaves', color: '#6A1B9A' },
      { id: 'lemon', name: 'Lemon Basil', daysToHarvest: [25, 30], description: 'Citrus scent, great for teas and desserts', color: '#689F38' }
    ]
  },
  { id: 'rosemary', name: 'Rosemary', emoji: '🌱', category: 'herb', spacing: 24, companionPlants: ['bean', 'carrot', 'cabbage', 'broccoli'], enemyPlants: [], daysToHarvest: [80, 90], sunNeeds: 'full', waterNeeds: 'low', zones: [7, 10], seedIndoors: [10, 12], transplant: [0, 2], color: '#558B2F',
    soilTempMin: 55, soilTempOptimal: [65, 70], daysToGermination: [14, 21], plantingDepth: '1/8 inch (surface sow)', plantingTip: "Easier from cuttings than seed — root a 4-inch stem in water",
    daysToMaturity: 85, startIndoorsWeeks: 12, directSowOffset: undefined,
    fertilizeIntervalWeeks: 6 },
  { id: 'mint', name: 'Mint', emoji: '🍃', category: 'herb', spacing: 18, companionPlants: ['tomato', 'cabbage', 'pea'], enemyPlants: [], daysToHarvest: [30, 40], sunNeeds: 'partial', waterNeeds: 'high', zones: [3, 8], transplant: [0, 2], color: '#00C853',
    soilTempMin: 60, soilTempOptimal: [65, 70], daysToGermination: [10, 15], plantingDepth: '1/4 inch', plantingTip: "Always grow in a container — mint will take over your entire garden",
    daysToMaturity: 90, startIndoorsWeeks: undefined, directSowOffset: undefined,
    fertilizeIntervalWeeks: 4 },
  { id: 'cilantro', name: 'Cilantro', emoji: '🌿', category: 'herb', spacing: 6, companionPlants: ['bean', 'pea', 'lettuce', 'tomato'], enemyPlants: ['fennel'], daysToHarvest: [21, 30], sunNeeds: 'partial', waterNeeds: 'medium', zones: [2, 11], directSow: [-2, 0], color: '#4CAF50',
    soilTempMin: 50, soilTempOptimal: [55, 68], daysToGermination: [7, 10], plantingDepth: '1/4 inch', plantingTip: "Bolts fast in heat — succession sow every 3 weeks for steady supply",
    daysToMaturity: 25, startIndoorsWeeks: undefined, directSowOffset: -1,
    fertilizeIntervalWeeks: undefined },
  { id: 'dill', name: 'Dill', emoji: '🌾', category: 'herb', spacing: 12, companionPlants: ['cabbage', 'lettuce', 'onion', 'cucumber'], enemyPlants: ['carrot'], daysToHarvest: [40, 60], sunNeeds: 'full', waterNeeds: 'medium', zones: [2, 9], directSow: [-2, 0], color: '#9CCC65',
    soilTempMin: 60, soilTempOptimal: [60, 70], daysToGermination: [7, 14], plantingDepth: '1/4 inch', plantingTip: "Direct sow only — dill has a taproot and hates transplanting",
    daysToMaturity: 50, startIndoorsWeeks: undefined, directSowOffset: -1,
    fertilizeIntervalWeeks: undefined },
  { id: 'parsley', name: 'Parsley', emoji: '🌿', category: 'herb', spacing: 8, companionPlants: ['tomato', 'corn', 'carrot', 'pepper'], enemyPlants: ['lettuce'], daysToHarvest: [30, 40], sunNeeds: 'partial', waterNeeds: 'medium', zones: [3, 9], seedIndoors: [8, 10], transplant: [-2, 0], color: '#388E3C',
    soilTempMin: 50, soilTempOptimal: [55, 75], daysToGermination: [14, 28], plantingDepth: '1/4 inch', plantingTip: "Soak seeds overnight to speed up notoriously slow germination",
    daysToMaturity: 75, startIndoorsWeeks: 10, directSowOffset: undefined,
    fertilizeIntervalWeeks: 4 },
  { id: 'lavender', name: 'Lavender', emoji: '💜', category: 'herb', spacing: 18, companionPlants: ['rosemary', 'sage', 'thyme', 'marigold'], enemyPlants: [], daysToHarvest: [90, 200], sunNeeds: 'full', waterNeeds: 'low', zones: [5, 9], seedIndoors: [10, 12], transplant: [2, 4], color: '#7B1FA2',
    soilTempMin: 60, soilTempOptimal: [65, 75], daysToGermination: [14, 21], plantingDepth: '1/8 inch (surface sow)', plantingTip: "Needs excellent drainage — amend heavy soil with sand or gravel",
    daysToMaturity: 110, startIndoorsWeeks: 12, directSowOffset: undefined,
    fertilizeIntervalWeeks: undefined },
  { id: 'thyme', name: 'Thyme', emoji: '🌱', category: 'herb', spacing: 12, companionPlants: ['cabbage', 'tomato', 'eggplant', 'strawberry'], enemyPlants: [], daysToHarvest: [14, 21], sunNeeds: 'full', waterNeeds: 'low', zones: [4, 9], seedIndoors: [6, 8], transplant: [-2, 0], color: '#689F38',
    soilTempMin: 60, soilTempOptimal: [65, 70], daysToGermination: [14, 21], plantingDepth: '1/8 inch (surface sow)', plantingTip: "Don't overwater — thyme thrives in lean, dry, well-drained soil",
    daysToMaturity: 85, startIndoorsWeeks: 8, directSowOffset: undefined,
    fertilizeIntervalWeeks: 6 },
  { id: 'sage', name: 'Sage', emoji: '🍃', category: 'herb', spacing: 24, companionPlants: ['rosemary', 'cabbage', 'carrot', 'tomato'], enemyPlants: ['basil', 'cucumber'], daysToHarvest: [75, 90], sunNeeds: 'full', waterNeeds: 'low', zones: [4, 8], seedIndoors: [6, 8], transplant: [0, 2], color: '#78909C',
    soilTempMin: 60, soilTempOptimal: [60, 70], daysToGermination: [10, 21], plantingDepth: '1/8 inch', plantingTip: "Replace plants every 3-4 years as they get woody and less productive",
    daysToMaturity: 80, startIndoorsWeeks: 8, directSowOffset: undefined,
    fertilizeIntervalWeeks: undefined },
  { id: 'chive', name: 'Chive', emoji: '🌱', category: 'herb', spacing: 6, companionPlants: ['carrot', 'tomato', 'lettuce', 'strawberry'], enemyPlants: ['bean', 'pea'], daysToHarvest: [30, 40], sunNeeds: 'full', waterNeeds: 'medium', zones: [3, 9], seedIndoors: [8, 10], transplant: [-2, 0], color: '#7CB342',
    soilTempMin: 60, soilTempOptimal: [65, 70], daysToGermination: [7, 14], plantingDepth: '1/4 inch', plantingTip: "Cut leaves 2 inches from the base — they'll regrow all season",
    daysToMaturity: 60, startIndoorsWeeks: 8, directSowOffset: undefined,
    fertilizeIntervalWeeks: 4 },
  // FRUITS
  { id: 'strawberry', name: 'Strawberry', emoji: '🍓', category: 'fruit', spacing: 12, companionPlants: ['lettuce', 'spinach', 'onion', 'thyme', 'borage'], enemyPlants: ['cabbage', 'broccoli'], daysToHarvest: [60, 90], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 10], transplant: [-4, -2], color: '#E53935',
    soilTempMin: 35, soilTempOptimal: [60, 80], daysToGermination: [7, 21], plantingDepth: 'Crown level (don\'t bury crown)', plantingTip: "Remove first-year flowers on June-bearers to build stronger roots",
    daysToMaturity: 75, startIndoorsWeeks: undefined, directSowOffset: undefined,
    fertilizeIntervalWeeks: 4 },
  { id: 'watermelon', name: 'Watermelon', emoji: '🍉', category: 'fruit', spacing: 60, companionPlants: ['corn', 'sunflower', 'nasturtium'], enemyPlants: ['potato'], daysToHarvest: [70, 90], sunNeeds: 'full', waterNeeds: 'high', zones: [3, 11], directSow: [1, 3], color: '#C62828',
    soilTempMin: 65, soilTempOptimal: [70, 95], daysToGermination: [4, 10], plantingDepth: '1 inch', plantingTip: "Thump test: ripe melons sound hollow — also check for a yellow ground spot",
    daysToMaturity: 85, startIndoorsWeeks: 4, directSowOffset: 2,
    fertilizeIntervalWeeks: 3 },
  // FLOWERS
  { id: 'sunflower', name: 'Sunflower', emoji: '🌻', category: 'flower', spacing: 12, companionPlants: ['cucumber', 'corn', 'bean', 'lettuce'], enemyPlants: ['potato'], daysToHarvest: [55, 70], sunNeeds: 'full', waterNeeds: 'low', zones: [2, 11], directSow: [0, 2], color: '#FDD835',
    soilTempMin: 50, soilTempOptimal: [70, 85], daysToGermination: [7, 10], plantingDepth: '1 inch', plantingTip: "Stake tall varieties — a heavy seed head in wind can snap the stalk",
    daysToMaturity: 65, startIndoorsWeeks: undefined, directSowOffset: 1,
    fertilizeIntervalWeeks: undefined },
  { id: 'marigold', name: 'Marigold', emoji: '🏵️', category: 'flower', spacing: 8, companionPlants: ['tomato', 'pepper', 'eggplant', 'zucchini', 'potato', 'basil'], enemyPlants: [], daysToHarvest: [45, 60], sunNeeds: 'full', waterNeeds: 'low', zones: [2, 11], seedIndoors: [6, 8], transplant: [0, 2], color: '#FF8F00',
    soilTempMin: 50, soilTempOptimal: [65, 75], daysToGermination: [5, 7], plantingDepth: '1/4 inch', plantingTip: "Plant near veggies — marigolds repel aphids, whiteflies, and nematodes",
    daysToMaturity: 50, startIndoorsWeeks: 6, directSowOffset: undefined,
    fertilizeIntervalWeeks: 4 },
  { id: 'nasturtium', name: 'Nasturtium', emoji: '🌺', category: 'flower', spacing: 12, companionPlants: ['tomato', 'cucumber', 'zucchini', 'bean', 'cabbage'], enemyPlants: [], daysToHarvest: [35, 50], sunNeeds: 'full', waterNeeds: 'low', zones: [2, 11], directSow: [0, 2], color: '#FF6D00',
    soilTempMin: 55, soilTempOptimal: [65, 75], daysToGermination: [7, 12], plantingDepth: '1/2 inch', plantingTip: "Nick or soak seeds overnight to break the hard coat and speed germination",
    daysToMaturity: 45, startIndoorsWeeks: undefined, directSowOffset: 0,
    fertilizeIntervalWeeks: undefined },
  { id: 'borage', name: 'Borage', emoji: '💙', category: 'flower', spacing: 18, companionPlants: ['tomato', 'strawberry', 'zucchini', 'cabbage'], enemyPlants: [], daysToHarvest: [40, 60], sunNeeds: 'full', waterNeeds: 'low', zones: [2, 11], directSow: [-2, 0], color: '#1565C0',
    soilTempMin: 50, soilTempOptimal: [60, 70], daysToGermination: [5, 15], plantingDepth: '1/2 inch', plantingTip: "Self-seeds prolifically — let some flowers go to seed for next year's crop",
    daysToMaturity: 55, startIndoorsWeeks: undefined, directSowOffset: -1,
    fertilizeIntervalWeeks: undefined },
]

export const plantMap = new Map(plantCatalog.map(p => [p.id, p]))

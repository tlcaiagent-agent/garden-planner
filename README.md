# 🌱 GardenPlot — Plan Your Perfect Garden

A drag-and-drop garden planner with companion planting intelligence, personalized planting calendars, and an AI garden expert.

## Features

- **🗺️ Garden Layout Planner** — Canvas-based drag-and-drop garden bed designer with grid snapping
- **🤝 Companion Planting** — Color-coded indicators showing good/bad plant neighbors
- **📅 Planting Calendar** — Monthly calendar with seed start, transplant, and harvest dates based on USDA zone
- **🤖 AI Garden Expert** — Context-aware chat for gardening questions with sourced answers
- **🔗 Share** — Generate beautiful shareable garden cards
- **📊 Dashboard** — Weather widget, daily tasks, garden overview

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (auth + database + storage)
- **Canvas/SVG** for garden layout

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project (for full backend)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# File: supabase/schema.sql
```

This creates all tables with Row Level Security policies.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/page.tsx    # Dashboard
│   ├── ask/page.tsx          # AI Garden Expert
│   └── garden/[id]/
│       ├── plan/page.tsx     # Garden Layout Planner (core feature)
│       ├── calendar/page.tsx # Planting Calendar
│       └── share/page.tsx    # Share garden card
├── components/
│   └── Navbar.tsx
├── data/
│   ├── plants.ts             # 35+ plants with real companion data
│   └── mock.ts               # Mock data for development
└── lib/
    └── supabase.ts           # Supabase client
```

## Plant Catalog

Includes 35+ plants with real companion planting data:
- 🍅 Vegetables: Tomato, Pepper, Lettuce, Zucchini, Cucumber, Carrot, Bean, Pea, Corn, Onion, Garlic, Potato, Spinach, Kale, Radish, Broccoli, Cabbage, Eggplant, Sweet Potato
- 🌿 Herbs: Basil, Rosemary, Mint, Cilantro, Dill, Parsley, Lavender, Thyme, Sage, Chive
- 🍓 Fruits: Strawberry, Watermelon
- 🌻 Flowers: Sunflower, Marigold, Nasturtium, Borage

## Design

Whimsical but modern garden aesthetic:
- Earthy greens (#2D5016, #4A7C2E)
- Warm browns (#8B6914)
- Cream (#FFF8E7)
- Rounded corners, soft shadows
- Mobile responsive

## License

MIT

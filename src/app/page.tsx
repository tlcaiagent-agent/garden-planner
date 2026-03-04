import Navbar from '@/components/Navbar'
import Link from 'next/link'

const features = [
  { emoji: '🗺️', title: 'Drag & Drop Planner', desc: 'Design your garden beds with an intuitive canvas. Drag plants, resize beds, and snap to grid.' },
  { emoji: '🤝', title: 'Companion Planting', desc: 'Instantly see which plants thrive together and which to keep apart. Color-coded indicators.' },
  { emoji: '📅', title: 'Planting Calendar', desc: 'Know exactly when to start seeds, transplant, and harvest based on your USDA zone.' },
  { emoji: '🤖', title: 'AI Garden Expert', desc: 'Ask any gardening question and get expert answers with sourced links from university extensions.' },
  { emoji: '📊', title: 'Track & Learn', desc: 'Log yields, take notes, and improve each season with historical data.' },
  { emoji: '🔗', title: 'Share Your Garden', desc: 'Generate beautiful shareable garden cards to show off your layout.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar transparent />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-garden-cream via-garden-sand/30 to-garden-cream pt-24 pb-20 px-4">
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none text-[200px] leading-none" aria-hidden>
          🌿🌻🍅🌶️🥕🌱🍃🌺🫘🥬
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-garden-dark mb-6 leading-tight">
            Plan Your <span className="text-garden-green">Perfect</span> Garden
          </h1>
          <p className="text-xl sm:text-2xl text-garden-dark/70 mb-8 max-w-2xl mx-auto leading-relaxed">
            The drag-and-drop garden planner with companion planting intelligence, 
            personalized calendars, and an AI expert at your fingertips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn-primary text-lg !py-4 !px-8">
              Start Planning Free 🌱
            </Link>
            <a href="#features" className="btn-secondary text-lg !py-4 !px-8">
              See Features
            </a>
          </div>
          <p className="mt-4 text-garden-dark/40 text-sm">No credit card required • Free forever for 1 garden</p>
        </div>
      </section>

      {/* Demo preview */}
      <section className="max-w-5xl mx-auto -mt-8 px-4 relative z-10">
        <div className="card !p-2 bg-white/90 backdrop-blur-md">
          <div className="bg-gradient-to-br from-garden-cream to-garden-sand rounded-xl p-8 min-h-[300px] flex items-center justify-center relative overflow-hidden">
            <div className="grid grid-cols-3 gap-4 opacity-90">
              {['🍅', '🫑', '🌿', '🥕', '🥬', '🌻', '🫘', '🍓', '🌶️'].map((e, i) => (
                <div key={i} className="w-16 h-16 bg-white/60 rounded-xl flex items-center justify-center text-3xl shadow-sm border border-garden-green/10 hover:scale-110 transition-transform cursor-pointer">
                  {e}
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 right-4 text-sm text-garden-dark/40 italic">Interactive planner preview</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto py-24 px-4">
        <h2 className="font-display text-4xl text-garden-dark text-center mb-4">Everything You Need to Grow</h2>
        <p className="text-center text-garden-dark/60 mb-16 max-w-xl mx-auto">From first seed to final harvest, GardenPlot guides you every step of the way.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="card hover:shadow-garden-lg transition-all hover:-translate-y-1">
              <div className="text-4xl mb-4">{f.emoji}</div>
              <h3 className="font-display text-xl text-garden-dark mb-2">{f.title}</h3>
              <p className="text-garden-dark/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-garden-dark py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl text-white mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', emoji: '📐', title: 'Design Your Beds', desc: 'Draw or choose bed shapes, set dimensions, and arrange your garden layout.' },
              { step: '2', emoji: '🌱', title: 'Drop In Plants', desc: 'Drag plants from the palette. We\'ll show companion matches and spacing guides.' },
              { step: '3', emoji: '📅', title: 'Follow Your Calendar', desc: 'Get a personalized schedule for your zone with seed start, transplant, and harvest dates.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-4">{s.emoji}</div>
                <div className="text-garden-lime font-bold text-sm mb-2">STEP {s.step}</div>
                <h3 className="font-display text-xl text-white mb-2">{s.title}</h3>
                <p className="text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto py-24 px-4">
        <h2 className="font-display text-4xl text-garden-dark text-center mb-4">Simple, Honest Pricing</h2>
        <p className="text-center text-garden-dark/60 mb-16">Start free. Upgrade when you&apos;re ready to grow more.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Seedling', price: 'Free', period: 'forever', features: ['1 garden', 'Basic planner', 'Plant catalog', 'Community support'], cta: 'Get Started', highlight: false },
            { name: 'Grower', price: '$20', period: '/year', features: ['Unlimited gardens', 'AI Garden Expert', 'Planting calendar', 'Companion planting', 'Share & export', 'Priority support'], cta: 'Start Growing', highlight: true },
            { name: 'Lifetime', price: '$35', period: 'one time', features: ['Everything in Grower', 'Forever access', 'Early features', 'Support the mission', '🌻'], cta: 'Go Lifetime', highlight: false },
          ].map((plan, i) => (
            <div key={i} className={`card text-center ${plan.highlight ? 'ring-2 ring-garden-green !shadow-garden-lg scale-105' : ''}`}>
              <h3 className="font-display text-xl text-garden-dark mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-garden-dark">{plan.price}</span>
                <span className="text-garden-dark/50 ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 text-left">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-garden-dark/70">
                    <span className="text-garden-green">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={plan.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-garden-green to-garden-dark py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl text-white mb-4">Ready to Grow Something Amazing?</h2>
          <p className="text-white/70 text-xl mb-8">Join thousands of gardeners who plan smarter with GardenPlot.</p>
          <Link href="/dashboard" className="inline-block bg-white text-garden-dark font-semibold py-4 px-8 rounded-xl text-lg hover:bg-garden-cream transition-colors shadow-lg">
            Start Your Garden Plan 🌱
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-garden-cream py-12 px-4 border-t border-garden-green/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-display text-garden-dark font-bold">
            <span className="text-xl">🌱</span> GardenPlot
          </div>
          <div className="flex gap-6 text-garden-dark/50 text-sm">
            <a href="#" className="hover:text-garden-dark">About</a>
            <a href="#" className="hover:text-garden-dark">Blog</a>
            <a href="#" className="hover:text-garden-dark">Support</a>
            <a href="#" className="hover:text-garden-dark">Privacy</a>
          </div>
          <p className="text-garden-dark/40 text-sm">© 2026 GardenPlot. Made with 🌻</p>
        </div>
      </footer>
    </div>
  )
}

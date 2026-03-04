'use client'
import { useState, useRef, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { mockConversations, userProfile } from '@/data/mock'
import { mockGardens } from '@/data/mock'
import { plantMap } from '@/data/plants'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { title: string; url: string }[]
  timestamp: string
}

const suggestedQuestions = [
  "When should I start tomato seeds indoors?",
  "What are the best companion plants for peppers?",
  "How do I improve clay soil for a vegetable garden?",
  "What can I plant in partial shade?",
  "How often should I water raised beds?",
  "What's the best mulch for a vegetable garden?",
]

// Mock AI responses
const mockResponses: Record<string, { answer: string; sources: { title: string; url: string }[] }> = {
  default: {
    answer: "That's a great gardening question! Based on your Zone 7b location in Portland, OR, here's what I'd recommend:\n\nFor your specific growing conditions, you'll want to consider your last frost date (around April 15) and your soil type. The Pacific Northwest has naturally acidic soil, which is great for many vegetables.\n\nI'd suggest starting with a soil test to understand your specific conditions, then adjusting your plan accordingly. Your current garden with tomatoes, basil, and peppers is a classic combination that should do well in your zone.\n\nRemember to harden off any seedlings started indoors before transplanting!",
    sources: [
      { title: 'OSU Extension — Vegetable Gardening in Oregon', url: 'https://extension.oregonstate.edu/gardening/vegetables' },
      { title: 'USDA Plant Hardiness Zone Map', url: 'https://planthardiness.ars.usda.gov/' },
    ],
  },
  tomato: {
    answer: "For Zone 7b (Portland, OR), start tomato seeds indoors **6-8 weeks before your last frost date** (around April 15). That means **late February to early March** is your ideal seed starting window.\n\nHere's your tomato timeline:\n• 🏠 **Feb 15 - Mar 1**: Start seeds indoors at 70-80°F\n• 🌱 **Apr 1-15**: Begin hardening off seedlings\n• 🌿 **Apr 15 - May 1**: Transplant outdoors after last frost\n• 🍅 **Jul - Sep**: Harvest time!\n\nI see you already have tomatoes in your Backyard Veggie Garden — great choice! Your basil planted nearby will help repel pests and some say improves flavor.",
    sources: [
      { title: 'OSU Extension — Growing Tomatoes', url: 'https://extension.oregonstate.edu/gardening/vegetables/tomatoes' },
      { title: 'Clemson Extension — Tomato Growing Guide', url: 'https://hgic.clemson.edu/factsheet/tomato/' },
    ],
  },
  companion: {
    answer: "Great question about companion planting for peppers! Here are the **best companions** for your peppers:\n\n✅ **Best friends:**\n• 🌿 Basil — repels aphids and spider mites\n• 🍅 Tomatoes — similar growing needs\n• 🥕 Carrots — loosen soil around pepper roots\n• 🧅 Onions — deter many common pests\n• 🥬 Spinach — good ground cover, different root depth\n• 🏵️ Marigolds — repel nematodes and whiteflies\n\n❌ **Keep away from:**\n• Fennel — inhibits growth of most garden plants\n• Kohlrabi — competes for nutrients\n\nI notice you already have basil and marigolds in your main raised bed — perfect companions for your peppers!",
    sources: [
      { title: 'Cornell Extension — Companion Planting Guide', url: 'https://gardening.cals.cornell.edu/lessons/companion-planting/' },
      { title: 'University of Minnesota — Companion Planting', url: 'https://extension.umn.edu/yard-and-garden' },
    ],
  },
}

function getResponse(question: string) {
  const q = question.toLowerCase()
  if (q.includes('tomato') && (q.includes('seed') || q.includes('start') || q.includes('when'))) return mockResponses.tomato
  if (q.includes('companion') || q.includes('neighbor') || q.includes('next to')) return mockResponses.companion
  return mockResponses.default
}

export default function AskPage() {
  const growingPlants = [...new Set(mockGardens.flatMap(g => g.beds.flatMap(b => b.plants.map(p => p.plantType))))]

  const [messages, setMessages] = useState<Message[]>(() =>
    mockConversations.flatMap(conv => [
      { id: conv.id + '-q', role: 'user' as const, content: conv.question, timestamp: conv.createdAt },
      { id: conv.id + '-a', role: 'assistant' as const, content: conv.answer, sources: conv.sources, timestamp: conv.createdAt },
    ])
  )
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const response = getResponse(text)
      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1200 + Math.random() * 800)
  }

  return (
    <div className="min-h-screen bg-garden-cream/50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col">
        <div className="mb-4">
          <h1 className="font-display text-3xl text-garden-dark">🤖 AI Garden Expert</h1>
          <p className="text-garden-dark/50 text-sm mt-1">
            Ask anything about gardening. I know your zone ({userProfile.zone}), location ({userProfile.location}), and what you&apos;re growing ({growingPlants.map(id => plantMap.get(id)?.emoji).join(' ')}).
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto space-y-4 mb-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌻</div>
              <h2 className="font-display text-2xl text-garden-dark mb-2">What would you like to know?</h2>
              <p className="text-garden-dark/50 mb-8">I can help with planting schedules, companion planting, pest control, soil prep, and more.</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {suggestedQuestions.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    className="bg-white text-garden-dark/70 text-sm px-4 py-2 rounded-xl border border-garden-green/15 hover:bg-garden-cream hover:border-garden-green/30 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user'
                ? 'bg-garden-green text-white rounded-2xl rounded-br-md px-4 py-3'
                : 'card !p-4'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 text-garden-green">
                    <span>🌱</span>
                    <span className="text-sm font-semibold">GardenPlot AI</span>
                  </div>
                )}
                <div className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? '' : 'text-garden-dark/80'}`}>
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-garden-green/10">
                    <p className="text-xs text-garden-dark/40 mb-1">📚 Sources:</p>
                    {msg.sources.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="block text-xs text-garden-green hover:underline truncate">
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="card !p-4">
                <div className="flex items-center gap-2 text-garden-green">
                  <span>🌱</span>
                  <span className="text-sm">Thinking</span>
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Suggested questions (when there are messages) */}
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {suggestedQuestions.slice(0, 3).map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)}
                className="whitespace-nowrap bg-white text-garden-dark/60 text-xs px-3 py-1.5 rounded-xl border border-garden-green/10 hover:bg-garden-cream transition-colors flex-shrink-0">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3">
          <input ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask a gardening question..."
            className="flex-1 bg-white rounded-2xl px-5 py-4 border border-garden-green/15 focus:outline-none focus:ring-2 focus:ring-garden-green/30 focus:border-garden-green/30 text-garden-dark placeholder:text-garden-dark/30 shadow-sm" />
          <button onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="btn-primary !rounded-2xl !px-6 disabled:opacity-50 disabled:cursor-not-allowed">
            Send 🌱
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Lock, ArrowLeft } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })
  }, [])

  return (
    <div ref={containerRef} className="relative min-h-screen bg-transparent overflow-hidden font-sans text-[#000]">

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        
        {/* Hero */}
        <div className="text-center max-w-4xl relative">
          
          {/* Action Burst Behind Title */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] min-w-[300px] min-h-[300px] bg-gray-200 action-burst z-[-1] opacity-60"></div>

          <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2 bg-gray-600 border-4 border-[#000] shadow-[4px_4px_0px_#000] mb-8 transform -rotate-3 text-white">
            <img src="/tvc_w.png" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain opacity-75" />
            <span className="font-bangers text-xl sm:text-2xl tracking-[0.1em]">SELL A THING • DISABLED</span>
          </div>

          {/* Title */}
          <h1 className="comic-title text-6xl sm:text-8xl md:text-9xl mb-8 transform rotate-2 text-gray-500" style={{ WebkitTextStroke: '4px #000', textShadow: '8px 8px 0px #000' }}>
            SELL A<br/>
            <span className="text-gray-400">THING</span>
          </h1>

          {/* Notice banner */}
          <div className="bg-[#ff3b30] text-white border-4 border-[#000] p-4 font-bangers text-xl sm:text-2xl shadow-[4px_4px_0px_#000] transform -rotate-1 max-w-lg mx-auto mb-6">
            ⚠️ THIS GAME IS CURRENTLY UNAVAILABLE
          </div>

          {/* Subtitle */}
          <div className="bg-white border-4 border-[#000] p-4 sm:p-6 shadow-[6px_6px_0px_#000] transform rotate-1 max-w-2xl mx-auto mb-10 text-gray-600">
            <p className="text-lg sm:text-2xl font-bold leading-relaxed">
              Market Mayhem is offline or has concluded. Check back later or return to the main portal to explore upcoming games!
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap justify-center gap-6">
            <div className="comic-btn bg-gray-400 text-gray-700 !py-4 sm:!py-5 !px-8 sm:!px-10 text-xl sm:!text-3xl border-gray-600 shadow-none transform-none flex items-center justify-center gap-3 cursor-not-allowed">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-gray-700" />
              <span>UNAVAILABLE</span>
            </div>

            <Link href="/" className="comic-btn bg-white hover:bg-gray-100 !py-4 sm:!py-5 !px-8 sm:!px-10 text-xl sm:!text-3xl flex items-center justify-center gap-3">
              <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" />
              <span>BACK TO PORTAL</span>
            </Link>

            {!loading && session && (
              <button onClick={async () => {
                const supabase = createBrowserSupabaseClient()
                await supabase.auth.signOut()
                window.location.reload()
              }} className="comic-btn bg-gray-200 hover:bg-gray-300 !py-4 sm:!py-5 !px-6 sm:!px-8 text-xl sm:!text-2xl">
                <span>LOGOUT</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

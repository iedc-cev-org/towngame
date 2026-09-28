import type { Metadata } from 'next'
import './amongus.css'

export const metadata: Metadata = {
  title: 'AMONG US IRL | IEDC CEV',
  description: 'Play Among Us in real life! A social deduction game where Crewmates complete tasks and Impostors sabotage.',
}

export default function AmongUsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="amongus-container min-h-screen bg-[#0b0d21] text-[#e8eaf6] relative">
      {children}
    </div>
  )
}

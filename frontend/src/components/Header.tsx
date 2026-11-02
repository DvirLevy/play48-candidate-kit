import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="bg-card/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
            <Sparkles className="size-4" />
          </span>
          Sprite Studio
        </Link>
        <Link to="/design-system" className="text-muted-foreground hover:text-foreground text-sm">
          Design system
        </Link>
      </div>
    </header>
  )
}

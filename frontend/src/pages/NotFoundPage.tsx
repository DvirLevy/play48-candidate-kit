import { Link } from 'react-router-dom'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <ErrorState
      title="Page not found"
      error={new Error("The page you're looking for doesn't exist.")}
      action={
        <Button asChild variant="outline">
          <Link to="/">Back to studio</Link>
        </Button>
      }
    />
  )
}

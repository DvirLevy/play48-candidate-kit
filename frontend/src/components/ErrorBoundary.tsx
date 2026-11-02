import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/ErrorState'

interface State {
  error: Error | null
}

/** Catches render errors anywhere below and shows the error page instead of a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return <ErrorState error={this.state.error} onRetry={() => this.setState({ error: null })} />
    }
    return this.props.children
  }
}

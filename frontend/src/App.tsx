import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Header } from '@/components/Header'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'

const DesignSystemPage = lazy(() => import('@/pages/DesignSystemPage'))

export default function App() {
  return (
    <>
      <Header />
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

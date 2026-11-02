import { http } from '@/api/client'
import { ApiError } from '@/api/errors'
import { generationSchema, manifestSchema, type Generation, type Manifest } from '@/api/types'

export async function createGeneration(prompt: string): Promise<Generation> {
  const { data } = await http.post('/generations', { prompt })
  return generationSchema.parse(data)
}

export async function getGeneration(id: string): Promise<Generation> {
  const { data } = await http.get(`/generations/${id}`)
  return generationSchema.parse(data)
}

/** Resolves to null when nothing has been generated yet (404). */
export async function getLatestGeneration(): Promise<Generation | null> {
  try {
    const { data } = await http.get('/generations/latest')
    return generationSchema.parse(data)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function fetchManifest(url: string): Promise<Manifest> {
  const { data } = await http.get(url)
  return manifestSchema.parse(data)
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(new ApiError('Failed to load the spritesheet image', 'ASSET_ERROR'))
    image.src = url
  })
}

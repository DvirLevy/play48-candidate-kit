import { useMutation } from '@tanstack/react-query'
import { createGeneration } from '@/api/generations'

export function useCreateGeneration() {
  return useMutation({ mutationFn: createGeneration })
}

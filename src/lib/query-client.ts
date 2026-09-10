import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const transitKeys = {
  all: ['transit'] as const,
  stats: () => [...transitKeys.all, 'stats'] as const,
  drivers: (query: unknown) => [...transitKeys.all, 'drivers', query] as const,
  driver: (id: string) => [...transitKeys.all, 'drivers', id] as const,
}

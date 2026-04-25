import { useRequest } from 'ahooks'
import { hc } from 'hono/client'
import type { AppType } from '../../server'

const client = hc<AppType>('/')

export function useTasks() {
  return useRequest(
    async () => {
      const res = await client.api.task.$get()
      const json = await res.json()
      if (json.success) {
        const tasks = json.data
        return tasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      } else {
        return []
      }
    },
    {
      cacheKey: 'global-tasks',
      staleTime: 5000,
      pollingInterval: 5000,
      onError: () => {
        console.error('Failed to fetch tasks')
      }
    }
  )
}

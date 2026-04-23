import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useGlobalStore } from '../store/global'
import { useTasks } from './useTasks'

export const GPT_IMAGE_RMB_RATIO = 1.4

export interface GPTImageQuotaResponse {
  id: number
  name: string
  quota: number
  unlimited_quota: boolean
  used_quota: number
}

interface QuotaStore {
  data: GPTImageQuotaResponse | null
  error: string | null
  loading: boolean
  lastApiKey: string | null
  fetchPromise: Promise<void> | null
  fetchQuota: (apiKey: string | null, force?: boolean) => Promise<void>
}

const useQuotaStore = create<QuotaStore>((set, get) => ({
  data: null,
  error: null,
  loading: false,
  lastApiKey: null,
  fetchPromise: null,
  fetchQuota: async (apiKey, force = false) => {
    if (!apiKey) {
      set({ data: null, error: null, lastApiKey: null })
      return
    }

    const state = get()
    if (
      !force &&
      state.lastApiKey === apiKey &&
      (state.data !== null || state.error !== null || state.loading)
    ) {
      return state.fetchPromise || Promise.resolve()
    }

    if (state.loading && state.lastApiKey === apiKey) {
      return state.fetchPromise || Promise.resolve()
    }

    const promise = (async () => {
      set({ loading: true, error: null, lastApiKey: apiKey })
      try {
        const response = await fetch('https://ai.t8star.cn/v1/token/quota', {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        })
        const data = await response.json()
        if (!response.ok || data.error) {
          throw new Error(data.error?.message || '获取余额失败')
        }
        set({ data, error: null, loading: false, fetchPromise: null })
      } catch (error: any) {
        console.error(error)
        set({ error: error.message, loading: false, fetchPromise: null })
      }
    })()

    set({ fetchPromise: promise })
    return promise
  }
}))

export function useGPTImageQuota() {
  const gptImageApiKey = useGlobalStore((state) => state.gptImageApiKey)
  const { data: tasks } = useTasks()
  const knownCompletedTasks = useRef<Set<string> | null>(null)

  const data = useQuotaStore((state) => state.data)
  const loading = useQuotaStore((state) => state.loading)
  const error = useQuotaStore((state) => state.error)
  const fetchQuota = useQuotaStore((state) => state.fetchQuota)

  useEffect(() => {
    fetchQuota(gptImageApiKey)
  }, [gptImageApiKey, fetchQuota])

  useEffect(() => {
    if (!tasks) return

    // 假设第一页任务数量为前 20 条
    const recentTasks = tasks.slice(0, 20)

    if (knownCompletedTasks.current === null) {
      // 初始化已完成任务集合
      knownCompletedTasks.current = new Set()
      for (const task of recentTasks) {
        if (task.status === 'completed') {
          knownCompletedTasks.current.add(task.id)
        }
      }
      return
    }

    let hasNewCompletedTask = false
    for (const task of recentTasks) {
      if (task.status === 'completed') {
        if (!knownCompletedTasks.current.has(task.id)) {
          hasNewCompletedTask = true
          knownCompletedTasks.current.add(task.id)
        }
      }
    }

    if (hasNewCompletedTask) {
      fetchQuota(gptImageApiKey, true)
    }
  }, [tasks, gptImageApiKey, fetchQuota])

  return {
    quota: data,
    loading,
    error,
    refresh: () => fetchQuota(gptImageApiKey, true)
  }
}

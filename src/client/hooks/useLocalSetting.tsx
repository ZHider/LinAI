import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GptImageQuality } from '../../server/module/gpt-image/enum'

export interface GPTImageSettings {
  enable1K: boolean
  enable2K: boolean
  enable4K: boolean
  quality: GptImageQuality
}

export const defaultGPTImageSettings: GPTImageSettings = {
  enable1K: true,
  enable2K: true,
  enable4K: false,
  quality: 'medium'
}

interface LocalSettingState {
  gptImageSettings: GPTImageSettings
  setGptImageSettings: (
    settings: GPTImageSettings | ((prev: GPTImageSettings) => GPTImageSettings)
  ) => void
}

const useLocalSettingStore = create<LocalSettingState>()(
  persist(
    (set) => ({
      gptImageSettings: defaultGPTImageSettings,
      setGptImageSettings: (settings) =>
        set((state) => ({
          gptImageSettings:
            typeof settings === 'function'
              ? settings(state.gptImageSettings)
              : settings
        }))
    }),
    {
      name: 'gpt-image-settings'
    }
  )
)

export function useLocalSetting() {
  const gptImageSettings = useLocalSettingStore((state) => state.gptImageSettings)
  const setGptImageSettings = useLocalSettingStore(
    (state) => state.setGptImageSettings
  )

  const mergedSettings = useMemo(
    () => ({ ...defaultGPTImageSettings, ...gptImageSettings }),
    [gptImageSettings]
  )

  return {
    gptImageSettings: mergedSettings,
    setGptImageSettings
  }
}

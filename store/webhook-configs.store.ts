'use client'

import { create } from 'zustand'
import type { WebhookConfig } from '@/lib/types'

const STORAGE_KEY = 'sc-webhook-configs'

interface WebhookConfigsStore {
  configs: Record<string, WebhookConfig>
  setConfig: (productId: string, config: WebhookConfig) => void
  getConfig: (productId: string) => WebhookConfig | null
  removeConfig: (productId: string) => void
  loadFromStorage: () => void
}

export const useWebhookConfigsStore = create<WebhookConfigsStore>((set, get) => ({
  configs: {},

  setConfig: (productId: string, config: WebhookConfig): void => {
    set((state) => {
      const next = { ...state.configs, [productId]: config }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
      return { configs: next }
    })
  },

  getConfig: (productId: string): WebhookConfig | null => {
    return get().configs[productId] ?? null
  },

  removeConfig: (productId: string): void => {
    set((state) => {
      const next = { ...state.configs }
      delete next[productId]
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
      return { configs: next }
    })
  },

  loadFromStorage: (): void => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, WebhookConfig>
        set({ configs: parsed })
      }
    } catch {
      /* ignore */
    }
  },
}))

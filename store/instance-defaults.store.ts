'use client'

import { create } from 'zustand'
import type { InstanceDefaultWebhook, InstanceDefaultProxy } from '@/lib/types'

const STORAGE_KEY_WEBHOOK = 'sc-inst-def-webhooks'
const STORAGE_KEY_PROXY = 'sc-inst-def-proxies'

// We use 'null' to indicate an explicit removal by the user.
// If the key doesn't exist, it hasn't been loaded or modified.
interface InstanceDefaultsStore {
  webhookConfigs: Record<string, InstanceDefaultWebhook | null>
  proxyConfigs: Record<string, InstanceDefaultProxy | null>
  
  setWebhookConfig: (productId: string, config: InstanceDefaultWebhook | null) => void
  getWebhookConfig: (productId: string) => InstanceDefaultWebhook | null | undefined
  removeWebhookConfigState: (productId: string) => void

  setProxyConfig: (productId: string, config: InstanceDefaultProxy | null) => void
  getProxyConfig: (productId: string) => InstanceDefaultProxy | null | undefined
  removeProxyConfigState: (productId: string) => void

  loadFromStorage: () => void
}

export const useInstanceDefaultsStore = create<InstanceDefaultsStore>((set, get) => ({
  webhookConfigs: {},
  proxyConfigs: {},

  setWebhookConfig: (productId: string, config: InstanceDefaultWebhook | null): void => {
    set((state) => {
      const next = { ...state.webhookConfigs, [productId]: config }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_WEBHOOK, JSON.stringify(next))
      }
      return { webhookConfigs: next }
    })
  },

  getWebhookConfig: (productId: string): InstanceDefaultWebhook | null | undefined => {
    return get().webhookConfigs[productId]
  },

  removeWebhookConfigState: (productId: string): void => {
    set((state) => {
      const next = { ...state.webhookConfigs }
      delete next[productId]
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_WEBHOOK, JSON.stringify(next))
      }
      return { webhookConfigs: next }
    })
  },

  setProxyConfig: (productId: string, config: InstanceDefaultProxy | null): void => {
    set((state) => {
      const next = { ...state.proxyConfigs, [productId]: config }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PROXY, JSON.stringify(next))
      }
      return { proxyConfigs: next }
    })
  },

  getProxyConfig: (productId: string): InstanceDefaultProxy | null | undefined => {
    return get().proxyConfigs[productId]
  },

  removeProxyConfigState: (productId: string): void => {
    set((state) => {
      const next = { ...state.proxyConfigs }
      delete next[productId]
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_PROXY, JSON.stringify(next))
      }
      return { proxyConfigs: next }
    })
  },

  loadFromStorage: (): void => {
    if (typeof window === 'undefined') return
    try {
      const rawW = localStorage.getItem(STORAGE_KEY_WEBHOOK)
      if (rawW) {
        const parsed = JSON.parse(rawW) as Record<string, InstanceDefaultWebhook | null>
        set({ webhookConfigs: parsed })
      }
      const rawP = localStorage.getItem(STORAGE_KEY_PROXY)
      if (rawP) {
        const parsed = JSON.parse(rawP) as Record<string, InstanceDefaultProxy | null>
        set({ proxyConfigs: parsed })
      }
    } catch {
      /* ignore */
    }
  },
}))

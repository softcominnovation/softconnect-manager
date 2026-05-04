'use client'

import { create } from 'zustand'
import { AES, enc } from 'crypto-js'

const STORAGE_KEY = 'sc-product-keys'
const CIPHER_SEED = 'sc-pk-v1'

function encrypt(value: string): string {
  return AES.encrypt(value, CIPHER_SEED).toString()
}

function decrypt(value: string): string {
  const bytes = AES.decrypt(value, CIPHER_SEED)
  return bytes.toString(enc.Utf8)
}

interface ProductKeysStore {
  keys: Record<string, string>
  setProductKey: (productId: string, plainApiKey: string) => void
  getEncryptedKey: (productId: string) => string | null
  hasKey: (productId: string) => boolean
  removeKey: (productId: string) => void
  loadFromStorage: () => void
}

export const useProductKeysStore = create<ProductKeysStore>((set, get) => ({
  keys: {},

  setProductKey: (productId: string, plainApiKey: string): void => {
    const encrypted = encrypt(plainApiKey)
    set((state) => {
      const next = { ...state.keys, [productId]: encrypted }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
      return { keys: next }
    })
  },

  getEncryptedKey: (productId: string): string | null => {
    const { keys } = get()
    return keys[productId] ?? null
  },

  hasKey: (productId: string): boolean => {
    return productId in get().keys
  },

  removeKey: (productId: string): void => {
    set((state) => {
      const next = { ...state.keys }
      delete next[productId]
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
      return { keys: next }
    })
  },

  loadFromStorage: (): void => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>
        set({ keys: parsed })
      }
    } catch {
      /* ignore */
    }
  },
}))

export function decryptProductKey(encryptedKey: string): string {
  return decrypt(encryptedKey)
}

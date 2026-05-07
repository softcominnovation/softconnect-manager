'use client'

import { useAuthStore } from '@/store/auth.store'

export function usePermissions() {
  const user = useAuthStore((s) => s.user)

  const isSuperAdmin = user?.type === 'super-admin'
  const isAdmin = user?.type === 'admin'
  const isUser = user?.type === 'user'
  const isAtLeastAdmin = isSuperAdmin || isAdmin

  function can(permission: 'manage:users' | 'view:users'): boolean {
    switch (permission) {
      case 'manage:users':
      case 'view:users':
        return isSuperAdmin
      default:
        return false
    }
  }

  return {
    user,
    isSuperAdmin,
    isAdmin,
    isUser,
    isAtLeastAdmin,
    can,
  }
}

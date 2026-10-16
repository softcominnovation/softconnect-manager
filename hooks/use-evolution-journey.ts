'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { useEvolutionChange, useEvolutionChanges, evolutionQueryRoots } from './use-evolutions'
import { evolutionsApi } from '@/lib/evolutions-api'
import {
  ChangeConsent,
  canPrepareCallback,
  isPendingChange,
  type EvolutionChange,
  type EvolutionDraft,
} from '@/lib/evolution-changes'

export function useEvolutionJourney(productId: string, supported: boolean) {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)
  const scope = `${userId}:${productId}`
  const [id, setId] = useState('')
  const [applyUncertain, setApplyUncertain] = useState(false)
  const history = useEvolutionChanges(productId, supported)
  const operation = useEvolutionChange(productId, id)
  const qc = useQueryClient()
  const alive = useRef(true)
  const consent = useRef(new ChangeConsent())
  const current = () => alive.current && !!token && useAuthStore.getState().token === token
  useEffect(() => {
    alive.current = true
    const intent = consent.current
    const leave = () => {
      if (document.visibilityState !== 'visible') intent.clear()
    }
    document.addEventListener('visibilitychange', leave)
    return () => {
      alive.current = false
      intent.clear()
      document.removeEventListener('visibilitychange', leave)
    }
  }, [])
  useEffect(() => {
    if (!id && history.data?.items[0]) setId(history.data.items[0].operationId)
  }, [id, history.data])
  const record = (row: EvolutionChange) => {
    if (!current()) return
    setId(row.operationId)
    qc.setQueryData(['evolution-change', userId, productId, row.operationId], row)
  }
  const invalidate = async () => {
    if (current())
      await Promise.all(evolutionQueryRoots.map((key) => qc.invalidateQueries({ queryKey: [key] })))
  }
  const prepare = useMutation({
    onMutate: () => {
      consent.current.clear()
      return { generation: consent.current.checkpoint() }
    },
    mutationFn: async (draft: EvolutionDraft) => {
      if (!current()) throw new Error('A sessão mudou. Reabra a configuração.')
      return evolutionsApi.prepareChange(token!, productId, draft)
    },
    retry: false,
    onSuccess: (row, _draft, context) => {
      if (current()) {
        if (document.visibilityState === 'visible')
          consent.current.authorize(row, scope, context?.generation)
        setApplyUncertain(false)
        record(row)
        void qc.invalidateQueries({ queryKey: ['evolution-changes'] })
      }
    },
  })
  const verify = async () => {
    const result = await operation.refetch()
    if (current() && !result.error) setApplyUncertain(false)
    return result
  }
  const apply = useMutation({
    mutationFn: async (row: EvolutionChange) => {
      if (!current()) throw new Error('A sessão mudou. Reabra a configuração.')
      consent.current.clear()
      return evolutionsApi.applyChange(token!, productId, row.operationId, row.revision)
    },
    retry: false,
    onSuccess: async (row) => {
      setApplyUncertain(false)
      record(row)
      await invalidate()
    },
    onError: () => {
      consent.current.clear()
      if (current()) {
        setApplyUncertain(true)
        void verify()
      }
    },
  })
  const cancel = useMutation({
    mutationFn: async (row: EvolutionChange) => {
      consent.current.clear()
      if (!current()) throw new Error('A sessão mudou.')
      return evolutionsApi.cancelChange(token!, productId, row.operationId, row.revision)
    },
    retry: false,
    onSuccess: record,
  })
  const callback = useMutation({
    mutationFn: async ({ row, instanceId }: { row: EvolutionChange; instanceId: string }) => {
      consent.current.clear()
      if (!current()) throw new Error('A sessão mudou.')
      if (
        !canPrepareCallback(row) ||
        !row.requiredActions.some(
          (action) =>
            action.code === 'confirm_instance_webhook' && action.instanceIds?.includes(instanceId)
        )
      )
        throw new Error(
          'Atualize a operação e escolha uma instância própria disponível para esta verificação.'
        )
      return evolutionsApi.callbackCheck(
        token!,
        productId,
        row.operationId,
        row.revision,
        instanceId
      )
    },
    retry: false,
    onSuccess: record,
  })
  const row = operation.data
  const mutateApply = apply.mutate
  useEffect(() => {
    if (
      row &&
      !apply.isPending &&
      consent.current.claim(row, scope, document.visibilityState === 'visible')
    )
      mutateApply(row)
  }, [row, scope, apply.isPending, mutateApply])
  // One final read at the deadline; the normal interval stops there even without an executor.
  const refresh = operation.refetch
  useEffect(() => {
    if (!row || !isPendingChange(row.status)) return
    const remaining = Date.parse(row.executionDeadline) - Date.now()
    if (remaining <= 0) return
    const timer = setTimeout(() => {
      if (alive.current) void refresh()
    }, remaining + 50)
    return () => clearTimeout(timer)
  }, [row?.operationId, row?.status, row?.executionDeadline, row, refresh])
  return {
    history,
    operation,
    prepare,
    apply,
    cancel,
    callback,
    applyUncertain,
    verify,
    busy: prepare.isPending || apply.isPending || cancel.isPending || callback.isPending,
    resume: (nextId: string) => {
      consent.current.clear()
      apply.reset()
      cancel.reset()
      callback.reset()
      setApplyUncertain(false)
      setId(nextId)
    },
    clearConsent: () => consent.current.clear(),
  }
}

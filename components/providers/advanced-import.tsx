'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useImportCandidates, useProductEvolutions } from '@/hooks/use-evolutions'
import { useImportInstancesBulk } from '@/hooks/use-instances'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { ImportBulkResult } from '@/lib/types'
import { Choice, Failure, Acknowledgement } from './shared'

function Selection({
  productId,
  providerId,
  onResult,
  onBusy,
}: {
  productId: string
  providerId: string
  onResult: (result: ImportBulkResult) => void
  onBusy: (busy: boolean) => void
}) {
  const candidates = useImportCandidates(productId, providerId)
  const mutation = useImportInstancesBulk(productId)
  const [selected, setSelected] = useState<string[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const ready = candidates.data?.inventoryStatus === 'ready'
  return (
    <div className="space-y-3">
      <Failure
        error={candidates.error || mutation.error}
        onReload={() => {
          setSelected([])
          setConfirmed(false)
          void candidates.refetch()
        }}
      />
      {candidates.isLoading && <p role="status">Carregando candidatos…</p>}
      {candidates.data && (
        <>
          <p className="text-sm text-muted-foreground">
            Inventário:{' '}
            {candidates.data.asOf
              ? new Date(candidates.data.asOf).toLocaleString('pt-BR')
              : 'Sem data'}{' '}
            · {candidates.data.conflictCount} conflito(s).
          </p>
          {!ready && (
            <p className="text-sm">
              Inventário sem confirmação atual.{' '}
              <Link className="text-primary underline" href={`/providers/${providerId}`}>
                Atualize o inventário do provider
              </Link>{' '}
              e consulte novamente antes de importar.
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={candidates.isFetching || mutation.isPending}
            onClick={() => {
              setSelected([])
              setConfirmed(false)
              void candidates.refetch()
            }}
          >
            Consultar candidatos
          </Button>
          <div className="max-h-64 space-y-2 overflow-auto">
            {candidates.data.items.length === 0 && (
              <p className="text-sm">Nenhuma instância disponível para importação.</p>
            )}
            {candidates.data.items.map((item) => (
              <label
                key={item.providerInstanceId}
                className="flex items-start gap-2 rounded border p-2 text-sm"
              >
                <input
                  type="checkbox"
                  disabled={!ready || mutation.isPending || item.ownership === 'own'}
                  checked={selected.includes(item.providerInstanceId)}
                  onChange={(e) => {
                    setConfirmed(false)
                    setSelected((ids) =>
                      e.target.checked
                        ? [...ids, item.providerInstanceId]
                        : ids.filter((id) => id !== item.providerInstanceId)
                    )
                  }}
                />
                <span className="break-all">
                  {item.instanceName}
                  {item.ownership === 'own' ? ' · Já vinculada a este produto' : ''}
                </span>
              </label>
            ))}
          </div>
          <Acknowledgement checked={confirmed} onChange={setConfirmed}>
            Confirmo a importação das {selected.length} instância(s) selecionadas, da Evolution
            escolhida. Não haverá migração.
          </Acknowledgement>
          <Button
            disabled={!ready || !selected.length || !confirmed || mutation.isPending}
            onClick={() => {
              onBusy(true)
              mutation.mutate(
                { vpsProviderId: providerId, instanceIds: selected },
                { onSuccess: onResult, onSettled: () => onBusy(false) }
              )
            }}
          >
            {mutation.isPending ? 'Importando…' : 'Importar selecionadas'}
          </Button>
        </>
      )}
    </div>
  )
}

export function AdvancedImport({
  productId,
  onResult,
}: {
  productId: string
  onResult: (result: ImportBulkResult) => void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [providerId, setProviderId] = useState('')
  const links = useProductEvolutions(open ? productId : '')
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Importação por Evolution
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importação opcional por Evolution</DialogTitle>
            <DialogDescription>
              Escolha uma instalação vinculada e as instâncias disponíveis. A importação atual pelo
              provider padrão continua disponível.
            </DialogDescription>
          </DialogHeader>
          <Failure error={links.error} onReload={() => void links.refetch()} />
          <Choice
            label="Evolution de origem"
            disabled={busy}
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          >
            <option value="">Selecione uma Evolution</option>
            {links.data?.map(({ evolution }) => (
              <option key={evolution.id} value={evolution.id}>
                {evolution.label}
              </option>
            ))}
          </Choice>
          {providerId && (
            <Selection
              key={providerId}
              productId={productId}
              providerId={providerId}
              onBusy={setBusy}
              onResult={(result) => {
                onResult(result)
                setOpen(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

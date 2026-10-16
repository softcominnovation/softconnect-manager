'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth.store'
import { useEvolutionMutation } from '@/hooks/use-evolutions'
import { evolutionsApi } from '@/lib/evolutions-api'
import type { Evolution } from '@/lib/evolutions'
import { apiUnavailable, type EvolutionRemoval } from '@/lib/evolution-changes'
import { Failure } from './shared'

const usageLabels: Record<string, string> = {
  instances: 'Instâncias, incluindo desconectadas',
  pending: 'Criações pendentes',
  defaults: 'Produtos que usam como padrão',
  links: 'Vínculos com produtos',
  inventory: 'Itens no inventário remoto',
  callbacks: 'Entregas de eventos pendentes',
  reconciliation: 'Consultas de inventário em andamento',
}

export function EvolutionRetirement({
  provider,
  onPause,
}: {
  provider: Evolution
  onPause: () => void
}) {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)
  const [open, setOpen] = useState(false)
  const query = useQuery({
    queryKey: ['evolution-removal', userId, provider.id],
    queryFn: () => evolutionsApi.removal(token!, provider.id),
    enabled: !!token && open,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })
  const retire = useEvolutionMutation((jwt, state: EvolutionRemoval) =>
    evolutionsApi.retire(jwt, provider.id, state.revision, state.inventoryRevision)
  )
  const state = query.data
  return (
    <>
      <Button
        variant="destructive"
        onClick={() => {
          retire.reset()
          setOpen(true)
        }}
      >
        Desativar cadastro
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!retire.isPending) setOpen(value)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Verificar retirada de {provider.label}</DialogTitle>
            <DialogDescription>
              Desativação global para todos os produtos. Mantém o cadastro e seu histórico; não
              desliga a Evolution nem a VPS. A API só permite a retirada sem uso ou pendências.
            </DialogDescription>
          </DialogHeader>
          {query.isFetching && <p role="status">Conferindo uso e inventário…</p>}
          {apiUnavailable(query.error) ? (
            <p role="alert">
              A API precisa disponibilizar a retirada segura. Nenhuma desativação foi enviada. Os
              cadastros antigos continuam acessíveis.
            </p>
          ) : (
            <Failure error={query.error} />
          )}
          {state && (
            <div className="space-y-3 text-sm">
              <p>
                {state.removable
                  ? 'Sem impedimentos na última verificação. A API confere novamente ao confirmar.'
                  : 'Ainda não é possível desativar este cadastro.'}
              </p>
              <ul className="space-y-1">
                {Object.entries(state.usage).map(([name, count]) => (
                  <li key={name}>
                    {usageLabels[name] ?? 'Outras referências'}: {count}
                  </li>
                ))}
              </ul>
              <p>
                Inventário:{' '}
                {state.inventoryObservedAt
                  ? new Date(state.inventoryObservedAt).toLocaleString('pt-BR')
                  : 'sem confirmação recente'}
                .
              </p>
              {state.blockers.includes('inventory_unconfirmed') && (
                <p>
                  Atualize o inventário no quadro “Ocupação e prontidão” e consulte novamente.
                  Instalações remotas desconhecidas também impedem a retirada.
                </p>
              )}
              <p>Produtos vinculados:</p>
              <ul className="space-y-1">
                {provider.links.map((link) => (
                  <li key={link.productId}>
                    <Link
                      className="text-primary underline"
                      href={`/products/${encodeURIComponent(link.productId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.product.name}
                    </Link>
                    :{' '}
                    {state.instancesByProduct.find((p) => p.productId === link.productId)?._count
                      ._all ?? 0}{' '}
                    instâncias. Revise o padrão e os vínculos na tela do produto.
                  </li>
                ))}
              </ul>
              {state.instancesByProduct
                .filter((p) => !provider.links.some((l) => l.productId === p.productId))
                .map((p) => (
                  <p key={p.productId}>
                    <Link
                      className="text-primary underline"
                      href={`/products/${encodeURIComponent(p.productId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Revisar produto com {p._count._all} instâncias
                    </Link>
                  </p>
                ))}
              {!state.removable && provider.acceptingNewInstances && (
                <Button
                  variant="outline"
                  className="h-auto min-h-10 whitespace-normal"
                  onClick={() => {
                    setOpen(false)
                    onPause()
                  }}
                >
                  Parar novas criações para todos os produtos
                </Button>
              )}
            </div>
          )}
          <Failure error={retire.error} />
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={retire.isPending} onClick={() => setOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="outline"
              disabled={query.isFetching || retire.isPending}
              onClick={() => {
                retire.reset()
                void query.refetch()
              }}
            >
              Consultar novamente
            </Button>
            <Button
              variant="destructive"
              disabled={!state?.removable || query.isFetching || !!query.error || retire.isPending}
              onClick={() => {
                if (state)
                  retire.mutate(state, {
                    onSuccess: () => {
                      setOpen(false)
                      toast.success('Cadastro desativado. O histórico foi preservado.')
                    },
                  })
              }}
            >
              {retire.isPending ? 'Desativando…' : 'Confirmar desativação global'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

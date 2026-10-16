'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ProviderForm } from '@/components/providers/provider-form'
import { Panel, Failure } from '@/components/providers/shared'
import { useEvolutionMutation } from '@/hooks/use-evolutions'
import { useVpsList } from '@/hooks/use-vps'
import { evolutionsApi } from '@/lib/evolutions-api'
import type { CreateEvolution } from '@/lib/evolutions'

export default function NewProviderPage() {
  const router = useRouter()
  const vps = useVpsList()
  const create = useEvolutionMutation((token, dto: CreateEvolution) =>
    evolutionsApi.create(token, dto)
  )
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/providers" className="text-sm text-primary underline">
        Voltar aos providers
      </Link>
      <h1 className="text-2xl font-semibold">Cadastrar provider</h1>
      <p className="text-sm text-muted-foreground">
        Cadastre uma instalação Evolution em uma VPS existente. Vínculos, limite e distribuição são
        opcionais e configurados depois.
      </p>
      <Failure error={vps.error} onReload={() => void vps.refetch()} />
      {vps.isLoading ? (
        <p role="status">Carregando VPS…</p>
      ) : (
        <Panel title="Instalação Evolution">
          <ProviderForm
            initial={{ label: '', providerUrl: '', vpsId: '', adapterType: 'evolution' }}
            vpsOptions={vps.data?.filter((item) => item.isActive) ?? []}
            pending={create.isPending}
            error={create.error}
            onCancel={() => router.push('/providers')}
            onSubmit={(values) =>
              create.mutate(
                { ...values, adapterType: 'evolution' },
                {
                  onSuccess: (data) => {
                    toast.success('Provider cadastrado')
                    router.push(`/providers/${data.id}`)
                  },
                }
              )
            }
          />
        </Panel>
      )}
    </div>
  )
}

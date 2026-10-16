'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEvolutionSetup, useEvolutionMutation } from '@/hooks/use-evolutions'
import { evolutionsApi } from '@/lib/evolutions-api'
import { apiUnavailable } from '@/lib/evolution-changes'
import { useAuthStore } from '@/store/auth.store'
import { Panel, Failure, Acknowledgement } from './shared'

export function EvolutionEnvironment() {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)
  return <EnvironmentForm key={`${userId}:${token}`} />
}
function EnvironmentForm() {
  const query = useEvolutionSetup()
  const [confirmed, setConfirmed] = useState(false)
  const save = useEvolutionMutation((token, revision: number) =>
    evolutionsApi.confirmSetup(token, revision)
  )
  return (
    <div className="space-y-6">
      <Link className="text-primary underline" href="/providers">
        Voltar aos providers
      </Link>
      <h1 className="text-2xl font-semibold">Preparação do ambiente</h1>
      <p className="text-sm text-muted-foreground">
        Esta preparação é feita pelo responsável pelo ambiente. Depois, os produtos podem verificar
        e ativar sua distribuição na própria tela.
      </p>
      {apiUnavailable(query.error) ? (
        <p role="alert">
          Atualize a API para disponibilizar a preparação guiada. Os cadastros atuais continuam
          acessíveis.
        </p>
      ) : (
        <Failure error={query.error} onReload={() => void query.refetch()} />
      )}
      {query.isPending && <p role="status">Consultando ambiente…</p>}
      {query.data && (
        <Panel title="Situação do ambiente">
          <ul className="space-y-2 text-sm">
            <li>
              Distribuição na API:{' '}
              {query.data.distributionEnabled ? 'habilitada' : 'ainda não habilitada'}
            </li>
            <li>
              Banco de dados:{' '}
              {query.data.databaseConsolidated ? 'preparação concluída' : 'preparação pendente'}
            </li>
            <li>
              Compatibilidade dos serviços:{' '}
              {query.data.confirmationRequired
                ? 'aguardando confirmação do responsável'
                : 'confirmada'}
            </li>
          </ul>
          {(!query.data.distributionEnabled || !query.data.databaseConsolidated) && (
            <p className="text-sm">
              Solicite ao responsável a preparação do ambiente da API. Esta tela não altera a
              infraestrutura e os produtos no modo padrão continuam funcionando.
            </p>
          )}
          {query.data.confirmation && (
            <p className="text-sm text-muted-foreground">
              Registrada em {new Date(query.data.confirmation.confirmedAt).toLocaleString('pt-BR')}{' '}
              por {query.data.confirmation.actor}.
            </p>
          )}
          {query.data.confirmationRequired && (
            <>
              <Acknowledgement checked={confirmed} onChange={setConfirmed}>
                Sou responsável pelo ambiente e confirmei que todas as réplicas da API e os workers
                foram atualizados para a versão compatível. Esta declaração não é uma verificação
                automática dos serviços.
              </Acknowledgement>
              <Failure
                error={save.error}
                onReload={() => {
                  setConfirmed(false)
                  save.reset()
                  void query.refetch()
                }}
              />
              <Button
                disabled={!confirmed || !query.data.databaseConsolidated || save.isPending}
                onClick={() =>
                  save.mutate(query.data!.revision, { onSuccess: () => setConfirmed(false) })
                }
              >
                {save.isPending ? 'Registrando…' : 'Registrar confirmação do ambiente'}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Atualizar situação
          </Button>
        </Panel>
      )}
    </div>
  )
}

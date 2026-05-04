'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  MessageCircle,
  Trash2,
  Wifi,
  WifiOff,
  Loader2,
  Send,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useInstance,
  useInstanceStatus,
  useSendPresence,
  useSendTestMessage,
  useDeleteInstance,
} from '@/hooks/use-instances'
import type { SendTestMessageDto } from '@/lib/types'

const testMessageSchema = z.object({
  number: z
    .string()
    .min(10, 'Informe um numero valido com DDI (ex: 5511999999999)')
    .regex(/^\d+$/, 'Apenas digitos, sem + ou espacos'),
  text: z.string().min(1, 'A mensagem nao pode ser vazia'),
})

function StatusBadge({ status }: { status: 'open' | 'close' | 'connecting' }) {
  const map = {
    open: {
      label: 'Conectado',
      icon: <Wifi className="h-4 w-4" />,
      className: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    },
    connecting: {
      label: 'Conectando',
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      className: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    close: {
      label: 'Desconectado',
      icon: <WifiOff className="h-4 w-4" />,
      className: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    },
  } as const
  const cfg = map[status] ?? map.close
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? ''}</span>
    </div>
  )
}

function TestPanel({ productId, instanceId }: { productId: string; instanceId: string }) {
  const [presenceResult, setPresenceResult] = useState<'ok' | 'corrupted' | null>(null)
  const { mutate: sendPresence, isPending: testingPresence } = useSendPresence(productId, instanceId)
  const { mutate: sendMessage, isPending: sendingMessage } = useSendTestMessage(productId, instanceId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SendTestMessageDto>({
    resolver: zodResolver(testMessageSchema),
    defaultValues: { text: 'Mensagem de teste  Softconnect Manager' },
  })

  function handleSendPresence() {
    setPresenceResult(null)
    sendPresence(undefined, {
      onSuccess: () => setPresenceResult('ok'),
      onError: () => setPresenceResult('corrupted'),
    })
  }

  function onSubmit(data: SendTestMessageDto) {
    sendMessage(data)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          Testes de Conectividade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Verificar Conexao (Send Presence)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Envia um sinal de presenca pelo WebSocket para confirmar que a conexao esta ativa.
                Se retornar erro ou connection closed, a instancia pode estar corrompida.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSendPresence}
              disabled={testingPresence}
              className="shrink-0 gap-1.5"
            >
              {testingPresence
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Activity className="h-3.5 w-3.5" />
              }
              Testar
            </Button>
          </div>

          {presenceResult === 'ok' && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Conexao saudavel  WebSocket ativo e respondendo.
            </div>
          )}

          {presenceResult === 'corrupted' && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Instancia corrompida</p>
                <p className="text-xs mt-0.5 text-destructive/80">
                  A instancia aparece como conectada, mas o WebSocket retornou erro ou conexao fechada.
                  Recomenda-se deletar e recriar a instancia.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t" />

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Enviar Mensagem de Teste</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Envia uma mensagem para um numero para validar o fluxo de envio.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="number" className="text-xs">
                Numero destino <span className="text-muted-foreground">(com DDI, sem + ou espacos)</span>
              </Label>
              <Input
                id="number"
                placeholder="5511999999999"
                className="h-8 text-sm"
                {...register('number')}
              />
              {errors.number && (
                <p className="text-xs text-destructive">{errors.number.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="text" className="text-xs">Mensagem</Label>
              <Textarea
                id="text"
                rows={2}
                className="text-sm resize-none"
                {...register('text')}
              />
              {errors.text && (
                <p className="text-xs text-destructive">{errors.text.message}</p>
              )}
            </div>
            <Button type="submit" size="sm" className="w-full gap-2" disabled={sendingMessage}>
              {sendingMessage
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
              {sendingMessage ? 'Enviando' : 'Enviar'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

export default function InstanceDetailPage({ params }: { params: { instanceId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get('productId') ?? ''

  const { data: instance, isLoading } = useInstance(productId, params.instanceId)
  const { data: status } = useInstanceStatus(productId, params.instanceId, {
    refetchInterval: 10_000,
  })

  const { mutate: deleteInst, isPending: deleting } = useDeleteInstance(productId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const currentStatus = status?.status ?? instance?.status

  function handleDelete() {
    deleteInst(params.instanceId, {
      onSuccess: () => router.push('/instances'),
    })
    setConfirmDelete(false)
  }

  if (!productId) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/instances')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <p className="text-destructive">
          productId nao fornecido na URL. Acesse esta pagina a partir da lista de instancias.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/instances')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <MessageCircle className="h-5 w-5 text-primary" />
          {isLoading ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-bold font-mono leading-none">{params.instanceId}</h1>
              {currentStatus && <StatusBadge status={currentStatus} />}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive hover:text-destructive self-start"
          disabled={deleting}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
          Deletar instancia
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4 text-primary" />
              Informacoes da Instancia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 text-sm">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full mb-2" />
              ))
            ) : (
              <>
                <Row
                  label="Instance ID"
                  value={<span className="font-mono text-xs">{instance?.instanceId}</span>}
                />
                <Row label="Perfil" value={instance?.profileName} />
                <Row
                  label="JID"
                  value={instance?.ownerJid
                    ? <span className="font-mono text-xs">{instance.ownerJid}</span>
                    : undefined
                  }
                />
                <Row
                  label="Status"
                  value={currentStatus ? <StatusBadge status={currentStatus} /> : undefined}
                />
                <Row
                  label="Criado em"
                  value={instance?.createdAt
                    ? new Date(instance.createdAt).toLocaleDateString('pt-BR', { dateStyle: 'long' })
                    : undefined
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        {!isLoading && currentStatus === 'open' && (
          <TestPanel productId={productId} instanceId={params.instanceId} />
        )}

        {!isLoading && currentStatus !== 'open' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                Instancia nao conectada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                As acoes de teste ficam disponiveis apenas quando a instancia esta com status{' '}
                <strong className="text-foreground">Conectado</strong>.
                A conexao e realizada pelo produto ou cliente que consome esta instancia.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar instancia?</AlertDialogTitle>
            <AlertDialogDescription>
              A instancia <strong>{params.instanceId}</strong> sera removida permanentemente.
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

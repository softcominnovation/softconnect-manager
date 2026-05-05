'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
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
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Search,
  Smartphone,
  User,
  Download,
  Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useInstanceList,
  useHubInstanceMap,
  useCreateInstance,
  useDeleteInstance,
  useImportInstance,
  useImportInstancesBulk,
  useSendPresence,
  useSendTestMessage,
} from '@/hooks/use-instances'
import { useProductList, useRotateProductKey } from '@/hooks/use-products'
import { useProductKeysStore } from '@/store/product-keys.store'
import {
  createInstanceSchema,
  type CreateInstanceFormData,
} from '@/lib/schemas/instance.schema'
import type { AdminInstance, HubInstanceDto, ImportInstanceDto, ImportBulkResult, SendTestMessageDto } from '@/lib/types'

const testMessageSchema = z.object({
  number: z
    .string()
    .min(10, 'Informe um numero valido com DDI (ex: 5511999999999)')
    .regex(/^\d+$/, 'Apenas digitos, sem + ou espacos'),
  text: z.string().min(1, 'A mensagem nao pode ser vazia'),
})

function StatusBadge({ status }: { status: string }) {
  const map = {
    open: {
      label: 'Conectado',
      icon: <Wifi className="h-3 w-3" />,
      className: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    },
    connecting: {
      label: 'Conectando',
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      className: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    close: {
      label: 'Desconectado',
      icon: <WifiOff className="h-3 w-3" />,
      className: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    },
    disconnected: {
      label: 'Desconectado',
      icon: <WifiOff className="h-3 w-3" />,
      className: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    },
  } as const
  const cfg = map[status as keyof typeof map] ?? map.close
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b last:border-0">
      <span className="text-muted-foreground text-sm shrink-0">{label}</span>
      <span className="text-sm font-medium text-right break-all">{value ?? <span className="text-muted-foreground">—</span>}</span>
    </div>
  )
}

const presenceSchema = z.object({
  number: z
    .string()
    .min(10, 'Informe um numero com DDI (ex: 5511999999999)')
    .regex(/^\d+$/, 'Apenas digitos, sem + ou espacos')
    .refine((v) => v.length >= 12, 'Inclua o DDI do pais (ex: 55 para Brasil)'),
})
type PresenceFormData = z.infer<typeof presenceSchema>

function TestPanel({ productId, instanceId }: { productId: string; instanceId: string }) {
  const [presenceResult, setPresenceResult] = useState<'ok' | 'error' | null>(null)
  const [messageResult, setMessageResult] = useState<'ok' | 'error' | null>(null)
  const [presenceDelay, setPresenceDelay] = useState(1200)
  const { mutate: sendPresence, isPending: testingPresence } = useSendPresence(productId, instanceId)
  const { mutate: sendMessage, isPending: sendingMessage } = useSendTestMessage(productId, instanceId)

  const {
    register: registerPresence,
    handleSubmit: handleSubmitPresence,
    formState: { errors: presenceErrors },
  } = useForm<PresenceFormData>({
    resolver: zodResolver(presenceSchema),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SendTestMessageDto>({
    resolver: zodResolver(testMessageSchema),
    defaultValues: { text: 'Mensagem de teste Softconnect Manager' },
  })

  function onSubmitPresence(data: PresenceFormData) {
    setPresenceResult(null)
    sendPresence(
      { number: data.number, presence: 'composing', delay: presenceDelay },
      {
        onSuccess: () => setPresenceResult('ok'),
        onError: () => setPresenceResult('error'),
      },
    )
  }

  function onSubmit(data: SendTestMessageDto) {
    setMessageResult(null)
    sendMessage(data, {
      onSuccess: () => setMessageResult('ok'),
      onError: () => setMessageResult('error'),
    })
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
          <div>
            <p className="text-sm font-medium">Verificar Conexao (Send Presence)</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Envia um sinal de presenca para confirmar que a conexao esta ativa.
            </p>
          </div>
          <form onSubmit={handleSubmitPresence(onSubmitPresence)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="presence-number" className="text-xs">
                Numero destino{' '}
                <span className="text-muted-foreground">(com DDI, ex: 5511999999999)</span>
              </Label>
              <Input
                id="presence-number"
                placeholder="5511999999999"
                className="h-8 text-sm"
                {...registerPresence('number')}
              />
              {presenceErrors.number && (
                <p className="text-xs text-destructive">{presenceErrors.number.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Delay (ms){' '}
                <span className="text-muted-foreground">— tempo de digitacao simulado</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setPresenceDelay((v) => Math.max(0, v - 100))}
                >
                  −
                </Button>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={presenceDelay}
                  onChange={(e) => setPresenceDelay(Number(e.target.value))}
                  className="h-8 text-sm text-center"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setPresenceDelay((v) => v + 100)}
                >
                  +
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={testingPresence}
              className="w-full gap-1.5"
            >
              {testingPresence ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Activity className="h-3.5 w-3.5" />
              )}
              Testar Presence
            </Button>
          </form>

          {presenceResult === 'ok' && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Conexao saudavel — WebSocket ativo e respondendo.
            </div>
          )}

          {presenceResult === 'error' && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Erro ao verificar conexao</p>
                <p className="text-xs mt-0.5 text-destructive/80">
                  O WebSocket retornou erro. Verifique se a instancia esta conectada.
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
              Envia uma mensagem para validar o fluxo de envio.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="number" className="text-xs">
                Numero destino{' '}
                <span className="text-muted-foreground">(com DDI, sem + ou espacos)</span>
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
              <Label htmlFor="text" className="text-xs">
                Mensagem
              </Label>
              <Textarea id="text" rows={2} className="text-sm resize-none" {...register('text')} />
              {errors.text && <p className="text-xs text-destructive">{errors.text.message}</p>}
            </div>
            <Button type="submit" size="sm" className="w-full gap-2" disabled={sendingMessage}>
              {sendingMessage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sendingMessage ? 'Enviando' : 'Enviar'}
            </Button>
          </form>

          {messageResult === 'ok' && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Mensagem enviada com sucesso — fluxo de envio funcionando.
            </div>
          )}

          {messageResult === 'error' && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Erro ao enviar mensagem</p>
                <p className="text-xs mt-0.5 text-destructive/80">
                  O envio retornou erro. Verifique se a instancia esta conectada.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ApiKeyPanel({ productId }: { productId: string }) {
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [newKeyModal, setNewKeyModal] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  const savedKey = useProductKeysStore((s) => s.getPlainKey(productId))
  const { setProductKey } = useProductKeysStore()
  const { mutate: rotateKey, isPending: rotating } = useRotateProductKey(productId)

  const maskedKey = savedKey ? `${savedKey.slice(0, 8)}...${savedKey.slice(-8)}` : null

  function handleConfirmRotate() {
    rotateKey(undefined, {
      onSuccess: (data) => {
        const key = data.apiKey
        setProductKey(productId, key)
        setNewKey(key)
        setNewKeyModal(true)
        setConfirmRotate(false)
        setShowKey(false)
      },
    })
  }

  function handleCopyKey(key: string) {
    navigator.clipboard.writeText(key)
    toast.success('API Key copiada para a area de transferencia')
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" />
            API Key do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {maskedKey ? (
              <span className="font-mono text-sm text-muted-foreground">{maskedKey}</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                <KeyRound className="h-3 w-3" />
                Key nao disponivel nesta sessao
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Use este botao quando o cliente perder a chave e precisar de uma nova. A chave atual sera
            invalidada imediatamente.
          </p>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            disabled={rotating}
            onClick={() => setConfirmRotate(true)}
          >
            {rotating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            {rotating ? 'Gerando...' : 'Rotacionar API Key'}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmRotate} onOpenChange={setConfirmRotate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotacionar API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>Atencao:</strong> a chave atual sera invalidada imediatamente. Qualquer cliente
              usando a chave antiga perdera acesso ao produto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmRotate}
            >
              Confirmar e invalidar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={newKeyModal}
        onOpenChange={(o) => {
          if (!o) {
            setNewKeyModal(false)
            setNewKey(null)
            setShowKey(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Nova API Key gerada
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm break-all flex-1">
                  {showKey ? newKey : newKey?.replace(/./g, '•')}
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Ocultar' : 'Mostrar'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                size="sm"
                className="w-full gap-2"
                onClick={() => newKey && handleCopyKey(newKey)}
              >
                <Copy className="h-4 w-4" />
                Copiar chave
              </Button>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-yellow-400/40 bg-yellow-50 dark:bg-yellow-900/10 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Esta chave nao sera exibida novamente apos fechar este dialogo. Copie agora e
                entregue ao cliente.
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setNewKeyModal(false)
                setNewKey(null)
                setShowKey(false)
              }}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function InstanceDetailModal({
  instance,
  productId,
  open,
  onClose,
  onDeleted,
}: {
  instance: AdminInstance
  productId: string
  open: boolean
  onClose: () => void
  onDeleted: () => void
}) {
  const { mutate: deleteInst, isPending: deleting } = useDeleteInstance(productId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete() {
    deleteInst(instance.id, {
      onSuccess: () => {
        setConfirmDelete(false)
        onDeleted()
      },
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-6">
              <div className="flex items-center gap-2 min-w-0">
                <MessageCircle className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <DialogTitle className="font-mono text-base truncate">
                    {instance.name}
                  </DialogTitle>
                  <div className="mt-1">
                    <StatusBadge status={instance.connectionStatus} />
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-destructive hover:text-destructive shrink-0"
                disabled={deleting}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Deletar
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Informacoes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 text-sm">
                <Row label="ID" value={<span className="font-mono text-xs">{instance.id}</span>} />
                <Row label="Nome" value={instance.name} />
                <Row label="Perfil" value={instance.profileName} />
                <Row label="Numero" value={instance.number} />
                <Row
                  label="JID"
                  value={
                    instance.ownerJid ? (
                      <span className="font-mono text-xs">{instance.ownerJid}</span>
                    ) : undefined
                  }
                />
                <Row label="Integracao" value={instance.integration} />
                <Row
                  label="Criado em"
                  value={new Date(instance.createdAt).toLocaleDateString('pt-BR', {
                    dateStyle: 'long',
                  })}
                />
              </CardContent>
            </Card>

            <TestPanel productId={productId} instanceId={instance.id} />

            <ApiKeyPanel productId={productId} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar instancia?</AlertDialogTitle>
            <AlertDialogDescription>
              A instancia <strong>{instance.name}</strong> sera removida permanentemente. Esta acao
              nao pode ser desfeita.
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
    </>
  )
}

function InstanceCard({
  instance,
  isLinked,
  onClick,
  onImport,
}: {
  instance: AdminInstance
  isLinked: boolean
  onClick: () => void
  onImport?: () => void
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm"
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0 flex-1">
            <p className="font-medium text-sm truncate font-mono">{instance.name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={instance.connectionStatus} />
              {isLinked ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Vinculada
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  <AlertCircle className="h-2.5 w-2.5" />
                  Nao vinculada
                </span>
              )}
            </div>
            {instance.number && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Smartphone className="h-3 w-3 shrink-0" />
                {instance.number}
              </div>
            )}
            {instance.profileName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3 shrink-0" />
                {instance.profileName}
              </div>
            )}
            {/* {!isLinked && onImport && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs mt-1 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  onImport()
                }}
              >
                <Link2 className="h-3.5 w-3.5" />
                Vincular ao Hub
              </Button>
            )} */}
          </div>
          {instance.profilePicUrl && (
            <img
              src={instance.profilePicUrl}
              alt={instance.profileName ?? instance.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 border"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getHubEntry(inst: AdminInstance, map: Map<string, HubInstanceDto>) {
  return (
    map.get(inst.name) ??
    (inst.providerInstanceId ? map.get(inst.providerInstanceId) : undefined) ??
    (inst.id ? map.get(inst.id) : undefined)
  )
}

export default function ProductInstancesPage({ params }: { params: { productId: string } }) {
  const router = useRouter()
  const { productId } = params

  const { data: products } = useProductList()
  const { data: instances, isLoading } = useInstanceList(productId)

  // Request paralela e independente: busca instâncias registradas no hub
  // para resolver Hub UUID ao clicar em qualquer instância
  const hubInstanceMap = useHubInstanceMap(productId)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedInstance, setSelectedInstance] = useState<AdminInstance | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [bulkResult, setBulkResult] = useState<ImportBulkResult | null>(null)
  const [instanceToImport, setInstanceToImport] = useState<AdminInstance | null>(null)

  const { mutate: createInstance, isPending } = useCreateInstance(productId)
  const { mutate: importInstance, isPending: importing } = useImportInstance(productId)
  const { mutate: importBulk, isPending: importingBulk } = useImportInstancesBulk(productId)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateInstanceFormData>({
    resolver: zodResolver(createInstanceSchema),
    defaultValues: { integration: 'WHATSAPP-BAILEYS' },
  })

  const product = products?.find((p) => p.id === productId)

  function handleInstanceClick(inst: AdminInstance) {
    const hubEntry =
      hubInstanceMap.get(inst.name) ??
      (inst.providerInstanceId ? hubInstanceMap.get(inst.providerInstanceId) : undefined) ??
      (inst.id ? hubInstanceMap.get(inst.id) : undefined)

    if (!hubEntry) {
      toast.error(
        'Esta instancia ainda nao possui registro no Hub. Vincule ou recrie-a pelo dashboard para habilitar o gerenciamento.',
        { duration: 5000 },
      )
      return
    }

    setSelectedInstance({ ...inst, id: hubEntry.id })
  }

  const filteredInstances = useMemo(() => {
    const list = instances ?? []
    return list.filter((inst) => {
      const matchSearch =
        !search ||
        inst.name.toLowerCase().includes(search.toLowerCase()) ||
        (inst.number ?? '').includes(search) ||
        (inst.profileName ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'connected'
          ? inst.connectionStatus === 'open'
          : inst.connectionStatus !== 'open')
      return matchSearch && matchStatus
    })
  }, [instances, search, filterStatus])

  function onSubmit(data: CreateInstanceFormData) {
    createInstance(
      { instanceName: data.instanceName, integration: data.integration, qrcode: false },
      {
        onSuccess: () => {
          setCreateOpen(false)
          reset()
        },
      },
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/instances')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <MessageCircle className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold leading-tight">
              {product?.name ?? 'Instancias'}
            </h1>
            {product?.slug && (
              <p className="text-xs text-muted-foreground font-mono">{product.slug}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* {product?.vpsId && (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={importingBulk}
              onClick={() => setBulkConfirmOpen(true)}
            >
              {importingBulk ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {importingBulk ? 'Importando...' : 'Importar Evolution'}
            </Button>
          )} */}
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Instancia
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar instancia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="connected">Conectado</SelectItem>
            <SelectItem value="disconnected">Desconectado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredInstances.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">
          {instances?.length === 0
            ? 'Nenhuma instancia criada neste produto.'
            : 'Nenhuma instancia encontrada com os filtros atuais.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInstances.map((inst) => {
            const linked = !!getHubEntry(inst, hubInstanceMap)
            return (
              <InstanceCard
                key={inst.providerInstanceId ?? inst.id}
                instance={inst}
                isLinked={linked}
                onClick={() => handleInstanceClick(inst)}
                onImport={!linked ? () => setInstanceToImport(inst) : undefined}
              />
            )
          })}
        </div>
      )}

      {selectedInstance && (
        <InstanceDetailModal
          instance={selectedInstance}
          productId={productId}
          open={!!selectedInstance}
          onClose={() => setSelectedInstance(null)}
          onDeleted={() => setSelectedInstance(null)}
        />
      )}

      {/* Bulk import — confirmation */}
      <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar instancias da Evolution?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao ira importar todas as instancias encontradas na Evolution que ainda nao
              estao vinculadas ao Hub. As instancias ja vinculadas serao ignoradas automaticamente.
              O processo e seguro e pode ser executado mais de uma vez sem duplicar registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setBulkConfirmOpen(false)
                importBulk(undefined, {
                  onSuccess: (result) => setBulkResult(result),
                })
              }}
            >
              Importar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk import — result */}
      <Dialog open={!!bulkResult} onOpenChange={(o) => !o && setBulkResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Resultado da importacao
            </DialogTitle>
          </DialogHeader>
          {bulkResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-green-50 dark:bg-green-900/10 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {bulkResult.created}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Importadas</p>
                </div>
                <div className="rounded-lg border bg-muted p-3 text-center">
                  <p className="text-2xl font-bold">{bulkResult.skipped}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Ja vinculadas</p>
                </div>
                <div
                  className={`rounded-lg border p-3 text-center ${
                    bulkResult.errors > 0 ? 'bg-red-50 dark:bg-red-900/10' : 'bg-muted'
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${bulkResult.errors > 0 ? 'text-destructive' : ''}`}
                  >
                    {bulkResult.errors}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Erros</p>
                </div>
              </div>

              {bulkResult.errors > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-destructive">Instancias com erro:</p>
                  <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                    {bulkResult.details
                      .filter((d) => d.result === 'error')
                      .map((d) => (
                        <li key={d.instanceName} className="text-xs font-mono text-destructive">
                          {d.instanceName}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              <Button className="w-full" variant="outline" onClick={() => setBulkResult(null)}>
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single instance import — confirmation */}
      <AlertDialog
        open={!!instanceToImport}
        onOpenChange={(o) => !o && setInstanceToImport(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vincular instancia ao Hub?</AlertDialogTitle>
            <AlertDialogDescription>
              A instancia <strong>{instanceToImport?.name}</strong> sera registrada no Hub usando
              seus dados atuais da Evolution. Apos a vinculacao, ela podera ser gerenciada
              normalmente pelo dashboard (conectar, desconectar, enviar mensagens, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={importing}
              onClick={() => {
                if (!instanceToImport) return
                const dto: ImportInstanceDto = {
                  id: instanceToImport.providerInstanceId ?? instanceToImport.id,
                  name: instanceToImport.name,
                  token: instanceToImport.token ?? '',
                  connectionStatus: instanceToImport.connectionStatus,
                  number: instanceToImport.number ?? undefined,
                }
                importInstance(dto, {
                  onSuccess: (result) => {
                    if (result.result === 'created') {
                      toast.success(`Instancia "${instanceToImport.name}" vinculada ao Hub`)
                    } else {
                      toast.info(`Instancia "${instanceToImport.name}" ja estava vinculada ao Hub`)
                    }
                    setInstanceToImport(null)
                  },
                })
              }}
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Vinculando...
                </span>
              ) : (
                'Vincular'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o)
          if (!o) reset()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Instancia</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="instanceName">Nome da instancia *</Label>
              <Input
                id="instanceName"
                placeholder="minha-instancia"
                {...register('instanceName')}
              />
              {errors.instanceName && (
                <p className="text-xs text-destructive">{errors.instanceName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Integracao</Label>
              <Controller
                control={control}
                name="integration"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WHATSAPP-BAILEYS">WhatsApp Baileys</SelectItem>
                      <SelectItem value="WHATSAPP-BUSINESS">WhatsApp Business</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false)
                  reset()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Criando...' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

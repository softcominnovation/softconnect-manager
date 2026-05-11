'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus, Pencil, PowerOff, Package, ExternalLink, Copy, Check, AlertTriangle, Search,
  Webhook, HelpCircle, X, Link2, Eye, EyeOff, RefreshCw, Rss, Loader2, Settings, Server
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useProductList, useCreateProduct, useUpdateProduct, useDeactivateProduct,
  useUpdateWebhookConfig, useSyncRelay, useGetWebhookConfig, useLoadWebhookConfigs,
  useGetInstanceDefaults, useUpdateInstanceDefaultWebhook, useUpdateInstanceDefaultProxy,
  useDeleteInstanceDefaultWebhook, useDeleteInstanceDefaultProxy
} from '@/hooks/use-products'
import { useVpsList } from '@/hooks/use-vps'
import { createProductSchema, updateProductSchema, type CreateProductFormData, type UpdateProductFormData } from '@/lib/schemas/product.schema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useWebhookConfigsStore } from '@/store/webhook-configs.store'
import { useInstanceDefaultsStore } from '@/store/instance-defaults.store'
import type { Product, ProductWithApiKey, WebhookConfig, InstanceDefaultWebhook, InstanceDefaultProxy } from '@/lib/types'

const WEBHOOK_EVENTS = [
  'APPLICATION_STARTUP', 'CALL', 'CHATS_DELETE', 'CHATS_SET', 'CHATS_UPDATE', 'CHATS_UPSERT',
  'CONNECTION_UPDATE', 'CONTACTS_SET', 'CONTACTS_UPDATE', 'CONTACTS_UPSERT',
  'GROUP_PARTICIPANTS_UPDATE', 'GROUP_UPDATE', 'GROUPS_UPSERT', 'LABELS_ASSOCIATION',
  'LABELS_EDIT', 'LOGOUT_INSTANCE', 'MESSAGES_DELETE', 'MESSAGES_SET', 'MESSAGES_UPDATE',
  'MESSAGES_UPSERT', 'PRESENCE_UPDATE', 'QRCODE_UPDATED', 'REMOVE_INSTANCE',
  'SEND_MESSAGE', 'TYPEBOT_CHANGE_STATUS', 'TYPEBOT_START',
]

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          checked ? 'bg-primary' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

function WebhookConfigModal({
  productId,
  initialConfig,
  hubRelay,
  onHubRelayChange,
  onClose,
}: {
  productId: string
  initialConfig?: WebhookConfig | null
  hubRelay: boolean
  onHubRelayChange: (v: boolean) => void
  onClose: () => void
}) {
  const setConfig = useWebhookConfigsStore((s) => s.setConfig)

  const [url, setUrl] = useState(initialConfig?.url ?? '')
  const [urlError, setUrlError] = useState('')
  const [secret, setSecret] = useState(initialConfig?.secret ?? '')
  const [showSecret, setShowSecret] = useState(false)
  const [secretCopied, setSecretCopied] = useState(false)
  const [byEvents, setByEvents] = useState(initialConfig?.byEvents ?? false)
  const [base64, setBase64] = useState(initialConfig?.base64 ?? true)
  const [events, setEvents] = useState<string[]>(initialConfig?.events ?? [])
  const [eventInput, setEventInput] = useState('')
  const [removeEventCandidate, setRemoveEventCandidate] = useState<string | null>(null)

  const filteredSuggestions = WEBHOOK_EVENTS.filter(
    (e) => e.toLowerCase().includes(eventInput.toLowerCase()) && !events.includes(e),
  )

  function generateSecret() {
    const arr = new Uint8Array(24)
    crypto.getRandomValues(arr)
    const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
    setSecret(hex)
  }

  function copySecret() {
    navigator.clipboard.writeText(secret)
    setSecretCopied(true)
    setTimeout(() => setSecretCopied(false), 2000)
  }

  function addEvent(event: string) {
    if (!events.includes(event)) setEvents([...events, event])
    setEventInput('')
  }

  function confirmRemoveEvent() {
    if (!removeEventCandidate) return
    setEvents(events.filter((e) => e !== removeEventCandidate))
    setRemoveEventCandidate(null)
  }

  function validateUrl(v: string): boolean {
    try {
      const parsed = new URL(v.trim())
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        setUrlError('Informe uma URL válida com http:// ou https://')
        return false
      }
      setUrlError('')
      return true
    } catch {
      setUrlError('Informe uma URL válida (http:// ou https://)')
      return false
    }
  }

  const canSave = url.trim() !== '' && !urlError && events.length > 0

  function handleSave() {
    if (!validateUrl(url)) return
    const config: WebhookConfig = {
      url: url.trim(),
      secret,
      events,
      byEvents,
      base64,
    }
    setConfig(productId, config)
    onClose()
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rss className="h-4 w-4 text-primary" />
              Webhook de Instâncias
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Hub Relay */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Rss className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Hub Relay</span>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" tabIndex={-1} className="text-muted-foreground hover:text-foreground">
                        <HelpCircle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      Quando ativado, o Hub repassa os eventos de webhook das instâncias para a URL configurada abaixo.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Toggle
                checked={hubRelay}
                onChange={onHubRelayChange}
                label={hubRelay ? 'Relay de webhook ativado' : 'Ativar relay de webhook nas instâncias'}
              />
            </div>

            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="wh-url">URL de destino <span className="text-destructive">*</span></Label>
              <Input
                id="wh-url"
                placeholder="https:// ou http://meu-sistema.com/webhooks/instancias"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (urlError) validateUrl(e.target.value) }}
                onBlur={() => url && validateUrl(url)}
              />
              {urlError && <p className="text-xs text-destructive">{urlError}</p>}
            </div>

            {/* Secret */}
            <div className="space-y-1.5">
              <Label htmlFor="wh-secret">Secret</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="wh-secret"
                    type={showSecret ? 'text' : 'password'}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    className="pr-8 font-mono text-xs"
                    placeholder="Deixe em branco para não usar"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <Button type="button" size="icon" variant="outline" onClick={copySecret} title="Copiar">
                  {secretCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={generateSecret} className="gap-1.5 shrink-0">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Gerar
                </Button>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid gap-3">
              <Toggle
                checked={byEvents}
                onChange={setByEvents}
                label={byEvents ? 'Filtrar por eventos (ByEvents ativado)' : 'Enviar todos os eventos (ByEvents desativado)'}
              />
              <Toggle
                checked={base64}
                onChange={setBase64}
                label={base64 ? 'Payload em Base64 ativado' : 'Payload em JSON puro'}
              />
            </div>

            {/* Events picker */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Eventos <span className="text-destructive">*</span></span>
              </div>

              <div className="relative">
                <Input
                  placeholder="Buscar evento e pressionar Enter…"
                  value={eventInput}
                  onChange={(e) => setEventInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (filteredSuggestions.length === 1) addEvent(filteredSuggestions[0])
                      else if (WEBHOOK_EVENTS.includes(eventInput.toUpperCase()) && !events.includes(eventInput.toUpperCase())) {
                        addEvent(eventInput.toUpperCase())
                      }
                    }
                  }}
                />
                {eventInput && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((ev) => (
                      <button
                        key={ev}
                        type="button"
                        onClick={() => addEvent(ev)}
                        className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-muted transition-colors"
                      >
                        {ev}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {events.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {events.map((ev) => (
                    <span
                      key={ev}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-mono text-foreground"
                    >
                      {ev}
                      <button
                        type="button"
                        aria-label={`Remover ${ev}`}
                        onClick={() => setRemoveEventCandidate(ev)}
                        className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {events.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Selecione pelo menos um evento para salvar.
                </p>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setEvents(WEBHOOK_EVENTS)}
                  className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Selecionar todos ({WEBHOOK_EVENTS.length})
                </button>
                {events.length > 0 && (
                  <>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => setEvents([])}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Limpar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" disabled={!canSave} onClick={handleSave}>
              Salvar configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeEventCandidate} onOpenChange={(o) => { if (!o) setRemoveEventCandidate(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover evento?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento <span className="font-mono font-medium">{removeEventCandidate}</span> será removido da lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveEvent}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function InstanceDefaultsModal({
  productId,
  onClose,
}: {
  productId: string
  onClose: () => void
}) {
  const setWebhookConfigStore = useInstanceDefaultsStore((s) => s.setWebhookConfig)
  const setProxyConfigStore = useInstanceDefaultsStore((s) => s.setProxyConfig)
  const getWebhookConfigStore = useInstanceDefaultsStore((s) => s.getWebhookConfig)
  const getProxyConfigStore = useInstanceDefaultsStore((s) => s.getProxyConfig)

  // Local state for Webhook
  const initialWh: InstanceDefaultWebhook | null | undefined = getWebhookConfigStore(productId)
  const [whEnabled, setWhEnabled] = useState(initialWh?.enabled ?? false)
  const [whUrl, setWhUrl] = useState(initialWh?.url ?? '')
  const [whUrlError, setWhUrlError] = useState('')
  const [whByEvents, setWhByEvents] = useState(initialWh?.byEvents ?? false)
  const [whBase64, setWhBase64] = useState(initialWh?.base64 ?? false)
  const [whEvents, setWhEvents] = useState<string[]>(initialWh?.events ?? [])
  const [whEventInput, setWhEventInput] = useState('')
  const [whRemoveEventCandidate, setWhRemoveEventCandidate] = useState<string | null>(null)
  const [confirmWhRemove, setConfirmWhRemove] = useState(false)

  const filteredWhSuggestions = WEBHOOK_EVENTS.filter(
    (e) => e.toLowerCase().includes(whEventInput.toLowerCase()) && !whEvents.includes(e),
  )

  // Local state for Proxy
  const initialPx: InstanceDefaultProxy | null | undefined = getProxyConfigStore(productId)
  const [pxEnabled, setPxEnabled] = useState(initialPx?.enabled ?? false)
  const [pxHost, setPxHost] = useState(initialPx?.host ?? '')
  const [pxPort, setPxPort] = useState(initialPx?.port ?? '')
  const [pxProtocol, setPxProtocol] = useState(initialPx?.protocol ?? 'http')
  const [pxUsername, setPxUsername] = useState(initialPx?.username ?? '')
  const [pxPassword, setPxPassword] = useState(initialPx?.password ?? '')
  const [showPxPassword, setShowPxPassword] = useState(false)
  const [confirmPxRemove, setConfirmPxRemove] = useState(false)

  function addWhEvent(event: string) {
    if (!whEvents.includes(event)) setWhEvents([...whEvents, event])
    setWhEventInput('')
  }

  function confirmRemoveWhEvent() {
    if (!whRemoveEventCandidate) return
    setWhEvents(whEvents.filter((e) => e !== whRemoveEventCandidate))
    setWhRemoveEventCandidate(null)
  }

  function validateUrl(v: string): boolean {
    if (!v.trim()) return true
    try {
      const parsed = new URL(v.trim())
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        setWhUrlError('Informe uma URL válida (http:// ou https://)')
        return false
      }
      setWhUrlError('')
      return true
    } catch {
      setWhUrlError('Informe uma URL válida (http:// ou https://)')
      return false
    }
  }

  const initialWhEnabled = initialWh?.enabled ?? false
  const hasInitialWh = initialWh !== undefined && initialWh !== null
  const isWhTouched = whUrl.trim() !== '' || whEvents.length > 0 || hasInitialWh || whEnabled !== initialWhEnabled

  const initialPxEnabled = initialPx?.enabled ?? false
  const hasInitialPx = initialPx !== undefined && initialPx !== null
  const isPxTouched = pxHost.trim() !== '' || pxPort.trim() !== '' || hasInitialPx || pxEnabled !== initialPxEnabled

  const canSaveWh = !isWhTouched || (!whEnabled || (whUrl.trim() !== '' && !whUrlError && whEvents.length > 0))
  const canSavePx = !isPxTouched || (!pxEnabled || (pxHost.trim() !== '' && pxPort.trim() !== ''))

  function handleSave() {
    if (isWhTouched && !validateUrl(whUrl)) return

    // Save Webhook
    if (isWhTouched && canSaveWh) {
      setWebhookConfigStore(productId, {
        enabled: whEnabled,
        url: whUrl.trim(),
        byEvents: whByEvents,
        base64: whBase64,
        events: whEvents,
      })
    }

    // Save Proxy
    if (isPxTouched && canSavePx) {
      setProxyConfigStore(productId, {
        enabled: pxEnabled,
        host: pxHost.trim(),
        port: pxPort.trim(),
        protocol: pxProtocol,
        username: pxUsername.trim() || undefined,
        password: pxPassword.trim() || undefined,
      })
    }

    onClose()
  }

  function handleRemoveWh() {
    setWhEnabled(false)
    setWhUrl('')
    setWhUrlError('')
    setWhByEvents(false)
    setWhBase64(false)
    setWhEvents([])
    setWebhookConfigStore(productId, null)
    setConfirmWhRemove(false)
    toast.success('Webhook padrão removido (será efetivado ao salvar o produto)')
  }

  function handleRemovePx() {
    setPxEnabled(false)
    setPxHost('')
    setPxPort('')
    setPxProtocol('http')
    setPxUsername('')
    setPxPassword('')
    setProxyConfigStore(productId, null)
    setConfirmPxRemove(false)
    toast.success('Proxy padrão removido (será efetivado ao salvar o produto)')
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configurações Default das Instâncias
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Aplicadas automaticamente ao criar novas instâncias (Evolution)
            </p>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Seção Webhook */}
            <div className="rounded-lg border border-border p-5 space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base font-medium">Webhook Padrão</span>
                  <Badge variant={initialWh && initialWh !== null ? 'success' : 'secondary'} className="ml-2">
                    {initialWh && initialWh !== null ? 'Configurado' : 'Não configurado'}
                  </Badge>
                </div>
                {initialWh && initialWh !== null && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmWhRemove(true)}>
                    Remover
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <Toggle
                  checked={whEnabled}
                  onChange={setWhEnabled}
                  label={whEnabled ? 'Ativo' : 'Inativo'}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="wh-def-url">URL de destino {whEnabled && <span className="text-destructive">*</span>}</Label>
                  <Input
                    id="wh-def-url"
                    placeholder="https://meu-sistema.com/webhook/whatsapp"
                    value={whUrl}
                    onChange={(e) => { setWhUrl(e.target.value); if (whUrlError) validateUrl(e.target.value) }}
                    onBlur={() => whUrl && validateUrl(whUrl)}
                  />
                  {whUrlError && <p className="text-xs text-destructive">{whUrlError}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Toggle
                    checked={whByEvents}
                    onChange={setWhByEvents}
                    label="Enviar por Evento (ByEvents)"
                  />
                  <Toggle
                    checked={whBase64}
                    onChange={setWhBase64}
                    label="Payload em Base64"
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  <Label>Eventos {whEnabled && <span className="text-destructive">*</span>}</Label>
                  <div className="relative">
                    <Input
                      placeholder="Buscar evento e pressionar Enter…"
                      value={whEventInput}
                      onChange={(e) => setWhEventInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (filteredWhSuggestions.length === 1) addWhEvent(filteredWhSuggestions[0])
                          else if (WEBHOOK_EVENTS.includes(whEventInput.toUpperCase()) && !whEvents.includes(whEventInput.toUpperCase())) {
                            addWhEvent(whEventInput.toUpperCase())
                          }
                        }
                      }}
                    />
                    {whEventInput && filteredWhSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-40 overflow-y-auto">
                        {filteredWhSuggestions.map((ev) => (
                          <button
                            key={ev}
                            type="button"
                            onClick={() => addWhEvent(ev)}
                            className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-muted transition-colors"
                          >
                            {ev}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {whEvents.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {whEvents.map((ev) => (
                        <span
                          key={ev}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-mono text-foreground"
                        >
                          {ev}
                          <button
                            type="button"
                            aria-label={`Remover ${ev}`}
                            onClick={() => setWhRemoveEventCandidate(ev)}
                            className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setWhEvents(WEBHOOK_EVENTS)}
                      className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      Selecionar todos ({WEBHOOK_EVENTS.length})
                    </button>
                    {whEvents.length > 0 && (
                      <>
                        {' · '}
                        <button
                          type="button"
                          onClick={() => setWhEvents([])}
                          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        >
                          Limpar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção Proxy */}
            <div className="rounded-lg border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base font-medium">Proxy Padrão</span>
                  <Badge variant={initialPx && initialPx !== null ? 'success' : 'secondary'} className="ml-2">
                    {initialPx && initialPx !== null ? 'Configurado' : 'Não configurado'}
                  </Badge>
                </div>
                {initialPx && initialPx !== null && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmPxRemove(true)}>
                    Remover
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <Toggle
                  checked={pxEnabled}
                  onChange={setPxEnabled}
                  label={pxEnabled ? 'Ativo' : 'Inativo'}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="px-host">Host do Proxy {pxEnabled && <span className="text-destructive">*</span>}</Label>
                    <Input
                      id="px-host"
                      placeholder="proxy.example.com"
                      value={pxHost}
                      onChange={(e) => setPxHost(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="px-port">Porta {pxEnabled && <span className="text-destructive">*</span>}</Label>
                    <Input
                      id="px-port"
                      placeholder="8080"
                      value={pxPort}
                      onChange={(e) => setPxPort(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="px-protocol">Protocolo</Label>
                  <Select value={pxProtocol} onValueChange={setPxProtocol}>
                    <SelectTrigger id="px-protocol">
                      <SelectValue placeholder="Selecione o protocolo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="https">HTTPS</SelectItem>
                      <SelectItem value="socks5">SOCKS5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="px-user">Usuário</Label>
                    <Input
                      id="px-user"
                      placeholder="Opcional"
                      value={pxUsername}
                      onChange={(e) => setPxUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="px-pass">Senha</Label>
                    <div className="relative">
                      <Input
                        id="px-pass"
                        type={showPxPassword ? 'text' : 'password'}
                        placeholder="Opcional"
                        value={pxPassword}
                        onChange={(e) => setPxPassword(e.target.value)}
                        className="pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPxPassword(!showPxPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPxPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" disabled={!canSaveWh || !canSavePx} onClick={handleSave}>
              Salvar configurações na memória
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmWhRemove} onOpenChange={setConfirmWhRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Webhook Padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a configuração de webhook padrão para as novas instâncias deste produto. Esta ação só será efetivada quando você salvar o produto no modal principal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveWh} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmPxRemove} onOpenChange={setConfirmPxRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Proxy Padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a configuração de proxy padrão para as novas instâncias deste produto. Esta ação só será efetivada quando você salvar o produto no modal principal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePx} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!whRemoveEventCandidate} onOpenChange={(o) => { if (!o) setWhRemoveEventCandidate(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover evento?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento <span className="font-mono font-medium">{whRemoveEventCandidate}</span> será removido da lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveWhEvent}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function OriginsManager({
  origins,
  onChange,
}: {
  origins: string[]
  onChange: (origins: string[]) => void
}) {
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [removeCandidate, setRemoveCandidate] = useState<string | null>(null)

  function handleAdd() {
    const url = inputValue.trim()
    if (!url) return
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        setInputError('Informe uma URL válida (http:// ou https://)')
        return
      }
    } catch {
      setInputError('Informe uma URL válida')
      return
    }
    if (origins.includes(url)) {
      setInputError('Esta origem já foi adicionada')
      return
    }
    onChange([...origins, url])
    setInputValue('')
    setInputError('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  function confirmRemove() {
    if (!removeCandidate) return
    onChange(origins.filter((o) => o !== removeCandidate))
    setRemoveCandidate(null)
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="https://app.meusite.com.br"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setInputError('') }}
              onKeyDown={handleKeyDown}
            />
            {inputError && <p className="text-xs text-destructive mt-1">{inputError}</p>}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="shrink-0 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {origins.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {origins.map((origin) => (
              <span
                key={origin}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-mono text-foreground"
              >
                <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                {origin}
                <button
                  type="button"
                  aria-label={`Remover ${origin}`}
                  onClick={() => setRemoveCandidate(origin)}
                  className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {origins.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Nenhuma origem configurada. Deixe vazio para permitir qualquer origem.</p>
        )}
      </div>

      <AlertDialog open={!!removeCandidate} onOpenChange={(o) => { if (!o) setRemoveCandidate(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover origem?</AlertDialogTitle>
            <AlertDialogDescription>
              A origem <span className="font-mono font-medium">{removeCandidate}</span> será removida da lista.
              Esta alteração só será efetivada ao salvar o produto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ProductFormFields({
  register,
  errors,
  setValue,
  watchVpsProviderId,
  watchBatchEnabled,
  watchAdapterType,
  origins,
  onOriginsChange,
  providerList,
}: {
  register: ReturnType<typeof useForm<CreateProductFormData>>['register']
  errors: ReturnType<typeof useForm<CreateProductFormData>>['formState']['errors']
  setValue: ReturnType<typeof useForm<CreateProductFormData>>['setValue']
  watchVpsProviderId?: string
  watchBatchEnabled?: boolean
  watchAdapterType?: string
  origins: string[]
  onOriginsChange: (origins: string[]) => void
  providerList: { id: string; label: string; vpsLabel: string }[]
}) {
  const batchEnabled = watchBatchEnabled ?? false

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" placeholder="Softshop" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" placeholder="softshop" {...register('slug')} />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="vpsProviderId">Provider vinculado</Label>
          <Select
            value={watchVpsProviderId ?? ''}
            onValueChange={(v) => setValue('vpsProviderId', v === 'none' ? '' : v)}
          >
            <SelectTrigger id="vpsProviderId">
              <SelectValue placeholder="Selecione um Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {providerList.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label} — {p.vpsLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vpsProviderId && <p className="text-xs text-destructive">{errors.vpsProviderId.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adapterType">Adapter Type</Label>
          <Select
            value={watchAdapterType ?? ''}
            onValueChange={(v) => setValue('adapterType', v)}
          >
            <SelectTrigger id="adapterType">
              <SelectValue placeholder="Selecione o adapter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="evolution">Evolution</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Origins */}
      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Origens Permitidas (CORS)</span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" tabIndex={-1} className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Lista de origens (domínios) autorizadas a consumir este produto.
                Deixe vazia para permitir qualquer origem.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <OriginsManager origins={origins} onChange={onOriginsChange} />
      </div>

      {/* Batch webhook section */}
      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Notificações de Envio em Lote</span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" tabIndex={-1} className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  Quando ativado, o Hub envia um POST para a sua URL após processar cada mensagem
                  do lote — informando se aquela mensagem foi entregue ou falhou. Deixe desativado
                  se não precisa acompanhar mensagens individualmente.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={batchEnabled}
            onClick={() => {
              const next = !batchEnabled
              setValue('batchWebhookEnabled', next)
              if (!next) setValue('batchWebhookUrl', '')
            }}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              batchEnabled ? 'bg-primary' : 'bg-input',
            )}
          >
            <span
              className={cn(
                'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
                batchEnabled ? 'translate-x-4' : 'translate-x-0',
              )}
            />
          </button>
          <span className="text-sm text-muted-foreground">
            {batchEnabled ? 'Notificação por mensagem ativada' : 'Ativar notificação por mensagem enviada no lote'}
          </span>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="batchWebhookUrl"
            className={cn(!batchEnabled && 'text-muted-foreground/50')}
          >
            URL de destino {batchEnabled && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="batchWebhookUrl"
            placeholder="https://meu-sistema.com/webhooks/hub-batch"
            disabled={!batchEnabled}
            className={cn(!batchEnabled && 'opacity-40 cursor-not-allowed')}
            {...register('batchWebhookUrl')}
          />
          {errors.batchWebhookUrl && (
            <p className="text-xs text-destructive">{errors.batchWebhookUrl.message}</p>
          )}
          {batchEnabled && (
            <p className="text-xs text-muted-foreground">
              O Hub faz um POST para esta URL após processar cada mensagem do lote, informando
              sucesso ou falha individual.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ApiKeyModal({
  product,
  onClose,
}: {
  product: ProductWithApiKey
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(product.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Produto criado — API Key gerada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Esta é a <strong>única vez</strong> que esta API Key será exibida. Copie agora e
              guarde em local seguro — não é possível recuperá-la depois.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>API Key</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={product.apiKey} className="font-mono text-xs" />
              <Button size="icon" variant="outline" onClick={copy} type="button">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Produto: <span className="font-medium text-foreground">{product.name}</span> —
            Slug: <span className="font-medium text-foreground">{product.slug}</span>
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Entendi, já copiei</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditProductDialog({
  product,
  providerList,
  onClose,
}: {
  product: Product
  providerList: { id: string; label: string; vpsLabel: string }[]
  onClose: () => void
}) {
  const update = useUpdateProduct(product.id)
  const updateWebhookConfig = useUpdateWebhookConfig(product.id)
  const syncRelay = useSyncRelay(product.id)

  const { isLoading: loadingWebhookConfig } = useGetWebhookConfig(product.id)
  const storedConfig = useWebhookConfigsStore((s) => s.configs[product.id] ?? null)

  const { isLoading: loadingDefaults } = useGetInstanceDefaults(product.id)
  const updateDefaultWh = useUpdateInstanceDefaultWebhook(product.id)
  const deleteDefaultWh = useDeleteInstanceDefaultWebhook(product.id)
  const updateDefaultPx = useUpdateInstanceDefaultProxy(product.id)
  const deleteDefaultPx = useDeleteInstanceDefaultProxy(product.id)
  const getWhStore = useInstanceDefaultsStore((s) => s.getWebhookConfig)
  const getPxStore = useInstanceDefaultsStore((s) => s.getProxyConfig)

  const [origins, setOrigins] = useState<string[]>(product.origins ?? [])
  const [webhookModalOpen, setWebhookModalOpen] = useState(false)
  const [instanceDefaultsModalOpen, setInstanceDefaultsModalOpen] = useState(false)
  const [relayConfirm, setRelayConfirm] = useState<'enable' | 'disable' | null>(null)
  const [pendingRelayAction, setPendingRelayAction] = useState<(() => Promise<void>) | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProductFormData>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: product.name,
      slug: product.slug,
      vpsProviderId: product.vpsProviderId ?? '',
      adapterType: product.adapterType,
      hubRelay: product.hubRelay ?? false,
      batchWebhookEnabled: product.batchWebhookEnabled ?? false,
      batchWebhookUrl: product.batchWebhookUrl ?? '',
    },
  })
  const watchVpsProviderId = watch('vpsProviderId')
  const watchBatchEnabled = watch('batchWebhookEnabled')
  const watchAdapterType = watch('adapterType')
  const watchHubRelay = watch('hubRelay') ?? false

  async function onSubmit(data: UpdateProductFormData) {
    const dto = {
      ...data,
      origins,
      vpsProviderId: data.vpsProviderId || undefined,
      batchWebhookUrl: data.batchWebhookEnabled ? (data.batchWebhookUrl ?? null) : null,
    }

    await new Promise<void>((resolve, reject) => {
      update.mutate(dto, {
        onSuccess: () => resolve(),
        onError: (err) => reject(err),
      })
    })

    if (storedConfig) {
      try {
        await updateWebhookConfig.mutateAsync(storedConfig)
      } catch {
        // error toast handled by mutation
      }
    }

    const whDef = getWhStore(product.id)
    if (whDef !== undefined) {
      if (whDef === null) {
        await deleteDefaultWh.mutateAsync().catch(() => {})
      } else {
        await updateDefaultWh.mutateAsync(whDef).catch(() => {})
      }
    }

    const pxDef = getPxStore(product.id)
    if (pxDef !== undefined) {
      if (pxDef === null) {
        await deleteDefaultPx.mutateAsync().catch(() => {})
      } else {
        await updateDefaultPx.mutateAsync(pxDef).catch(() => {})
      }
    }

    const relayChanged = (data.hubRelay ?? false) !== (product.hubRelay ?? false)
    if (relayChanged) {
      const isEnabling = data.hubRelay ?? false
      setPendingRelayAction(() => async () => {
        if (!storedConfig) {
          toast.error('Configure o webhook de instâncias antes de sincronizar o relay.')
          return
        }
        try {
          await syncRelay.mutateAsync(undefined)
          toast.success('Relay sincronizado em todas as instâncias')
        } catch {
          // error toast handled by mutation
        }
      })
      setRelayConfirm(isEnabling ? 'enable' : 'disable')
    } else {
      onClose()
    }
  }

  async function handleRelayConfirm() {
    if (pendingRelayAction) await pendingRelayAction()
    setRelayConfirm(null)
    setPendingRelayAction(null)
    onClose()
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ProductFormFields
              register={register as unknown as ReturnType<typeof useForm<CreateProductFormData>>['register']}
              errors={errors as ReturnType<typeof useForm<CreateProductFormData>>['formState']['errors']}
              setValue={setValue as unknown as ReturnType<typeof useForm<CreateProductFormData>>['setValue']}
              watchVpsProviderId={watchVpsProviderId ?? ''}
              watchBatchEnabled={watchBatchEnabled ?? false}
              watchAdapterType={watchAdapterType ?? ''}
              origins={origins}
              onOriginsChange={setOrigins}
              providerList={providerList}
            />

            {/* Instance Defaults */}
            {watchAdapterType === 'evolution' && (
              <div className="rounded-lg border border-border p-4 space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Configurações Default das Instâncias</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setInstanceDefaultsModalOpen(true)}
                  disabled={loadingDefaults}
                >
                  {loadingDefaults
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Settings className="h-3.5 w-3.5" />
                  }
                  Configurações Default das Instâncias
                </Button>
                {/* Visual feedback if configured */}
                {(getWhStore(product.id) || getPxStore(product.id)) && (
                  <p className="text-xs text-muted-foreground">
                    {getWhStore(product.id) && getWhStore(product.id) !== null ? 'Webhook padrão configurado' : ''}
                    {getWhStore(product.id) && getWhStore(product.id) !== null && getPxStore(product.id) && getPxStore(product.id) !== null ? ' · ' : ''}
                    {getPxStore(product.id) && getPxStore(product.id) !== null ? 'Proxy padrão configurado' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Hub Relay + Webhook Config */}
            <div className="rounded-lg border border-border p-4 space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Rss className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Webhook de Instâncias (Hub Relay)</span>
              </div>
              <Toggle
                checked={watchHubRelay}
                onChange={(v) => setValue('hubRelay', v)}
                label={watchHubRelay ? 'Relay ativado — eventos serão retransmitidos' : 'Relay desativado'}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setWebhookModalOpen(true)}
                disabled={loadingWebhookConfig}
              >
                {loadingWebhookConfig
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Webhook className="h-3.5 w-3.5" />
                }
                {storedConfig ? 'Editar Webhook de Instâncias' : 'Configurar Webhook de Instâncias'}
              </Button>
              {storedConfig && (
                <p className="text-xs text-muted-foreground">
                  URL: <span className="font-mono">{storedConfig.url}</span>
                  {' · '}
                  <span>{storedConfig.events.length} evento(s)</span>
                </p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || update.isPending || updateWebhookConfig.isPending}>
                {update.isPending || updateWebhookConfig.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {webhookModalOpen && (
        <WebhookConfigModal
          productId={product.id}
          initialConfig={storedConfig}
          hubRelay={watchHubRelay}
          onHubRelayChange={(v) => setValue('hubRelay', v)}
          onClose={() => setWebhookModalOpen(false)}
        />
      )}

      {instanceDefaultsModalOpen && (
        <InstanceDefaultsModal
          productId={product.id}
          onClose={() => setInstanceDefaultsModalOpen(false)}
        />
      )}

      <AlertDialog open={!!relayConfirm} onOpenChange={(o) => { if (!o) { setRelayConfirm(null); setPendingRelayAction(null); onClose() } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {relayConfirm === 'enable' ? 'Ativar relay em todas as instâncias?' : 'Desativar relay em todas as instâncias?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {relayConfirm === 'enable'
                ? 'O webhook configurado será registrado em todas as instâncias ativas deste produto.'
                : 'O relay de webhook será desativado em todas as instâncias deste produto.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setRelayConfirm(null); setPendingRelayAction(null); onClose() }}>
              Não, apenas salvar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRelayConfirm}>
              {syncRelay.isPending ? 'Sincronizando…' : 'Sim, sincronizar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function ProductsPage() {
  const router = useRouter()
  const { data: products, isLoading } = useProductList()
  const { data: vpsList } = useVpsList()
  const createProduct = useCreateProduct()
  const deactivate = useDeactivateProduct()

  const productIds = useMemo(() => (products ?? []).map((p) => p.id), [products])
  useLoadWebhookConfigs(productIds)

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState<ProductWithApiKey | null>(null)

  const [search, setSearch] = useState('')
  const [filterProvider, setFilterProvider] = useState('all')
  const [filterAdapter, setFilterAdapter] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const providerList = useMemo(() => {
    const result: { id: string; label: string; vpsLabel: string; isActive: boolean }[] = []
    for (const vps of vpsList ?? []) {
      for (const prov of vps.providers ?? []) {
        result.push({ id: prov.id, label: prov.label, vpsLabel: vps.label, isActive: prov.isActive && vps.isActive })
      }
    }
    return result
  }, [vpsList])

  const activeProviderList = useMemo(() => providerList.filter((p) => p.isActive), [providerList])

  const adapterOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const p of products ?? []) if (p.adapterType) seen.add(p.adapterType)
    return Array.from(seen)
  }, [products])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (products ?? []).filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      const matchProvider = filterProvider === 'all' || p.vpsProviderId === filterProvider
      const matchAdapter = filterAdapter === 'all' || p.adapterType === filterAdapter
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' ? p.isActive : !p.isActive)
      return matchSearch && matchProvider && matchAdapter && matchStatus
    })
  }, [products, search, filterProvider, filterAdapter, filterStatus])

  const hasActiveProvider = activeProviderList.length > 0

  const [createOrigins, setCreateOrigins] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: '', slug: '', vpsProviderId: '', adapterType: 'evolution', hubRelay: false, batchWebhookEnabled: false, batchWebhookUrl: '' },
  })
  const watchVpsProviderId = watch('vpsProviderId')
  const watchBatchEnabled = watch('batchWebhookEnabled')
  const watchAdapterType = watch('adapterType')
  const watchHubRelayCreate = watch('hubRelay') ?? false

  function onCreateSubmit(data: CreateProductFormData) {
    const dto = {
      ...data,
      origins: createOrigins,
      vpsProviderId: data.vpsProviderId || undefined,
      adapterType: data.adapterType || 'evolution',
      batchWebhookUrl: data.batchWebhookEnabled ? (data.batchWebhookUrl ?? null) : null,
    }
    createProduct.mutate(dto, {
      onSuccess: (created) => {
        setCreateOpen(false)
        reset()
        setCreateOrigins([])
        setNewProduct(created)
      },
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-sm text-muted-foreground">Gerencie os produtos do hub</p>
          </div>
        </div>
        <div className="relative group">
          <Button
            disabled={!hasActiveProvider}
            onClick={() => setCreateOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
          {!hasActiveProvider && (
            <span className="absolute bottom-full mb-2 right-0 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Cadastre um provider ativo primeiro
            </span>
          )}
        </div>
      </div>

      {!hasActiveProvider && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            Nenhum provider ativo encontrado. Você precisa{' '}
            <button
              onClick={() => router.push('/vps')}
              className="underline underline-offset-2 font-medium"
            >
              cadastrar um provider em uma VPS
            </button>{' '}
            antes de criar produtos.
          </span>
        </div>
      )}

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome ou slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os providers</SelectItem>
            {providerList.map((prov) => (
              <SelectItem key={prov.id} value={prov.id}>{prov.label} — {prov.vpsLabel}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAdapter} onValueChange={setFilterAdapter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Adapter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os adapters</SelectItem>
            {adapterOptions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Provider</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Adapter</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Webhook de Lote</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))}

              {!isLoading && products?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                  </td>
                </tr>
              )}

              {!isLoading && products && products.length > 0 && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum produto encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((p) => {
                  const provider = providerList.find((prov) => prov.id === p.vpsProviderId)
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.slug}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                        {provider ? `${provider.label} — ${provider.vpsLabel}` : <span className="italic">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {p.adapterType}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {p.batchWebhookEnabled ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Webhook className="h-3 w-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.isActive ? 'success' : 'secondary'}>
                          {p.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => router.push(`/products/${p.id}`)}
                            title="Ver detalhe"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditTarget(p)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {p.isActive && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeactivateTarget(p)}
                              title="Desativar"
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) reset() }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)}>
            <ProductFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watchVpsProviderId={watchVpsProviderId ?? ''}
              watchBatchEnabled={watchBatchEnabled ?? false}
              watchAdapterType={watchAdapterType ?? ''}
              origins={createOrigins}
              onOriginsChange={setCreateOrigins}
              providerList={activeProviderList}
            />

            {/* Hub Relay no create — só toggle, webhook config após criação */}
            <div className="rounded-lg border border-border p-4 space-y-4 mt-4">
              <div className="flex items-center gap-2">
                <Rss className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Webhook de Instâncias (Hub Relay)</span>
              </div>
              <Toggle
                checked={watchHubRelayCreate}
                onChange={(v) => setValue('hubRelay', v)}
                label={watchHubRelayCreate ? 'Relay ativado' : 'Relay desativado'}
              />
              {watchHubRelayCreate && (
                <p className="text-xs text-muted-foreground">
                  Após criar o produto, edite-o para configurar o webhook de instâncias.
                </p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => { setCreateOpen(false); reset() }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || createProduct.isPending}>
                {createProduct.isPending ? 'Criando…' : 'Criar Produto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {editTarget && (
        <EditProductDialog
          product={editTarget}
          providerList={activeProviderList}
          onClose={() => setEditTarget(null)}
        />
      )}

      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => { if (!o) setDeactivateTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto <strong>{deactivateTarget?.name}</strong> será desativado. Instâncias vinculadas
              podem parar de funcionar. Esta ação pode ser revertida pelo suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deactivateTarget) {
                  deactivate.mutate(deactivateTarget.id, { onSuccess: () => setDeactivateTarget(null) })
                }
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {newProduct && (
        <ApiKeyModal product={newProduct} onClose={() => setNewProduct(null)} />
      )}
    </div>
  )
}


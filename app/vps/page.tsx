'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Server,
  Plus,
  Pencil,
  PowerOff,
  ExternalLink,
  Network,
  Eye,
  EyeOff,
  Copy,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useVpsList,
  useCreateVps,
  useUpdateVps,
  useDeactivateVps,
  useVpsProviders,
  useCreateVpsProvider,
  useUpdateVpsProvider,
  useDeactivateVpsProvider,
} from '@/hooks/use-vps'
import {
  createVpsSchema,
  updateVpsSchema,
  createVpsProviderSchema,
  updateVpsProviderSchema,
  type CreateVpsFormData,
  type UpdateVpsFormData,
  type CreateVpsProviderFormData,
  type UpdateVpsProviderFormData,
} from '@/lib/schemas/vps.schema'
import type { VpsServer, VpsProvider } from '@/lib/types'

const adapterOptions = ['evolution', 'baileys', 'business']

function SecretInput({
  id,
  label,
  fieldKey,
  register,
  error,
  getValues,
  copyLabel,
}: {
  id: string
  label: string
  fieldKey: any
  register: any
  error?: string
  getValues: any
  copyLabel: string
}) {
  const [show, setShow] = useState(false)

  function handleCopy() {
    const val = getValues(fieldKey) as string | undefined
    if (!val) return
    navigator.clipboard.writeText(val)
    toast.success(`${copyLabel} copiada para a área de transferência`)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder="••••••••"
          className="pr-20"
          {...register(fieldKey)}
        />
        <div className="absolute right-1 flex items-center gap-0.5">
          <button
            type="button"
            className="h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            tabIndex={-1}
            aria-label={`Copiar ${copyLabel}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
            onClick={() => setShow((v) => !v)}
            tabIndex={-1}
            aria-label={show ? 'Ocultar chave' : 'Mostrar chave'}
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function VpsFormFields({
  register,
  errors,
  isEdit,
  getValues,
}: {
  register: ReturnType<typeof useForm<CreateVpsFormData>>['register']
  errors: ReturnType<typeof useForm<CreateVpsFormData>>['formState']['errors']
  isEdit: boolean
  getValues: ReturnType<typeof useForm<CreateVpsFormData>>['getValues']
}) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="label">Label *</Label>
          <Input id="label" placeholder="EvoLab-01" {...register('label')} />
          {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subdomain">Subdomínio *</Label>
          <Input id="subdomain" placeholder="evolab01.softconnect.net.br" {...register('subdomain')} />
          {errors.subdomain && <p className="text-xs text-destructive">{errors.subdomain.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ip">IP *</Label>
        <Input id="ip" placeholder="203.0.113.10" {...register('ip')} />
        {errors.ip && <p className="text-xs text-destructive">{errors.ip.message}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="managerType">Manager Type</Label>
          <Input id="managerType" placeholder="portainer" {...register('managerType')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="managerUrl">Manager URL</Label>
          <Input id="managerUrl" placeholder="https://portainer.exemplo.com" {...register('managerUrl')} />
          {errors.managerUrl && <p className="text-xs text-destructive">{errors.managerUrl.message}</p>}
        </div>
      </div>
      <SecretInput
        id="managerApiKey"
        label={isEdit ? 'Manager API Key (deixe vazio para manter)' : 'Manager API Key'}
        fieldKey="managerApiKey"
        register={register}
        error={errors.managerApiKey?.message}
        getValues={getValues}
        copyLabel="Manager API Key"
      />
      <div className="space-y-1.5">
        <Label htmlFor="monitorUrl">Monitor URL</Label>
        <Input id="monitorUrl" placeholder="https://monitor.exemplo.com" {...register('monitorUrl')} />
        {errors.monitorUrl && <p className="text-xs text-destructive">{errors.monitorUrl.message}</p>}
      </div>
      <SecretInput
        id="monitorApiKey"
        label={isEdit ? 'Monitor API Key (deixe vazio para manter)' : 'Monitor API Key'}
        fieldKey="monitorApiKey"
        register={register}
        error={errors.monitorApiKey?.message}
        getValues={getValues}
        copyLabel="Monitor API Key"
      />
      <div className="space-y-1.5">
        <Label htmlFor="notes">Anotações</Label>
        <Textarea
          id="notes"
          placeholder="Observações internas sobre esta VPS, configurações especiais, histórico…"
          rows={4}
          className="resize-y"
          {...register('notes')}
        />
        <p className="text-xs text-muted-foreground">Campo opcional. Suporta quebras de linha.</p>
      </div>
    </div>
  )
}

function ProviderFormDialog({
  vpsId,
  provider,
  onClose,
}: {
  vpsId: string
  provider?: VpsProvider
  onClose: () => void
}) {
  const isEdit = !!provider
  const create = useCreateVpsProvider(vpsId)
  const update = useUpdateVpsProvider(vpsId, provider?.id ?? '')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreateVpsProviderFormData>({
    resolver: zodResolver(createVpsProviderSchema),
    defaultValues: {
      label: provider?.label ?? '',
      providerUrl: provider?.providerUrl ?? '',
      providerApiKey: provider?.providerApiKey ?? '',
      adapterType: provider?.adapterType ?? 'evolution',
    },
  })

  const watchAdapter = watch('adapterType')

  function onSubmit(data: CreateVpsProviderFormData) {
    if (isEdit) {
      const dto: UpdateVpsProviderFormData = { ...data }
      if (!dto.providerApiKey) delete dto.providerApiKey
      update.mutate(dto, { onSuccess: onClose })
    } else {
      create.mutate(data, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Provider' : 'Novo Provider'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-label">Label *</Label>
            <Input id="p-label" {...register('label')} placeholder="Evolution A" />
            {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-url">Provider URL *</Label>
            <Input id="p-url" {...register('providerUrl')} placeholder="https://evo-a.vps01.softcom.com" />
            {errors.providerUrl && <p className="text-xs text-destructive">{errors.providerUrl.message}</p>}
          </div>
          <SecretInput
            id="p-key"
            label={isEdit ? 'API Key (deixe em branco para manter)' : 'API Key *'}
            fieldKey="providerApiKey"
            register={register}
            error={errors.providerApiKey?.message}
            getValues={getValues}
            copyLabel="Provider API Key"
          />
          <div className="space-y-1.5">
            <Label>Adapter Type *</Label>
            <Select value={watchAdapter} onValueChange={(v) => setValue('adapterType', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adapterOptions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || create.isPending || update.isPending}>
              {create.isPending || update.isPending ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar Provider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProvidersDialog({ vps, onClose }: { vps: VpsServer; onClose: () => void }) {
  const { data: providers, isLoading } = useVpsProviders(vps.id)
  const deactivate = useDeactivateVpsProvider(vps.id)
  const [providerForm, setProviderForm] = useState<{ open: boolean; provider?: VpsProvider }>({ open: false })

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Providers — {vps.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setProviderForm({ open: true })}>
              <Plus className="h-3.5 w-3.5" />
              Novo Provider
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !providers || providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Network className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum provider cadastrado para esta VPS.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium">Label</th>
                    <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Adapter</th>
                    <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">URL</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((prov) => (
                    <tr key={prov.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{prov.label}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{prov.adapterType}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <a
                          href={prov.providerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 max-w-[180px] truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {prov.providerUrl}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            !prov.isActive ? 'secondary' : prov.isHealthy ? 'success' : 'destructive'
                          }
                        >
                          {!prov.isActive ? 'Inativo' : prov.isHealthy ? 'Saudável' : 'Com erro'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setProviderForm({ open: true, provider: prov })}
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {prov.isActive && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deactivate.mutate(prov.id)}
                              title="Desativar"
                            >
                              <PowerOff className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>

      {providerForm.open && (
        <ProviderFormDialog
          vpsId={vps.id}
          provider={providerForm.provider}
          onClose={() => setProviderForm({ open: false })}
        />
      )}
    </Dialog>
  )
}

function EditVpsDialog({ vps, onClose }: { vps: VpsServer; onClose: () => void }) {
  const update = useUpdateVps(vps.id)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<UpdateVpsFormData>({
    resolver: zodResolver(updateVpsSchema),
    defaultValues: {
      label: vps.label,
      subdomain: vps.subdomain,
      ip: vps.ip,
      managerType: vps.managerType ?? '',
      managerUrl: vps.managerUrl ?? '',
      managerApiKey: vps.managerApiKey ?? '',
      monitorUrl: vps.monitorUrl ?? '',
      monitorApiKey: vps.monitorApiKey ?? '',
      notes: vps.notes ?? '',
    },
  })

  function onSubmit(data: UpdateVpsFormData) {
    const dto: UpdateVpsFormData = { ...data }
    if (!dto.managerApiKey) delete dto.managerApiKey
    if (!dto.monitorApiKey) delete dto.monitorApiKey
    update.mutate(dto, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar VPS — {vps.label}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <VpsFormFields
            register={register as ReturnType<typeof useForm<CreateVpsFormData>>['register']}
            errors={errors as ReturnType<typeof useForm<CreateVpsFormData>>['formState']['errors']}
            isEdit={true}
            getValues={getValues as ReturnType<typeof useForm<CreateVpsFormData>>['getValues']}
          />
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || update.isPending}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function VpsPage() {
  const router = useRouter()
  const { data: vpsList, isLoading } = useVpsList()
  const createVps = useCreateVps()
  const deactivateVps = useDeactivateVps()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VpsServer | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<VpsServer | null>(null)
  const [providersTarget, setProvidersTarget] = useState<VpsServer | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (vpsList ?? []).filter((v) => {
      const matchSearch =
        !q ||
        v.label.toLowerCase().includes(q) ||
        v.subdomain.toLowerCase().includes(q) ||
        v.ip.includes(q)
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' ? v.isActive : !v.isActive)
      return matchSearch && matchStatus
    })
  }, [vpsList, search, filterStatus])

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreateVpsFormData>({
    resolver: zodResolver(createVpsSchema),
  })

  function onCreateSubmit(data: CreateVpsFormData) {
    const dto = {
      ...data,
      managerApiKey: data.managerApiKey || undefined,
      monitorApiKey: data.monitorApiKey || undefined,
      managerUrl: data.managerUrl || undefined,
      monitorUrl: data.monitorUrl || undefined,
      notes: data.notes || undefined,
    }
    createVps.mutate(dto, {
      onSuccess: () => {
        setCreateOpen(false)
        reset()
      },
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">VPS</h1>
            <p className="text-sm text-muted-foreground">Gerencie os servidores e seus providers</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova VPS
        </Button>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por label, subdomínio ou IP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
                <th className="px-4 py-3 text-left font-medium">Label</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Subdomínio</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">IP</th>
                <th className="px-4 py-3 text-left font-medium">Providers</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))}

              {!isLoading && vpsList?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Server className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">Nenhuma VPS cadastrada</p>
                  </td>
                </tr>
              )}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma VPS encontrada para os filtros aplicados.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((vps) => {
                  const activeProviders = (vps.providers ?? []).filter((p) => p.isActive)
                  return (
                    <tr key={vps.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{vps.label}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">{vps.subdomain}</td>
                      <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-muted-foreground">{vps.ip}</td>
                      <td className="px-4 py-3">
                        {(vps.providers ?? []).length > 0 ? (
                          <button
                            onClick={() => setProvidersTarget(vps)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Network className="h-3.5 w-3.5" />
                            {activeProviders.length > 0
                              ? `${activeProviders.length} ativo${activeProviders.length > 1 ? 's' : ''}`
                              : '0 ativos'}
                          </button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 gap-1"
                            onClick={() => setProvidersTarget(vps)}
                          >
                            <Plus className="h-3 w-3" />
                            Cadastrar Provider
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={vps.isActive ? 'success' : 'secondary'}>
                          {vps.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => router.push(`/vps/${vps.id}`)}
                            title="Ver detalhe"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setProvidersTarget(vps)}
                            title="Gerenciar providers"
                          >
                            <Network className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditTarget(vps)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {vps.isActive && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeactivateTarget(vps)}
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova VPS</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <VpsFormFields register={register} errors={errors} isEdit={false} getValues={getValues} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setCreateOpen(false); reset() }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || createVps.isPending}>
                {createVps.isPending ? 'Criando…' : 'Criar VPS'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {editTarget && (
        <EditVpsDialog vps={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {providersTarget && (
        <ProvidersDialog vps={providersTarget} onClose={() => setProvidersTarget(null)} />
      )}

      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => { if (!o) setDeactivateTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar VPS?</AlertDialogTitle>
            <AlertDialogDescription>
              A VPS <strong>{deactivateTarget?.label}</strong> e todos os seus providers serão desativados.
              Produtos vinculados podem parar de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deactivateTarget) {
                  deactivateVps.mutate(deactivateTarget.id, { onSuccess: () => setDeactivateTarget(null) })
                }
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

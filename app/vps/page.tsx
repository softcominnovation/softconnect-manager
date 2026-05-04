'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, PowerOff, Server, ExternalLink, Search, Eye, EyeOff, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useVpsList, useCreateVps, useUpdateVps, useDeactivateVps } from '@/hooks/use-vps'
import { createVpsSchema, type CreateVpsFormData } from '@/lib/schemas/vps.schema'
import type { VpsServer } from '@/lib/types'

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
  fieldKey: keyof CreateVpsFormData
  register: ReturnType<typeof useForm<CreateVpsFormData>>['register']
  error?: string
  getValues: ReturnType<typeof useForm<CreateVpsFormData>>['getValues']
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ip">IP *</Label>
          <Input id="ip" placeholder="203.0.113.10" {...register('ip')} />
          {errors.ip && <p className="text-xs text-destructive">{errors.ip.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adapterType">Adapter Type</Label>
          <Input id="adapterType" placeholder="evolution" {...register('adapterType')} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="providerUrl">Provider URL *</Label>
        <Input
          id="providerUrl"
          placeholder="https://evolab01.softconnect.net.br"
          {...register('providerUrl')}
        />
        {errors.providerUrl && <p className="text-xs text-destructive">{errors.providerUrl.message}</p>}
      </div>
      <SecretInput
        id="providerApiKey"
        label={isEdit ? 'Provider API Key (deixe vazio para manter)' : 'Provider API Key *'}
        fieldKey="providerApiKey"
        register={register}
        error={errors.providerApiKey?.message}
        getValues={getValues}
        copyLabel="Provider API Key"
      />
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
    </div>
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

  const [search, setSearch] = useState('')
  const [filterAdapter, setFilterAdapter] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const adapterOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const v of vpsList ?? []) if (v.adapterType) seen.add(v.adapterType)
    return Array.from(seen)
  }, [vpsList])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (vpsList ?? []).filter((v) => {
      const matchSearch =
        !q ||
        v.label.toLowerCase().includes(q) ||
        v.subdomain.toLowerCase().includes(q) ||
        v.ip.includes(q)
      const matchAdapter = filterAdapter === 'all' || v.adapterType === filterAdapter
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' ? v.isActive : !v.isActive)
      return matchSearch && matchAdapter && matchStatus
    })
  }, [vpsList, search, filterAdapter, filterStatus])

  const createForm = useForm<CreateVpsFormData>({ resolver: zodResolver(createVpsSchema) })

  async function onSubmitCreate(data: CreateVpsFormData) {
    await createVps.mutateAsync(data)
    setCreateOpen(false)
    createForm.reset()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">VPS</h1>
            <p className="text-sm text-muted-foreground">Gerencie os servidores VPS do SoftConnect Hub</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : !vpsList?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Server className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground">Nenhuma VPS cadastrada</p>
          <p className="text-sm text-muted-foreground mt-1">Crie a primeira VPS para começar</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Label</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subdomínio</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Adapter</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      Nenhuma VPS encontrada para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((vps) => (
                    <tr key={vps.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{vps.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{vps.subdomain}</td>
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{vps.ip}</td>
                      <td className="px-4 py-3 text-muted-foreground">{vps.adapterType}</td>
                      <td className="px-4 py-3">
                        <Badge variant={vps.isActive ? 'default' : 'secondary'}>
                          {vps.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/vps/${vps.id}`)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditTarget(vps)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {vps.isActive && (
                            <Button variant="ghost" size="sm" onClick={() => setDeactivateTarget(vps)}>
                              <PowerOff className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova VPS</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onSubmitCreate)}>
            <VpsFormFields register={createForm.register} errors={createForm.formState.errors} isEdit={false} getValues={createForm.getValues} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createForm.formState.isSubmitting}>
                {createForm.formState.isSubmitting ? 'Criando...' : 'Criar VPS'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      {editTarget && (
        <EditVpsDialog vps={editTarget} onClose={() => setEditTarget(null)} />
      )}

      {/* Confirm Desativar */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(open: boolean) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar VPS?</AlertDialogTitle>
            <AlertDialogDescription>
              A VPS <strong>{deactivateTarget?.label}</strong> será desativada. Produtos e instâncias vinculadas podem ser afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deactivateTarget) {
                  await deactivateVps.mutateAsync(deactivateTarget.id)
                  setDeactivateTarget(null)
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

function EditVpsDialog({ vps, onClose }: { vps: VpsServer; onClose: () => void }) {
  const updateVps = useUpdateVps(vps.id)
  const form = useForm<CreateVpsFormData>({
    resolver: zodResolver(createVpsSchema.partial().required({ label: true, subdomain: true, ip: true, providerUrl: true }) as never),
    defaultValues: {
      label: vps.label,
      subdomain: vps.subdomain,
      ip: vps.ip,
      providerUrl: vps.providerUrl,
      providerApiKey: vps.providerApiKey ?? '',
      adapterType: vps.adapterType,
      managerType: vps.managerType ?? '',
      managerUrl: vps.managerUrl ?? '',
      managerApiKey: vps.managerApiKey ?? '',
      monitorUrl: vps.monitorUrl ?? '',
      monitorApiKey: vps.monitorApiKey ?? '',
    },
  })

  async function onSubmit(data: CreateVpsFormData) {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
    )
    await updateVps.mutateAsync(payload)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar VPS — {vps.label}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <VpsFormFields register={form.register} errors={form.formState.errors} isEdit getValues={form.getValues} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


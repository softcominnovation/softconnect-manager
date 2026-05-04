'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, PowerOff, Server, ExternalLink } from 'lucide-react'
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
import { useVpsList, useCreateVps, useUpdateVps, useDeactivateVps } from '@/hooks/use-vps'
import { createVpsSchema, type CreateVpsFormData } from '@/lib/schemas/vps.schema'
import type { VpsServer } from '@/lib/types'

function VpsFormFields({
  register,
  errors,
  isEdit,
}: {
  register: ReturnType<typeof useForm<CreateVpsFormData>>['register']
  errors: ReturnType<typeof useForm<CreateVpsFormData>>['formState']['errors']
  isEdit: boolean
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
        <Input id="providerUrl" placeholder="http://203.0.113.10:8080" {...register('providerUrl')} />
        {errors.providerUrl && <p className="text-xs text-destructive">{errors.providerUrl.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="providerApiKey">
          {isEdit ? 'Provider API Key (deixe vazio para manter)' : 'Provider API Key *'}
        </Label>
        <Input id="providerApiKey" type="password" placeholder="••••••••" {...register('providerApiKey')} />
        {errors.providerApiKey && <p className="text-xs text-destructive">{errors.providerApiKey.message}</p>}
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
      <div className="space-y-1.5">
        <Label htmlFor="managerApiKey">Manager API Key</Label>
        <Input id="managerApiKey" type="password" placeholder="••••••••" {...register('managerApiKey')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="monitorUrl">Monitor URL</Label>
          <Input id="monitorUrl" placeholder="https://monitor.exemplo.com" {...register('monitorUrl')} />
          {errors.monitorUrl && <p className="text-xs text-destructive">{errors.monitorUrl.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monitorApiKey">Monitor API Key</Label>
          <Input id="monitorApiKey" type="password" placeholder="••••••••" {...register('monitorApiKey')} />
        </div>
      </div>
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
                {vpsList.map((vps) => (
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
                ))}
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
            <VpsFormFields register={createForm.register} errors={createForm.formState.errors} isEdit={false} />
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
      adapterType: vps.adapterType,
      managerType: vps.managerType ?? '',
      managerUrl: vps.managerUrl ?? '',
      monitorUrl: vps.monitorUrl ?? '',
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
          <VpsFormFields register={form.register} errors={form.formState.errors} isEdit />
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


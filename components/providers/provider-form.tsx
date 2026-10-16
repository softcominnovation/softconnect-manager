'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Copy, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { providerFormSchema, type ProviderFields } from '@/lib/provider-form'
import { Failure } from './shared'

export function ProviderForm({
  initial,
  editing = false,
  vpsOptions,
  pending,
  error,
  onSubmit,
  onCancel,
  onReload,
  legacyAdapters = false,
  onDirtyChange,
}: {
  initial: Omit<ProviderFields, 'providerApiKey'> & { providerApiKey?: string }
  editing?: boolean
  vpsOptions?: { id: string; label: string }[]
  pending: boolean
  error?: unknown
  onSubmit: (values: ProviderFields) => void
  onCancel?: () => void
  onReload?: () => void
  legacyAdapters?: boolean
  onDirtyChange?: (dirty: boolean) => void
}) {
  const [showKey, setShowKey] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isDirty },
  } = useForm<ProviderFields>({
    resolver: zodResolver(providerFormSchema(editing)),
    defaultValues: { ...initial, providerApiKey: initial.providerApiKey ?? '' },
  })
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
        <div className="space-y-1.5">
          <Label htmlFor="provider-label">Nome do provider</Label>
          <Input id="provider-label" {...register('label')} autoComplete="off" />
          {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
        </div>
        {vpsOptions && (
          <div className="space-y-1.5">
            <Label htmlFor="provider-vps">VPS</Label>
            <select
              id="provider-vps"
              {...register('vpsId')}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione uma VPS</option>
              {vpsOptions.map((vps) => (
                <option key={vps.id} value={vps.id}>
                  {vps.label}
                </option>
              ))}
            </select>
            {errors.vpsId && <p className="text-sm text-destructive">{errors.vpsId.message}</p>}
            <Link
              className="block text-sm text-primary underline"
              href="/vps"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cadastrar VPS em outra aba (mantém este formulário)
            </Link>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="provider-url">URL da Evolution</Label>
          <Input
            id="provider-url"
            {...register('providerUrl')}
            placeholder="https://evolution.exemplo.com"
            autoComplete="off"
          />
          {errors.providerUrl && (
            <p className="text-sm text-destructive">{errors.providerUrl.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provider-key">
            {editing ? 'API Key (deixe em branco para manter)' : 'API Key'}
          </Label>
          <div className="relative flex items-center">
            <Input
              id="provider-key"
              type={showKey ? 'text' : 'password'}
              placeholder="••••••••"
              className="pr-20"
              {...register('providerApiKey')}
              autoComplete="new-password"
            />
            <div className="absolute right-1 flex items-center gap-0.5">
              <button
                type="button"
                className="h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                aria-label="Copiar Provider API Key"
                onClick={async () => {
                  const value = getValues('providerApiKey')
                  if (!value) return
                  try {
                    await navigator.clipboard.writeText(value)
                    toast.success('Provider API Key copiada para a área de transferência')
                  } catch {
                    toast.error('Não foi possível copiar a API Key')
                  }
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                onClick={() => setShowKey((value) => !value)}
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          {errors.providerApiKey && (
            <p className="text-sm text-destructive">{errors.providerApiKey.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="provider-adapter">Adapter</Label>
          <select
            id="provider-adapter"
            {...register('adapterType')}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {(legacyAdapters
              ? Array.from(new Set(['evolution', 'baileys', 'business', initial.adapterType]))
              : ['evolution']
            ).map((adapter) => (
              <option key={adapter} value={adapter}>
                {adapter}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      <Failure error={error} onReload={onReload} />
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : editing ? 'Salvar provider' : 'Criar provider'}
        </Button>
      </div>
    </form>
  )
}

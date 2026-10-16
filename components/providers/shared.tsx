'use client'

import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { readinessLabels } from '@/lib/evolutions'

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

export function Choice({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId()
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        {...props}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  )
}

export function Failure({ error, onReload }: { error: unknown; onReload?: () => void }) {
  if (!error) return null
  const conflict = (error as { status?: number }).status === 409
  return (
    <div role="alert" className="space-y-2 rounded-md border border-destructive/40 p-3 text-sm">
      <p>{error instanceof Error ? error.message : 'Não foi possível carregar os dados.'}</p>
      {conflict && (
        <p>
          Os dados podem ter mudado. Suas alterações foram mantidas. Atualize a leitura e revise
          antes de enviar novamente.
        </p>
      )}
      {onReload && (
        <Button type="button" variant="outline" size="sm" onClick={onReload}>
          Atualizar dados para revisar
        </Button>
      )}
    </div>
  )
}

export function Blockers({ codes }: { codes: string[] }) {
  if (!codes.length) return null
  return (
    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
      {codes.map((code) => (
        <li key={code}>{readinessLabels[code] ?? code}</li>
      ))}
    </ul>
  )
}

export function Acknowledgement({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-primary"
      />
      <Label htmlFor={id} className="text-sm font-normal leading-6">
        {children}
      </Label>
    </div>
  )
}

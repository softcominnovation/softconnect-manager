'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Server, Layers, KeyRound, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
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
import { toast } from 'sonner'
import { useProduct, useRotateProductKey } from '@/hooks/use-products'
import { useVpsList } from '@/hooks/use-vps'
import { useProductKeysStore, decryptProductKey } from '@/store/product-keys.store'

function ApiKeyCard({ productId }: { productId: string }) {
  const [visible, setVisible] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const encryptedKey = useProductKeysStore((s) => s.getEncryptedKey(productId))
  const { mutate: rotateKey, isPending } = useRotateProductKey(productId)

  const plainKey = encryptedKey ? decryptProductKey(encryptedKey) : null

  function handleCopy() {
    if (!plainKey) return
    navigator.clipboard.writeText(plainKey)
    toast.success('API Key copiada para a área de transferência')
  }

  function handleRotate() {
    rotateKey(undefined, {
      onSuccess: () => setVisible(false),
    })
    setConfirmRotate(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" />
            API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plainKey ? (
            <>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={visible ? plainKey : '•'.repeat(32)}
                  className="font-mono text-xs"
                />
                <Button variant="ghost" size="icon" onClick={() => setVisible((v) => !v)} title={visible ? 'Ocultar' : 'Mostrar'}>
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCopy} title="Copiar API Key">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta chave autentica as requisições de instâncias deste produto. Mantenha-a segura.
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                A API Key não está disponível neste navegador. Ela é armazenada apenas no momento da criação ou rotação.
              </p>
              <p className="text-sm text-muted-foreground">
                Clique em <strong>Rotacionar</strong> para gerar uma nova chave e acessar as instâncias deste produto.
              </p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full"
            onClick={() => setConfirmRotate(true)}
            disabled={isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Gerando nova key…' : 'Rotacionar API Key'}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmRotate} onOpenChange={setConfirmRotate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotacionar API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Uma nova API Key será gerada. A chave atual será{' '}
              <strong>invalidada imediatamente</strong> — instâncias ativas deste produto
              perderão a autenticação até que recebam a nova chave.
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotate}>
              Rotacionar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: product, isLoading, error } = useProduct(params.id)
  const { data: vpsList } = useVpsList()

  const vps = product?.vpsId ? vpsList?.find((v) => v.id === product.vpsId) : null

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        {isLoading ? (
          <Skeleton className="h-7 w-48" />
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{product?.name}</h1>
            <Badge variant={product?.isActive ? 'success' : 'secondary'}>
              {product?.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Informações do Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
            ) : (
              <>
                <Row label="Nome" value={product?.name} />
                <Row label="Slug" value={<span className="font-mono text-xs">{product?.slug}</span>} />
                <Row label="Adapter" value={product?.adapterType} />
                <Row label="Hub Relay" value={product?.hubRelay ? 'Ativado' : 'Desativado'} />
                <Row
                  label="Criado em"
                  value={product?.createdAt ? new Date(product.createdAt).toLocaleDateString('pt-BR') : '—'}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-primary" />
              Infraestrutura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
            ) : (
              <>
                <Row
                  label="VPS vinculada"
                  value={vps ? `${vps.label} (${vps.ip})` : <span className="italic text-muted-foreground">Nenhuma</span>}
                />
                {product?.origins && product.origins.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Origens permitidas</span>
                    <div className="flex flex-col gap-1">
                      {product.origins.map((o) => (
                        <span key={o} className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 w-fit">{o}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(!product?.origins || product.origins.length === 0) && (
                  <Row label="Origens permitidas" value={<span className="italic text-muted-foreground">Nenhuma configurada</span>} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {!isLoading && <ApiKeyCard productId={params.id} />}
      </div>

      <Button
        variant="outline"
        className="gap-2"
        onClick={() => router.push(`/instances?productId=${params.id}`)}
        disabled={isLoading}
      >
        <Layers className="h-4 w-4" />
        Ver instâncias vinculadas
      </Button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value ?? '—'}</span>
    </div>
  )
}


'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

const SOFTCOM_URL = process.env.NEXT_PUBLIC_SOFTCOM_URL ?? '#'
const COPYRIGHT = `© 2024${new Date().getFullYear()} Softcom Tecnologia. Todos os direitos reservados.`

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, isLoading, router])

  async function onSubmit(data: LoginFormData) {
    const success = await login(data.email, data.password)
    if (success) router.replace('/dashboard')
    else toast.error('Credenciais inválidas. Verifique e-mail e senha.')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Painel esquerdo  desktop only */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-between p-12 bg-card border-r border-border">
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Image src="/favicon.png" alt="Softconnect Manager" width={64} height={64} className="rounded-xl" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Softconnect</h1>
              <p className="text-lg font-medium text-primary">Manager</p>
            </div>
          </div>
          <Image
            src="/images/home-ilustration.svg"
            alt="Ilustração"
            width={320}
            height={240}
            className="opacity-80"
            priority
          />
          <a href={SOFTCOM_URL} target="_blank" rel="noopener noreferrer">
            <Image
              src="/images/logo.png"
              alt="Softcom Tecnologia"
              width={140}
              height={40}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </a>
        </div>
        <p className="text-xs text-muted-foreground text-center">{COPYRIGHT}</p>
      </div>

      {/* Painel direito  sempre visível */}
      <div className="flex w-full lg:w-1/2 flex-col min-h-screen">
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Image src="/favicon.png" alt="Softconnect Manager" width={48} height={48} className="rounded-xl" />
              <p className="text-lg font-bold text-foreground">Softconnect Manager</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Entrar</h2>
              <p className="mt-1 text-sm text-muted-foreground">Acesse o painel administrativo do SoftConnect Hub</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="admin@exemplo.com" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="" autoComplete="current-password" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <div className="lg:hidden flex justify-center mt-6">
              <a href={SOFTCOM_URL} target="_blank" rel="noopener noreferrer">
                <Image
                  src="/images/logo.png"
                  alt="Softcom Tecnologia"
                  width={120}
                  height={36}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
            </div>
          </div>
        </div>
        <p className="lg:hidden text-xs text-muted-foreground text-center px-8 pb-6">{COPYRIGHT}</p>
      </div>
    </div>
  )
}

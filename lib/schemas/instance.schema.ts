import { z } from 'zod'

export const createInstanceSchema = z.object({
  instanceName: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(64, 'Nome muito longo')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Apenas letras, números, hífens e underscores'
    ),
  number: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\d{10,13}$/.test(v.replace(/\D/g, '')),
      'Informe DDD + número (ex: 83991300001)',
    )
    .transform((v) => (v ? v.replace(/\D/g, '') : undefined)),
  token: z.string().optional(),
  integration: z
    .enum(['WHATSAPP-BAILEYS', 'WHATSAPP-BUSINESS'])
    .optional(),
})

export type CreateInstanceFormData = z.infer<typeof createInstanceSchema>


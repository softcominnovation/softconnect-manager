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
  token: z.string().optional(),
  integration: z
    .enum(['WHATSAPP-BAILEYS', 'WHATSAPP-BUSINESS'])
    .optional(),
})

export type CreateInstanceFormData = z.infer<typeof createInstanceSchema>

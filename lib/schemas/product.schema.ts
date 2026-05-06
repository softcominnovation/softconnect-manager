import { z } from 'zod'

function refineBatchWebhook(
  data: { batchWebhookEnabled?: boolean; batchWebhookUrl?: string | null },
  ctx: z.RefinementCtx,
) {
  if (!data.batchWebhookEnabled) return
  const url = data.batchWebhookUrl?.trim()
  if (!url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A URL do webhook é obrigatória quando a notificação de lote está ativa.',
      path: ['batchWebhookUrl'],
    })
    return
  }
  try {
    if (new URL(url).protocol !== 'https:') throw new Error()
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe uma URL válida com o formato https://',
      path: ['batchWebhookUrl'],
    })
  }
}

const productBaseFields = z.object({
  name: z.string().min(2, 'Nome obrigatório (mínimo 2 caracteres)'),
  slug: z
    .string()
    .min(2, 'Slug obrigatório (mínimo 2 caracteres)')
    .regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens'),
  vpsId: z.string().uuid('Selecione uma VPS válida').optional().or(z.literal('')),
  adapterType: z.string().optional(),
  origins: z.array(z.string().url('URL inválida')).optional(),
  hubRelay: z.boolean().optional(),
  batchWebhookEnabled: z.boolean().optional(),
  batchWebhookUrl: z.string().optional().or(z.literal('')),
})

export const createProductSchema = productBaseFields.superRefine(refineBatchWebhook)

export const updateProductSchema = productBaseFields
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .superRefine(refineBatchWebhook)

export type CreateProductFormData = z.infer<typeof createProductSchema>
export type UpdateProductFormData = z.infer<typeof updateProductSchema>

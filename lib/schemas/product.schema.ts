import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório (mínimo 2 caracteres)'),
  slug: z
    .string()
    .min(2, 'Slug obrigatório (mínimo 2 caracteres)')
    .regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens'),
  vpsId: z.string().uuid('Selecione uma VPS válida').optional().or(z.literal('')),
  adapterType: z.string().optional(),
  hubRelay: z.boolean().optional(),
})

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type CreateProductFormData = z.infer<typeof createProductSchema>
export type UpdateProductFormData = z.infer<typeof updateProductSchema>

import { z } from 'zod'

export const createVpsSchema = z.object({
  label: z.string().min(1, 'Label obrigatório'),
  subdomain: z.string().min(1, 'Subdomínio obrigatório'),
  ip: z.string().min(1, 'IP obrigatório'),
  providerUrl: z.string().url('URL inválida'),
  providerApiKey: z.string().min(1, 'API Key do provider obrigatória'),
  adapterType: z.string().optional(),
  managerType: z.string().optional(),
  managerUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  managerApiKey: z.string().optional(),
  monitorUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  monitorApiKey: z.string().optional(),
})

export const updateVpsSchema = createVpsSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Informe ao menos um campo')

export type CreateVpsFormData = z.infer<typeof createVpsSchema>
export type UpdateVpsFormData = z.infer<typeof updateVpsSchema>

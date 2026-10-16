import { z } from 'zod'

export const providerFormSchema = (editing: boolean) =>
  z.object({
    label: z.string().trim().min(1, 'Informe o nome.').max(255),
    providerUrl: z
      .string()
      .trim()
      .url('Informe uma URL válida.')
      .refine((value) => /^https?:\/\//i.test(value), 'Use http ou https.'),
    providerApiKey: editing
      ? z.string().max(8192)
      : z
          .string()
          .max(8192)
          .refine((value) => !!value.trim(), 'Informe a API Key.'),
    adapterType: z.string().min(1),
    vpsId: z.string().min(1, 'Selecione uma VPS.'),
  })
export type ProviderFields = z.infer<ReturnType<typeof providerFormSchema>>

// Basic edits cannot reset capacity, admissions, links or product defaults.
export function providerChanges(
  values: ProviderFields,
  original: Omit<ProviderFields, 'providerApiKey'> & { providerApiKey?: string }
) {
  const result: Partial<ProviderFields> = {}
  for (const key of ['label', 'providerUrl', 'adapterType', 'vpsId'] as const) {
    if (values[key] !== original[key]) result[key] = values[key]
  }
  if (values.providerApiKey.trim() && values.providerApiKey !== original.providerApiKey)
    result.providerApiKey = values.providerApiKey
  return result
}

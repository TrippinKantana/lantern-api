import { z } from 'zod'

const optionalString = z.string().transform((v) => v || undefined).optional()
const optionalUrl = z.string().transform((v) => v || undefined).optional()

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  domain: optionalString,
  industry: optionalString,
  address: optionalString,
  phone: optionalString,
  website: optionalUrl,
})

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  domain: optionalString,
  industry: optionalString,
  address: optionalString,
  phone: optionalString,
  website: optionalUrl,
  isActive: z.boolean().optional(),
})

export const assignRepSchema = z.object({
  userId: z.string().min(1),
  role: z.string().default('account_manager'),
  isPrimary: z.boolean().default(false),
})

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type AssignRepInput = z.infer<typeof assignRepSchema>

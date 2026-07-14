import { z } from 'zod'

const userRoleEnum = z.enum([
  'SUPER_ADMIN',
  'LANTERN_STAFF',
  'PROJECT_MANAGER',
  'SUPPORT_AGENT',
  'FINANCE_MANAGER',
  'CLIENT_ADMIN',
  'CLIENT_USER',
])

/** Roles offered in the product UI (legacy specialty roles remain in DB for compatibility). */
export const inviteRoleEnum = z.enum(['LANTERN_STAFF', 'CLIENT_ADMIN', 'CLIENT_USER'])

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  /** Omit or leave empty to auto-generate a temporary password. */
  password: z.string().min(8).optional(),
  /** When true (default for staff create without password), return plaintext temp password once. */
  generatePassword: z.boolean().optional(),
  role: userRoleEnum,
  companyId: z.string().optional().nullable(),
  phone: z.string().optional(),
  // HR / staff profile fields
  jobTitle: z.string().optional(),
  departmentId: z.string().optional().nullable(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern']).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
})

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  role: userRoleEnum.optional(),
})

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: inviteRoleEnum,
  companyId: z.string().optional().nullable(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type InviteUserInput = z.infer<typeof inviteUserSchema>

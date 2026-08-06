import { z } from 'zod'

const optionalString = z.string().transform((v) => v || undefined).optional()
const optionalNumber = z.coerce.number().optional()

export const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  department: optionalString,
  location: optionalString,
  locationType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).default('REMOTE'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).default('FULL_TIME'),
  summary: optionalString,
  description: z.string().min(1, 'Description is required'),
  requirements: optionalString,
  responsibilities: optionalString,
  salaryMin: optionalNumber,
  salaryMax: optionalNumber,
  salaryCurrency: z.string().default('USD'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).default('DRAFT'),
  closesAt: optionalString,
})

export const updateJobSchema = z.object({
  title: z.string().min(1).optional(),
  department: optionalString,
  location: optionalString,
  locationType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  summary: optionalString,
  description: z.string().min(1).optional(),
  requirements: optionalString,
  responsibilities: optionalString,
  salaryMin: optionalNumber,
  salaryMax: optionalNumber,
  salaryCurrency: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
  closesAt: optionalString,
})

export const updateApplicationSchema = z.object({
  status: z.enum(['new', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'rejected', 'hired']).optional(),
  notes: optionalString,
})

export type CreateJobInput = z.infer<typeof createJobSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>

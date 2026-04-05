import { z } from "zod";
import { objectIdSchema } from "./user.schemas.js";

const finiteNumberMessage = "Value must be a finite number";

const positiveMoney = z
  .number()
  .refine(Number.isFinite, { message: finiteNumberMessage })
  .positive("Amount must be greater than 0");

const nonNegativeMoney = z
  .number()
  .refine(Number.isFinite, { message: finiteNumberMessage })
  .nonnegative("Amount must be greater than or equal to 0");

export const projectIdParamsSchema = z.object({
  params: z.object({
    projectId: objectIdSchema,
  }),
});

export const createProjectBodySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(160),
    description: z.string().trim().min(1, "Description is required").max(4000),
    targetCapital: positiveMoney,
    ownerInvestment: nonNegativeMoney.optional().default(0),
    maxInvestmentPercentage: z
      .number()
      .refine(Number.isFinite, { message: finiteNumberMessage })
      .min(1)
      .max(100)
      .optional()
      .default(50),
  })
  .strict();

export const createProjectRequestSchema = z.object({
  body: createProjectBodySchema,
});

export const updateProjectBodySchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().min(1).max(4000).optional(),
    targetCapital: positiveMoney.optional(),
    maxInvestmentPercentage: z
      .number()
      .refine(Number.isFinite, { message: finiteNumberMessage })
      .min(1)
      .max(100)
      .optional(),
  })
  .strict();

export const updateProjectRequestSchema = z.object({
  params: z.object({
    projectId: objectIdSchema,
  }),
  body: updateProjectBodySchema,
});

export type CreateProjectInput = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectBodySchema>;

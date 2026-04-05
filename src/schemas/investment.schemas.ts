import { z } from "zod";
import { objectIdSchema } from "./user.schemas.js";

const finiteNumberMessage = "Value must be a finite number";

export const investInProjectRequestSchema = z.object({
  params: z.object({
    projectId: objectIdSchema,
  }),
  body: z
    .object({
      amount: z
        .number()
        .refine(Number.isFinite, { message: finiteNumberMessage })
        .positive("Amount must be greater than 0"),
    })
    .strict(),
});

export const investorIdParamsSchema = z.object({
  params: z.object({
    investorId: objectIdSchema,
  }),
});

export const ownerIdParamsSchema = z.object({
  params: z.object({
    ownerId: objectIdSchema,
  }),
});

export type InvestInProjectInput = z.infer<typeof investInProjectRequestSchema>["body"];

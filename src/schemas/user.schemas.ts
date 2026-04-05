import { z } from "zod";

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

export const userRoleSchema = z.enum(["OWNER", "INVESTOR", "ADMIN"]);
const finiteNumberMessage = "Value must be a finite number";

export const userSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Invalid email address")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    role: userRoleSchema,
    balance: z
      .number()
      .nonnegative()
      .refine(Number.isFinite, { message: finiteNumberMessage })
      .optional(),
  })
  .strict();

export const registerUserBodySchema = userSchema.pick({
  name: true,
  email: true,
  password: true,
  role: true,
  balance: true,
});

export const loginBodySchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Invalid email address")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
  })
  .strict();


export const createUserRequestSchema = z.object({
  body: userSchema,
});

export const registerRequestSchema = z.object({
  body: registerUserBodySchema,
});

export const loginRequestSchema = z.object({
  body: loginBodySchema,
});


export const userBalanceUpdateSchema = z.object({
  body: z.object({
	operation: z.enum(["add", "deduct"]),
	amount: z
	  .number()
	  .refine(Number.isFinite, { message: finiteNumberMessage }),
  }),
});

export const userIdParamsSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
});

export const userBalanceUpdateRequestSchema = z.object({
  params: z.object({
    userId: objectIdSchema,
  }),
  body: userBalanceUpdateSchema.shape.body,
});








export type UserInput = z.infer<typeof userSchema>;
export type RegisterUserInput = z.infer<typeof registerUserBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
export type UserBalanceUpdateInput = z.infer<typeof userBalanceUpdateSchema>["body"];

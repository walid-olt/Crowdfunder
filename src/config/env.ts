import z from 'zod';
import { config } from 'dotenv';

/*
  we use zod to validate the environment variables 
  and provide type safety before we use them in our application.
  preventing runtime errors due to missing or invalid environment variables.
*/

const envSchema = z.object({
	PORT: z.string().default('3000'),
	MONGODB_URI: z.string(),
	MONGODB_DB_NAME: z.string().default('crowdfund'),
	JWT_SECRET_KEY: z
		.string()
		.min(32, { message: 'jwt secret key too short ' }),
	JWT_EXPIRES_IN: z.string().default('1h'),
});
export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
	config();
	const { success, data, error } = envSchema.safeParse(process.env);
	if (!success) {
		console.error('Invalid environment variables', error.message);
		process.exit(1);
	}
	return data;
}

const env = loadEnv();
export default env;

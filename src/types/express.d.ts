import type { Iuser } from "../interfaces/index.js";

type AuthenticatedUser = {
  id: string;
  email: string;
  role: Iuser["role"];
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}
export {};
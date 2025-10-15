//import { User } from "@/context/AuthContext";

// Resposta de /login
export interface LoginResponse {
  token?: string;
  access_token?: string;
  accessToken?: string;
  user?: User;
}

// Resposta de /me
export interface MeResponse {
  user?: User;
}

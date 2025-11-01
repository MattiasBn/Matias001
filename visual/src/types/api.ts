export interface User {
  id: number;
  name: string;
  email: string;
  role: "funcionario" | "administrador" | "gerente";
  password?: string | null;
  telefone: string | null;
  confirmar: boolean;
  photo?: string | null;
  google_id?: string;
  is_profile_complete?: boolean;
  login_type?: "google" | "normal";
}
export type MeResponse = User;

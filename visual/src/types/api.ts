export interface User {
  id: number;
  name: string;
  email: string;
  role: "funcionario" | "administrador" | "gerente";
  telefone: string | null;
  confirmar: boolean;
  photo?: string | null;
  google_id?: string
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

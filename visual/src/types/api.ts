
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
}

export interface LoginResponse {
  token: string;
  user: User;
  must_completar_registro?: boolean;
}

export interface MeResponse {
  user: User;
}

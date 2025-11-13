// src/types/api.ts

export interface User {
  id: number;
  name: string;
  email: string;
  role: "funcionario" | "administrador" | "gerente";
  
  // Tipagens existentes:
  password?: string | null;
  telefone: string | null;
  confirmar: boolean;
  photo?: string | null;
  google_id?: string;
  login_type?: "google" | "normal"; // O Laravel retorna 'google' ou 'email'
  
  //  CORREÇÃO / NOVO CAMPO COMPUTADO PELO LARAVEL
  perfil_incompleto?: boolean; 
}

export type MeResponse = User;
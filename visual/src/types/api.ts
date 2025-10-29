// NO ARQUIVO: types/api.ts (REVISADO)

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
}

// ✅ CORRETO: MeResponse agora é o próprio objeto User, 
// pois o Laravel está a retornar todos os campos do usuário diretamente no JSON.
export type MeResponse = User; 

// *******************************************************************
// Nota: A sua implementação do /me em Laravel (que retorna todos os campos
// de $user num objeto JSON) é idêntica ao que a interface User representa.
// Por isso, 'export type MeResponse = User' é o correto.
// *******************************************************************
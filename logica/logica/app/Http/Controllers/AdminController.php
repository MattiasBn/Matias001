<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class AdminController extends Controller
{
    /**
     * Listar utilizadores por ordem alfabética e agrupados por role
     */
    public function index()
    {
        $users = User::orderBy('role')
            ->orderBy('name', 'asc')
            ->get()
            ->groupBy('role'); // Agrupa por role

        return response()->json($users);
    }

    /**
     * Ver detalhes de um utilizador
     */
    public function show($id)
    {
        $user = User::findOrFail($id);

        return response()->json($user);
    }

    /**
     * Confirmar conta de utilizador
     */
    public function confirmarConta($id)
    {
        $user = User::findOrFail($id);
        $user->confirmar = true;
        $user->save();

        return response()->json([
            'message' => 'Conta confirmada com sucesso.',
            'user'    => $user
        ]);
    }

    /**
     * Ativar/desativar conta
     */
    public function toggleConfirmar($id)
    {
        $user = User::findOrFail($id);
        $user->confirmar = !$user->confirmar;
        $user->save();

        return response()->json([
            'message' => $user->confirmar
                ? 'Conta ativada com sucesso.'
                : 'Conta desativada com sucesso.',
            'user' => $user
        ]);
    }

    /**
     * Atualizar dados do utilizador (role, nome, email, telefone, etc.)
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'telefone' => 'nullable|string|max:20|unique:users,telefone,' . $id,
            'role'     => 'in:funcionario,administrador,gerente',
        ]);

        $user->update($request->only('name', 'email', 'telefone', 'role'));

        return response()->json([
            'message' => 'Usuário atualizado com sucesso.',
            'user'    => $user,
        ]);
    }



    /**
 * Listar utilizadores em formato simples (sem agrupamento)
 */
public function lista()
{
    $users = User::orderBy('role')
        ->orderBy('name', 'asc')
        ->get();

    return response()->json($users);
}


    /**
     * Remover utilizador
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Usuário removido com sucesso.']);
    }
}

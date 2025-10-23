<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Laravel\Socialite\Contracts\Provider;
use Illuminate\Support\Facades\Http;


class AuthController extends Controller
{
    /**
     * Registrar novo usuário
     *//**
     * Registrar novo usuário
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'      => 'required|string|max:255|unique:users', // Adicionada regra 'unique:users'
            'email'     => 'required|string|email|max:255|unique:users',
            'password'  => 'required|string|min:8|confirmed',
            'role'      => 'in:funcionario,administrador,gerente',
            'telefone'  => 'required|string|max:20|unique:users', // Alterada para 'required' e 'unique'
        ]);

        $user = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => $request->role ?? 'funcionario',
            'telefone'  => $request->telefone,
            'confirmar' => false, // conta bloqueada até aprovação
            'photo'     => $request->photo,
        ]);

        return response()->json([
            'message' => 'Registro efetuado com sucesso. Aguarde a confirmação do administrador.',
            'user'    => $user,
        ], 201);
    }

    /**
     * Login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'As credenciais fornecidas estão incorretas.',
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 🚨 Bloqueia se não foi confirmado
        if (!$user->confirmar) {
            Auth::logout();
            return response()->json([
                'message' => 'A sua conta ainda não foi confirmada pelo administrador.',
            ], 403);
        }

        // Revoga tokens antigos
        $user->tokens()->delete();

        // Cria token novo
        $token = $user->createToken('auth_token', [$user->role])->plainTextToken;

        return response()->json([
            'message'      => 'Login efetuado com sucesso.',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user,
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Sessão terminada com sucesso.']);
    }

    /**
     * Dados do utilizador logado
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Atualizar perfil
     */
    public function atualizarPerfil(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'telefone' => 'nullable|string|max:20|unique:users,telefone,' . $user->id,
        ]);

        $user->update($request->only('name', 'email', 'telefone'));

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'user'    => $user,
        ]);
    }

    /**
     * Alterar senha
     */
    public function alterarSenha(Request $request)
    {
        $request->validate([
            'current_password' => ['required','string'],
            'password'         => ['required','string','min:8','confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'A senha atual está incorreta.',
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->setRememberToken(null)->save();

        return response()->json(['message' => 'Senha alterada com sucesso.']);
    }

    /**
     * Deletar conta
     */
    public function deletarConta(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Conta deletada com sucesso.']);
    }

    /**
     * Listar todos utilizadores
     */
    public function listarUtilizadores()
    {
        return response()->json(User::all());
    }

    /**
     * Pesquisar utilizadores
     */
    public function pesquisarUtilizadores(Request $request)
    {
        $query = $request->input('query');

        $users = User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->orWhere('role', 'like', "%{$query}%")
            ->get();

        return response()->json($users);
    }

// funcao do socialite 

/**
 * 1) D/**
 * Redirect via WEB (usa session cookies) - abre a página do Google
 */

/**
 * Callback WEB do Google
 * - cria/acha user
 * - se novo: guarda dados temporários no cache e redireciona para front /complete-registration?social_key=...
 * -/**
 * Redireciona para o Google (web flow)
 */

  public function redirectToGoogleWeb()
{
    return Socialite::driver('google')
        ->stateless()
        ->redirect();
}


    public function handleGoogleCallbackWeb()
    {
        try {
            $provider = Socialite::driver('google');
            $googleUser = $provider->stateless()->user();
        } catch (\Exception $e) {
            return redirect()->away(env('APP_FRONTEND_URL') . '/login?error=google_callback');
        }

        $user = User::where('email', $googleUser->getEmail())->first();

        if (!$user) {
            $user = User::create([
                'name'      => $googleUser->getName(),
                'email'     => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'photo'     => $googleUser->getAvatar(),
                'password'  => Hash::make(Str::random(40)),
                'role'      => 'funcionario',
                'confirmar' => false,
            ]);
        } else {
            $updated = false;
            if (!$user->google_id) { $user->google_id = $googleUser->getId(); $updated = true; }
            if (!$user->photo && $googleUser->getAvatar()) { $user->photo = $googleUser->getAvatar(); $updated = true; }
            if ($updated) $user->save();
        }

        // Revoga tokens antigos e gera um novo
        $user->tokens()->delete();
        $token = $user->createToken('auth_token', [$user->role])->plainTextToken;

        return redirect()->away(env('APP_FRONTEND_URL') . '/auth/callback?token=' . $token);
    }
 
}

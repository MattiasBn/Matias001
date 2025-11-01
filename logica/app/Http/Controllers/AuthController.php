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
                'status_code' => 'PENDING_APPROVAL'
            ], 403);
        }

        // Revoga tokens antigos
        $user->tokens()->delete();

        // Cria token novo
        $token = $user->createToken('auth_token', [$user->role])->plainTextToken;

        return response()->json([
            'message'      => 'Login efetuado com sucesso.',
             'token'        => $token, // ✅ adicionado
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
        $user = $request->user();

        return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role,
        'confirmar' => $user->confirmar,
        'photo' => $user->photo,
        'login_type' => $user->login_type, // 👈 adiciona isto
        // O campo 'is_profile_complete' é fornecido pelo Accessor que criamos
        'is_profile_complete' => $user->is_profile_complete, 
    ]);

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

public function redirectToGoogleWeb(Request $request)
    {
        $state = $request->query('state', 'login');

        return Socialite::driver('google')
            ->with(['state' => $state])
            ->stateless()
            ->redirect();
    }

    // Dentro da classe AuthController
public function handleGoogleCallbackWeb(Request $request)
{
    $frontendUrl = env('FRONTEND_URL', 'https://sismatias.onrender.com');
    $state = $request->query('state', 'login');

    try {
        $socialiteUser = Socialite::driver('google')->stateless()->user();
    } catch (\Exception $e) {
        return redirect()->away("{$frontendUrl}/auth/callback?error_code=google_callback");
    }

    // Procura usuário existente pelo e-mail
    $user = User::where('email', $socialiteUser->getEmail())->first();

    /**
     * =========================================================
     * A. REGISTO (CRIAR CONTA NOVA)
     * =========================================================
     */
    if ($state === 'register') {
        if ($user) {
            // Já existe — redireciona para login
            return redirect()->away("{$frontendUrl}/login?error=email_existente");
        }

        // Cria conta nova, pendente de aprovação
        $user = User::create([
            'email'     => $socialiteUser->getEmail(),
            'name'      => $socialiteUser->getName(),
            'google_id' => $socialiteUser->getId(),
            'password'  => null,
            'telefone'  => null,
            'confirmar' => false, // aguardando aprovação
            'role'      => 'funcionario',
            'photo'     => $socialiteUser->getAvatar(),
        ]);

        // Redireciona com aviso
        return redirect()->away("{$frontendUrl}/login?message_code=REGISTER_PENDING_APPROVAL");
    }

    /**
     * =========================================================
     * B. LOGIN (ACESSO A CONTA EXISTENTE)
     * =========================================================
     */
    if (!$user) {
        return redirect()->away("{$frontendUrl}/login?error=user_not_found");
    }

    // 1️⃣ Verifica se o admin já aprovou
    if (!$user->confirmar) {
        return redirect()->away("{$frontendUrl}/login?message_code=PENDING_APPROVAL");
    }

    // 2️⃣ Revoga tokens antigos
    $user->tokens()->delete();

    // 3️⃣ Cria novo token com o role do usuário
    $token = $user->createToken('auth_token', [$user->role])->plainTextToken;

    // 4️⃣ Verifica se o perfil está completo (senha + telefone)
    if (!$user->is_profile_complete) {
        // Perfil incompleto → redireciona para completar registo
        return redirect()->away("{$frontendUrl}/auth/callback?token={$token}&state=incomplete");
    }

    // 5️⃣ Perfil completo → redireciona para o dashboard normal
    return redirect()->away("{$frontendUrl}/auth/callback?token={$token}&state=complete");
}

    
 // Dentro da classe AuthControllerpublic 

 function completeRegistration(Request $request)
{
    
    $user = auth()->user();

    $request->validate([
        'telefone' => 'required|string|unique:users,telefone,' . $user->id,
        'password' => 'required|confirmed|min:9',
    ]);

    $user->telefone = $request->telefone;
    $user->password = bcrypt($request->password);
    $user->is_profile_complete = true;
    $user->save();

    // 🚀 Atualiza token (se necessário)
    $token = $user->createToken('API Token')->plainTextToken;

    return response()->json([
        'message' => 'Perfil atualizado com sucesso.',
        'access_token' => $token,
        'user' => $user,
    ]);
}


}

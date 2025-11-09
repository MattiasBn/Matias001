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
        'name'      => 'required|string|max:255|unique:users',
        'email'     => 'required|string|email|max:255|unique:users',
        'password'  => 'required|string|min:8|confirmed',
        'role'      => 'in:funcionario,administrador,gerente',
        'telefone'  => 'required|string|max:20|unique:users',
    ]);

    $email = $request->email;
    $apiKey = env('ABSTRACT_API_KEY');

    //caminho da api usada para identificar email valido a ser cadastrado 
    //https://app.abstractapi.com/api/email-reputation/settings

    // ✅ URL correta para validação real
    $url = "https://emailreputation.abstractapi.com/v1/?api_key={$apiKey}&email={$email}";

    try {
        $response = Http::timeout(10)->get($url);
        $data = $response->json();

        if (!isset($data['email_deliverability']['status']) || $data['email_deliverability']['status'] !== 'deliverable') {
            return response()->json([
                'message' => 'O Nosso Sistema Verificou que o E-mail introduzido não é válido, ou não pode receber mensagens.'
            ], 422);
        }
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erro ao verificar e-mail. Tente novamente mais tarde.',
            'error' => $e->getMessage()
        ], 500);
    }

    $user = User::create([
        'name'      => $request->name,
        'email'     => $email,
        'password'  => Hash::make($request->password),
        'role'      => $request->role ?? 'funcionario',
        'telefone'  => $request->telefone,
        'confirmar' => false,
        'photo'     => $request->photo ?? null,
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
        'id'         => $user->id,
        'name'       => $user->name,
        'email'      => $user->email,
        'role'       => $user->role,
        'confirmar'  => (bool) $user->confirmar,
        'photo'      => $user->photo,
        'login_type' => $user->login_type ?? 'email', // evita erro se campo não existir
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
    $validated = $request->validate([
        'current_password' => ['required','string'],
        'password'         => ['required','string','min:8','confirmed'],
    ]);

    $user = $request->user();

    if (!Hash::check($validated['current_password'], $user->password)) {
        return response()->json(['message' => 'A senha atual está incorreta.'], 422);
    }

    $user->update(['password' => Hash::make($validated['password'])]);

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

    $user = User::where('email', $socialiteUser->getEmail())->first();

    // 🔹 A. REGISTO
    if ($state === 'register') {
        if ($user) {
            return redirect()->away("{$frontendUrl}/login?error=email_existente");
        }

        $user = User::create([
            'email'     => $socialiteUser->getEmail(),
            'name'      => $socialiteUser->getName(),
            'google_id' => $socialiteUser->getId(),
            'photo'     => $socialiteUser->getAvatar(),
            'email_verified_at'=>now(),
            'password'  => null,
            'telefone'  => null,
            'confirmar' => false,
            'role'      => 'funcionario',
        ]);

        return redirect()->away("{$frontendUrl}/login?message_code=REGISTER_PENDING_APPROVAL");
    }

    // 🔹 B. LOGIN
    if (!$user) {
        return redirect()->away("{$frontendUrl}/login?error=user_not_found");
    }

    if (!$user->confirmar) {
        return redirect()->away("{$frontendUrl}/login?message_code=PENDING_APPROVAL");
    }

    // Atualiza foto caso esteja vazia
    if (!$user->photo && $socialiteUser->getAvatar()) {
        $user->update(['photo' => $socialiteUser->getAvatar()]);
    }

    // Revoga tokens antigos e cria novo
    $user->tokens()->delete();

    $token = $user->createToken('auth_token', [$user->role])->plainTextToken;



    return redirect()->away("{$frontendUrl}/auth/callback?token={$token}&state=complete");
}
 
}
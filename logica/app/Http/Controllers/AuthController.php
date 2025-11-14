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
   // ... dentro de public function me(Request $request)
public function me(Request $request)
{
    $user = $request->user();

    // 🚨 CORREÇÃO NA LÓGICA DE PERFIL INCOMPLETO:
    // O perfil está incompleto se for uma conta social (google_id preenchido)
    // E faltar o telefone. A senha pode ser NULL e o frontend lida com isso.
    // Vamos usar a flag que você já criou no Socialite.
    
    // Simplificando o cálculo do perfil_incompleto com base nas suas colunas:
    $isSocialLogin = !empty($user->google_id);
    
    // Consideramos incompleto se:
    // 1. É um login social E o telefone é NULL.
    // 2. É um login social E a senha é NULL (para forçar o cadastro da senha).
    $perfilIncompleto = (
        $isSocialLogin && 
        (empty($user->telefone) || empty($user->password))
    );

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email'=> $user->email,
        'role' => $user->role,
        'confirmar'=> (bool) $user->confirmar,
        'photo' => $user->photo,
        'telefone'  => $user->telefone,
        // 🚨 CRÍTICO: Use o google_id para determinar o tipo de login
        'login_type' => $user->google_id ? 'google' : 'email', 
        'perfil_incompleto' => $perfilIncompleto, // <-- Esta flag agora é precisa
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
            'photo' => 'nullable|image|max:2048', // até 2MB
        ]);

         if ($request->hasFile('photo')) {
            if ($user->photo) Storage::delete($user->photo); // apaga foto antiga
            $user->photo = $request->file('photo')->store('perfil', 'public');
        }


        $user->update($request->only('name', 'email', 'telefone', 'photo'));

        return response()->json([
            'message' => 'Perfil atualizado com sucesso.',
            'user'    => $user,
        ]);
    }

    /**
     * Alterar senha
     */// ... dentro de public function alterarSenha(Request $request)
public function alterarSenha(Request $request)
{
    $user = $request->user();

    // 1. 🚨 Lógica CRÍTICA para determinar se a senha atual é obrigatória
    // Senha atual é obrigatória SOMENTE se o usuário tiver uma senha no banco
    $requiresCurrentPassword = !empty($user->password);
    
    // 2. Definir regras de validação base
    $rules = [
        // Adiciona a validação de segurança de min:9 e regex do RegisterForm
        'password' => [
            'required',
            'string',
            'min:9',
            'confirmed',
            'regex:/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{9,}$/',
        ],
    ];

    // 3. Adicionar regra condicional para Senha Atual
    if ($requiresCurrentPassword) {
        $rules['current_password'] = ['required', 'string'];
    }

    // Validação
    $validated = $request->validate($rules);

    // 4. Se a senha atual é exigida, checar se ela está correta
    if ($requiresCurrentPassword) {
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                // Mensagem de erro que o frontend espera (no campo current_password)
                'errors' => ['current_password' => ['A senha atual está incorreta.']], 
                'message' => 'A senha atual está incorreta.'
            ], 422);
        }
    }
    
    // 5. Se o perfil estava incompleto, agora está completo
    if ($user->google_id && empty($user->password)) {
        // Isto cobre o caso em que o Google user está definindo a primeira senha
        // Você pode ter uma coluna 'perfil_incompleto' no banco que você atualiza aqui,
        // mas aqui focamos em atualizar a senha.
    }
    
    // Atualiza a senha e remove a flag 'perfil_incompleto' se aplicável
    $user->update(['password' => Hash::make($validated['password'])]);

    // Opcional: Atualizar a flag perfil_incompleto se for o último campo pendente.
    // (Depende se você mantém essa coluna na tabela users).
    // Exemplo: $user->perfil_incompleto = false; $user->save();
    
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
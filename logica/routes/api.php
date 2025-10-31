<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\GerenteController;
use App\Http\Controllers\FuncionarioController;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Http\Request;
// ==============================
// Rotas públicas (sem autenticação)
// ==============================

use Illuminate\Support\Facades\Cache;

Route::get('/auth/social/temp/{key}', function ($key) {
    $data = Cache::get("social:{$key}");
    if (!$data) {
        return response()->json(['message' => 'Dados temporários não encontrados ou expirados.'], 404);
    }
    return response()->json($data);
});

//rotas do auth do google
Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogleWeb']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallbackWeb']);

Route::middleware('auth:sanctum')->post('/complete-registration', [AuthController::class, 'completeRegistration']);


Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
    return response()->json($request->user());
});

//Route::post('/completar-registro', [AuthController::class, 'completeRegistration']);

 Route::post('/login', [AuthController::class, 'login']);

Route::post('/register', [AuthController::class, 'register']);

//rota do laravel  socialite para ssesao e cadastros com a google register

// Recuperação de senha
Route::middleware('api')->group(function () {
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLinkEmail'])
        ->name('password.email');

    Route::post('/reset-password', [PasswordController::class, 'reset'])
        ->name('password.reset');
});

// ==============================
// Rotas protegidas (com Sanctum)
// ==============================
Route::middleware('auth:sanctum')->group(function () {
    // Autenticação / perfil
    Route::post('/logout', [AuthController::class, 'logout']);
   // Route::get('/me', [UserController::class, 'me']);
    Route::put('/perfil', [AuthController::class, 'atualizarPerfil']);
    Route::put('/alterar-senha', [AuthController::class, 'alterarSenha']);
    Route::delete('/perfil', [AuthController::class, 'deletarConta']);


    // ==============================
    // Rotas ADMIN
    // ==============================
    Route::middleware('role:administrador')->prefix('admin')->group(function () {
        // Listagens de utilizadores
        Route::get('/usuarios', [AdminController::class, 'index']);       // agrupado por role
        Route::get('/usuarios/lista', [AdminController::class, 'lista']); // lista simples

        // Gestão de utilizadores
        Route::get('/usuarios/{id}', [AdminController::class, 'show']);
        Route::put('/usuarios/{id}', [AdminController::class, 'update']);
        Route::delete('/usuarios/{id}', [AdminController::class, 'destroy']);
        Route::patch('/usuarios/{id}/confirmar', [AdminController::class, 'confirmarConta']);
        Route::patch('/usuarios/{id}/toggle', [AdminController::class, 'toggleConfirmar']);

        // Autorizações extras
        Route::post('/users/{id}/authorize', [AdminController::class, 'authorizeUser']);
    });

    // ==============================
    // Rotas GERENTE
    // ==============================
    Route::middleware('role:gerente')->prefix('gerente')->group(function () {
        Route::get('/dashboard', [GerenteController::class, 'dashboard']);
        Route::get('/relatorio', [GerenteController::class, 'relatorio']);
    });

    // ==============================
    // Rotas FUNCIONÁRIO
    // ==============================
    Route::middleware('role:funcionario')->prefix('funcionario')->group(function () {
        Route::get('/dashboard', [FuncionarioController::class, 'dashboard']);
        Route::get('/tarefas', [FuncionarioController::class, 'tarefas']);
    });

    // ==============================
    // Utilizadores gerais (qualquer user logado)
    // ==============================
    Route::get('/utilizadores', [AuthController::class, 'listarUtilizadores']);
    Route::get('/utilizadores/pesquisar', [AuthController::class, 'pesquisarUtilizadores']);
});

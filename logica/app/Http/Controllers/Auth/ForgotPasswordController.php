<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Services\GmailService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ForgotPasswordController extends Controller
{
    
public function sendPasswordReset(Request $request, GmailService $gmail)
{
    $request->validate([
        'email' => 'required|email|exists:users,email',
    ]);

    $user = User::where('email', $request->email)->first();

    // Criar token seguro
    $token = Str::random(60);
    $user->password_reset_token = Hash::make($token);
    $user->password_reset_expires = now()->addMinutes(30);
    $user->save();

    // Link para o frontend
    $resetLink = "https://sismatias.onrender.com/redefinir-senha?token={$token}&email={$user->email}";

    // Enviar email via Gmail API
    $subject = "Redefinição de senha";
    $body = "<p>Olá {$user->name},</p>
             <p>Clique no link abaixo para redefinir sua senha (válido por 30 minutos):</p>
             <a href='{$resetLink}'>{$resetLink}</a>";

    try {
        $gmail->sendEmail($user->email, $subject, $body);
    } catch (\Exception $e) {
        return response()->json([
            'mensagem' => 'Erro ao enviar email: ' . $e->getMessage()
        ], 500);
    }

    return response()->json([
        'mensagem' => 'Um link de redefinição foi enviado para o seu e-mail.'
    ]);
}
}
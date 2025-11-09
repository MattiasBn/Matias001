<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

class PasswordController extends Controller
{
   public function resetPassword(Request $request)
{
    $request->validate([
        'email' => 'required|email|exists:users,email',
        'password' => 'required|string|min:8|confirmed',
        'token' => 'required|string'
    ]);

    $user = User::where('email', $request->email)->first();

    // Verifica token
    if (!Hash::check($request->token, $user->password_reset_token) ||
        now()->gt($user->password_reset_expires)) {
        return response()->json(['mensagem' => 'Token inválido ou expirado.'], 422);
    }

    $user->password = Hash::make($request->password);
    $user->password_reset_token = null;
    $user->password_reset_expires = null;
    $user->save();

    return response()->json(['mensagem' => 'Senha redefinida com sucesso!']);
}
}
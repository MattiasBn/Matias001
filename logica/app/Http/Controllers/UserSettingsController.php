<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserSetting;

class UserSettingsController extends Controller
{
    public function show(Request $request)
    {
        
        // Busca as configurações do utilizador
        $settings = $request->user()->settings;

         return response()->json($settings ?? []);
        // Se não existir, devolver os defaults (MAS SEM criar na BD)
        
    }


    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'theme' => 'in:light,dark,system',
            'font_size' => 'in:small,medium,large',
            'timezone' => 'string',
            'language' => 'string',
            'email_notifications' => 'boolean',
            'push_notifications' => 'boolean',
        ]);

        // Aqui salvamos PERMANENTEMENTE na base de dados
        UserSetting::updateOrCreate(
            ['user_id' => $user->id],
            $data
        );

        return response()->json(['message' => 'Configurações atualizadas com sucesso']);
    }
}

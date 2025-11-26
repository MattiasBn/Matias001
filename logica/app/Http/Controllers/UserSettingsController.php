<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserSetting;

class UserSettingsController extends Controller
{
    public function show(Request $request)
    {
        $settings = $request->user()->settings;
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'theme' => 'in:light,dark,system',
            'font_size' => 'in:small,medium,large',
            'timezone' => 'string',
            'language' => 'string|in:pt,en,es,fr',
            'email_notifications' => 'boolean',
            'push_notifications' => 'boolean',
        ]);

        $user->settings()->update($request->all());

        return response()->json(['message' => 'Configurações atualizadas com sucesso']);
    }
}

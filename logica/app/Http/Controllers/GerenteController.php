<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class GerenteController extends Controller
{
    // Exemplo: dashboard do gerente
    public function dashboard()
    {
        return response()->json(['message' => 'Bem-vindo ao painel do gerente']);
    }

    // Exemplo: relatório de vendas
    public function relatorio()
    {
        return response()->json(['vendas' => 12345, 'lucro' => 6789]);
    }
}

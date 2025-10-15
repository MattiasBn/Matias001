<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FuncionarioController extends Controller
{
    // Exemplo: dashboard do funcionário
    public function dashboard()
    {
        return response()->json(['message' => 'Bem-vindo ao painel do funcionário']);
    }

    // Exemplo: tarefas do funcionário
    public function tarefas()
    {
        return response()->json([
            ['id' => 1, 'descricao' => 'Atender cliente'],
            ['id' => 2, 'descricao' => 'Preparar relatório'],
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash; // Importe o Hash aqui

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Cria um usuário Administrador
         User::factory()->create([
            'name' => 'Administrador',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'administrador',
            'telefone' => '911222333', // Exemplo de número de telefone
            'confirmar' => true, // Confirmado por padrão
        ]);

        // Cria um utilizador de exemplo com o papel 'gerente'
        User::factory()->create([
            'name' => 'Gerente',
            'email' => 'gerente@example.com',
            'password' => Hash::make('password'),
            'role' => 'gerente',
            'telefone' => '911444555', // Outro exemplo
            'confirmar' => true,
        ]);

        // Cria um utilizador de exemplo com o papel 'funcionario'
        User::factory()->create([
            'name' => 'Funcionario',
            'email' => 'funcionario@example.com',
            'password' => Hash::make('password'),
            'role' => 'funcionario',
            'telefone' => '911666777',
            'confirmar' => false, // Este utilizador precisa de confirmação
        ]);

       

        // Cria 10 utilizadores de teste aleatórios com o papel 'cliente' e sem telefone
        User::factory(10)->create();
    }
}
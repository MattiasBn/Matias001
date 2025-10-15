<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            
            $table->string('telefone')->nullable()->unique();

            // Adiciona a coluna 'is_confirmed' com um valor padrão de 'false'
            // Este campo será usado para a autorização de uso do sistema
            $table->boolean('confirmar')->default(false);


        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            
             $table->dropColumn('telefone');
            $table->dropColumn('confirmar');


        });
    }
};

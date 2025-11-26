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
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->enum('theme', ['light', 'dark', 'system'])->default('system');
            $table->enum('font_size', ['small', 'medium', 'large'])->default('medium');
            $table->string('timezone')->default('Africa/Luanda');
            $table->string('language')->default('pt');

            $table->boolean('email_notifications')->default(true);
            $table->boolean('push_notifications')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};

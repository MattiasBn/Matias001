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

            $table->enum('theme', ['light', 'dark', 'system'])->nullable()->change();
            $table->enum('font_size', ['small', 'medium', 'large'])->nullable()->change();
            $table->string('timezone')->nullable()->change();
            $table->string('language')->nullable()->change();

            $table->boolean('email_notifications')->nullable()->change();
            $table->boolean('push_notifications')->nullable()->change();

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

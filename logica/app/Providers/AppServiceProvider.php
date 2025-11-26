<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Cookie;
use App\Models\User;
use App\Observers\UserObserver;

use Illuminate\Auth\Notifications\ResetPassword;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    
    public function boot(): void
    {
        
         ResetPassword::createUrlUsing(function ($notifiable, $token) {
        return env('FRONTEND_URL', 'http://localhost:3000') 
            . "/reset-password/{$token}?email={$notifiable->getEmailForPasswordReset()}";
    });

    Cookie::macro('sameSiteNone', function ($name, $value, $minutes, $path = '/', $domain = null, $secure = false, $httpOnly = true) {
        return Cookie::make($name, $value, $minutes, $path, $domain, $secure, $httpOnly, false, 'None');
    });



    User::observe(UserObserver::class);

    }
}

<?php
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;
 
return [
    App\Providers\AppServiceProvider::class,
 
];
 
class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // ...
}
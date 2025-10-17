<?php

use Illuminate\Support\Facades\Route;


Route::get('/', function () {
    return view('welcome'); // Ou a view que serve o seu front-end Next.js
});

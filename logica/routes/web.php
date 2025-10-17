<?php

use Illuminate\Support\Facades\Route;


Route::get('/matiasistemas.onrender.com', function () {
    return view('welcome'); // Ou a view que serve o seu front-end Next.js
});

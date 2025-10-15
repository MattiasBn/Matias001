<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
   public function me(Request $request)
{
    return response()->json([
        'user' => $request->user(),
    ]);
}

}
<?php

use App\Http\Controllers\GuestSessionController;
use Illuminate\Support\Facades\Route;

Route::post('/guest-session', [GuestSessionController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/session', [GuestSessionController::class, 'show']);
});
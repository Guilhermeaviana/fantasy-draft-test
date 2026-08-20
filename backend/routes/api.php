<?php

use App\Http\Controllers\GuestSessionController;
use App\Http\Controllers\PollController;
use App\Http\Controllers\VoteController;
use Illuminate\Support\Facades\Route;

Route::post('/guest-session', [GuestSessionController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/session', [GuestSessionController::class, 'show']);

    Route::get('/polls', [PollController::class, 'index']);
    Route::post('/polls', [PollController::class, 'store']);
    Route::get('/polls/{poll}', [PollController::class, 'show']);
    Route::post('/polls/{poll}/votes', [VoteController::class, 'store']);
});
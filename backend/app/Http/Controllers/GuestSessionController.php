<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GuestSessionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if ($request->user()) {
            // Reutiliza a identidade atual para não criar um novo guest a cada recarregamento.
            return response()->json([
                'id' => $request->user()->id,
                'is_guest' => $request->user()->is_guest,
            ]);
        }

        $user = User::create([
            'is_guest' => true,
        ]);

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'id' => $user->id,
            'is_guest' => $user->is_guest,
        ], 201);
    }

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'id' => $request->user()->id,
            'is_guest' => $request->user()->is_guest,
        ]);
    }
}
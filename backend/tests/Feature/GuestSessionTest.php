<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_protected_session_route(): void
    {
        $response = $this->getJson('/api/session');

        $response->assertUnauthorized();
    }

    public function test_guest_session_creates_authenticates_and_reuses_guest_identity(): void
    {
        $headers = [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173/',
        ];

        $response = $this
            ->withHeaders($headers)
            ->postJson('/api/guest-session');

        $response
            ->assertCreated()
            ->assertJson([
                'is_guest' => true,
            ])
            ->assertJsonStructure([
                'id',
                'is_guest',
            ]);

        $user = User::findOrFail($response->json('id'));

        $this->assertTrue($user->is_guest);
        $this->assertAuthenticatedAs($user, 'web');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_guest' => true,
        ]);

        $this
            ->withHeaders($headers)
            ->getJson('/api/session')
            ->assertOk()
            ->assertJson([
                'id' => $user->id,
                'is_guest' => true,
            ]);

        $this
            ->withHeaders($headers)
            ->postJson('/api/guest-session')
            ->assertOk()
            ->assertJson([
                'id' => $user->id,
                'is_guest' => true,
            ]);

        $this->assertDatabaseCount('users', 1);
    }

    public function test_authenticated_guest_can_access_protected_session_route(): void
    {
        $user = User::create([
            'is_guest' => true,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/session');

        $response
            ->assertOk()
            ->assertJson([
                'id' => $user->id,
                'is_guest' => true,
            ]);
    }
}
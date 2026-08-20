<?php

namespace Tests\Feature;

use App\Models\Poll;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PollApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_polls(): void
    {
        $this
            ->getJson('/api/polls')
            ->assertUnauthorized();
    }

    public function test_authenticated_guest_can_create_poll_with_options(): void
    {
        $user = User::create([
            'is_guest' => true,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/polls', [
                'question' => 'Quem vence hoje?',
                'options' => [
                    'Raiders',
                    'Texans',
                ],
                'duration_minutes' => 15,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('question', 'Quem vence hoje?')
            ->assertJsonPath('status', 'open')
            ->assertJsonPath('total_votes', 0)
            ->assertJsonCount(2, 'options');

        $this->assertArrayNotHasKey('data', $response->json());

        $pollId = $response->json('id');

        $this->assertDatabaseHas('polls', [
            'id' => $pollId,
            'created_by' => $user->id,
            'question' => 'Quem vence hoje?',
        ]);

        $this->assertDatabaseHas('poll_options', [
            'poll_id' => $pollId,
            'label' => 'Raiders',
            'position' => 0,
        ]);

        $this->assertDatabaseHas('poll_options', [
            'poll_id' => $pollId,
            'label' => 'Texans',
            'position' => 1,
        ]);
    }

    public function test_poll_requires_at_least_two_options(): void
    {
        $user = User::create([
            'is_guest' => true,
        ]);

        $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/polls', [
                'question' => 'Quem vence?',
                'options' => [
                    'Raiders',
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'options',
            ]);

        $this->assertDatabaseCount('polls', 0);
    }

    public function test_poll_rejects_duplicate_options_ignoring_case(): void
    {
        $user = User::create([
            'is_guest' => true,
        ]);

        $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/polls', [
                'question' => 'Quem vence?',
                'options' => [
                    'Raiders',
                    'raiders',
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'options.1',
            ]);

        $this->assertDatabaseCount('polls', 0);
    }

    public function test_authenticated_guest_can_list_polls_without_data_wrapper(): void
    {
        $user = User::create([
            'is_guest' => true,
        ]);

        $poll = Poll::create([
            'created_by' => $user->id,
            'question' => 'Raiders ou Texans?',
        ]);

        $poll->options()->createMany([
            [
                'label' => 'Raiders',
                'position' => 0,
            ],
            [
                'label' => 'Texans',
                'position' => 1,
            ],
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/polls');

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.question', 'Raiders ou Texans?');

        $this->assertIsArray($response->json());
        $this->assertArrayNotHasKey('data', $response->json());
    }

    public function test_authenticated_guest_can_view_poll(): void
    {
        $user = User::create([
            'is_guest' => true,
        ]);

        $poll = Poll::create([
            'created_by' => $user->id,
            'question' => 'Qual será o resultado?',
        ]);

        $poll->options()->createMany([
            [
                'label' => 'Opção A',
                'position' => 0,
            ],
            [
                'label' => 'Opção B',
                'position' => 1,
            ],
        ]);

        $this
            ->actingAs($user, 'sanctum')
            ->getJson("/api/polls/{$poll->id}")
            ->assertOk()
            ->assertJsonPath('id', $poll->id)
            ->assertJsonPath('question', 'Qual será o resultado?')
            ->assertJsonCount(2, 'options');
    }
}
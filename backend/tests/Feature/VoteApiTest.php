<?php

namespace Tests\Feature;

use App\Models\Poll;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoteApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_vote(): void
    {
        $creator = User::create([
            'is_guest' => true,
        ]);

        $poll = $this->createPoll($creator);

        $this
            ->postJson("/api/polls/{$poll->id}/votes", [
                'poll_option_id' => $poll->options->first()->id,
            ])
            ->assertUnauthorized();

        $this->assertDatabaseCount('votes', 0);
    }

    public function test_authenticated_guest_can_vote_and_receive_updated_results(): void
    {
        $creator = User::create([
            'is_guest' => true,
        ]);

        $voter = User::create([
            'is_guest' => true,
        ]);

        $poll = $this->createPoll($creator);

        $option = $poll->options->first();

        $response = $this
            ->actingAs($voter, 'sanctum')
            ->postJson("/api/polls/{$poll->id}/votes", [
                'poll_option_id' => $option->id,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('id', $poll->id)
            ->assertJsonPath('total_votes', 1)
            ->assertJsonPath('has_voted', true)
            ->assertJsonPath('my_vote_option_id', $option->id)
            ->assertJsonPath('options.0.votes', 1)
            ->assertJsonPath('options.0.percentage', 100);

        $this->assertDatabaseHas('votes', [
            'poll_id' => $poll->id,
            'poll_option_id' => $option->id,
            'user_id' => $voter->id,
        ]);
    }

    public function test_user_cannot_vote_twice_in_same_poll(): void
    {
        $creator = User::create([
            'is_guest' => true,
        ]);

        $voter = User::create([
            'is_guest' => true,
        ]);

        $poll = $this->createPoll($creator);

        $firstOption = $poll->options->get(0);
        $secondOption = $poll->options->get(1);

        $this
            ->actingAs($voter, 'sanctum')
            ->postJson("/api/polls/{$poll->id}/votes", [
                'poll_option_id' => $firstOption->id,
            ])
            ->assertCreated();

        $this
            ->actingAs($voter, 'sanctum')
            ->postJson("/api/polls/{$poll->id}/votes", [
                'poll_option_id' => $secondOption->id,
            ])
            ->assertConflict()
            ->assertJson([
                'code' => 'already_voted',
            ]);

        $this->assertDatabaseCount('votes', 1);

        $this->assertDatabaseHas('votes', [
            'poll_id' => $poll->id,
            'poll_option_id' => $firstOption->id,
            'user_id' => $voter->id,
        ]);
    }

    public function test_user_cannot_vote_with_option_from_another_poll(): void
    {
        $creator = User::create([
            'is_guest' => true,
        ]);

        $voter = User::create([
            'is_guest' => true,
        ]);

        $firstPoll = $this->createPoll($creator);
        $secondPoll = $this->createPoll($creator);

        $foreignOption = $secondPoll->options->first();

        $this
            ->actingAs($voter, 'sanctum')
            ->postJson("/api/polls/{$firstPoll->id}/votes", [
                'poll_option_id' => $foreignOption->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'poll_option_id',
            ]);

        $this->assertDatabaseCount('votes', 0);
    }

    public function test_user_cannot_vote_in_closed_poll(): void
    {
        $creator = User::create([
            'is_guest' => true,
        ]);

        $voter = User::create([
            'is_guest' => true,
        ]);

        $poll = $this->createPoll(
            $creator,
            now()->subMinute()
        );

        $option = $poll->options->first();

        $this
            ->actingAs($voter, 'sanctum')
            ->postJson("/api/polls/{$poll->id}/votes", [
                'poll_option_id' => $option->id,
            ])
            ->assertConflict()
            ->assertJson([
                'code' => 'poll_closed',
            ]);

        $this->assertDatabaseCount('votes', 0);
    }

    private function createPoll(
        User $creator,
        $closesAt = null
    ): Poll {
        $poll = Poll::create([
            'created_by' => $creator->id,
            'question' => 'Raiders ou Texans?',
            'closes_at' => $closesAt,
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

        return $poll->load('options');
    }
}
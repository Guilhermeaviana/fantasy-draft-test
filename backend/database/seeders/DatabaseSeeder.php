<?php

namespace Database\Seeders;

use App\Models\Poll;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $creator = User::create([
            'is_guest' => true,
        ]);

        $voters = collect(range(1, 5))
            ->map(fn () => User::create([
                'is_guest' => true,
            ]));

        $livePoll = Poll::create([
            'created_by' => $creator->id,
            'question' => 'Quem vence o confronto de hoje?',
            'closes_at' => now()->addMinutes(30),
        ]);

        $livePoll->options()->createMany([
            [
                'label' => 'Palmeiras',
                'position' => 0,
            ],
            [
                'label' => 'Flamengo',
                'position' => 1,
            ],
        ]);

        $livePoll->load('options');

        Vote::create([
            'poll_id' => $livePoll->id,
            'poll_option_id' => $livePoll->options[0]->id,
            'user_id' => $voters[0]->id,
        ]);

        Vote::create([
            'poll_id' => $livePoll->id,
            'poll_option_id' => $livePoll->options[0]->id,
            'user_id' => $voters[1]->id,
        ]);

        Vote::create([
            'poll_id' => $livePoll->id,
            'poll_option_id' => $livePoll->options[1]->id,
            'user_id' => $voters[2]->id,
        ]);

        $openPoll = Poll::create([
            'created_by' => $creator->id,
            'question' => 'Qual posição merece mais atenção no próximo Draft?',
            'closes_at' => null,
        ]);

        $openPoll->options()->createMany([
            [
                'label' => 'Quarterback',
                'position' => 0,
            ],
            [
                'label' => 'Wide Receiver',
                'position' => 1,
            ],
            [
                'label' => 'Running Back',
                'position' => 2,
            ],
        ]);

        $closedPoll = Poll::create([
            'created_by' => $creator->id,
            'question' => 'Qual foi o destaque da rodada?',
            'closes_at' => now()->subMinutes(10),
        ]);

        $closedPoll->options()->createMany([
            [
                'label' => 'Ataque',
                'position' => 0,
            ],
            [
                'label' => 'Defesa',
                'position' => 1,
            ],
        ]);

        $closedPoll->load('options');

        Vote::create([
            'poll_id' => $closedPoll->id,
            'poll_option_id' => $closedPoll->options[0]->id,
            'user_id' => $voters[3]->id,
        ]);

        Vote::create([
            'poll_id' => $closedPoll->id,
            'poll_option_id' => $closedPoll->options[1]->id,
            'user_id' => $voters[4]->id,
        ]);
    }
}
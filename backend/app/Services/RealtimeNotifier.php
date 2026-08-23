<?php

namespace App\Services;

use App\Http\Resources\PollResultsResource;
use App\Models\Poll;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RealtimeNotifier
{
    public function pollResultsUpdated(Poll $poll): void
    {
        $url = sprintf(
            '%s/internal/polls/%d/results-updated',
            rtrim(config('services.realtime.url'), '/'),
            $poll->id,
        );

        try {
            $response = Http::timeout(2)
                ->withHeaders([
                    'X-Internal-Secret' => config('services.realtime.secret'),
                ])
                ->post(
                    $url,
                    (new PollResultsResource($poll))->resolve(),
                );

            if ($response->failed()) {
                Log::warning('Realtime server rejected poll update.', [
                    'poll_id' => $poll->id,
                    'status' => $response->status(),
                ]);
            }
        } catch (ConnectionException $exception) {
            // O voto já foi persistido; indisponibilidade realtime não pode desfazer a operação.
            Log::warning('Realtime server is unavailable.', [
                'poll_id' => $poll->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
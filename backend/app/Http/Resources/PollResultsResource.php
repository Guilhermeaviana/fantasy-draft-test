<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PollResultsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalVotes = (int) $this->votes_count;

        return [
            'id' => $this->id,
            'status' => $this->isClosed() ? 'closed' : 'open',
            'closes_at' => $this->closes_at?->toISOString(),
            'total_votes' => $totalVotes,
            'options' => $this->options->map(function ($option) use ($totalVotes) {
                $votes = (int) $option->votes_count;

                return [
                    'id' => $option->id,
                    'votes' => $votes,
                    'percentage' => $totalVotes === 0
                        ? 0
                        : round(($votes / $totalVotes) * 100, 1),
                ];
            })->values(),
        ];
    }
}
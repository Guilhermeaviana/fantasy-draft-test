<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PollResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalVotes = (int) $this->votes_count;

        $viewerVote = $this->relationLoaded('votes')
            ? $this->votes->first()
            : null;

        return [
            'id' => $this->id,

            'question' => $this->question,

            'status' => $this->isClosed()
                ? 'closed'
                : 'open',

            'closes_at' =>
                $this->closes_at?->toISOString(),

            'created_at' =>
                $this->created_at?->toISOString(),

            'total_votes' => $totalVotes,

            'has_voted' =>
                $viewerVote !== null,

            'my_vote_option_id' =>
                $viewerVote?->poll_option_id,

            'sports_event' =>
                $this->sportsEvent
                    ? new SportsEventResource(
                        $this->sportsEvent,
                    )
                    : null,

            'options' =>
                $this->options
                    ->map(
                        function ($option) use (
                            $totalVotes,
                        ) {
                            $votes =
                                (int) $option
                                    ->votes_count;

                            return [
                                'id' =>
                                    $option->id,

                                'label' =>
                                    $option->label,

                                'position' =>
                                    $option->position,

                                'votes' =>
                                    $votes,

                                'percentage' =>
                                    $totalVotes === 0
                                        ? 0
                                        : round(
                                            (
                                                $votes
                                                / $totalVotes
                                            ) * 100,
                                            1,
                                        ),
                            ];
                        },
                    )
                    ->values(),
        ];
    }
}
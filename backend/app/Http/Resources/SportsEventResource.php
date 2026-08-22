<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SportsEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'provider' => $this->provider,
            'external_id' => $this->external_id,

            'sport' => $this->sport,
            'league' => $this->league,

            'starts_at' => $this->starts_at?->toIso8601String(),
            'status' => $this->status,

            'home_team' => [
                'id' => $this->home_team_external_id,
                'name' => $this->home_team,
                'logo' => $this->home_team_logo,
                'score' => $this->home_score,
            ],

            'away_team' => [
                'id' => $this->away_team_external_id,
                'name' => $this->away_team,
                'logo' => $this->away_team_logo,
                'score' => $this->away_score,
            ],

            'venue' => $this->venue,
        ];
    }
}
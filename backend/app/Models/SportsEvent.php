<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SportsEvent extends Model
{
    protected $fillable = [
        'provider',
        'external_id',
        'sport',
        'league',
        'league_external_id',
        'starts_at',
        'status',
        'home_team',
        'away_team',
        'home_team_external_id',
        'away_team_external_id',
        'home_team_logo',
        'away_team_logo',
        'home_score',
        'away_score',
        'venue',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'home_score' => 'integer',
            'away_score' => 'integer',
        ];
    }

    public function polls(): HasMany
    {
        return $this->hasMany(Poll::class);
    }
}
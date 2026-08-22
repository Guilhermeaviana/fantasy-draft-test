<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Poll extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'sports_event_id',
        'question',
        'closes_at',
    ];

    protected function casts(): array
    {
        return [
            'closes_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by',
        );
    }

    public function sportsEvent(): BelongsTo
    {
        return $this->belongsTo(
            SportsEvent::class,
        );
    }

    public function options(): HasMany
    {
        return $this->hasMany(
            PollOption::class,
        )->orderBy('position');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(
            Vote::class,
        );
    }

    public function isClosed(): bool
    {
        return $this->closes_at !== null
            && $this->closes_at->lessThanOrEqualTo(
                now(),
            );
    }

    public function scopeWithViewerState(
        Builder $query,
        int $userId,
    ): Builder {
        return $query
            ->with([
                'sportsEvent',

                'options' => fn (HasMany $query) =>
                    $query->withCount('votes'),

                'votes' => fn (HasMany $query) =>
                    $query->where(
                        'user_id',
                        $userId,
                    ),
            ])
            ->withCount('votes');
    }
}
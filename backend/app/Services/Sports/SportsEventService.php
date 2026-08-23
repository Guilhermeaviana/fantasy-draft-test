<?php

namespace App\Services\Sports;

use App\Contracts\SportsDataProvider;
use App\Models\SportsEvent;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Collection;

class SportsEventService
{
    public function __construct(
        private readonly SportsDataProvider $provider,
    ) {
    }

    public function syncForDate(
        DateTimeInterface $date,
        ?string $sport = null,
    ): Collection {
        $events =
            $this->provider
                ->eventsForDate(
                    $date,
                    $sport,
                );

        $ids = collect($events)
            ->map(function (array $event) {
                $sportsEvent =
                    SportsEvent::query()
                        ->updateOrCreate(
                            [
                                'provider' =>
                                    $event['provider'],

                                'external_id' =>
                                    $event['external_id'],
                            ],
                            $event,
                        );

                return $sportsEvent->id;
            });

        return SportsEvent::query()
            ->whereIn('id', $ids)
            ->orderBy('starts_at')
            ->get();
    }

    public function syncForDateRange(
        DateTimeInterface $startDate,
        int $days,
        ?string $sport = null,
    ): Collection {
        $ids = collect();

        $date = Carbon::instance(
            $startDate,
        );

        for (
            $offset = 0;
            $offset < $days;
            $offset++
        ) {
            $events = $this->syncForDate(
                $date
                    ->copy()
                    ->addDays($offset),
                $sport,
            );

            $ids = $ids->merge(
                $events->modelKeys(),
            );
        }

        return SportsEvent::query()
            ->whereIn(
                'id',
                $ids->unique()->values(),
            )
            ->orderBy('starts_at')
            ->get();
    }
}
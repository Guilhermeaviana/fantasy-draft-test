<?php

namespace App\Services\Sports;

use App\Contracts\SportsDataProvider;
use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TheSportsDbProvider implements SportsDataProvider
{
    private const PROVIDER = 'thesportsdb';

    public function eventsForDate(
        DateTimeInterface $date,
        ?string $sport = null,
    ): array {
        $dateString = Carbon::instance(
            $date,
        )->format('Y-m-d');

        $cacheKey = sprintf(
            'sportsdb.events.%s.%s',
            $dateString,
            $sport ?? 'all',
        );

        return Cache::remember(
            $cacheKey,
            now()->addMinutes(10),
            fn () => $this->fetchEvents(
                $dateString,
                $sport,
            ),
        );
    }

    private function fetchEvents(
        string $date,
        ?string $sport,
    ): array {
        $parameters = [
            'd' => $date,
        ];

        if ($sport !== null) {
            $parameters['s'] = $sport;
        }

        $baseUrl = rtrim(
            config('services.sportsdb.base_url'),
            '/',
        );

        $apiKey = config(
            'services.sportsdb.api_key',
        );

        $response = Http::acceptJson()
            ->timeout(8)
            ->retry(
                2,
                250,
            )
            ->get(
                "{$baseUrl}/{$apiKey}/eventsday.php",
                $parameters,
            );

        $response->throw();

        $events = $response->json(
            'events',
            [],
        );

        if (! is_array($events)) {
            return [];
        }

        return collect($events)
            ->map(
                fn (array $event) =>
                    $this->normalizeEvent(
                        $event,
                    ),
            )
            ->filter()
            ->values()
            ->all();
    }

    private function normalizeEvent(
        array $event,
    ): ?array {
        $externalId =
            $event['idEvent'] ?? null;

        $homeTeam =
            $event['strHomeTeam'] ?? null;

        $awayTeam =
            $event['strAwayTeam'] ?? null;

        if (
            ! $externalId
            || ! $homeTeam
            || ! $awayTeam
        ) {
            return null;
        }

        return [
            'provider' => self::PROVIDER,

            'external_id' =>
                (string) $externalId,

            'sport' =>
                $event['strSport']
                ?? 'Unknown',

            'league' =>
                $event['strLeague']
                ?? null,

            'league_external_id' =>
                isset($event['idLeague'])
                    ? (string) $event['idLeague']
                    : null,

            'starts_at' =>
                $this->parseTimestamp(
                    $event,
                ),

            'status' =>
                $this->normalizeStatus(
                    $event,
                ),

            'home_team' =>
                $homeTeam,

            'away_team' =>
                $awayTeam,

            'home_team_external_id' =>
                isset($event['idHomeTeam'])
                    ? (string) $event['idHomeTeam']
                    : null,

            'away_team_external_id' =>
                isset($event['idAwayTeam'])
                    ? (string) $event['idAwayTeam']
                    : null,

            'home_team_logo' =>
                $event['strHomeTeamBadge']
                ?? null,

            'away_team_logo' =>
                $event['strAwayTeamBadge']
                ?? null,

            'home_score' =>
                $this->nullableInteger(
                    $event['intHomeScore']
                    ?? null,
                ),

            'away_score' =>
                $this->nullableInteger(
                    $event['intAwayScore']
                    ?? null,
                ),

            'venue' =>
                $event['strVenue']
                ?: null,
        ];
    }

    private function parseTimestamp(
        array $event,
    ): ?Carbon {
        $timestamp =
            $event['strTimestamp']
            ?? null;

        if ($timestamp) {
            return Carbon::parse(
                $timestamp,
                'UTC',
            );
        }

        $date =
            $event['dateEvent']
            ?? null;

        if (! $date) {
            return null;
        }

        $time =
            $event['strTime']
            ?? '00:00:00';

        return Carbon::parse(
            "{$date} {$time}",
            'UTC',
        );
    }

    private function normalizeStatus(
        array $event,
    ): string {
        if (
            ($event['strPostponed'] ?? null)
            === 'yes'
        ) {
            return 'postponed';
        }

        $status = strtoupper(
            trim(
                (string) (
                    $event['strStatus']
                    ?? ''
                ),
            ),
        );

        if (
            in_array(
                $status,
                [
                    'FT',
                    'AET',
                    'FINISHED',
                    'FINAL',
                ],
                true,
            )
        ) {
            return 'finished';
        }

        if (
            in_array(
                $status,
                [
                    'LIVE',
                    'IN PLAY',
                    '1H',
                    '2H',
                    'HT',
                ],
                true,
            )
        ) {
            return 'live';
        }

        $homeScore =
            $event['intHomeScore']
            ?? null;

        $awayScore =
            $event['intAwayScore']
            ?? null;

        if (
            $homeScore !== null
            && $awayScore !== null
        ) {
            return 'finished';
        }

        return 'scheduled';
    }

    private function nullableInteger(
        mixed $value,
    ): ?int {
        if (
            $value === null
            || $value === ''
        ) {
            return null;
        }

        return (int) $value;
    }
}
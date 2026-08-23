<?php

namespace Tests\Unit;

use App\Services\Sports\TheSportsDbProvider;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TheSportsDbProviderTest extends TestCase
{
    public function test_normalizes_in_progress_sports_statuses_as_live(): void
    {
        Cache::flush();

        config()->set(
            'services.sportsdb.base_url',
            'https://sports.test',
        );

        config()->set(
            'services.sportsdb.api_key',
            'test-key',
        );

        Http::fake([
            '*' => Http::response([
                'events' => [
                    [
                        'idEvent' => 'basketball-live',
                        'strSport' => 'Basketball',
                        'strHomeTeam' => 'Home Basketball',
                        'strAwayTeam' => 'Away Basketball',
                        'strStatus' => 'Q3',
                        'intHomeScore' => '72',
                        'intAwayScore' => '68',
                        'dateEvent' => '2026-08-23',
                        'strTime' => '18:00:00',
                    ],
                    [
                        'idEvent' => 'baseball-live',
                        'strSport' => 'Baseball',
                        'strHomeTeam' => 'Home Baseball',
                        'strAwayTeam' => 'Away Baseball',
                        'strStatus' => 'IN5',
                        'intHomeScore' => '3',
                        'intAwayScore' => '2',
                        'dateEvent' => '2026-08-23',
                        'strTime' => '19:00:00',
                    ],
                    [
                        'idEvent' => 'soccer-live',
                        'strSport' => 'Soccer',
                        'strHomeTeam' => 'Home Soccer',
                        'strAwayTeam' => 'Away Soccer',
                        'strStatus' => '2H',
                        'intHomeScore' => '1',
                        'intAwayScore' => '0',
                        'dateEvent' => '2026-08-23',
                        'strTime' => '20:00:00',
                    ],
                ],
            ]),
        ]);

        $provider = app(
            TheSportsDbProvider::class,
        );

        $events = $provider->eventsForDate(
            Carbon::parse('2026-08-23'),
        );

        $this->assertCount(
            3,
            $events,
        );

        $this->assertSame(
            'live',
            $events[0]['status'],
        );

        $this->assertSame(
            'live',
            $events[1]['status'],
        );

        $this->assertSame(
            'live',
            $events[2]['status'],
        );
    }

    public function test_normalizes_finished_and_unavailable_statuses(): void
    {
        Cache::flush();

        config()->set(
            'services.sportsdb.base_url',
            'https://sports.test',
        );

        config()->set(
            'services.sportsdb.api_key',
            'test-key',
        );

        Http::fake([
            '*' => Http::response([
                'events' => [
                    [
                        'idEvent' => 'finished-event',
                        'strSport' => 'Soccer',
                        'strHomeTeam' => 'Finished Home',
                        'strAwayTeam' => 'Finished Away',
                        'strStatus' => 'FT',
                        'intHomeScore' => '2',
                        'intAwayScore' => '1',
                        'dateEvent' => '2026-08-23',
                        'strTime' => '16:00:00',
                    ],
                    [
                        'idEvent' => 'postponed-event',
                        'strSport' => 'Basketball',
                        'strHomeTeam' => 'Postponed Home',
                        'strAwayTeam' => 'Postponed Away',
                        'strStatus' => 'POST',
                        'intHomeScore' => null,
                        'intAwayScore' => null,
                        'dateEvent' => '2026-08-23',
                        'strTime' => '21:00:00',
                    ],
                ],
            ]),
        ]);

        $provider = app(
            TheSportsDbProvider::class,
        );

        $events = $provider->eventsForDate(
            Carbon::parse('2026-08-23'),
        );

        $this->assertSame(
            'finished',
            $events[0]['status'],
        );

        $this->assertSame(
            'postponed',
            $events[1]['status'],
        );
    }
}
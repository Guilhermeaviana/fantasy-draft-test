<?php

namespace Tests\Feature;

use App\Contracts\SportsDataProvider;
use App\Models\SportsEvent;
use App\Models\User;
use DateTimeInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SportsEventApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_sports_events(): void
    {
        $this
            ->getJson('/api/sports-events')
            ->assertUnauthorized();
    }

    public function test_authenticated_guest_can_sync_and_list_sports_events(): void
    {
        $this->app->bind(
            SportsDataProvider::class,
            fn () => new class implements SportsDataProvider {
                public function eventsForDate(
                    DateTimeInterface $date,
                    ?string $sport = null,
                ): array {
                    return [
                        [
                            'provider' => 'fake-provider',
                            'external_id' => 'event-123',
                            'sport' => 'Baseball',
                            'league' => 'MLB',
                            'league_external_id' => '4424',
                            'starts_at' => '2026-08-21T20:10:00Z',
                            'status' => 'scheduled',
                            'home_team' => 'Atlanta Braves',
                            'away_team' => 'Milwaukee Brewers',
                            'home_team_external_id' => '135268',
                            'away_team_external_id' => '135276',
                            'home_team_logo' => 'https://example.com/braves.png',
                            'away_team_logo' => 'https://example.com/brewers.png',
                            'home_score' => null,
                            'away_score' => null,
                            'venue' => 'Demo Stadium',
                        ],
                    ];
                }
            },
        );

        $user = User::create([
            'is_guest' => true,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson(
                '/api/sports-events?date=2026-08-21&sport=Baseball',
            );

        $response
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath(
                '0.sport',
                'Baseball',
            )
            ->assertJsonPath(
                '0.league',
                'MLB',
            )
            ->assertJsonPath(
                '0.home_team.name',
                'Atlanta Braves',
            )
            ->assertJsonPath(
                '0.away_team.name',
                'Milwaukee Brewers',
            )
            ->assertJsonPath(
                '0.status',
                'scheduled',
            );

        $this->assertDatabaseHas(
            'sports_events',
            [
                'provider' => 'fake-provider',
                'external_id' => 'event-123',
                'home_team' => 'Atlanta Braves',
                'away_team' => 'Milwaukee Brewers',
            ],
        );
    }

    public function test_sync_does_not_duplicate_existing_event(): void
    {
        $this->app->bind(
            SportsDataProvider::class,
            fn () => new class implements SportsDataProvider {
                public function eventsForDate(
                    DateTimeInterface $date,
                    ?string $sport = null,
                ): array {
                    return [
                        [
                            'provider' => 'fake-provider',
                            'external_id' => 'same-event',
                            'sport' => 'Soccer',
                            'league' => 'Demo League',
                            'league_external_id' => null,
                            'starts_at' => '2026-08-21T20:00:00Z',
                            'status' => 'scheduled',
                            'home_team' => 'Home Team',
                            'away_team' => 'Away Team',
                            'home_team_external_id' => null,
                            'away_team_external_id' => null,
                            'home_team_logo' => null,
                            'away_team_logo' => null,
                            'home_score' => null,
                            'away_score' => null,
                            'venue' => null,
                        ],
                    ];
                }
            },
        );

        $user = User::create([
            'is_guest' => true,
        ]);

        $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/sports-events?date=2026-08-21')
            ->assertOk();

        $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/sports-events?date=2026-08-21')
            ->assertOk();

        $this->assertDatabaseCount(
            'sports_events',
            1,
        );
    }

    public function test_authenticated_guest_can_view_sports_event(): void
    {
        $user = User::create([
            'is_guest' => true,
        ]);

        $event = SportsEvent::create([
            'provider' => 'fake-provider',
            'external_id' => 'event-456',
            'sport' => 'Basketball',
            'league' => 'NBA',
            'status' => 'scheduled',
            'home_team' => 'Boston Celtics',
            'away_team' => 'Los Angeles Lakers',
        ]);

        $this
            ->actingAs($user, 'sanctum')
            ->getJson(
                "/api/sports-events/{$event->id}",
            )
            ->assertOk()
            ->assertJsonPath(
                'id',
                $event->id,
            )
            ->assertJsonPath(
                'home_team.name',
                'Boston Celtics',
            )
            ->assertJsonPath(
                'away_team.name',
                'Los Angeles Lakers',
            );
    }

        public function test_can_filter_live_sports_events(): void
    {
        $this->app->bind(
            SportsDataProvider::class,
            fn () => new class implements SportsDataProvider {
                public function eventsForDate(
                    DateTimeInterface $date,
                    ?string $sport = null,
                ): array {
                    return [
                        [
                            'provider' => 'fake-provider',
                            'external_id' => 'scheduled-event',
                            'sport' => 'Basketball',
                            'league' => 'WNBA',
                            'league_external_id' => null,
                            'starts_at' => '2026-08-23T21:00:00Z',
                            'status' => 'scheduled',
                            'home_team' => 'Scheduled Home',
                            'away_team' => 'Scheduled Away',
                            'home_team_external_id' => null,
                            'away_team_external_id' => null,
                            'home_team_logo' => null,
                            'away_team_logo' => null,
                            'home_score' => null,
                            'away_score' => null,
                            'venue' => null,
                        ],
                        [
                            'provider' => 'fake-provider',
                            'external_id' => 'live-event',
                            'sport' => 'Basketball',
                            'league' => 'WNBA',
                            'league_external_id' => null,
                            'starts_at' => '2026-08-23T18:00:00Z',
                            'status' => 'live',
                            'home_team' => 'Live Home',
                            'away_team' => 'Live Away',
                            'home_team_external_id' => null,
                            'away_team_external_id' => null,
                            'home_team_logo' => null,
                            'away_team_logo' => null,
                            'home_score' => 72,
                            'away_score' => 68,
                            'venue' => null,
                        ],
                        [
                            'provider' => 'fake-provider',
                            'external_id' => 'finished-event',
                            'sport' => 'Basketball',
                            'league' => 'WNBA',
                            'league_external_id' => null,
                            'starts_at' => '2026-08-23T15:00:00Z',
                            'status' => 'finished',
                            'home_team' => 'Finished Home',
                            'away_team' => 'Finished Away',
                            'home_team_external_id' => null,
                            'away_team_external_id' => null,
                            'home_team_logo' => null,
                            'away_team_logo' => null,
                            'home_score' => 90,
                            'away_score' => 85,
                            'venue' => null,
                        ],
                    ];
                }
            },
        );

        $user = User::create([
            'is_guest' => true,
        ]);

        $this
            ->actingAs($user, 'sanctum')
            ->getJson(
                '/api/sports-events?date=2026-08-23&status=live',
            )
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath(
                '0.external_id',
                'live-event',
            )
            ->assertJsonPath(
                '0.status',
                'live',
            )
            ->assertJsonPath(
                '0.home_team.score',
                72,
            );

        $this->assertDatabaseCount(
            'sports_events',
            3,
        );
    }

    public function test_can_list_only_events_eligible_for_poll(): void
    {
        $this->app->bind(
            SportsDataProvider::class,
            fn () => new class implements SportsDataProvider {
                public function eventsForDate(
                    DateTimeInterface $date,
                    ?string $sport = null,
                ): array {
                    return [
                        [
                            'provider' => 'fake-provider',
                            'external_id' => 'eligible-scheduled',
                            'sport' => 'Soccer',
                            'league' => 'Demo League',
                            'league_external_id' => null,
                            'starts_at' => '2026-08-23T21:00:00Z',
                            'status' => 'scheduled',
                            'home_team' => 'Scheduled Home',
                            'away_team' => 'Scheduled Away',
                            'home_team_external_id' => null,
                            'away_team_external_id' => null,
                            'home_team_logo' => null,
                            'away_team_logo' => null,
                            'home_score' => null,
                            'away_score' => null,
                            'venue' => null,
                        ],
                        [
                            'provider' => 'fake-provider',
                            'external_id' => 'eligible-live',
                            'sport' => 'Soccer',
                            'league' => 'Demo League',
                            'league_external_id' => null,
                            'starts_at' => '2026-08-23T18:00:00Z',
                            'status' => 'live',
                            'home_team' => 'Live Home',
                            'away_team' => 'Live Away',
                            'home_team_external_id' => null,
                            'away_team_external_id' => null,
                            'home_team_logo' => null,
                            'away_team_logo' => null,
                            'home_score' => 1,
                            'away_score' => 0,
                            'venue' => null,
                        ],
                        [
                            'provider' => 'fake-provider',
                            'external_id' => 'ineligible-finished',
                            'sport' => 'Soccer',
                            'league' => 'Demo League',
                            'league_external_id' => null,
                            'starts_at' => '2026-08-23T15:00:00Z',
                            'status' => 'finished',
                            'home_team' => 'Finished Home',
                            'away_team' => 'Finished Away',
                            'home_team_external_id' => null,
                            'away_team_external_id' => null,
                            'home_team_logo' => null,
                            'away_team_logo' => null,
                            'home_score' => 2,
                            'away_score' => 1,
                            'venue' => null,
                        ],
                        [
                            'provider' => 'fake-provider',
                            'external_id' => 'ineligible-postponed',
                            'sport' => 'Soccer',
                            'league' => 'Demo League',
                            'league_external_id' => null,
                            'starts_at' => '2026-08-23T23:00:00Z',
                            'status' => 'postponed',
                            'home_team' => 'Postponed Home',
                            'away_team' => 'Postponed Away',
                            'home_team_external_id' => null,
                            'away_team_external_id' => null,
                            'home_team_logo' => null,
                            'away_team_logo' => null,
                            'home_score' => null,
                            'away_score' => null,
                            'venue' => null,
                        ],
                    ];
                }
            },
        );

        $user = User::create([
            'is_guest' => true,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson(
                '/api/sports-events?date=2026-08-23&eligible_for_poll=1',
            );

        $response
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath(
                '0.external_id',
                'eligible-live',
            )
            ->assertJsonPath(
                '1.external_id',
                'eligible-scheduled',
            );

        $this->assertDatabaseCount(
            'sports_events',
            4,
        );
    }

        public function test_can_sync_sports_events_for_multiple_days(): void
    {
        $this->app->bind(
            SportsDataProvider::class,
            fn () => new class implements SportsDataProvider {
                public function eventsForDate(
                    DateTimeInterface $date,
                    ?string $sport = null,
                ): array {
                    $dateString =
                        $date->format('Y-m-d');

                    $events = [
                        '2026-08-23' => [
                            [
                                'provider' => 'fake-provider',
                                'external_id' => 'event-day-one',
                                'sport' => 'Basketball',
                                'league' => 'WNBA',
                                'league_external_id' => null,
                                'starts_at' => '2026-08-23T20:00:00Z',
                                'status' => 'scheduled',
                                'home_team' => 'Day One Home',
                                'away_team' => 'Day One Away',
                                'home_team_external_id' => null,
                                'away_team_external_id' => null,
                                'home_team_logo' => null,
                                'away_team_logo' => null,
                                'home_score' => null,
                                'away_score' => null,
                                'venue' => null,
                            ],
                        ],
                        '2026-08-24' => [
                            [
                                'provider' => 'fake-provider',
                                'external_id' => 'event-day-two',
                                'sport' => 'Basketball',
                                'league' => 'WNBA',
                                'league_external_id' => null,
                                'starts_at' => '2026-08-24T19:00:00Z',
                                'status' => 'scheduled',
                                'home_team' => 'Day Two Home',
                                'away_team' => 'Day Two Away',
                                'home_team_external_id' => null,
                                'away_team_external_id' => null,
                                'home_team_logo' => null,
                                'away_team_logo' => null,
                                'home_score' => null,
                                'away_score' => null,
                                'venue' => null,
                            ],
                        ],
                        '2026-08-25' => [
                            [
                                'provider' => 'fake-provider',
                                'external_id' => 'event-day-three',
                                'sport' => 'Basketball',
                                'league' => 'WNBA',
                                'league_external_id' => null,
                                'starts_at' => '2026-08-25T21:00:00Z',
                                'status' => 'scheduled',
                                'home_team' => 'Day Three Home',
                                'away_team' => 'Day Three Away',
                                'home_team_external_id' => null,
                                'away_team_external_id' => null,
                                'home_team_logo' => null,
                                'away_team_logo' => null,
                                'home_score' => null,
                                'away_score' => null,
                                'venue' => null,
                            ],
                        ],
                    ];

                    return $events[
                        $dateString
                    ] ?? [];
                }
            },
        );

        $user = User::create([
            'is_guest' => true,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson(
                '/api/sports-events?date=2026-08-23&days=3&sport=Basketball',
            );

        $response
            ->assertOk()
            ->assertJsonCount(3)
            ->assertJsonPath(
                '0.external_id',
                'event-day-one',
            )
            ->assertJsonPath(
                '1.external_id',
                'event-day-two',
            )
            ->assertJsonPath(
                '2.external_id',
                'event-day-three',
            );

        $this->assertDatabaseCount(
            'sports_events',
            3,
        );
    }
}
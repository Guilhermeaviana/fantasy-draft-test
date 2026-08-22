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
}
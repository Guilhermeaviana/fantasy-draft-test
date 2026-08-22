<?php

namespace App\Console\Commands;

use App\Services\Sports\SportsEventService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SyncSportsEvents extends Command
{
    protected $signature = 'sports:sync-events
                            {--date= : Data no formato YYYY-MM-DD}
                            {--sport= : Esporte opcional, ex: Baseball}';

    protected $description =
        'Sincroniza eventos esportivos externos com o banco local';

    public function handle(
        SportsEventService $service,
    ): int {
        $date = $this->option('date')
            ? Carbon::createFromFormat(
                'Y-m-d',
                $this->option('date'),
                'UTC',
            )
            : now('UTC');

        $sport =
            $this->option('sport')
            ?: null;

        $this->info(
            sprintf(
                'Sincronizando eventos de %s%s...',
                $date->format('Y-m-d'),
                $sport
                    ? " ({$sport})"
                    : '',
            ),
        );

        $events =
            $service->syncForDate(
                $date,
                $sport,
            );

        if ($events->isEmpty()) {
            $this->warn(
                'Nenhum evento encontrado.',
            );

            return self::SUCCESS;
        }

        $this->table(
            [
                'ID',
                'Esporte',
                'Liga',
                'Casa',
                'Visitante',
                'Status',
                'Horário UTC',
            ],
            $events->map(
                fn ($event) => [
                    $event->id,
                    $event->sport,
                    $event->league,
                    $event->home_team,
                    $event->away_team,
                    $event->status,
                    $event->starts_at
                        ?->utc()
                        ->format(
                            'Y-m-d H:i',
                        ),
                ],
            ),
        );

        $this->info(
            "{$events->count()} evento(s) sincronizado(s).",
        );

        return self::SUCCESS;
    }
}
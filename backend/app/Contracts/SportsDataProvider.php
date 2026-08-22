<?php

namespace App\Contracts;

use DateTimeInterface;

interface SportsDataProvider
{
    public function eventsForDate(
        DateTimeInterface $date,
        ?string $sport = null,
    ): array;
}
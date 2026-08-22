<?php

namespace App\Http\Controllers;

use App\Http\Resources\SportsEventResource;
use App\Models\SportsEvent;
use App\Services\Sports\SportsEventService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SportsEventController extends Controller
{
    public function index(
        Request $request,
        SportsEventService $service,
    ): AnonymousResourceCollection {
        $validated = $request->validate([
            'date' => [
                'nullable',
                'date_format:Y-m-d',
            ],
            'sport' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        $date = isset($validated['date'])
            ? Carbon::createFromFormat(
                'Y-m-d',
                $validated['date'],
                'UTC',
            )
            : now('UTC');

        $events = $service->syncForDate(
            $date,
            $validated['sport'] ?? null,
        );

        return SportsEventResource::collection(
            $events,
        );
    }

    public function show(
        SportsEvent $sportsEvent,
    ): SportsEventResource {
        return new SportsEventResource(
            $sportsEvent,
        );
    }
}
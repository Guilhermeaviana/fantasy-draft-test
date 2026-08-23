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
            'days' => [
                'nullable',
                'integer',
                'min:1',
                'max:7',
            ],
            'sport' => [
                'nullable',
                'string',
                'max:100',
            ],
            'status' => [
                'nullable',
                'in:scheduled,live,finished,postponed',
            ],
            'eligible_for_poll' => [
                'nullable',
                'boolean',
            ],
        ]);

        $date = isset($validated['date'])
            ? Carbon::createFromFormat(
                'Y-m-d',
                $validated['date'],
                'UTC',
            )
            : now('UTC');

        $events = $service->syncForDateRange(
            $date,
            $validated['days'] ?? 1,
            $validated['sport'] ?? null,
        );

        if (isset($validated['status'])) {
            $events = $events
                ->where(
                    'status',
                    $validated['status'],
                )
                ->values();
        }

        if ($request->boolean('eligible_for_poll')) {
            $events = $events
                ->whereIn(
                    'status',
                    [
                        'scheduled',
                        'live',
                    ],
                )
                ->values();
        }

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
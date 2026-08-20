<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePollRequest;
use App\Http\Resources\PollResource;
use App\Models\Poll;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class PollController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $polls = Poll::query()
            ->withViewerState($request->user()->id)
            ->latest()
            ->get();

        return PollResource::collection($polls);
    }

    public function store(StorePollRequest $request): JsonResponse
    {
        $data = $request->validated();

        $poll = DB::transaction(function () use ($request, $data) {
            $poll = Poll::create([
                'created_by' => $request->user()->id,
                'question' => $data['question'],
                'closes_at' => isset($data['duration_minutes'])
                    ? now()->addMinutes($data['duration_minutes'])
                    : null,
            ]);

            $options = collect($data['options'])
                ->values()
                ->map(fn (string $label, int $position) => [
                    'label' => $label,
                    'position' => $position,
                ])
                ->all();

            $poll->options()->createMany($options);

            return $poll;
        });

        $poll = Poll::query()
            ->withViewerState($request->user()->id)
            ->findOrFail($poll->id);

        return (new PollResource($poll))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Poll $poll): PollResource
    {
        $poll = Poll::query()
            ->withViewerState($request->user()->id)
            ->findOrFail($poll->id);

        return new PollResource($poll);
    }
}
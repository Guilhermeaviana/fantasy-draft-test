<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVoteRequest;
use App\Http\Resources\PollResource;
use App\Models\Poll;
use App\Models\Vote;
use App\Services\RealtimeNotifier;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;

class VoteController extends Controller
{
    public function __construct(
        private readonly RealtimeNotifier $realtimeNotifier,
    ) {
    }

    public function store(StoreVoteRequest $request, Poll $poll): JsonResponse
    {
        $userId = $request->user()->id;

        if ($poll->isClosed()) {
            return response()->json([
                'message' => 'Esta enquete já foi encerrada.',
                'code' => 'poll_closed',
            ], 409);
        }

        $alreadyVoted = Vote::query()
            ->where('poll_id', $poll->id)
            ->where('user_id', $userId)
            ->exists();

        if ($alreadyVoted) {
            return response()->json([
                'message' => 'Você já votou nesta enquete.',
                'code' => 'already_voted',
            ], 409);
        }

        try {
            Vote::create([
                'poll_id' => $poll->id,
                'poll_option_id' => $request->validated('poll_option_id'),
                'user_id' => $userId,
            ]);
        } catch (QueryException $exception) {
            if ($this->isDuplicateVoteViolation($exception)) {
                return response()->json([
                    'message' => 'Você já votou nesta enquete.',
                    'code' => 'already_voted',
                ], 409);
            }

            throw $exception;
        }

        $poll = Poll::query()
            ->withViewerState($userId)
            ->findOrFail($poll->id);

        $this->realtimeNotifier->pollResultsUpdated($poll);

        return (new PollResource($poll))
            ->response()
            ->setStatusCode(201);
    }

    private function isDuplicateVoteViolation(QueryException $exception): bool
    {
        return ($exception->errorInfo[0] ?? null) === '23505'
            && str_contains(
                $exception->getMessage(),
                'votes_poll_id_user_id_unique'
            );
    }
}
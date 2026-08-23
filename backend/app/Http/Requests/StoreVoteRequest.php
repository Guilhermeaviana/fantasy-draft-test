<?php

namespace App\Http\Requests;

use App\Models\Poll;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $poll = $this->route('poll');

        $pollId = $poll instanceof Poll
            ? $poll->id
            : $poll;

        return [
            'poll_option_id' => [
                'required',
                'integer',
                Rule::exists('poll_options', 'id')
                    ->where('poll_id', $pollId),
            ],
        ];
    }
}
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'question' => ['required', 'string', 'max:255'],
            'options' => ['required', 'array', 'min:2', 'max:10'],
            'options.*' => [
                'required',
                'string',
                'max:120',
                'distinct:ignore_case',
            ],
            'duration_minutes' => [
                'nullable',
                'integer',
                'min:1',
                'max:1440',
            ],
        ];
    }
}
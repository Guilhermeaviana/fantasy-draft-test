<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $fillable = [
        'is_guest',
    ];

    protected function casts(): array
    {
        return [
            'is_guest' => 'boolean',
        ];
    }

    public function createdPolls(): HasMany
    {
        return $this->hasMany(Poll::class, 'created_by');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }
}
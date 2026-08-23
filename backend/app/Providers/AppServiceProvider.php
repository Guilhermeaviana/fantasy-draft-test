<?php

namespace App\Providers;

use App\Contracts\SportsDataProvider;
use App\Services\Sports\TheSportsDbProvider;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            SportsDataProvider::class,
            TheSportsDbProvider::class,
        );
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();
    }
}
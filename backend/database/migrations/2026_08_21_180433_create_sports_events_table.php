<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sports_events', function (Blueprint $table) {
            $table->id();

            $table->string('provider', 50);
            $table->string('external_id', 100);

            $table->string('sport', 100);
            $table->string('league')->nullable();
            $table->string('league_external_id', 100)->nullable();

            $table->timestampTz('starts_at')->nullable();
            $table->string('status', 30)->default('scheduled');

            $table->string('home_team');
            $table->string('away_team');

            $table->string('home_team_external_id', 100)->nullable();
            $table->string('away_team_external_id', 100)->nullable();

            $table->text('home_team_logo')->nullable();
            $table->text('away_team_logo')->nullable();

            $table->integer('home_score')->nullable();
            $table->integer('away_score')->nullable();

            $table->string('venue')->nullable();

            $table->timestamps();

            $table->unique([
                'provider',
                'external_id',
            ]);

            $table->index([
                'sport',
                'starts_at',
            ]);

            $table->index([
                'status',
                'starts_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sports_events');
    }
};
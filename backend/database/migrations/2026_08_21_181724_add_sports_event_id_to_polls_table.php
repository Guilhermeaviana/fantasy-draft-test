<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('polls', function (Blueprint $table) {
            $table
                ->foreignId('sports_event_id')
                ->nullable()
                ->after('created_by')
                ->constrained('sports_events')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('polls', function (Blueprint $table) {
            $table->dropConstrainedForeignId(
                'sports_event_id'
            );
        });
    }
};
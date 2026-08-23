<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('poll_id');
            $table->unsignedInteger('poll_option_id')->index();
            $table->unsignedInteger('user_id');
            $table->timestamps();

            $table
                ->foreign('poll_id')
                ->references('id')
                ->on('polls')
                ->cascadeOnDelete();

            $table
                ->foreign('poll_option_id')
                ->references('id')
                ->on('poll_options')
                ->cascadeOnDelete();

            $table
                ->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();

            $table->unique(['poll_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
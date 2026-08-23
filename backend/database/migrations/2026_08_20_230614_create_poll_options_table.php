<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poll_options', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('poll_id');
            $table->string('label', 120);
            $table->unsignedSmallInteger('position');
            $table->timestamps();

            $table
                ->foreign('poll_id')
                ->references('id')
                ->on('polls')
                ->cascadeOnDelete();

            $table->unique(['poll_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_options');
    }
};
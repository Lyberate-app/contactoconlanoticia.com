<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('redirects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('from_url', 1000);
            $table->string('to_url', 1000);
            $table->integer('status_code')->default(301);
            $table->timestamps();
            
            $table->index(['site_id', 'from_url(255)']);
        });

        Schema::create('ad_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('identifier')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_slot_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('code')->nullable();
            $table->foreignId('media_id')->nullable()->constrained()->nullOnDelete();
            $table->string('link_url', 1000)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ads');
        Schema::dropIfExists('ad_slots');
        Schema::dropIfExists('redirects');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->unique(['business_id', 'id']);
            $table->index(['business_id', 'status', 'name']);
        });

        Schema::create('menus', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable();
            $table->string('name', 150);
            $table->unsignedBigInteger('price');
            $table->string('status')->default('active');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->index(['business_id', 'status', 'is_available', 'name']);
            $table->index(['business_id', 'category_id']);
            $table->foreign(['business_id', 'category_id'])
                ->references(['business_id', 'id'])
                ->on('categories');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menus');
        Schema::dropIfExists('categories');
    }
};

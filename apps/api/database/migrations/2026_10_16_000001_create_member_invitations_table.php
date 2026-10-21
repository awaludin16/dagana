<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invited_by_membership_id')->nullable()
                ->constrained('memberships')->nullOnDelete();
            $table->string('email');
            $table->string('role');
            $table->json('outlet_ids');
            $table->json('permission_grants');
            $table->json('permission_denials');
            $table->string('token_hash')->unique();
            $table->string('status')->default('pending');
            $table->string('delivery_status')->default('pending');
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index(['business_id', 'email', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_invitations');
    }
};

<?php

namespace Database\Seeders;

use App\Domain\Organization\Actions\CreateBusinessAction;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed synthetic local development data only.
     *
     * Never place real customer or production data here (AGENTS §7).
     */
    public function run(): void
    {
        if (User::where('email', 'owner@dagana.test')->exists()) {
            return;
        }

        $owner = User::factory()->create([
            'name' => 'Demo Owner',
            'email' => 'owner@dagana.test',
            'password' => 'password123',
        ]);

        app(CreateBusinessAction::class)->execute(
            $owner,
            'Warung Demo',
            ['name' => 'Outlet Utama', 'address' => 'Jl. Contoh No. 1'],
        );
    }
}

<?php

namespace Tests\Feature\Api\V1;

use App\Domain\Region\RegionService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use RuntimeException;
use Tests\TestCase;

class RegionServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    public function test_region_results_are_cached_after_the_first_request(): void
    {
        Http::fake([
            '*provinces.json' => Http::response([
                'data' => [
                    ['id' => '11', 'name' => 'ACEH'],
                    ['id' => '12', 'name' => 'SUMATERA UTARA'],
                ],
            ]),
        ]);

        $regions = app(RegionService::class);

        $this->assertSame([
            ['id' => '11', 'name' => 'ACEH'],
            ['id' => '12', 'name' => 'SUMATERA UTARA'],
        ], $regions->get('provinces'));

        $regions->get('provinces');

        Http::assertSentCount(1);
    }

    public function test_stale_cache_is_served_when_the_upstream_keeps_failing(): void
    {
        Cache::put('regions:v2:provinces:stale', [
            ['id' => '11', 'name' => 'ACEH'],
        ], now()->addDay());

        Http::fake(['*' => Http::response(null, 500)]);

        $regions = app(RegionService::class);

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $this->assertSame([
                ['id' => '11', 'name' => 'ACEH'],
            ], $regions->get('provinces'));
        }

        // Circuit is open now: the fourth call must not hit the upstream again.
        $this->assertSame([
            ['id' => '11', 'name' => 'ACEH'],
        ], $regions->get('provinces'));

        Http::assertSentCount(3);
    }

    public function test_region_endpoint_returns_a_clear_error_when_no_cache_exists(): void
    {
        Sanctum::actingAs(User::factory()->create());

        Cache::flush();
        Http::fake(['*' => Http::response(null, 500)]);

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                app(RegionService::class)->get('provinces');
            } catch (RuntimeException) {
                // Expected until the circuit is open.
            }
        }

        $this->getJson('/api/v1/regions/provinces')
            ->assertStatus(503)
            ->assertJsonPath('message', 'Data wilayah sedang tidak tersedia. Silakan coba lagi.');

        Http::assertSentCount(3);
    }
}

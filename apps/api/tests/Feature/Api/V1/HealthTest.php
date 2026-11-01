<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use RuntimeException;
use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_reports_ok_when_dependencies_are_reachable(): void
    {
        DB::shouldReceive('select')->once()->andReturn([['?column?' => 1]]);
        Redis::shouldReceive('connection->ping')->once()->andReturn(true);

        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertExactJson([
                'status' => 'ok',
                'checks' => ['database' => 'ok', 'redis' => 'ok'],
            ]);
    }

    public function test_reports_unavailable_and_hides_error_details_when_a_dependency_fails(): void
    {
        DB::shouldReceive('select')->andThrow(new RuntimeException('SQLSTATE[08006] host postgres refused'));
        Redis::shouldReceive('connection->ping')->andReturn(true);

        $this->getJson('/api/v1/health')
            ->assertStatus(503)
            ->assertJsonPath('status', 'unavailable')
            ->assertJsonPath('checks.database', 'unavailable')
            ->assertJsonPath('checks.redis', 'ok')
            ->assertDontSee('SQLSTATE');
    }
}

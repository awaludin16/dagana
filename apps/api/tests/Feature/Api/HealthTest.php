<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_reports_ok_when_dependencies_are_reachable(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk()
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.checks.database.status', 'ok')
            ->assertJsonPath('data.checks.cache.status', 'ok');
    }
}

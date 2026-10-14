<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Reports whether the API can reach its critical dependencies.
 *
 * This endpoint is intentionally unauthenticated and used for local/probe
 * checks only. It must not leak connection details or error messages.
 */
class HealthController extends Controller
{
    private const CACHE_KEY = 'dagana:health:probe';

    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->probe(fn () => DB::select('select 1')),
            'cache' => $this->probe(function (): void {
                Cache::put(self::CACHE_KEY, true, 5);
                Cache::forget(self::CACHE_KEY);
            }),
        ];

        $healthy = collect($checks)->every(fn (array $check) => $check['status'] === 'ok');

        return response()->json([
            'data' => [
                'status' => $healthy ? 'ok' : 'degraded',
                'checks' => $checks,
            ],
        ], $healthy ? 200 : 503);
    }

    /**
     * @return array{status: string}
     */
    private function probe(callable $callback): array
    {
        try {
            $callback();

            return ['status' => 'ok'];
        } catch (Throwable) {
            // Never surface internal exception messages over the API.
            return ['status' => 'error'];
        }
    }
}

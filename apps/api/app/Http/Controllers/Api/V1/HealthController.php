<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Throwable;

class HealthController extends Controller
{
    /**
     * Readiness probe: distinguishes a service that can serve requests from one
     * whose dependencies are not reachable yet. Error details stay in the logs.
     */
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->probe(fn () => DB::select('select 1')),
            'redis' => $this->probe(fn () => Redis::connection()->ping()),
        ];

        $ready = ! in_array('unavailable', $checks, true);

        return response()->json([
            'status' => $ready ? 'ok' : 'unavailable',
            'checks' => $checks,
        ], $ready ? 200 : 503);
    }

    private function probe(callable $check): string
    {
        try {
            $check();

            return 'ok';
        } catch (Throwable $exception) {
            report($exception);

            return 'unavailable';
        }
    }
}

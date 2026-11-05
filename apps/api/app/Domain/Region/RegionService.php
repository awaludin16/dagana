<?php

namespace App\Domain\Region;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class RegionService
{
    private const FAILURE_THRESHOLD = 3;

    /**
     * Fetch a region level through a cached upstream with a stale fallback and
     * a small circuit breaker. Once the circuit opens, cached data is served
     * without touching the upstream for one minute.
     *
     * @return list<array{id: string, name: string, postal_code?: string}>
     */
    public function get(string $level, ?string $parent = null): array
    {
        $key = $this->cacheKey($level, $parent);
        $fresh = Cache::get($key);

        if (is_array($fresh)) {
            return $fresh;
        }

        $stale = Cache::get("{$key}:stale");

        if (Cache::has("{$key}:circuit")) {
            return is_array($stale) ? $stale : throw $this->unavailable();
        }

        try {
            $response = Http::acceptJson()
                ->timeout((int) config('services.regions.timeout', 5))
                ->get($this->url($level, $parent));

            if (! $response->successful()) {
                throw new RuntimeException("Region upstream returned {$response->status()}.");
            }

            $regions = collect($response->json('data'))
                ->map(fn (array $region): array => [
                    'id' => (string) ($region['id'] ?? ''),
                    'name' => (string) ($region['name'] ?? ''),
                    ...($level === 'villages'
                        ? ['postal_code' => (string) ($region['postal_code'] ?? '')]
                        : []),
                ])
                ->filter(fn (array $region): bool => $region['id'] !== '' && $region['name'] !== '')
                ->values()
                ->all();

            Cache::put($key, $regions, now()->addDay());
            Cache::put("{$key}:stale", $regions, now()->addDays(7));
            Cache::forget("{$key}:failures");

            return $regions;
        } catch (Throwable) {
            $failures = (int) Cache::get("{$key}:failures", 0) + 1;
            Cache::put("{$key}:failures", $failures, now()->addMinutes(5));

            if ($failures >= self::FAILURE_THRESHOLD) {
                Cache::put("{$key}:circuit", true, now()->addMinute());
            }

            return is_array($stale) ? $stale : throw $this->unavailable();
        }
    }

    private function cacheKey(string $level, ?string $parent): string
    {
        return "regions:v2:{$level}".($parent ? ":{$parent}" : '');
    }

    private function url(string $level, ?string $parent): string
    {
        $base = rtrim((string) config('services.regions.base_url'), '/');

        return match ($level) {
            'provinces' => "{$base}/provinces.json",
            'regencies' => "{$base}/regencies/{$parent}.json",
            'districts' => "{$base}/districts/{$parent}.json",
            'villages' => "{$base}/villages/{$parent}.json",
            default => throw new RuntimeException('Level wilayah tidak dikenal.'),
        };
    }

    private function unavailable(): RuntimeException
    {
        return new RuntimeException('Data wilayah sedang tidak tersedia.');
    }
}

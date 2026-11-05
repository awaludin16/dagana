<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Region\RegionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class RegionController extends Controller
{
    public function provinces(RegionService $regions): JsonResponse
    {
        return $this->respond(fn (): array => $regions->get('provinces'));
    }

    public function regencies(RegionService $regions, string $province): JsonResponse
    {
        return $this->respond(fn (): array => $regions->get('regencies', $province));
    }

    public function districts(RegionService $regions, string $regency): JsonResponse
    {
        return $this->respond(fn (): array => $regions->get('districts', $regency));
    }

    public function villages(RegionService $regions, string $district): JsonResponse
    {
        return $this->respond(fn (): array => $regions->get('villages', $district));
    }

    /**
     * @param  callable(): list<array<string, string>>  $resolver
     */
    private function respond(callable $resolver): JsonResponse
    {
        try {
            return response()->json(['data' => $resolver()]);
        } catch (RuntimeException) {
            return response()->json([
                'message' => 'Data wilayah sedang tidak tersedia. Silakan coba lagi.',
            ], 503);
        }
    }
}

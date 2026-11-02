<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Business\Actions\CreateBusinessAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Business\StoreBusinessRequest;
use App\Http\Requests\Business\UpdateBusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\OutletResource;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    public function store(StoreBusinessRequest $request, CreateBusinessAction $action): JsonResponse
    {
        $data = $request->validated();

        $business = $action->execute($request->user(), $data['business'], $data['outlet']);

        return response()->json([
            'data' => [
                'business' => new BusinessResource($business),
                'outlet' => new OutletResource($business->outlets->first()),
            ],
        ], 201);
    }

    public function show(Request $request, int $business): BusinessResource
    {
        return new BusinessResource(
            Business::visibleTo($request->user())->findOrFail($business),
        );
    }

    public function update(UpdateBusinessRequest $request, int $business): BusinessResource
    {
        $business = Business::visibleTo($request->user())->findOrFail($business);
        $business->update($request->validated());

        return new BusinessResource($business);
    }
}

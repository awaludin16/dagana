<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Outlet\Actions\DeleteOutletAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Outlet\StoreOutletRequest;
use App\Http\Requests\Outlet\UpdateOutletRequest;
use App\Http\Resources\OutletResource;
use App\Models\Outlet;
use App\Support\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OutletController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return OutletResource::collection(
            Outlet::accessibleTo($request->user())->orderBy('name')->get(),
        );
    }

    public function store(StoreOutletRequest $request): JsonResponse
    {
        $outlet = Outlet::create([
            'business_id' => $request->user()->membership->business_id,
            ...Address::merge($request->validated()),
        ]);

        return response()->json(['data' => new OutletResource($outlet)], 201);
    }

    public function show(Request $request, int $outlet): OutletResource
    {
        return new OutletResource(
            Outlet::accessibleTo($request->user())->findOrFail($outlet),
        );
    }

    public function update(UpdateOutletRequest $request, int $outlet): OutletResource
    {
        $outlet = Outlet::accessibleTo($request->user())->findOrFail($outlet);
        $outlet->update(Address::merge($request->validated()));

        return new OutletResource($outlet);
    }

    public function destroy(Request $request, int $outlet, DeleteOutletAction $action): JsonResponse
    {
        $action->execute(
            Outlet::accessibleTo($request->user())->findOrFail($outlet),
        );

        return response()->json(null, 204);
    }
}

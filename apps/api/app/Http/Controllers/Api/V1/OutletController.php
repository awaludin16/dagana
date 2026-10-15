<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Organization\Models\Business;
use App\Domain\Outlet\Models\Outlet;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Outlet\StoreOutletRequest;
use App\Http\Requests\Api\V1\Outlet\UpdateOutletRequest;
use App\Http\Resources\Api\V1\OutletResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OutletController extends Controller
{
    public function index(Business $business): AnonymousResourceCollection
    {
        $this->authorize('viewOutlets', $business);

        return OutletResource::collection(
            $business->outlets()->orderBy('name')->get()
        );
    }

    public function store(StoreOutletRequest $request, Business $business): JsonResponse
    {
        $this->authorize('createOutlet', $business);

        $outlet = $business->outlets()->create([
            'name' => $request->string('name')->toString(),
            'address' => $request->input('address'),
            'timezone' => $business->timezone,
            'status' => Outlet::STATUS_ACTIVE,
        ]);

        return (new OutletResource($outlet))->response()->setStatusCode(201);
    }

    public function show(Outlet $outlet): OutletResource
    {
        $this->authorize('view', $outlet);

        return new OutletResource($outlet);
    }

    public function update(UpdateOutletRequest $request, Outlet $outlet): OutletResource
    {
        $this->authorize('update', $outlet);

        $outlet->update($request->validated());

        return new OutletResource($outlet);
    }
}

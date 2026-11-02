<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Outlet\UpdateOutletRequest;
use App\Http\Resources\OutletResource;
use App\Models\Outlet;
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

    public function show(Request $request, int $outlet): OutletResource
    {
        return new OutletResource(
            Outlet::accessibleTo($request->user())->findOrFail($outlet),
        );
    }

    public function update(UpdateOutletRequest $request, int $outlet): OutletResource
    {
        $outlet = Outlet::accessibleTo($request->user())->findOrFail($outlet);
        $outlet->update($request->validated());

        return new OutletResource($outlet);
    }
}

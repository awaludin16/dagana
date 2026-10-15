<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Organization\Actions\CreateBusinessAction;
use App\Domain\Organization\Models\Business;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Business\StoreBusinessRequest;
use App\Http\Requests\Api\V1\Business\UpdateBusinessRequest;
use App\Http\Resources\Api\V1\BusinessResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BusinessController extends Controller
{
    /**
     * Businesses the authenticated user is a member of.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $businesses = $request->user()->businesses()
            ->withCount('outlets')
            ->orderBy('businesses.name')
            ->get();

        return BusinessResource::collection($businesses);
    }

    /**
     * Create a business and grant the creator the Owner membership.
     *
     * Any authenticated user may create a business; the first outlet is
     * optional so the onboarding flow can stay a single request.
     */
    public function store(StoreBusinessRequest $request, CreateBusinessAction $action): JsonResponse
    {
        $business = $action->execute(
            $request->user(),
            $request->businessName(),
            $request->firstOutlet(),
            $request->timezone(),
            $request->currency(),
        );

        return (new BusinessResource($business))->response()->setStatusCode(201);
    }

    public function show(Business $business): BusinessResource
    {
        $this->authorize('view', $business);

        return new BusinessResource($business->load('outlets'));
    }

    public function update(UpdateBusinessRequest $request, Business $business): BusinessResource
    {
        $this->authorize('update', $business);

        $business->update($request->validated());

        return new BusinessResource($business);
    }
}

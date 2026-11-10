<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Order\Actions\CancelOrderAction;
use App\Domain\Order\Actions\CheckoutAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $membership = $request->user()->membership;
        $businessId = $membership->business_id;

        $query = Order::query()
            ->where('business_id', $businessId)
            ->with(['items', 'payments']);

        // Non-owner hanya melihat order pada outlet yang dapat diakses (D-05).
        if (! $membership->isOwner()) {
            $query->whereIn('outlet_id', $membership->accessibleOutlets()->pluck('id')->all());
        }

        if ($request->filled('outlet_id')) {
            $outletId = (int) $request->query('outlet_id');

            if (! $membership->canAccessOutlet($outletId)) {
                throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
            }

            $query->where('outlet_id', $outletId);
        }

        return OrderResource::collection(
            $query->latest()->paginate($this->perPage($request))
        );
    }

    public function store(StoreOrderRequest $request, CheckoutAction $action): JsonResponse
    {
        $membership = $request->user()->membership;

        [$order, $created] = $action->execute(array_merge(
            $request->validated(),
            ['membership' => $membership]
        ));

        return response()->json(['data' => new OrderResource($order)], $created ? 201 : 200);
    }

    public function show(Request $request, int $order): OrderResource
    {
        $membership = $request->user()->membership;

        $model = Order::query()
            ->where('business_id', $membership->business_id)
            ->with(['items', 'payments'])
            ->findOrFail($order);

        if (! $membership->canAccessOutlet($model->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        return new OrderResource($model);
    }

    public function cancel(Request $request, int $order, CancelOrderAction $action): JsonResponse
    {
        $membership = $request->user()->membership;

        $model = Order::query()
            ->where('business_id', $membership->business_id)
            ->findOrFail($order);

        $action->execute($model, $membership);

        return response()->json(null, 204);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Outlet\Models\Outlet;
use App\Domain\Payment\Actions\ConfirmOrderPaymentAction;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Sales\Actions\CheckoutOrderAction;
use App\Domain\Sales\Models\Order;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Sales\CheckoutOrderRequest;
use App\Http\Requests\Api\V1\Sales\ConfirmOrderPaymentRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index(Request $request, Outlet $outlet): AnonymousResourceCollection
    {
        $this->authorize('viewOrders', $outlet);
        $filters = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        return OrderResource::collection(
            $outlet->orders()
                ->with(['items', 'payment'])
                ->orderByDesc('id')
                ->paginate($filters['per_page'] ?? 20)
        );
    }

    public function store(
        CheckoutOrderRequest $request,
        Outlet $outlet,
        CheckoutOrderAction $checkout,
    ): JsonResponse {
        $this->authorize('createOrder', $outlet);
        $actor = Auth::user();
        abort_unless($actor instanceof User, 401);
        $validated = $request->validated();

        $result = $checkout->execute(
            $outlet,
            $actor,
            $validated['idempotency_key'],
            $validated['items'],
            PaymentMethod::from($validated['payment_method']),
        );

        return (new OrderResource($result['order']))
            ->response()
            ->setStatusCode($result['replayed'] ? 200 : 201);
    }

    public function show(Outlet $outlet, Order $order): OrderResource
    {
        $this->authorize('viewOrders', $outlet);

        return new OrderResource($order->load(['items', 'payment']));
    }

    public function confirmPayment(
        ConfirmOrderPaymentRequest $request,
        Outlet $outlet,
        Order $order,
        ConfirmOrderPaymentAction $confirm,
    ): OrderResource {
        $this->authorize('confirmOrderPayment', $outlet);

        $actor = Auth::user();
        abort_unless($actor instanceof User, 401);

        return new OrderResource($confirm->execute(
            $order,
            $actor,
            $request->validated('reference'),
        ));
    }
}

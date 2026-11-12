<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Inventory\Actions\AdjustStockAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\AdjustStockRequest;
use App\Http\Requests\Inventory\StoreInventoryItemRequest;
use App\Http\Requests\Inventory\UpdateInventoryItemRequest;
use App\Http\Resources\InventoryItemResource;
use App\Http\Resources\StockMovementResource;
use App\Models\InventoryItem;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

/**
 * Phase 6 — Basic Inventory: item per outlet, saldo dari movement ledger,
 * adjustment, dan low stock. Semua query ter-scope business/outlet.
 */
class InventoryItemController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $membership = $request->user()->membership;

        $query = InventoryItem::query()
            ->where('business_id', $membership->business_id)
            ->withSum('movements as current_stock', 'quantity_change');

        // Non-owner hanya melihat item pada outlet yang dapat diakses (D-05).
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

        if (! is_null($request->query('is_active'))) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }

        if ($request->filled('q')) {
            $query->where('name', 'ilike', '%'.$request->string('q').'%');
        }

        return InventoryItemResource::collection(
            $query->orderBy('name')->paginate($this->perPage($request))
        );
    }

    public function store(StoreInventoryItemRequest $request): JsonResponse
    {
        $membership = $request->user()->membership;
        $outletId = (int) $request->validated('outlet_id');

        $this->ensureOutletAccess($request, $outletId);

        $item = InventoryItem::create([
            'business_id' => $membership->business_id,
            ...$request->validated(),
        ]);

        return response()->json(['data' => new InventoryItemResource($item)], 201);
    }

    public function show(Request $request, int $item): InventoryItemResource
    {
        return new InventoryItemResource($this->resolve($request, $item));
    }

    public function update(UpdateInventoryItemRequest $request, int $item): InventoryItemResource
    {
        $model = $this->resolve($request, $item);
        $validated = $request->validated();

        // Quantity historis tersimpan pada base unit item; mengganti unit setelah
        // ada movement akan mengubah arti ledger tanpa konversi.
        if (isset($validated['unit'])
            && $validated['unit'] !== $model->unit
            && $model->movements()->exists()) {
            throw ValidationException::withMessages([
                'unit' => 'Unit tidak dapat diubah setelah item memiliki movement stok.',
            ]);
        }

        $model->update($validated);
        $model->loadSum('movements as current_stock', 'quantity_change');

        return new InventoryItemResource($model);
    }

    public function adjustments(
        AdjustStockRequest $request,
        int $item,
        AdjustStockAction $action,
    ): JsonResponse {
        $membership = $request->user()->membership;
        $model = $this->resolve($request, $item);

        [$movement, $created] = $action->execute(
            $membership,
            $model,
            (int) $request->validated('quantity_change'),
            (string) $request->validated('reason'),
            (string) $request->validated('idempotency_key'),
        );

        return response()->json(
            ['data' => new StockMovementResource($movement)],
            $created ? 201 : 200,
        );
    }

    public function movements(Request $request, int $item): AnonymousResourceCollection
    {
        $model = $this->resolve($request, $item);

        return StockMovementResource::collection(
            $model->movements()->latest('id')->paginate($this->perPage($request))
        );
    }

    private function resolve(Request $request, int $itemId): InventoryItem
    {
        $membership = $request->user()->membership;

        $model = InventoryItem::query()
            ->where('business_id', $membership->business_id)
            ->withSum('movements as current_stock', 'quantity_change')
            ->findOrFail($itemId);

        if (! $membership->canAccessOutlet($model->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        return $model;
    }

    private function ensureOutletAccess(Request $request, int $outletId): void
    {
        if (! $request->user()->membership->canAccessOutlet($outletId)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }
    }
}

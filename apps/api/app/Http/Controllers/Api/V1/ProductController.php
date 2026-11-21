<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Catalog\Actions\DeleteProductAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductAvailabilityRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Requests\Product\UpdateProductStockRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductOutletAvailability;
use App\Models\ProductStock;
use App\Models\ProductStockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $outletId = $this->requestedOutlet($request);
        $availability = is_null($request->query('is_available'))
            ? null
            : $request->boolean('is_available');

        $products = Product::query()
            ->where('business_id', $request->user()->membership->business_id)
            ->with('category')
            ->when($outletId !== null, function ($query) use ($outletId): void {
                $query->with([
                    'outletAvailabilities' => fn ($relation) => $relation->where('outlet_id', $outletId),
                    'outletStocks' => fn ($relation) => $relation->where('outlet_id', $outletId),
                ]);
            })
            ->when(is_numeric($request->query('category_id')), function ($query) use ($request): void {
                $query->where('category_id', (int) $request->query('category_id'));
            })
            ->when(! is_null($request->query('is_active')), function ($query) use ($request): void {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->when($availability !== null && $outletId === null, function ($query) use ($availability): void {
                $query->where('is_available', $availability);
            })
            ->when($availability === true && $outletId !== null, function ($query) use ($outletId): void {
                $query->where('is_available', true)
                    ->whereDoesntHave('outletAvailabilities', function ($relation) use ($outletId): void {
                        $relation->where('outlet_id', $outletId)->where('is_available', false);
                    })
                    ->whereDoesntHave('outletStocks', function ($relation) use ($outletId): void {
                        $relation->where('outlet_id', $outletId)->where('quantity', 0);
                    });
            })
            ->when($availability === false && $outletId !== null, function ($query) use ($outletId): void {
                $query->where(function ($query) use ($outletId): void {
                    $query->where('is_available', false)
                        ->orWhereHas('outletAvailabilities', function ($relation) use ($outletId): void {
                            $relation->where('outlet_id', $outletId)->where('is_available', false);
                        });
                });
            })
            ->when($request->filled('q'), function ($query) use ($request): void {
                $query->where('name', 'ilike', '%'.$request->string('q').'%');
            })
            ->orderBy('name')
            ->paginate($this->perPage($request));

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::create([
            'business_id' => $request->user()->membership->business_id,
            ...$request->validated(),
        ])->load('category');

        return response()->json(['data' => new ProductResource($product)], 201);
    }

    public function show(Request $request, int $product): ProductResource
    {
        return new ProductResource($this->loadOutletContext($this->scopedProduct($request, $product), $request));
    }

    public function update(UpdateProductRequest $request, int $product): ProductResource
    {
        $model = $this->scopedProduct($request, $product);
        $model->update($request->validated());
        $model->load('category');

        return new ProductResource($this->loadOutletContext($model, $request));
    }

    public function updateAvailability(UpdateProductAvailabilityRequest $request, int $product): ProductResource
    {
        $model = $this->scopedProduct($request, $product);
        $outletId = (int) $request->validated('outlet_id');

        abort_unless($request->user()->membership->canAccessOutlet($outletId), 404);

        ProductOutletAvailability::updateOrCreate(
            ['product_id' => $model->id, 'outlet_id' => $outletId],
            ['is_available' => $request->boolean('is_available')],
        );

        $model->load(['category', 'outletAvailabilities' => fn ($relation) => $relation->where('outlet_id', $outletId)]);

        return new ProductResource($model);
    }

    public function updateStock(UpdateProductStockRequest $request, int $product): ProductResource
    {
        $model = $this->scopedProduct($request, $product);
        $outletId = (int) $request->validated('outlet_id');

        abort_unless($request->user()->membership->canAccessOutlet($outletId), 404);

        $businessId = $request->user()->membership->business_id;
        $requestedQuantity = $request->validated('quantity');
        $nextQuantity = $requestedQuantity === null ? null : (int) $requestedQuantity;

        DB::transaction(function () use ($businessId, $model, $outletId, $nextQuantity, $request): void {
            $stock = ProductStock::query()
                ->where('business_id', $businessId)
                ->where('product_id', $model->id)
                ->where('outlet_id', $outletId)
                ->lockForUpdate()
                ->first();

            $previousQuantity = $stock?->quantity ?? 0;

            if ($nextQuantity === null) {
                $stock?->delete();
            } elseif ($stock !== null) {
                $stock->quantity = $nextQuantity;
                $stock->save();
            } else {
                $stock = ProductStock::create([
                    'business_id' => $businessId,
                    'product_id' => $model->id,
                    'outlet_id' => $outletId,
                    'quantity' => $nextQuantity,
                ]);
            }

            $change = ($nextQuantity ?? 0) - $previousQuantity;

            if ($change !== 0) {
                ProductStockMovement::create([
                    'business_id' => $businessId,
                    'product_id' => $model->id,
                    'outlet_id' => $outletId,
                    'membership_id' => $request->user()->membership->id,
                    'order_id' => null,
                    'product_name' => $model->name,
                    'quantity_change' => $change,
                    'type' => ProductStockMovement::TYPE_ADJUSTMENT,
                    'reason' => $request->validated('reason') ?: ($nextQuantity === null ? 'Stok tidak lagi dipantau' : 'Penyesuaian manual'),
                    'created_at' => now(),
                ]);
            }
        });

        $model->load([
            'category',
            'outletAvailabilities' => fn ($relation) => $relation->where('outlet_id', $outletId),
            'outletStocks' => fn ($relation) => $relation->where('outlet_id', $outletId),
        ]);

        return new ProductResource($model);
    }

    public function destroy(Request $request, int $product, DeleteProductAction $action): JsonResponse
    {
        $action->execute($this->scopedProduct($request, $product));

        return response()->json(null, 204);
    }

    private function scopedProduct(Request $request, int $productId): Product
    {
        return Product::query()
            ->where('business_id', $request->user()->membership->business_id)
            ->findOrFail($productId);
    }

    /**
     * Optional outlet context: availability (D-35) and stock (D-37) per outlet.
     * An outlet outside the caller's access is reported as 404 so existence is
     * not leaked (D-05).
     */
    private function requestedOutlet(Request $request): ?int
    {
        if (! is_numeric($request->query('outlet_id'))) {
            return null;
        }

        $outletId = (int) $request->query('outlet_id');
        abort_unless($request->user()->membership->canAccessOutlet($outletId), 404);

        return $outletId;
    }

    private function loadOutletContext(Product $product, Request $request): Product
    {
        $outletId = $this->requestedOutlet($request);

        if ($outletId !== null) {
            $product->load([
                'outletAvailabilities' => fn ($relation) => $relation->where('outlet_id', $outletId),
                'outletStocks' => fn ($relation) => $relation->where('outlet_id', $outletId),
            ]);
        }

        return $product;
    }
}

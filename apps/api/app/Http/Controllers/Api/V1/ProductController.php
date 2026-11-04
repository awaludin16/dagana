<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Catalog\Actions\DeleteProductAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::query()
            ->where('business_id', $request->user()->membership->business_id)
            ->with('category')
            ->when(is_numeric($request->query('category_id')), function ($query) use ($request): void {
                $query->where('category_id', (int) $request->query('category_id'));
            })
            ->when(! is_null($request->query('is_active')), function ($query) use ($request): void {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->when(! is_null($request->query('is_available')), function ($query) use ($request): void {
                $query->where('is_available', $request->boolean('is_available'));
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
        return new ProductResource($this->scopedProduct($request, $product));
    }

    public function update(UpdateProductRequest $request, int $product): ProductResource
    {
        $model = $this->scopedProduct($request, $product);
        $model->update($request->validated());

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
}

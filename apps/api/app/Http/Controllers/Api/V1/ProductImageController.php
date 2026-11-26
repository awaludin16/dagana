<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Catalog\Actions\DeleteProductImageAction;
use App\Domain\Catalog\Actions\StoreProductImageAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\UploadProductImageRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductImageController extends Controller
{
    public function store(
        UploadProductImageRequest $request,
        int $product,
        StoreProductImageAction $action,
    ): ProductResource {
        $model = $this->scopedProduct($request, $product);
        $action->execute($model, $request->file('image'));
        $model->load('category');

        return new ProductResource($model);
    }

    public function destroy(
        Request $request,
        int $product,
        DeleteProductImageAction $action,
    ): ProductResource {
        $model = $this->scopedProduct($request, $product);
        $action->execute($model);
        $model->load('category');

        return new ProductResource($model);
    }

    private function scopedProduct(Request $request, int $productId): Product
    {
        return Product::query()
            ->where('business_id', $request->user()->membership->business_id)
            ->findOrFail($productId);
    }
}

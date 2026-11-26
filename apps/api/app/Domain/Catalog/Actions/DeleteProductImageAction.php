<?php

namespace App\Domain\Catalog\Actions;

use App\Domain\Catalog\Services\ProductImageService;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class DeleteProductImageAction
{
    public function __construct(private readonly ProductImageService $images) {}

    public function execute(Product $product): Product
    {
        $oldPath = DB::transaction(function () use ($product): ?string {
            $locked = Product::query()
                ->whereKey($product->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $oldPath = $locked->image_path;
            $locked->update(['image_path' => null]);

            return $oldPath;
        });

        $this->images->delete($oldPath);

        return $product->refresh();
    }
}

<?php

namespace App\Domain\Catalog\Actions;

use App\Domain\Catalog\Services\ProductImageService;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

class StoreProductImageAction
{
    public function __construct(private readonly ProductImageService $images) {}

    /**
     * Filesystem and database writes are not atomic. Upload first, then update
     * the row; delete the new file when the database update fails, and only
     * delete the old file after the new path is committed.
     */
    public function execute(Product $product, UploadedFile $file): Product
    {
        $newPath = $this->images->store($product, $file);

        try {
            $oldPath = DB::transaction(function () use ($product, $newPath): ?string {
                $locked = Product::query()
                    ->whereKey($product->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();

                $oldPath = $locked->image_path;
                $locked->update(['image_path' => $newPath]);

                return $oldPath;
            });
        } catch (Throwable $exception) {
            $this->images->delete($newPath);

            throw $exception;
        }

        $this->images->delete($oldPath);

        return $product->refresh();
    }
}

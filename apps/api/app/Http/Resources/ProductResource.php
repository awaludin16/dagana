<?php

namespace App\Http\Resources;

use App\Domain\Catalog\Services\ProductImageService;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'name' => $this->name,
            'price' => $this->price,
            'image_path' => $this->image_path,
            'image_url' => app(ProductImageService::class)->url($this->image_path),
            'is_active' => $this->is_active,
            'is_available' => $this->is_available,
            'is_available_at_outlet' => $this->when(
                $this->relationLoaded('outletStocks'),
                fn (): bool => $this->is_available
                    && ($this->outletStocks->first()?->quantity ?? 1) !== 0,
            ),
            'stock_quantity' => $this->when(
                $this->relationLoaded('outletStocks'),
                fn (): ?int => $this->outletStocks->first()?->quantity,
            ),
            'low_stock_threshold' => $this->when(
                $this->relationLoaded('outletStocks'),
                fn (): ?int => $this->outletStocks->first()?->low_stock_threshold,
            ),
            'low_stock' => $this->when(
                $this->relationLoaded('outletStocks'),
                function (): bool {
                    $stock = $this->outletStocks->first();

                    return $stock !== null
                        && $stock->low_stock_threshold !== null
                        && $stock->quantity <= $stock->low_stock_threshold;
                },
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

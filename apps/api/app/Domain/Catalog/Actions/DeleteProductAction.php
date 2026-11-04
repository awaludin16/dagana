<?php

namespace App\Domain\Catalog\Actions;

use App\Models\Product;

class DeleteProductAction
{
    /**
     * shortcut: historical reference guard (order items) arrives with Phase 4;
     * once orders exist, this must refuse to delete a product that already has
     * a transaction and rely on deactivation via PATCH is_active instead.
     */
    public function execute(Product $product): void
    {
        $product->delete();
    }
}

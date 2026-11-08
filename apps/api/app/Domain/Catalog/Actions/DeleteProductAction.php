<?php

namespace App\Domain\Catalog\Actions;

use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Validation\ValidationException;

class DeleteProductAction
{
    /**
     * shortcut: historical reference guard (order items) arrives with Phase 4;
     * once orders exist, this must refuse to delete a product that already has
     * a transaction and rely on deactivation via PATCH is_active instead.
     */
    public function execute(Product $product): void
    {
        // Produk yang sudah dirujuk oleh histori transaksi tidak boleh
        // dihapus (menjaga snapshot order); nonaktifkan melalui PATCH
        // is_active = false sebagai penggantinya.
        if (OrderItem::query()->where('product_id', $product->id)->exists()) {
            throw ValidationException::withMessages([
                'product' => 'Produk tidak dapat dihapus karena sudah digunakan pada histori transaksi. Nonaktifkan produk sebagai penggantinya.',
            ]);
        }

        $product->delete();
    }
}

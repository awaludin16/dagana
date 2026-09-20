<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validasi tambahan untuk array variants pada payload produk:
 * SKU/barcode tidak boleh duplikat dalam satu payload (selain unik di DB).
 */
trait ValidatesVariantKeys
{
    protected function rejectDuplicateVariantKeys(FormRequest $request, Validator $validator): void
    {
        $variants = $request->input('variants');

        if (! is_array($variants) || $variants === []) {
            return;
        }

        $skus = array_map(fn ($variant): ?string => $variant['sku'] ?? null, $variants);
        $skus = array_values(array_filter($skus));

        if (count($skus) !== count(array_unique($skus))) {
            $validator->errors()->add('variants', 'SKU tidak boleh duplikat dalam satu produk.');
        }

        $barcodes = array_map(fn ($variant): ?string => $variant['barcode'] ?? null, $variants);
        $barcodes = array_values(array_filter($barcodes));

        if (count($barcodes) !== count(array_unique($barcodes))) {
            $validator->errors()->add('variants', 'Barcode tidak boleh duplikat dalam satu produk.');
        }
    }
}

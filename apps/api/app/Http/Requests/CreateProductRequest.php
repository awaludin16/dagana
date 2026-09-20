<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // SKU & barcode unik per tenant (bukan global) — kolom tenant_id
        // denormalisasi pada product_variants menegakkan ini di level DB.
        $tenantId = $this->attributes->get('tenant_context');

        $skuRule = Rule::unique('product_variants', 'sku')
            ->where(fn ($query) => $query->where('tenant_id', $tenantId));

        $barcodeRule = Rule::unique('product_variants', 'barcode')
            ->where(fn ($query) => $query->where('tenant_id', $tenantId));

        return [
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'url'],

            'variants' => ['required', 'array', 'min:1'],
            'variants.*.sku' => ['required', 'string', 'max:100', $skuRule],
            'variants.*.barcode' => ['nullable', 'string', 'max:100', $barcodeRule],
            'variants.*.unit' => ['nullable', 'string', 'max:20'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.cost_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}

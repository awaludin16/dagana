<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesVariantKeys;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    use ValidatesVariantKeys;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // SKU & barcode unik per tenant, kecuali variants milik produk ini:
        // saat mengganti seluruh variants, baris lama dihapus sebelum insert ulang.
        $tenantId = $this->attributes->get('tenant_context');
        $product = $this->route('product');
        $ownVariantIds = $product?->variants()->pluck('id')->all() ?? [];

        $skuUnique = function (string $attribute, mixed $value, Closure $fail) use ($tenantId, $ownVariantIds): void {
            $exists = DB::table('product_variants')
                ->where('tenant_id', $tenantId)
                ->where('sku', $value)
                ->when($ownVariantIds !== [], fn ($query) => $query->whereNotIn('id', $ownVariantIds))
                ->exists();

            if ($exists) {
                $fail('SKU sudah dipakai produk lain.');
            }
        };

        $barcodeUnique = function (string $attribute, mixed $value, Closure $fail) use ($tenantId, $ownVariantIds): void {
            $exists = DB::table('product_variants')
                ->where('tenant_id', $tenantId)
                ->where('barcode', $value)
                ->when($ownVariantIds !== [], fn ($query) => $query->whereNotIn('id', $ownVariantIds))
                ->exists();

            if ($exists) {
                $fail('Barcode sudah dipakai varian lain.');
            }
        };

        return [
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'url'],
            'status' => ['sometimes', 'in:ACTIVE,INACTIVE'],

            'variants' => ['sometimes', 'array', 'min:1'],
            'variants.*.sku' => ['required', 'string', 'max:100', $skuUnique],
            'variants.*.barcode' => ['nullable', 'string', 'max:100', $barcodeUnique],
            'variants.*.unit' => ['nullable', 'string', 'max:20'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.cost_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->rejectDuplicateVariantKeys($this, $validator);
        });
    }
}

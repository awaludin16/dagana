<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateProductVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->attributes->get('tenant_context');

        return [
            'sku' => [
                'required', 'string', 'max:100',
                Rule::unique('product_variants', 'sku')
                    ->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'barcode' => [
                'nullable', 'string', 'max:100',
                Rule::unique('product_variants', 'barcode')
                    ->where(fn ($query) => $query->where('tenant_id', $tenantId)),
            ],
            'unit' => ['nullable', 'string', 'max:20'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}

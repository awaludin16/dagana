<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_variant_id' => [
                'required', 'uuid',
                Rule::exists('product_variants', 'id')
                    ->where('tenant_id', $this->attributes->get('tenant_context')),
            ],
            // bertanda: positif = stok masuk, negatif = stok keluar; 0 ditolak.
            'quantity' => ['required', 'numeric', Rule::notIn([0, '0', '0.0', '0.00'])],
            'reason' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}

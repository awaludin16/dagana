<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStockReceivingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'received_at' => ['nullable', 'date'],
            'note' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_variant_id' => [
                'required', 'uuid',
                Rule::exists('product_variants', 'id')
                    ->where('tenant_id', $this->attributes->get('tenant_context')),
            ],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.cost_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}

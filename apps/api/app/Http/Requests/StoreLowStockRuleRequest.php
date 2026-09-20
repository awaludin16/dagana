<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLowStockRuleRequest extends FormRequest
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
            // null = berlaku untuk seluruh outlet tenant.
            'outlet_id' => ['nullable', 'uuid', 'exists:outlets,id'],
            'threshold' => ['required', 'numeric', 'min:0'],
        ];
    }
}

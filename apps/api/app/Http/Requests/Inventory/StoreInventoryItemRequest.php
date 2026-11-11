<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $businessId = $this->user()->membership->business_id;

        return [
            'outlet_id' => [
                'required',
                'integer',
                Rule::exists('outlets', 'id')->where('business_id', $businessId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:20'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0', 'max:4294967295'],
            'is_active' => ['boolean'],
        ];
    }
}

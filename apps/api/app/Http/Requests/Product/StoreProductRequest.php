<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'category_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where('business_id', $businessId),
            ],
            'price' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'is_available' => ['boolean'],
        ];
    }
}

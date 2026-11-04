<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category_id' => [
                'sometimes',
                'nullable',
                Rule::exists('categories', 'id')->where('business_id', $businessId),
            ],
            'price' => ['sometimes', 'required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'required', 'boolean'],
            'is_available' => ['sometimes', 'required', 'boolean'],
        ];
    }
}

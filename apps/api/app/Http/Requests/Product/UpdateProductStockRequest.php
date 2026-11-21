<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductStockRequest extends FormRequest
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
            // null mengembalikan menu ke kondisi tanpa batas (tidak dilacak).
            'quantity' => ['present', 'nullable', 'integer', 'min:0', 'max:1000000'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}

<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductAvailabilityRequest extends FormRequest
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
            'is_available' => ['required', 'boolean'],
        ];
    }
}

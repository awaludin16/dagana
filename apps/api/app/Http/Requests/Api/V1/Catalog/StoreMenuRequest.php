<?php

namespace App\Http\Requests\Api\V1\Catalog;

use App\Domain\Catalog\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMenuRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('name'))) {
            $this->merge(['name' => trim($this->input('name'))]);
        }
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $business = $this->route('business');

        return [
            'name' => ['required', 'string', 'max:150'],
            'price' => ['required', 'integer', 'min:1', 'max:9223372036854775807'],
            'category_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('categories', 'id')
                    ->where('business_id', $business->getKey())
                    ->where('status', Category::STATUS_ACTIVE),
            ],
            'is_available' => ['sometimes', 'boolean'],
        ];
    }
}

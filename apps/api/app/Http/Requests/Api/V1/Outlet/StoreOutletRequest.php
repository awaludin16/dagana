<?php

namespace App\Http\Requests\Api\V1\Outlet;

use App\Rules\UniqueOutletName;
use Illuminate\Foundation\Http\FormRequest;

class StoreOutletRequest extends FormRequest
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
        return [
            'name' => [
                'required',
                'string',
                'max:150',
                new UniqueOutletName($this->route('business')->getKey()),
            ],
            'address' => ['nullable', 'string', 'max:255'],
        ];
    }
}

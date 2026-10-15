<?php

namespace App\Http\Requests\Api\V1\Outlet;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOutletRequest extends FormRequest
{
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
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
        ];
    }
}

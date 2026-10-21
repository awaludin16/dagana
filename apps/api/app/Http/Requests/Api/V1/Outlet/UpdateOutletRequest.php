<?php

namespace App\Http\Requests\Api\V1\Outlet;

use App\Domain\Outlet\Models\Outlet;
use App\Rules\UniqueOutletName;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOutletRequest extends FormRequest
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
        /** @var Outlet $outlet */
        $outlet = $this->route('outlet');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:150',
                new UniqueOutletName($outlet->business_id, $outlet->getKey()),
            ],
            'address' => ['nullable', 'string', 'max:255'],
        ];
    }
}

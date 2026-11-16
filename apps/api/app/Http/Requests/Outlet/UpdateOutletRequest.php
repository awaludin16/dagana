<?php

namespace App\Http\Requests\Outlet;

use App\Support\Address;
use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOutletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('phone') !== null) {
            $this->merge(['phone' => Phone::digits($this->input('phone'))]);
        }
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:30', 'regex:/^\d{10,13}$/'],
            ...Address::rules('address'),
        ];
    }
}

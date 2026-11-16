<?php

namespace App\Http\Requests\Outlet;

use App\Support\Address;
use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;

class StoreOutletRequest extends FormRequest
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
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^\d{10,13}$/'],
            ...Address::rules('address', required: true),
        ];
    }
}

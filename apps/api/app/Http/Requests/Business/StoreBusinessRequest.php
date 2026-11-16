<?php

namespace App\Http\Requests\Business;

use App\Support\Address;
use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $outlet = $this->input('outlet');

        if (is_array($outlet) && ($outlet['phone'] ?? null) !== null) {
            $outlet['phone'] = Phone::digits($outlet['phone']);
            $this->merge(['outlet' => $outlet]);
        }
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'business' => ['required', 'array'],
            'business.name' => ['required', 'string', 'max:255'],
            'outlet' => ['required', 'array'],
            'outlet.name' => ['required', 'string', 'max:255'],
            'outlet.phone' => ['required', 'string', 'max:30', 'regex:/^\d{10,13}$/'],
            ...Address::rules('outlet.address', required: true),
        ];
    }

    /**
     * @return list<callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->user()->membership()->exists()) {
                    $validator->errors()->add('business', 'User ini sudah terhubung ke sebuah business.');
                }
            },
        ];
    }
}

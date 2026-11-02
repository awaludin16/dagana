<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreBusinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'business' => ['required', 'array'],
            'business.name' => ['required', 'string', 'max:255'],
            'business.phone' => ['nullable', 'string', 'max:30'],
            'business.address' => ['nullable', 'string', 'max:1000'],
            'outlet' => ['required', 'array'],
            'outlet.name' => ['required', 'string', 'max:255'],
            'outlet.phone' => ['nullable', 'string', 'max:30'],
            'outlet.address' => ['nullable', 'string', 'max:1000'],
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

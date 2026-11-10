<?php

namespace App\Http\Requests\Cash;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validasi membuka Cash Session. Nominal kas memakai integer rupiah penuh
 * (aturan amount Dagana), tanpa pecahan.
 */
class StoreCashSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array>
     */
    public function rules(): array
    {
        return [
            'outlet_id' => ['required', 'integer', 'exists:outlets,id'],
            'opening_cash' => ['required', 'integer', 'min:0', 'max:4294967295'],
        ];
    }
}

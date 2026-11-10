<?php

namespace App\Http\Requests\Cash;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validasi menutup Cash Session: actual cash wajib integer rupiah >= 0;
 * catatan selisih opsional. Expected cash dan variance dihitung di backend.
 */
class CloseCashSessionRequest extends FormRequest
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
            'actual_cash' => ['required', 'integer', 'min:0', 'max:4294967295'],
            'variance_note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

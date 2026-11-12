<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Adjustment memakai quantity_change bertanda: positif masuk, negatif keluar.
 * Reason wajib agar perubahan saldo dapat dipertanggungjawabkan.
 */
class AdjustStockRequest extends FormRequest
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
            'quantity_change' => ['required', 'integer', 'not_in:0', 'min:-1000000000', 'max:1000000000'],
            'reason' => ['required', 'string', 'max:1000'],
            'idempotency_key' => ['required', 'uuid'],
        ];
    }
}

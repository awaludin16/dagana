<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi input checkout. Harga dan total dihitung ulang di backend dari
 * catalog yang sah; harga yang dikirim client tidak diterima.
 */
class StoreOrderRequest extends FormRequest
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
            'idempotency_key' => ['required', 'string', 'uuid', 'max:255'],
            'payment_method' => ['required', Rule::in([
                'cash', 'qr_payment', 'bank_transfer', 'debit', 'credit',
            ])],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

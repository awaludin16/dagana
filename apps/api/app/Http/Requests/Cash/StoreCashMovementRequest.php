<?php

namespace App\Http\Requests\Cash;

use App\Models\CashMovement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi movement kas manual. CASH_IN/CASH_OUT/REFUND memakai nominal
 * positif (arah arus ditentukan type); ADJUSTMENT memakai integer bertanda
 * (boleh minus) untuk koreksi dua arah.
 */
class StoreCashMovementRequest extends FormRequest
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
            'type' => ['required', Rule::in([
                CashMovement::TYPE_CASH_IN,
                CashMovement::TYPE_CASH_OUT,
                CashMovement::TYPE_REFUND,
                CashMovement::TYPE_ADJUSTMENT,
            ])],
            'amount' => [
                'required',
                'integer',
                'not_in:0',
                'max:2000000000',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $type = (string) $this->input('type');
                    $amount = (int) $value;

                    // Arah arus ditentukan type: nominal harus positif.
                    if (in_array($type, [
                        CashMovement::TYPE_CASH_IN,
                        CashMovement::TYPE_CASH_OUT,
                        CashMovement::TYPE_REFUND,
                    ], true) && $amount < 1) {
                        $fail('Nilai amount harus positif untuk type IN, OUT, atau REFUND.');
                    }

                    if ($amount < -2_000_000_000) {
                        $fail('Nilai amount melebihi batas.');
                    }
                },
            ],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

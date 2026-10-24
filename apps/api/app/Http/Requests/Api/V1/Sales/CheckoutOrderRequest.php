<?php

namespace App\Http\Requests\Api\V1\Sales;

use App\Domain\Payment\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutOrderRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['idempotency_key' => $this->header('Idempotency-Key')]);
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
        return [
            'idempotency_key' => ['required', 'string', 'min:16', 'max:128'],
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.menu_id' => ['required', 'integer', 'min:1', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
        ];
    }
}

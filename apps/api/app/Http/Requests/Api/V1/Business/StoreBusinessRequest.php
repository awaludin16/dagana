<?php

namespace App\Http\Requests\Api\V1\Business;

use Illuminate\Foundation\Http\FormRequest;

class StoreBusinessRequest extends FormRequest
{
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
            'name' => ['required', 'string', 'max:150'],
            'timezone' => ['sometimes', 'string', 'timezone'],
            'currency' => ['sometimes', 'string', 'size:3'],

            'outlet' => ['sometimes', 'array'],
            'outlet.name' => ['required_with:outlet', 'string', 'max:150'],
            'outlet.address' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function businessName(): string
    {
        return $this->string('name')->toString();
    }

    public function timezone(): string
    {
        return $this->input('timezone', 'Asia/Jakarta');
    }

    public function currency(): string
    {
        return $this->input('currency', 'IDR');
    }

    /**
     * @return array{name: string, address?: string|null}|null
     */
    public function firstOutlet(): ?array
    {
        if (! $this->has('outlet')) {
            return null;
        }

        return [
            'name' => $this->input('outlet.name'),
            'address' => $this->input('outlet.address'),
        ];
    }
}

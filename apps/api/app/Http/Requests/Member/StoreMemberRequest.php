<?php

namespace App\Http\Requests\Member;

use App\Models\BusinessMembership;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->email)) {
            $this->merge(['email' => strtolower($this->email)]);
        }
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $businessId = $this->user()->membership->business_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in([BusinessMembership::ROLE_MANAGER, BusinessMembership::ROLE_CASHIER])],
            'outlet_ids' => ['required', 'array', 'min:1'],
            'outlet_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('outlets', 'id')->where('business_id', $businessId),
            ],
        ];
    }
}

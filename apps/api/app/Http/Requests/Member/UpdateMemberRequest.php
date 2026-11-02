<?php

namespace App\Http\Requests\Member;

use App\Models\BusinessMembership;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        $businessId = $this->user()->membership->business_id;

        return [
            'role' => ['sometimes', Rule::in([BusinessMembership::ROLE_MANAGER, BusinessMembership::ROLE_CASHIER])],
            'outlet_ids' => ['sometimes', 'array', 'min:1'],
            'outlet_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('outlets', 'id')->where('business_id', $businessId),
            ],
        ];
    }
}

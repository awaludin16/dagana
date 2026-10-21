<?php

namespace App\Http\Requests\Api\V1\Membership;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Outlet\Models\Outlet;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberInvitationRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => mb_strtolower(trim($this->input('email')))]);
        }
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
        $businessId = $this->route('business')?->getKey();

        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'role' => ['required', Rule::enum(RolePreset::class)],
            'outlet_ids' => ['sometimes', 'array'],
            'outlet_ids.*' => [
                'integer',
                Rule::exists('outlets', 'id')
                    ->where('business_id', $businessId)
                    ->where('status', Outlet::STATUS_ACTIVE),
            ],
            'permission_grants' => ['sometimes', 'array'],
            'permission_grants.*' => [Rule::enum(Permission::class)],
            'permission_denials' => ['sometimes', 'array'],
            'permission_denials.*' => [Rule::enum(Permission::class)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $grants = $this->input('permission_grants', []);
            $denials = $this->input('permission_denials', []);

            if (is_array($grants) && is_array($denials) && array_intersect($grants, $denials) !== []) {
                $validator->errors()->add(
                    'permission_grants',
                    __('A permission cannot be both granted and denied.'),
                );
            }
        });
    }

    public function email(): string
    {
        return $this->string('email')->toString();
    }

    public function role(): RolePreset
    {
        return RolePreset::from($this->string('role')->toString());
    }

    /**
     * @return array<int, int>
     */
    public function outletIds(): array
    {
        return array_map('intval', $this->input('outlet_ids', []));
    }

    /**
     * @return array<int, string>
     */
    public function permissionGrants(): array
    {
        return array_map('strval', $this->input('permission_grants', []));
    }

    /**
     * @return array<int, string>
     */
    public function permissionDenials(): array
    {
        return array_map('strval', $this->input('permission_denials', []));
    }

    public function hasPermissionOverrides(): bool
    {
        return $this->has('permission_grants') || $this->has('permission_denials');
    }
}

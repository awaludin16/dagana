<?php

namespace App\Http\Requests\Api\V1\Membership;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Authorization\Enums\RolePreset;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMemberRequest extends FormRequest
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
        $businessId = $this->route('business')?->getKey();

        return [
            'email' => ['required', 'string', 'email', 'max:255', 'exists:users,email'],
            'role' => ['required', Rule::enum(RolePreset::class)],
            'outlet_ids' => ['sometimes', 'array'],
            'outlet_ids.*' => [
                'integer',
                Rule::exists('outlets', 'id')->where('business_id', $businessId),
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

            if (! is_array($grants) || ! is_array($denials)) {
                return;
            }

            if (array_intersect($grants, $denials) !== []) {
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

    public function hasPermissionOverrides(): bool
    {
        return $this->has('permission_grants') || $this->has('permission_denials');
    }

    /**
     * @return array<int, string>
     */
    public function permissionGrants(): array
    {
        $value = $this->input('permission_grants', []);

        return is_array($value) ? array_map('strval', $value) : [];
    }

    /**
     * @return array<int, string>
     */
    public function permissionDenials(): array
    {
        $value = $this->input('permission_denials', []);

        return is_array($value) ? array_map('strval', $value) : [];
    }
}

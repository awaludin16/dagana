<?php

namespace App\Http\Requests\Api\V1\Membership;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Authorization\Enums\RolePreset;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
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
            'role' => ['sometimes', Rule::enum(RolePreset::class)],
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

    public function role(): ?RolePreset
    {
        return $this->has('role')
            ? RolePreset::from($this->string('role')->toString())
            : null;
    }

    /**
     * @return array<int, int>|null
     */
    public function outletIds(): ?array
    {
        return $this->has('outlet_ids')
            ? array_map('intval', $this->input('outlet_ids'))
            : null;
    }

    public function hasPermissionOverrides(): bool
    {
        return $this->has('permission_grants') || $this->has('permission_denials');
    }

    /**
     * @return array<int, string>|null
     */
    public function permissionGrants(): ?array
    {
        return $this->has('permission_grants') ? $this->stringList('permission_grants') : null;
    }

    /**
     * @return array<int, string>|null
     */
    public function permissionDenials(): ?array
    {
        return $this->has('permission_denials') ? $this->stringList('permission_denials') : null;
    }

    /**
     * @return array<int, string>
     */
    private function stringList(string $key): array
    {
        $value = $this->input($key, []);

        return is_array($value) ? array_map('strval', $value) : [];
    }
}

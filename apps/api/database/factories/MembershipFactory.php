<?php

namespace Database\Factories;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Membership>
 */
class MembershipFactory extends Factory
{
    protected $model = Membership::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'user_id' => User::factory(),
            'role' => RolePreset::Owner,
            'status' => Membership::STATUS_ACTIVE,
        ];
    }

    public function role(RolePreset $role): static
    {
        return $this->state(fn (): array => ['role' => $role]);
    }

    public function forBusiness(Business $business): static
    {
        return $this->state(fn (): array => ['business_id' => $business->getKey()]);
    }

    public function forUser(User $user): static
    {
        return $this->state(fn (): array => ['user_id' => $user->getKey()]);
    }
}

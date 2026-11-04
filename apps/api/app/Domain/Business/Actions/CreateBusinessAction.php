<?php

namespace App\Domain\Business\Actions;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\User;
use App\Support\Address;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateBusinessAction
{
    /**
     * Create the business, its first outlet, and the owner membership together.
     *
     * @param  array{name: string}  $businessAttributes
     * @param  array{name: string, phone?: ?string, address?: ?array<string, mixed>}  $outletAttributes
     */
    public function execute(User $user, array $businessAttributes, array $outletAttributes): Business
    {
        try {
            return DB::transaction(function () use ($user, $businessAttributes, $outletAttributes) {
                $address = Address::attributes($outletAttributes['address'] ?? null);

                $business = Business::create([
                    'name' => $businessAttributes['name'],
                ]);
                $business->outlets()->create([
                    'name' => $outletAttributes['name'],
                    'phone' => $outletAttributes['phone'] ?? null,
                    ...$address,
                ]);
                $business->memberships()->create([
                    'user_id' => $user->id,
                    'role' => BusinessMembership::ROLE_OWNER,
                    'status' => BusinessMembership::STATUS_ACTIVE,
                ]);

                return $business->load('outlets');
            });
        } catch (UniqueConstraintViolationException) {
            // The unique membership constraint is the final guard against concurrent onboarding.
            throw ValidationException::withMessages([
                'business' => 'User ini sudah terhubung ke sebuah business.',
            ]);
        }
    }
}

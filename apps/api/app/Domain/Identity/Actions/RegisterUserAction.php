<?php

namespace App\Domain\Identity\Actions;

use App\Models\User;

/**
 * Registers a new user identity.
 *
 * Does not create a business; onboarding (business + outlet) is a separate
 * authenticated step handled by the Organization domain.
 */
class RegisterUserAction
{
    public function execute(string $name, string $email, string $password): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ]);
    }
}

<?php

namespace App\Domain\Organization\Exceptions;

use RuntimeException;

/**
 * Thrown when an operation would leave a business without an active owner.
 *
 * A business must always keep at least one active Owner membership so that
 * administration, permissions, and billing never become unreachable.
 */
class LastOwnerException extends RuntimeException
{
    public static function cannotRemoveLastOwner(): self
    {
        return new self('A business must keep at least one active owner.');
    }
}

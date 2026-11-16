<?php

namespace App\Support;

/**
 * Phone number helpers shared by outlet/business requests.
 */
final class Phone
{
    /**
     * Strip every non-digit character so "0812-3456-789" becomes "08123456789".
     * Returns null for null input so "required" still reports correctly.
     */
    public static function digits(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return preg_replace('/\D/', '', (string) $value);
    }
}

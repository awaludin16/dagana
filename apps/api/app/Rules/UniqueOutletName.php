<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

class UniqueOutletName implements ValidationRule
{
    public function __construct(
        private readonly int|string $businessId,
        private readonly int|string|null $ignoreOutletId = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        $query = DB::table('outlets')
            ->where('business_id', $this->businessId)
            ->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($value))]);

        if ($this->ignoreOutletId !== null) {
            $query->where('id', '!=', $this->ignoreOutletId);
        }

        if ($query->exists()) {
            $fail('Nama outlet sudah digunakan dalam business ini.');
        }
    }
}

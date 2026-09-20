<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Str;

/**
 * Primary key UUID terurut (D6): aman offline (bisa generate di klien)
 * dan tidak membocorkan urutan data.
 */
trait HasUuid
{
    use HasUuids;

    public function newUniqueId(): string
    {
        return (string) Str::orderedUuid();
    }
}

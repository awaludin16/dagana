<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    public const MAX_PER_PAGE = 100;

    /**
     * Documented list limit: default 20, client may request 1..100.
     */
    protected function perPage(Request $request): int
    {
        return min(self::MAX_PER_PAGE, max(1, $request->integer('per_page', 20)));
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): UserResource
    {
        $user = $request->user()->load([
            'memberships.business',
            'memberships.outlets',
        ]);

        return new UserResource($user);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\BusinessMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        [$user, $token] = DB::transaction(function () use ($data): array {
            $user = User::create($data);

            return [$user, $user->createToken('api')->plainTextToken];
        });

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $this->rejectInactiveMembership($user);

        $token = $user->createToken($data['device_name'] ?? 'api')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    public function webRegister(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = DB::transaction(fn (): User => User::create($data));

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'data' => new UserResource($user->load('membership.business')),
        ], 201);
    }

    public function webLogin(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $this->rejectInactiveMembership($user);

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json([
            'data' => new UserResource($user->load('membership.business')),
        ]);
    }

    public function webLogout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(null, 204);
    }

    /**
     * Deactivation revokes tokens; do not hand out a new one. Users without a
     * membership (fresh registration before onboarding) may still log in.
     */
    private function rejectInactiveMembership(User $user): void
    {
        $membership = $user->membership;

        if ($membership && $membership->status === BusinessMembership::STATUS_INACTIVE) {
            throw ValidationException::withMessages([
                'email' => 'Akun Anda dinonaktifkan. Hubungi Owner bisnis.',
            ]);
        }
    }
}

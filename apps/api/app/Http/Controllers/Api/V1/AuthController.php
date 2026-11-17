<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\BusinessMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
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

        $user->sendEmailVerificationNotification();

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
        $user->sendEmailVerificationNotification();

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
     * Respons selalu sama apa pun hasilnya agar endpoint tidak bisa dipakai
     * mengintip email mana yang terdaftar (anti email-enumeration). Throttle
     * per email ditangani Password broker (RESET_THROTTLED).
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->validated());

        return response()->json([
            'message' => 'Jika email Anda terdaftar, tautan atur ulang password telah dikirim.',
        ]);
    }

    /**
     * Reset sukses mencabut semua API token user; sesi web lain ikut mati
     * saat expired karena remember me tidak digunakan.
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'token'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();
            },
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password berhasil diperbarui. Silakan login dengan password baru Anda.',
            ]);
        }

        throw ValidationException::withMessages([
            'email' => __($status),
        ]);
    }

    /**
     * Ditandai URL bertanda tangan (kedaluwarsa + sekali pakai via hash);
     * tidak butuh login karena tanda tangan adalah buktinya.
     */
    public function verifyEmail(int $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            throw ValidationException::withMessages([
                'email' => 'Tautan verifikasi tidak valid.',
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return response()->json([
            'message' => 'Email berhasil diverifikasi. Silakan login untuk melanjutkan.',
        ]);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => $user->hasVerifiedEmail()
                ? 'Email Anda sudah terverifikasi.'
                : 'Tautan verifikasi baru telah dikirim ke email Anda.',
        ]);
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

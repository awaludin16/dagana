<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;

/**
 * Tautan verifikasi dibuat sebagai URL bertanda tangan ke endpoint API, lalu
 * parameternya diteruskan ke halaman admin-web yang memanggil endpoint tersebut.
 */
class VerifyEmailNotification extends VerifyEmail
{
    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('Verifikasi Alamat Email Dagana')
            ->line('Klik tautan di bawah untuk memverifikasi alamat email akun Dagana Anda.')
            ->action('Verifikasi Email', $url)
            ->line('Tautan ini berlaku sesuai masa kedaluwarsa dan hanya dapat dipakai sekali.')
            ->line('Jika Anda tidak membuat akun ini, abaikan email ini.');
    }

    protected function verificationUrl($notifiable): string
    {
        $signed = URL::temporarySignedRoute(
            'api.v1.auth.email.verify',
            now()->addMinutes((int) config('auth.verification.expire', 60)),
            ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())],
        );

        // id & hash ada di path URL signed ({id}/{hash}); teruskan semuanya
        // sebagai query halaman frontend agar SPA bisa memanggil endpoint API.
        $segments = explode('/', trim((string) parse_url($signed, PHP_URL_PATH), '/'));
        [$id, $hash] = array_slice($segments, -2);
        $query = parse_url($signed, PHP_URL_QUERY) ?? '';

        return rtrim((string) config('app.frontend_url'), '/')
            ."/verify-email?id={$id}&hash={$hash}&{$query}";
    }
}

<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Tautan reset mengarah ke halaman admin-web; token reset dikirim dari
 * Laravel Password broker melalui properti $this->token.
 */
class ResetPasswordNotification extends ResetPassword
{
    protected function buildMailMessage($url): MailMessage
    {
        $minutes = (int) config('passwords.users.expire', 60);

        return (new MailMessage)
            ->subject('Atur Ulang Password Dagana')
            ->line('Anda menerima email ini karena kami menerima permintaan atur ulang password untuk akun Anda.')
            ->action('Atur Ulang Password', $url)
            ->line("Tautan ini kedaluwarsa dalam {$minutes} menit.")
            ->line('Jika Anda tidak meminta pengaturan ulang password, abaikan email ini.');
    }

    protected function resetUrl($notifiable): string
    {
        return rtrim((string) config('app.frontend_url'), '/').'/reset-password?token='.$this->token
            .'&email='.urlencode($notifiable->getEmailForPasswordReset());
    }
}

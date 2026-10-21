<?php

namespace App\Mail;

use App\Domain\Organization\Models\MemberInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MemberInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly MemberInvitation $invitation,
        public readonly string $token,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Undangan bergabung ke '.$this->invitation->business->name.' di Dagana');
    }

    public function content(): Content
    {
        $url = rtrim((string) config('services.frontend_url'), '/')
            .'/accept-invitation?token='.urlencode($this->token);

        return new Content(
            view: 'emails.member-invitation',
            with: [
                'businessName' => $this->invitation->business->name,
                'roleLabel' => $this->invitation->role->label(),
                'invitationUrl' => $url,
                'expiresAt' => $this->invitation->expires_at,
            ],
        );
    }
}

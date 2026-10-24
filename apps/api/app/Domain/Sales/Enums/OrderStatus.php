<?php

namespace App\Domain\Sales\Enums;

enum OrderStatus: string
{
    case PendingPayment = 'PENDING_PAYMENT';
    case Paid = 'PAID';
}

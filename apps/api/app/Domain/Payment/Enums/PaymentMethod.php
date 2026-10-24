<?php

namespace App\Domain\Payment\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case QrPayment = 'qr_payment';
    case BankTransfer = 'bank_transfer';
    case Debit = 'debit';
    case Credit = 'credit';
}

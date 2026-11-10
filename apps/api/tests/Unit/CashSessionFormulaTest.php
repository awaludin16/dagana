<?php

namespace Tests\Unit;

use App\Models\CashMovement;
use App\Models\CashSession;
use PHPUnit\Framework\TestCase;

/**
 * Formula Phase 5 (requirement payments-and-cash):
 * expected_cash = opening_cash + Σ amount pada ledger (cash in positif,
 * cash out / refund minus, cash sale positif, adjustment mengikuti tanda);
 * variance = actual_cash - expected_cash.
 */
class CashSessionFormulaTest extends TestCase
{
    public function test_expected_cash_nol(): void
    {
        $this->assertSame(0, CashSession::computeExpectedCash(0, 0));
    }

    public function test_expected_cash_contoh_requirement(): void
    {
        // Contoh requirement: opening 500.000 + sales 2.000.000 + in 100.000 - out 50.000
        $netMovement = 2_000_000 + 100_000 - 50_000;

        $this->assertSame(2_550_000, CashSession::computeExpectedCash(500_000, $netMovement));
    }

    public function test_net_movement_sale_in_out_refund(): void
    {
        $session = new CashSession(['opening_cash' => 500_000]);
        $session->setRelation('movements', collect([
            new CashMovement(['amount' => 2_000_000]), // cash sale
            new CashMovement(['amount' => 100_000]), // cash in
            new CashMovement(['amount' => -50_000]), // cash out
            new CashMovement(['amount' => -30_000]), // refund
        ]));

        $this->assertSame(2_020_000, $session->netMovement());
        $this->assertSame(2_520_000, CashSession::computeExpectedCash($session->opening_cash, $session->netMovement()));
    }

    public function test_net_movement_kosong(): void
    {
        $session = new CashSession(['opening_cash' => 75_000]);
        $session->setRelation('movements', collect());

        $this->assertSame(0, $session->netMovement());
        $this->assertSame(75_000, CashSession::computeExpectedCash($session->opening_cash, $session->netMovement()));
    }

    public function test_variance_positif(): void
    {
        // Kas di outlet lebih banyak daripada dugaan (overage).
        $this->assertSame(25_000, 2_550_000 - 2_525_000);
    }

    public function test_variance_negatif(): void
    {
        // Shortage mengikuti contoh requirement: actual 2.500.000 vs expected 2.550.000.
        $this->assertSame(-50_000, 2_500_000 - 2_550_000);
    }

    public function test_variance_nol(): void
    {
        $this->assertSame(0, 2_550_000 - 2_550_000);
    }
}

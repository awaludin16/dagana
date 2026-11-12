<?php

namespace App\Domain\Report;

use App\Models\CashSession;
use App\Models\InventoryItem;
use App\Models\Order;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Phase 7 — Reporting MVP. Semua agregat hanya dari data transaksi yang sudah
 * ada (orders/payments/cash ledger/stock ledger) dengan snapshot nilai; tidak
 * ada penghitungan ulang dari harga catalog terkini.
 *
 * Basis tanggal mengikuti jam aplikasi (config app.timezone, baseline UTC).
 * Definisi: penjualan dihitung dari order PAID pada tanggal konfirmasi
 * pembayaran pertama (MIN payments.paid_at); PENDING/FAILED/CANCELLED dan
 * payment REFUNDED tidak dihitung sebagai penjualan.
 */
class ReportService
{
    /**
     * Sales harian untuk rentang tanggal: setiap hari dalam rentang selalu
     * muncul (0 bila tanpa transaksi) agar tren tetap terbaca.
     *
     * @param  list<int>|null  $outletIds  null = semua outlet business (owner)
     * @return array{from: string, to: string, summary: array{sales_total: int, transactions: int}, days: list<array{date: string, sales_total: int, transactions: int, average_order_value: int|null}>}
     */
    public function dailySales(int $businessId, ?int $outletId, ?array $outletIds, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $byDate = DB::table('orders as o')
            ->joinSub($this->paidPerOrder(), 'p', 'p.order_id', '=', 'o.id')
            ->where('o.business_id', $businessId)
            ->where('o.status', Order::STATUS_PAID)
            ->where('p.paid_date', '>=', $from->startOfDay())
            ->where('p.paid_date', '<=', $to->endOfDay())
            ->when($outletId !== null, fn($q) => $q->where('o.outlet_id', $outletId))
            ->when($outletIds !== null, fn($q) => $q->whereIn('o.outlet_id', $outletIds))
            ->selectRaw('DATE(p.paid_date) as date, COUNT(*) as transactions, COALESCE(SUM(o.total_amount), 0) as sales_total')
            ->groupBy('date')
            ->get()
            ->mapWithKeys(fn(object $row): array => [
                (string) $row->date => [
                    'sales_total' => (int) $row->sales_total,
                    'transactions' => (int) $row->transactions,
                ],
            ]);

        $days = [];
        $summaryTotal = 0;
        $summaryCount = 0;
        foreach (CarbonImmutable::create($from->toDateString())->daysUntil($to->toDateString()) as $day) {
            $date = $day->toDateString();
            $salesTotal = $byDate[$date]['sales_total'] ?? 0;
            $transactions = $byDate[$date]['transactions'] ?? 0;
            $summaryTotal += $salesTotal;
            $summaryCount += $transactions;
            $days[] = [
                'date' => $date,
                'sales_total' => $salesTotal,
                'transactions' => $transactions,
                'average_order_value' => $transactions > 0 ? intdiv($salesTotal, $transactions) : null,
            ];
        }

        return [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'summary' => ['sales_total' => $summaryTotal, 'transactions' => $summaryCount],
            'days' => $days,
        ];
    }

    /**
     * Laporan payment per metode dan per status dalam rentang. by_method
     * hanya payment PAID; PENDING/FAILED/REFUNDED tidak pernah digabung ke
     * angka paid, hanya tampil di by_status.
     *
     * @param  list<int>|null  $outletIds
     * @return array{from: string, to: string, by_method: list<array{method: string, transactions: int, total: int}>, by_status: list<array{status: string, transactions: int, total: int}>}
     */
    public function payments(int $businessId, ?int $outletId, ?array $outletIds, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $rows = Payment::query()
            ->where('business_id', $businessId)
            ->where('created_at', '>=', $from->startOfDay())
            ->where('created_at', '<=', $to->endOfDay())
            ->when($outletId !== null, fn($q) => $q->where('outlet_id', $outletId))
            ->when($outletIds !== null, fn($q) => $q->whereIn('outlet_id', $outletIds))
            ->selectRaw('method, status, COUNT(*) as transactions, COALESCE(SUM(amount), 0) as total')
            ->groupBy('method', 'status')
            ->get();

        $byMethod = $rows->filter(fn(object $r) => $r->status === Payment::STATUS_PAID)
            ->map(fn(object $r): array => [
                'method' => $r->method,
                'transactions' => (int) $r->transactions,
                'total' => (int) $r->total,
            ])
            ->sortBy('method')
            ->values()
            ->all();

        $byStatus = $rows->groupBy('status')
            ->map(fn(Collection $group, string $status): array => [
                'status' => $status,
                'transactions' => (int) $group->sum('transactions'),
                'total' => (int) $group->sum('total'),
            ])
            ->sortBy('status')
            ->values()
            ->all();

        return ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'by_method' => $byMethod, 'by_status' => $byStatus];
    }

    /**
     * Performa operator: agregasi order PAID per membership, tanggal seperti
     * dailySales agar total laporan operator selalu cocok dengan laporan sales.
     *
     * @param  list<int>|null  $outletIds
     * @return LengthAwarePaginator<int, object{membership_id: int, operator_name: string, transactions: int, sales_total: int}>
     */
    public function operators(int $businessId, ?int $outletId, ?array $outletIds, CarbonImmutable $from, CarbonImmutable $to, int $perPage): LengthAwarePaginator
    {
        return DB::table('orders as o')
            ->joinSub($this->paidPerOrder(), 'p', 'p.order_id', '=', 'o.id')
            ->join('business_memberships as bm', 'bm.id', '=', 'o.membership_id')
            ->join('users as u', 'u.id', '=', 'bm.user_id')
            ->where('o.business_id', $businessId)
            ->where('o.status', Order::STATUS_PAID)
            ->where('p.paid_date', '>=', $from->startOfDay())
            ->where('p.paid_date', '<=', $to->endOfDay())
            ->when($outletId !== null, fn($q) => $q->where('o.outlet_id', $outletId))
            ->when($outletIds !== null, fn($q) => $q->whereIn('o.outlet_id', $outletIds))
            ->selectRaw('o.membership_id, u.name as operator_name, COUNT(*) as transactions, COALESCE(SUM(o.total_amount), 0) as sales_total')
            ->groupBy('o.membership_id', 'operator_name')
            ->orderByDesc('sales_total')
            ->orderBy('o.membership_id')
            ->paginate($perPage);
    }

    /**
     * Rekonsiliasi kas per session dalam rentang (basis opened_at): opening
     * cash, arus ledger per tipe, expected cash, actual cash, variance —
     * formula sama dengan Phase 5 (expected = opening + Σ movement).
     *
     * @param  list<int>|null  $outletIds
     * @return LengthAwarePaginator<CashSession>
     */
    public function cash(int $businessId, ?int $outletId, ?array $outletIds, CarbonImmutable $from, CarbonImmutable $to, int $perPage): LengthAwarePaginator
    {
        return CashSession::query()
            ->where('business_id', $businessId)
            ->where('opened_at', '>=', $from->startOfDay())
            ->where('opened_at', '<=', $to->endOfDay())
            ->when($outletId !== null, fn($q) => $q->where('outlet_id', $outletId))
            ->when($outletIds !== null, fn($q) => $q->whereIn('outlet_id', $outletIds))
            ->with('movements:id,cash_session_id,type,amount')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * Laporan inventory dasar: saldo item (Σ ledger penuh) plus ringkasan
     * movement dalam rentang. Kosong bila modul inventory tidak aktif.
     *
     * @param  list<int>|null  $outletIds
     * @return LengthAwarePaginator<InventoryItem>
     */
    public function inventory(int $businessId, ?int $outletId, ?array $outletIds, CarbonImmutable $from, CarbonImmutable $to, bool $lowStockOnly, int $perPage): LengthAwarePaginator
    {
        $stock = DB::table('stock_movements')
            ->selectRaw('inventory_item_id, COALESCE(SUM(quantity_change), 0) as stock')
            ->groupBy('inventory_item_id');

        $ranged = DB::table('stock_movements')
            ->selectRaw('inventory_item_id, COUNT(*) as movements_count, COALESCE(SUM(quantity_change), 0) as movements_net')
            ->where('created_at', '>=', $from->startOfDay())
            ->where('created_at', '<=', $to->endOfDay())
            ->groupBy('inventory_item_id');

        return InventoryItem::query()
            ->where('inventory_items.business_id', $businessId)
            ->when($outletId !== null, fn($q) => $q->where('inventory_items.outlet_id', $outletId))
            ->when($outletIds !== null, fn($q) => $q->whereIn('inventory_items.outlet_id', $outletIds))
            ->when($lowStockOnly, function (Builder $q) {
                $q->whereColumn('stock.stock', '<=', 'inventory_items.low_stock_threshold')
                    ->whereNotNull('inventory_items.low_stock_threshold');
            })
            ->leftJoinSub($stock, 'stock', 'stock.inventory_item_id', '=', 'inventory_items.id')
            ->leftJoinSub($ranged, 'ranged', 'ranged.inventory_item_id', '=', 'inventory_items.id')
            ->selectRaw('inventory_items.*, COALESCE(stock.stock, 0) as current_stock, COALESCE(ranged.movements_count, 0) as movements_count, COALESCE(ranged.movements_net, 0) as movements_net')
            ->orderBy('inventory_items.id')
            ->paginate($perPage);
    }

    /**
     * Satu order dihitung tepat satu kali: tanggal penjualan adalah tanggal
     * konfirmasi pembayaran PAID pertama, walau order punya beberapa payment.
     */
    private function paidPerOrder(): \Illuminate\Database\Query\Builder
    {
        return DB::table('payments')
            ->selectRaw('order_id, MIN(paid_at) as paid_date')
            ->where('status', Payment::STATUS_PAID)
            ->groupBy('order_id');
    }
}

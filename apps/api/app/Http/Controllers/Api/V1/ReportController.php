<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Report\ReportService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Report\ReportDateRangeRequest;
use App\Models\CashSession;
use App\Models\InventoryItem;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phase 7 — Reporting MVP: sales harian, payment, operator, cash
 * reconciliation, dan basic inventory. Read-only; permission `reports.read`
 * via route, scope Business dari membership, outlet access D-05.
 */
class ReportController extends Controller
{
    public function __construct(private readonly ReportService $service) {}

    public function sales(ReportDateRangeRequest $request): JsonResponse
    {
        [$businessId, $outletId, $outletIds, $from, $to] = $this->resolve($request);

        return response()->json(['data' => $this->service->dailySales($businessId, $outletId, $outletIds, $from, $to)]);
    }

    public function payments(ReportDateRangeRequest $request): JsonResponse
    {
        [$businessId, $outletId, $outletIds, $from, $to] = $this->resolve($request);

        return response()->json(['data' => $this->service->payments($businessId, $outletId, $outletIds, $from, $to)]);
    }

    public function operators(ReportDateRangeRequest $request): JsonResponse
    {
        [$businessId, $outletId, $outletIds, $from, $to] = $this->resolve($request);

        $paginator = $this->service->operators($businessId, $outletId, $outletIds, $from, $to, $this->perPage($request));

        return response()->json(['data' => $paginator->items(), 'meta' => $this->meta($paginator)]);
    }

    public function cash(ReportDateRangeRequest $request): JsonResponse
    {
        [$businessId, $outletId, $outletIds, $from, $to] = $this->resolve($request);

        $paginator = $this->service->cash($businessId, $outletId, $outletIds, $from, $to, $this->perPage($request));

        return response()->json([
            'data' => collect($paginator->items())->map(fn(CashSession $session): array => $this->cashRow($session))->all(),
            'meta' => $this->meta($paginator),
        ]);
    }

    public function inventory(ReportDateRangeRequest $request): JsonResponse
    {
        [$businessId, $outletId, $outletIds, $from, $to] = $this->resolve($request);

        $paginator = $this->service->inventory(
            $businessId,
            $outletId,
            $outletIds,
            $from,
            $to,
            $request->boolean('low_stock'),
            $this->perPage($request),
        );

        return response()->json([
            'data' => collect($paginator->items())
                ->map(fn(InventoryItem $item): array => [
                    'id' => $item->id,
                    'business_id' => $item->business_id,
                    'outlet_id' => $item->outlet_id,
                    'name' => $item->name,
                    'unit' => $item->unit,
                    'low_stock_threshold' => $item->low_stock_threshold,
                    'current_stock' => (int) $item->current_stock,
                    'is_low_stock' => $item->isLowStock((int) $item->current_stock),
                    'is_active' => $item->is_active,
                    'movements_count' => (int) $item->movements_count,
                    'movements_net' => (int) $item->movements_net,
                ])
                ->all(),
            'meta' => $this->meta($paginator),
        ]);
    }

    /**
     * Scope bersama: Business dari membership, outlet filter divalidasi
     * terhadap cakupan akses, rentang tanggal dalam jam aplikasi.
     *
     * @return array{0: int, 1: ?int, 2: list<int>|null, 3: CarbonImmutable, 4: CarbonImmutable}
     */
    private function resolve(Request $request): array
    {
        $membership = $request->user()->membership;

        $outletId = $request->filled('outlet_id') ? (int) $request->query('outlet_id') : null;
        if ($outletId !== null && ! $membership->canAccessOutlet($outletId)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        $outletIds = $membership->isOwner() ? null : $membership->accessibleOutlets()->pluck('id')->all();

        $from = CarbonImmutable::parse($request->validated('from'))->startOfDay();
        $to = CarbonImmutable::parse($request->validated('to'))->endOfDay();

        return [$membership->business_id, $outletId, $outletIds, $from, $to];
    }

    /**
     * @return array{current_page: int, from: int|null, last_page: int, per_page: int, to: int|null, total: int}
     */
    private function meta(LengthAwarePaginator $paginator): array
    {
        $count = count($paginator->items());

        return [
            'current_page' => $paginator->currentPage(),
            'from' => $count > 0 ? ($paginator->currentPage() - 1) * $paginator->perPage() + 1 : null,
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'to' => $count > 0 ? ($paginator->currentPage() - 1) * $paginator->perPage() + $count : null,
            'total' => $paginator->total(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function cashRow(CashSession $session): array
    {
        $byType = $session->movements
            ->groupBy('type')
            ->map(fn($group, string $type): array => ['type' => $type, 'amount' => (int) $group->sum('amount')])
            ->values();

        $netMovement = $session->netMovement();

        return [
            'id' => $session->id,
            'outlet_id' => $session->outlet_id,
            'operator_membership_id' => $session->operator_membership_id,
            'status' => $session->status,
            'opening_cash' => $session->opening_cash,
            'movements_by_type' => $byType,
            'net_movement' => $netMovement,
            'expected_cash' => CashSession::computeExpectedCash($session->opening_cash, $netMovement),
            'actual_cash' => $session->actual_cash,
            'variance' => $session->variance,
            'variance_note' => $session->variance_note,
            'opened_at' => $session->opened_at?->toIso8601String(),
            'closed_at' => $session->closed_at?->toIso8601String(),
        ];
    }
}

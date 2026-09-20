<?php

namespace App\Http\Controllers\Api;

use App\Enums\StockMovementType;
use App\Enums\StockOpnameStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOpnameAdjustmentRequest;
use App\Http\Requests\CreateStockAdjustmentRequest;
use App\Http\Requests\CreateStockOpnameRequest;
use App\Http\Requests\CreateStockReceivingRequest;
use App\Http\Requests\StoreLowStockRuleRequest;
use App\Http\Requests\UpdateLowStockRuleRequest;
use App\Models\LowStockRule;
use App\Models\ProductVariant;
use App\Models\Stock;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use App\Models\StockOpname;
use App\Models\StockReceiving;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Inventory (docs/API-Specification.md §4.5).
 *
 * Prinsip: stok hanya berubah lewat StockService (append-only ledger).
 * Mutasi stok memerlukan konteks outlet (`X-Outlet-Context`).
 */
class InventoryController extends Controller
{
    public function __construct(protected StockService $stockService) {}

    public function stocks(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $request->attributes->get('outlet_context');

        $stocks = Stock::query()
            ->with(['productVariant.product', 'productVariant.lowStockRules', 'outlet'])
            ->where('tenant_id', $tenantId)
            ->when($outletId, fn ($q) => $q->where('outlet_id', $outletId))
            ->when(
                $request->product_variant_id,
                fn ($q, $variantId) => $q->where('product_variant_id', $variantId),
            )
            ->when($request->search, function ($q, $search) {
                $needle = '%'.mb_strtolower($search).'%';
                $q->where(function ($sub) use ($needle) {
                    $sub->whereHas('productVariant.product', fn ($p) => $p->whereRaw('LOWER(name) LIKE ?', [$needle]))
                        ->orWhereHas('productVariant', fn ($p) => $p->whereRaw('LOWER(sku) LIKE ?', [$needle]));
                });
            })
            ->when($request->boolean('low_stock'), function ($q) {
                $q->where(function ($sub) {
                    $sub->where('quantity', '<=', 0)
                        ->orWhereExists(function ($ex) {
                            $ex->selectRaw('1')
                                ->from('low_stock_rules')
                                ->whereColumn('low_stock_rules.product_variant_id', 'stocks.product_variant_id')
                                ->where(function ($outlet) {
                                    // rule khusus outlet ATAU rule seluruh outlet tenant
                                    $outlet->whereColumn('low_stock_rules.outlet_id', 'stocks.outlet_id')
                                        ->orWhereNull('low_stock_rules.outlet_id');
                                })
                                ->whereColumn('low_stock_rules.threshold', '>', 'stocks.quantity');
                        });
                });
            })
            ->orderBy('updated_at', 'desc')
            ->paginate($request->integer('per_page', 25));

        $stocks->getCollection()->transform(function (Stock $stock) {
            // Prioritas rule: khusus outlet, baru rule seluruh outlet tenant.
            $rule = $stock->productVariant->lowStockRules
                ->filter(fn (LowStockRule $rule) => $rule->outlet_id === $stock->outlet_id || $rule->outlet_id === null)
                ->sortBy(fn (LowStockRule $rule) => $rule->outlet_id === $stock->outlet_id ? 0 : 1)
                ->first();

            $threshold = $rule?->threshold;
            $quantity = (float) $stock->quantity;

            return [
                'id' => $stock->id,
                'quantity' => $stock->quantity,
                'stock_status' => $quantity <= 0
                    ? 'out_of_stock'
                    : ($threshold !== null && $quantity < (float) $threshold ? 'low_stock' : 'in_stock'),
                'threshold' => $threshold,
                'variant' => [
                    'id' => $stock->productVariant->id,
                    'sku' => $stock->productVariant->sku,
                    'unit' => $stock->productVariant->unit,
                    'product' => [
                        'id' => $stock->productVariant->product->id,
                        'name' => $stock->productVariant->product->name,
                    ],
                ],
                'outlet' => [
                    'id' => $stock->outlet->id,
                    'name' => $stock->outlet->name,
                ],
            ];
        });

        return response()->json($stocks);
    }

    public function stockByVariant(Request $request, ProductVariant $variant): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');

        abort_if($variant->tenant_id !== $tenantId, 404, 'Varian tidak ditemukan.');

        $stocks = $variant->stocks()
            ->with('outlet')
            ->orderBy('outlet_id')
            ->get();

        return response()->json(['data' => [
            'variant' => [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'unit' => $variant->unit,
                'product' => [
                    'id' => $variant->product->id,
                    'name' => $variant->product->name,
                ],
            ],
            'stocks' => $stocks->map(fn (Stock $stock) => [
                'outlet_id' => $stock->outlet_id,
                'outlet_name' => $stock->outlet->name,
                'quantity' => $stock->quantity,
            ])->values(),
        ]]);
    }

    public function stockMovements(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $request->attributes->get('outlet_context');

        $movements = StockMovement::query()
            ->with(['productVariant.product', 'outlet', 'actor'])
            ->where('tenant_id', $tenantId)
            ->when($outletId, fn ($q) => $q->where('outlet_id', $outletId))
            ->when(
                $request->product_variant_id,
                fn ($q, $variantId) => $q->where('product_variant_id', $variantId),
            )
            ->when($request->movement_type, fn ($q, $type) => $q->where('movement_type', $type))
            ->when($request->search, function ($q, $search) {
                $needle = '%'.mb_strtolower($search).'%';
                $q->where(function ($sub) use ($needle) {
                    $sub->whereHas('productVariant.product', fn ($p) => $p->whereRaw('LOWER(name) LIKE ?', [$needle]))
                        ->orWhereHas('productVariant', fn ($p) => $p->whereRaw('LOWER(sku) LIKE ?', [$needle]));
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 25));

        return response()->json($movements);
    }

    public function storeAdjustment(CreateStockAdjustmentRequest $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $this->requireOutlet($request);
        $user = $request->user();
        $variant = $this->variantOfTenant($request->product_variant_id, $tenantId);

        [$movement, $adjustment, $balance] = DB::transaction(function () use ($request, $variant, $outletId, $tenantId, $user) {
            $before = $this->stockService->balance($variant, $outletId);
            $movement = $this->stockService->move(
                $variant,
                $outletId,
                $request->quantity,
                StockMovementType::Adjustment->value,
                StockMovementType::Adjustment->value,
                null,
                $request->reason,
                $request->note,
                $user->getAuthIdentifier(),
            );
            $after = $this->stockService->balance($variant, $outletId);

            $adjustment = StockAdjustment::create([
                'tenant_id' => $tenantId,
                'outlet_id' => $outletId,
                'product_variant_id' => $variant->id,
                'system_qty' => $before,
                'counted_qty' => $after,
                'diff' => $request->quantity,
                'reason' => $request->reason,
                'stock_opname_id' => null,
                'created_by' => $user->getAuthIdentifier(),
            ]);

            return [$movement, $adjustment, $after];
        });

        return response()->json(['data' => [
            'adjustment' => $adjustment->load('productVariant.product'),
            'movement' => $movement->load(['productVariant.product', 'outlet', 'actor']),
            'balance' => number_format($balance, 2, '.', ''),
        ]], 201);
    }

    public function storeReceiving(CreateStockReceivingRequest $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $this->requireOutlet($request);
        $user = $request->user();

        [$receiving, $movements] = DB::transaction(function () use ($request, $tenantId, $outletId, $user) {
            $receiving = StockReceiving::create([
                'tenant_id' => $tenantId,
                'outlet_id' => $outletId,
                'received_at' => $request->received_at ?? now(),
                'note' => $request->note,
                'created_by' => $user->getAuthIdentifier(),
            ]);

            $movements = [];
            foreach ($request->items as $item) {
                $variant = $this->variantOfTenant($item['product_variant_id'], $tenantId);

                $receiving->items()->create([
                    'tenant_id' => $tenantId,
                    'product_variant_id' => $variant->id,
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'] ?? 0,
                ]);

                $movements[] = $this->stockService->move(
                    $variant,
                    $outletId,
                    $item['quantity'],
                    StockMovementType::Receiving->value,
                    StockMovementType::Receiving->value,
                    $receiving->id,
                    null,
                    $request->note,
                    $user->getAuthIdentifier(),
                );
            }

            return [$receiving, $movements];
        });

        return response()->json(['data' => [
            'receiving' => $receiving->load('items.productVariant.product'),
            'movements' => array_map(
                fn (StockMovement $movement) => $movement->load('productVariant.product'),
                $movements,
            ),
        ]], 201);
    }

    public function activeOpname(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $request->attributes->get('outlet_context');

        if ($outletId === null) {
            throw ValidationException::withMessages([
                'outlet_id' => 'Pilih outlet terlebih dahulu.',
            ]);
        }

        $opname = StockOpname::query()
            ->withCount('adjustments')
            ->where('tenant_id', $tenantId)
            ->where('outlet_id', $outletId)
            ->where('status', StockOpnameStatus::InProgress->value)
            ->orderByDesc('created_at')
            ->first();

        return response()->json(['data' => $opname]);
    }

    public function storeOpname(CreateStockOpnameRequest $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $this->requireOutlet($request);
        $user = $request->user();

        $activeCount = StockOpname::query()
            ->where('tenant_id', $tenantId)
            ->where('outlet_id', $outletId)
            ->where('status', StockOpnameStatus::InProgress->value)
            ->count();

        if ($activeCount > 0) {
            throw ValidationException::withMessages([
                'outlet_id' => 'Masih ada opname berjalan untuk outlet ini. Selesaikan dulu.',
            ]);
        }

        $opname = StockOpname::create([
            'tenant_id' => $tenantId,
            'outlet_id' => $outletId,
            'started_at' => $request->started_at ?? now(),
            'status' => StockOpnameStatus::InProgress->value,
            'created_by' => $user->getAuthIdentifier(),
        ]);

        return response()->json(['data' => $opname->load('outlet')], 201);
    }

    public function storeOpnameAdjustment(
        CreateOpnameAdjustmentRequest $request,
        StockOpname $opname,
    ): JsonResponse {
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $this->requireOutlet($request);
        $user = $request->user();

        $this->assertOpnameEditable($opname, $tenantId, $outletId);

        $variant = $this->variantOfTenant($request->product_variant_id, $tenantId);
        $system = $this->stockService->balance($variant, $outletId);
        $counted = (float) $request->counted_qty;

        // Satu baris per varian dalam satu opname; input ulang = perbarui.
        $adjustment = StockAdjustment::updateOrCreate(
            ['stock_opname_id' => $opname->id, 'product_variant_id' => $variant->id],
            [
                'tenant_id' => $tenantId,
                'outlet_id' => $outletId,
                'system_qty' => $system,
                'counted_qty' => $counted,
                'diff' => $counted - $system,
                'reason' => $request->reason,
                'created_by' => $user->getAuthIdentifier(),
            ],
        );

        return response()->json(['data' => $adjustment->load('productVariant.product')], 201);
    }

    public function completeOpname(Request $request, StockOpname $opname): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $this->requireOutlet($request);
        $user = $request->user();

        $this->assertOpnameEditable($opname, $tenantId, $outletId);

        $movementsCount = DB::transaction(function () use ($opname, $outletId, $tenantId, $user) {
            $adjustments = $opname->adjustments()
                ->where('diff', '!=', 0)
                ->get();

            $count = 0;
            foreach ($adjustments as $adjustment) {
                $variant = $this->variantOfTenant($adjustment->product_variant_id, $tenantId);

                $this->stockService->move(
                    $variant,
                    $outletId,
                    $adjustment->diff,
                    StockMovementType::Opname->value,
                    StockMovementType::Opname->value,
                    $opname->id,
                    $adjustment->reason,
                    'Hasil opname',
                    $user->getAuthIdentifier(),
                );
                $count++;
            }

            $opname->update([
                'completed_at' => now(),
                'status' => StockOpnameStatus::Completed->value,
            ]);

            return $count;
        });

        $opname->load('adjustments.productVariant.product');

        return response()->json(['data' => [
            'id' => $opname->id,
            'status' => $opname->status,
            'completed_at' => $opname->completed_at,
            'movements_count' => $movementsCount,
        ]]);
    }

    public function lowStockRules(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $request->attributes->get('outlet_context');

        $rules = LowStockRule::query()
            ->with(['productVariant.product', 'outlet'])
            ->where('tenant_id', $tenantId)
            ->when($outletId, fn ($q) => $q->where(fn ($sub) => $sub->whereNull('outlet_id')->orWhere('outlet_id', $outletId)))
            ->when(
                $request->product_variant_id,
                fn ($q, $variantId) => $q->where('product_variant_id', $variantId),
            )
            ->orderBy('product_variant_id')
            ->get();

        return response()->json(['data' => $rules]);
    }

    public function storeLowStockRule(StoreLowStockRuleRequest $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');

        $duplicate = LowStockRule::query()
            ->where('tenant_id', $tenantId)
            ->where('product_variant_id', $request->product_variant_id)
            ->where('outlet_id', $request->outlet_id)
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'outlet_id' => 'Rule untuk varian & outlet ini sudah ada.',
            ]);
        }

        $rule = LowStockRule::create([
            'tenant_id' => $tenantId,
            'product_variant_id' => $request->product_variant_id,
            'outlet_id' => $request->outlet_id,
            'threshold' => $request->threshold,
        ]);

        return response()->json(['data' => $rule->load(['productVariant.product', 'outlet'])], 201);
    }

    public function updateLowStockRule(UpdateLowStockRuleRequest $request, LowStockRule $rule): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');

        abort_if($rule->tenant_id !== $tenantId, 404, 'Rule tidak ditemukan.');

        $rule->update(['threshold' => $request->threshold]);

        return response()->json(['data' => $rule->load(['productVariant.product', 'outlet'])]);
    }

    private function variantOfTenant(string $variantId, string $tenantId): ProductVariant
    {
        $variant = ProductVariant::query()
            ->where('tenant_id', $tenantId)
            ->find($variantId);

        abort_if($variant === null, 404, 'Varian tidak ditemukan.');

        return $variant;
    }

    private function requireOutlet(Request $request): string
    {
        $outletId = $request->attributes->get('outlet_context');

        abort_if($outletId === null, 422, 'Pilih outlet terlebih dahulu.');

        return $outletId;
    }

    private function assertOpnameEditable(StockOpname $opname, string $tenantId, string $outletId): void
    {
        abort_if($opname->tenant_id !== $tenantId, 404, 'Opname tidak ditemukan.');
        abort_if($opname->outlet_id !== $outletId, 422, 'Opname ini milik outlet lain.');
        abort_if($opname->status !== StockOpnameStatus::InProgress, 422, 'Opname tidak dalam status berjalan.');
    }
}

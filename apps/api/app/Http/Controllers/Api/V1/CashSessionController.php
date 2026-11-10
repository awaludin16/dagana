<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cash\Actions\CloseCashSessionAction;
use App\Domain\Cash\Actions\OpenCashSessionAction;
use App\Domain\Cash\Actions\RecordCashMovementAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Cash\CloseCashSessionRequest;
use App\Http\Requests\Cash\StoreCashMovementRequest;
use App\Http\Requests\Cash\StoreCashSessionRequest;
use App\Http\Resources\CashMovementResource;
use App\Http\Resources\CashSessionResource;
use App\Models\CashSession;
use App\Models\Outlet;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Phase 5 — Cash Session: open, movements (ledger), close, dan rekonsiliasi.
 * Semua query selalu ter-scope business; outlet access ditegakkan per record.
 */
class CashSessionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $membership = $request->user()->membership;

        $query = CashSession::query()
            ->where('business_id', $membership->business_id)
            ->withSum('movements', 'amount');

        // Non-owner hanya melihat session pada outlet yang dapat diakses (D-05).
        if (! $membership->isOwner()) {
            $query->whereIn('outlet_id', $membership->accessibleOutlets()->pluck('id')->all());
        }

        if ($request->filled('outlet_id')) {
            $outletId = (int) $request->query('outlet_id');

            if (! $membership->canAccessOutlet($outletId)) {
                throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
            }

            $query->where('outlet_id', $outletId);
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        return CashSessionResource::collection($query->latest()->paginate($this->perPage($request)));
    }

    public function store(StoreCashSessionRequest $request, OpenCashSessionAction $action): JsonResponse
    {
        $membership = $request->user()->membership;
        $outlet = Outlet::query()->where('business_id', $membership->business_id)->findOrFail($request->validated('outlet_id'));

        $session = $action->execute($membership, $outlet, (int) $request->validated('opening_cash'));

        return response()->json(['data' => new CashSessionResource($session)], 201);
    }

    public function show(Request $request, int $session): CashSessionResource
    {
        return new CashSessionResource($this->resolve($request, $session));
    }

    public function movements(Request $request, int $session): AnonymousResourceCollection
    {
        $model = $this->resolve($request, $session);

        return CashMovementResource::collection(
            $model->movements()->latest()->paginate($this->perPage($request))
        );
    }

    public function storeMovement(StoreCashMovementRequest $request, int $session, RecordCashMovementAction $action): JsonResponse
    {
        $membership = $request->user()->membership;
        $model = $this->resolve($request, $session);

        $movement = $action->execute(
            $model,
            $membership,
            (string) $request->validated('type'),
            (int) $request->validated('amount'),
            $request->validated('reason'),
        );

        return response()->json(['data' => new CashMovementResource($movement)], 201);
    }

    public function close(CloseCashSessionRequest $request, int $session, CloseCashSessionAction $action): JsonResponse
    {
        $membership = $request->user()->membership;
        $model = $this->resolve($request, $session);

        $closed = $action->execute(
            $model,
            $membership,
            (int) $request->validated('actual_cash'),
            $request->validated('variance_note'),
        );

        return response()->json(['data' => new CashSessionResource($closed)]);
    }

    private function resolve(Request $request, int $session): CashSession
    {
        $membership = $request->user()->membership;

        $model = CashSession::query()
            ->where('business_id', $membership->business_id)
            ->withSum('movements', 'amount')
            ->findOrFail($session);

        if (! $membership->canAccessOutlet($model->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        return $model;
    }
}

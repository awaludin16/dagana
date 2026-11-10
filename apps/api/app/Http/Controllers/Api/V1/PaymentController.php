<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Order\Actions\MarkPaymentPaidAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Konfirmasi status pembayaran server-side (PENDING → PAID).
 * Gateway/provider produksi belum diintegrasikan; endpoint ini adalah jalur
 * konfirmasi yang sah setelah bukti pembayaran diverifikasi backend.
 */
class PaymentController extends Controller
{
    public function confirm(Request $request, int $payment, MarkPaymentPaidAction $action): JsonResponse
    {
        $membership = $request->user()->membership;

        $model = Payment::query()
            ->where('business_id', $membership->business_id)
            ->findOrFail($payment);

        if (! $membership->canAccessOutlet($model->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        return response()->json(['data' => new PaymentResource($action->execute($model, $membership))]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateOutletRequest;
use App\Models\MenuItem;
use App\Models\Outlet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OutletController extends Controller
{
    public function store(CreateOutletRequest $request): JsonResponse
    {
        $outlet = Outlet::create([
            'tenant_id' => $request->attributes->get('tenant_context'),
            'name' => $request->name,
            'address' => $request->address,
            'business_type' => $request->business_type ?? 'retail',
            'status' => 'ACTIVE',
        ]);

        return response()->json(['data' => $outlet], 201);
    }

    public function menu(Request $request, Outlet $outlet): JsonResponse
    {
        // Scope eksplisit ke tenant aktif (defense-in-depth di samping RLS).
        abort_if(
            $outlet->tenant_id !== $request->attributes->get('tenant_context'),
            404,
            'Menu outlet tidak ditemukan.',
        );

        $items = MenuItem::query()
            ->with(['product.variants'])
            ->where('outlet_id', $outlet->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function (MenuItem $item) {
                $product = $item->product;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'image_url' => $product->image_url,
                    'variants' => $product->variants->map(fn ($v) => [
                        'id' => $v->id,
                        'sku' => $v->sku,
                        'price' => $v->price,
                        'unit' => $v->unit,
                    ]),
                ];
            });

        return response()->json(['data' => $items]);
    }
}

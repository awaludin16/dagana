<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with('variants')
            ->where('tenant_id', $request->attributes->get('tenant_context'))
            ->when($request->search, fn ($q, $search) => $q->where('name', 'ilike', "%{$search}%"))
            ->paginate(25);

        return response()->json($products);
    }

    public function store(CreateProductRequest $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_context');

        $product = DB::transaction(function () use ($request, $tenantId) {
            $product = Product::create([
                'tenant_id' => $tenantId,
                'category_id' => $request->category_id,
                'name' => $request->name,
                'description' => $request->description,
                'image_url' => $request->image_url,
                'status' => 'ACTIVE',
            ]);

            foreach ($request->variants as $variant) {
                $product->variants()->create([
                    'tenant_id' => $tenantId,
                    'sku' => $variant['sku'],
                    'barcode' => $variant['barcode'] ?? null,
                    'unit' => $variant['unit'] ?? 'pcs',
                    'price' => $variant['price'],
                    'cost_price' => $variant['cost_price'] ?? 0,
                    'status' => 'ACTIVE',
                ]);
            }

            return $product;
        });

        return response()->json(['data' => $product->load('variants')], 201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        // Scope eksplisit ke tenant aktif (defense-in-depth di samping RLS).
        abort_if(
            $product->tenant_id !== $request->attributes->get('tenant_context'),
            404,
            'Produk tidak ditemukan.',
        );

        $product->load('variants');

        return response()->json(['data' => $product]);
    }
}

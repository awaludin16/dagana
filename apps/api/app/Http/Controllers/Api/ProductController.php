<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\CreateProductVariantRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->with(['variants', 'category'])
            ->where('tenant_id', $request->attributes->get('tenant_context'))
            // Case-insensitive lintas driver (PostgreSQL & SQLite); `ilike` hanya
            // tersedia di PostgreSQL.
            ->when($request->search, fn ($q, $search) => $q->whereRaw(
                'LOWER(name) LIKE ?',
                ['%'.mb_strtolower($search).'%'],
            ))
            ->when($request->category, fn ($q, $category) => $q->where('category_id', $category))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('updated_at', 'desc')
            ->paginate($request->integer('per_page', 25));

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

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        abort_if(
            $product->tenant_id !== $request->attributes->get('tenant_context'),
            404,
            'Produk tidak ditemukan.',
        );

        $tenantId = $request->attributes->get('tenant_context');

        $product = DB::transaction(function () use ($request, $product, $tenantId) {
            $product->update($request->safe()->only([
                'name', 'category_id', 'description', 'image_url', 'status',
            ]));

            if ($request->has('variants')) {
                $product->variants()->delete();

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
            }

            return $product->fresh();
        });

        return response()->json(['data' => $product->load('variants')]);
    }

    public function addVariant(CreateProductVariantRequest $request, Product $product): JsonResponse
    {
        abort_if(
            $product->tenant_id !== $request->attributes->get('tenant_context'),
            404,
            'Produk tidak ditemukan.',
        );

        $variant = $product->variants()->create([
            'tenant_id' => $request->attributes->get('tenant_context'),
            'sku' => $request->sku,
            'barcode' => $request->barcode ?? null,
            'unit' => $request->unit ?? 'pcs',
            'price' => $request->price,
            'cost_price' => $request->cost_price ?? 0,
            'status' => 'ACTIVE',
        ]);

        return response()->json(['data' => $variant], 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        abort_if(
            $product->tenant_id !== $request->attributes->get('tenant_context'),
            404,
            'Produk tidak ditemukan.',
        );

        // Soft delete: nonaktifkan, tidak menghapus baris (spec: DELETE = soft: status).
        $product->update(['status' => 'INACTIVE']);

        return response()->json(['data' => $product->refresh()->load('variants')]);
    }
}

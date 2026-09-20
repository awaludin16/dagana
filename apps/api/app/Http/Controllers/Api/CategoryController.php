<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->where('tenant_id', $request->attributes->get('tenant_context'))
            ->withCount('products')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function store(CreateCategoryRequest $request): JsonResponse
    {
        $category = Category::create([
            'tenant_id' => $request->attributes->get('tenant_context'),
            'parent_id' => $request->parent_id,
            'name' => $request->name,
            'sort_order' => $request->sort_order ?? 0,
        ]);

        return response()->json(['data' => $category], 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        abort_if(
            $category->tenant_id !== $request->attributes->get('tenant_context'),
            404,
            'Kategori tidak ditemukan.',
        );

        $category->update($request->safe()->only(['name', 'parent_id', 'sort_order']));

        return response()->json(['data' => $category->refresh()]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        abort_if(
            $category->tenant_id !== $request->attributes->get('tenant_context'),
            404,
            'Kategori tidak ditemukan.',
        );

        // Anak kategori menjadi root (parent_id tak ber-FK, rawan orphan).
        Category::query()
            ->where('tenant_id', $category->tenant_id)
            ->where('parent_id', $category->id)
            ->update(['parent_id' => null]);

        // Produk yang memakai kategori ini otomatis nullOnDelete di DB.
        $category->delete();

        return response()->json(['data' => null]);
    }
}

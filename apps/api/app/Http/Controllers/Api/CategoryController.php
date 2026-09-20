<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->where('tenant_id', $request->attributes->get('tenant_context'))
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
}

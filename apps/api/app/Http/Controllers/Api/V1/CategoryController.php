<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Catalog\Models\Category;
use App\Domain\Organization\Models\Business;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\StoreCategoryRequest;
use App\Http\Requests\Api\V1\Catalog\UpdateCategoryRequest;
use App\Http\Resources\Api\V1\CategoryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request, Business $business): AnonymousResourceCollection
    {
        $this->authorize('viewCategories', $business);

        $filters = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'status' => ['sometimes', Rule::in(['active', 'disabled', 'all'])],
        ]);

        $categories = $business->categories();
        if (($filters['status'] ?? 'active') !== 'all') {
            $categories->where('status', $filters['status'] ?? Category::STATUS_ACTIVE);
        }

        return CategoryResource::collection(
            $categories->orderBy('name')->paginate($filters['per_page'] ?? 20)
        );
    }

    public function store(StoreCategoryRequest $request, Business $business): JsonResponse
    {
        $this->authorize('createCategory', $business);

        $category = $business->categories()->create([
            ...$request->validated(),
            'status' => Category::STATUS_ACTIVE,
        ]);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function show(Business $business, Category $category): CategoryResource
    {
        $this->authorize('viewCategories', $business);

        return new CategoryResource($category);
    }

    public function update(UpdateCategoryRequest $request, Business $business, Category $category): CategoryResource
    {
        $this->authorize('updateCategory', $business);
        $category->update($request->validated());

        return new CategoryResource($category);
    }

    public function disable(Business $business, Category $category): CategoryResource
    {
        $this->authorize('archiveCategory', $business);
        $category->update(['status' => Category::STATUS_DISABLED]);

        return new CategoryResource($category);
    }

    public function enable(Business $business, Category $category): CategoryResource
    {
        $this->authorize('archiveCategory', $business);
        $category->update(['status' => Category::STATUS_ACTIVE]);

        return new CategoryResource($category);
    }
}

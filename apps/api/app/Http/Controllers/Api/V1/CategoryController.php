<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Catalog\Actions\DeleteCategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->where('business_id', $request->user()->membership->business_id)
            ->when(! is_null($request->query('is_active')), function ($query) use ($request): void {
                $query->where('is_active', $request->boolean('is_active'));
            })
            ->when($request->filled('q'), function ($query) use ($request): void {
                $query->where('name', 'ilike', '%'.$request->string('q').'%');
            })
            ->orderBy('name')
            ->paginate($this->perPage($request));

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create([
            'business_id' => $request->user()->membership->business_id,
            ...$request->validated(),
        ]);

        return response()->json(['data' => new CategoryResource($category)], 201);
    }

    public function show(Request $request, int $category): CategoryResource
    {
        return new CategoryResource($this->scopedCategory($request, $category));
    }

    public function update(UpdateCategoryRequest $request, int $category): CategoryResource
    {
        $model = $this->scopedCategory($request, $category);
        $model->update($request->validated());

        return new CategoryResource($model);
    }

    public function destroy(Request $request, int $category, DeleteCategoryAction $action): JsonResponse
    {
        $action->execute($this->scopedCategory($request, $category));

        return response()->json(null, 204);
    }

    private function scopedCategory(Request $request, int $categoryId): Category
    {
        return Category::query()
            ->where('business_id', $request->user()->membership->business_id)
            ->findOrFail($categoryId);
    }
}

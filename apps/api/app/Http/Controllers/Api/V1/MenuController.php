<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Catalog\Models\Menu;
use App\Domain\Organization\Models\Business;
use App\Domain\Outlet\Models\Outlet;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\StoreMenuRequest;
use App\Http\Requests\Api\V1\Catalog\UpdateMenuRequest;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Http\Resources\Api\V1\MenuResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class MenuController extends Controller
{
    public function index(Request $request, Business $business): AnonymousResourceCollection
    {
        $this->authorize('viewProducts', $business);

        $filters = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'status' => ['sometimes', Rule::in(['active', 'disabled', 'all'])],
            'search' => ['sometimes', 'string', 'max:100'],
            'category_id' => ['sometimes', 'integer'],
        ]);

        $menus = $business->menus()->with('category');
        if (($filters['status'] ?? 'active') !== 'all') {
            $menus->where('status', $filters['status'] ?? Menu::STATUS_ACTIVE);
        }
        if (isset($filters['search'])) {
            $menus->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($filters['search']).'%']);
        }
        if (isset($filters['category_id'])) {
            $menus->where('category_id', $filters['category_id']);
        }

        return MenuResource::collection(
            $menus->orderBy('name')->paginate($filters['per_page'] ?? 20)
        );
    }

    public function store(StoreMenuRequest $request, Business $business): JsonResponse
    {
        $this->authorize('createProduct', $business);

        $menu = $business->menus()->create([
            ...$request->validated(),
            'status' => Menu::STATUS_ACTIVE,
            'is_available' => $request->validated('is_available', true),
        ]);
        $menu->load('category');

        return (new MenuResource($menu))->response()->setStatusCode(201);
    }

    public function show(Business $business, Menu $menu): MenuResource
    {
        $this->authorize('viewProducts', $business);

        return new MenuResource($menu->load('category'));
    }

    public function update(UpdateMenuRequest $request, Business $business, Menu $menu): MenuResource
    {
        $this->authorize('updateProduct', $business);
        $menu->update($request->validated());

        return new MenuResource($menu->load('category'));
    }

    public function disable(Business $business, Menu $menu): MenuResource
    {
        $this->authorize('archiveProduct', $business);
        $menu->update(['status' => Menu::STATUS_DISABLED]);

        return new MenuResource($menu->load('category'));
    }

    public function enable(Business $business, Menu $menu): MenuResource
    {
        $this->authorize('archiveProduct', $business);
        $menu->update(['status' => Menu::STATUS_ACTIVE]);

        return new MenuResource($menu->load('category'));
    }

    public function outletMenus(Request $request, Outlet $outlet): AnonymousResourceCollection
    {
        $this->authorize('viewCatalog', $outlet);
        $filters = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'search' => ['sometimes', 'string', 'max:100'],
            'category_id' => ['sometimes', 'integer'],
        ]);

        $menus = $outlet->business->menus()
            ->with('category')
            ->where('status', Menu::STATUS_ACTIVE)
            ->where('is_available', true);

        if (isset($filters['search'])) {
            $menus->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($filters['search']).'%']);
        }
        if (isset($filters['category_id'])) {
            $menus->where('category_id', $filters['category_id']);
        }

        return MenuResource::collection(
            $menus->orderBy('name')->paginate($filters['per_page'] ?? 20)
        );
    }

    public function outletCategories(Request $request, Outlet $outlet): AnonymousResourceCollection
    {
        $this->authorize('viewCatalogCategories', $outlet);
        $filters = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        return CategoryResource::collection(
            $outlet->business->categories()
                ->where('status', 'active')
                ->orderBy('name')
                ->paginate($filters['per_page'] ?? 100)
        );
    }
}

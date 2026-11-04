<?php

namespace App\Domain\Catalog\Actions;

use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteCategoryAction
{
    /**
     * Master data with references must be deactivated, not deleted. A category
     * still holding menus is such a master; hard delete is allowed only while
     * it is empty.
     */
    public function execute(Category $category): void
    {
        DB::transaction(function () use ($category): void {
            if ($category->products()->exists()) {
                throw ValidationException::withMessages([
                    'category' => 'Kategori masih memiliki menu. Nonaktifkan kategori alih-alih menghapusnya.',
                ]);
            }

            $category->delete();
        });
    }
}

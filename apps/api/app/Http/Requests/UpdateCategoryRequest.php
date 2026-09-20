<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->parent_id === null) {
                return;
            }

            if ($this->parent_id === $this->route('category')?->id) {
                $validator->errors()->add('parent_id', 'Kategori tidak boleh menjadi parent-nya sendiri.');
            }

            $parentInTenant = DB::table('categories')
                ->where('id', $this->parent_id)
                ->where('tenant_id', $this->attributes->get('tenant_context'))
                ->exists();

            if (! $parentInTenant) {
                $validator->errors()->add('parent_id', 'Kategori parent tidak ditemukan.');
            }
        });
    }
}

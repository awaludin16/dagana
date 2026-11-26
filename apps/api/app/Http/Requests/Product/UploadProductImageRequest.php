<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class UploadProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120',
                'dimensions:max_width=4096,max_height=4096',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.required' => 'Pilih gambar produk terlebih dahulu.',
            'image.image' => 'File harus berupa gambar JPEG, PNG, atau WebP.',
            'image.mimes' => 'Format gambar harus JPEG, PNG, atau WebP.',
            'image.mimetypes' => 'Format gambar harus JPEG, PNG, atau WebP.',
            'image.max' => 'Ukuran gambar maksimal 5 MB.',
            'image.dimensions' => 'Dimensi gambar maksimal 4096 x 4096 piksel.',
            'image.uploaded' => 'Gambar gagal diunggah. Periksa batas ukuran upload server.',
        ];
    }
}

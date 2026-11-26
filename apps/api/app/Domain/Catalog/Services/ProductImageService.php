<?php

namespace App\Domain\Catalog\Services;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class ProductImageService
{
    public const DISK = 'product_images';

    /**
     * Store the file with a server-generated name. The client filename is never
     * used, and the extension comes from server-side MIME detection.
     */
    public function store(Product $product, UploadedFile $file): string
    {
        $directory = "businesses/{$product->business_id}/products/{$product->id}";
        $filename = Str::uuid().'.'.$file->extension();

        $path = Storage::disk(self::DISK)->putFileAs($directory, $file, $filename);

        if ($path === false) {
            throw new RuntimeException('Gambar produk gagal disimpan ke storage.');
        }

        return $path;
    }

    /**
     * A failed file deletion must never roll back product data; report it so the
     * orphan can be cleaned up manually.
     */
    public function delete(?string $path): void
    {
        if ($path === null) {
            return;
        }

        try {
            Storage::disk(self::DISK)->delete($path);
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    /**
     * Public URL comes only from the dedicated public URL config. The S3/MinIO
     * API endpoint is never exposed as an image URL.
     */
    public function url(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        $base = config('filesystems.disks.'.self::DISK.'.url');

        if (! is_string($base) || trim($base) === '') {
            return null;
        }

        return rtrim($base, '/').'/'.ltrim($path, '/');
    }
}

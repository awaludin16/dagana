<?php

namespace Tests\Feature\Api\V1;

use App\Domain\Catalog\Actions\StoreProductImageAction;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class ProductImageTest extends TestCase
{
    use RefreshDatabase;

    private const JPEG = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    private const WEBP = 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('product_images');
        config(['filesystems.disks.product_images.url' => 'https://images.example.test']);
    }

    public function test_owner_can_upload_a_product_image(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $response = $this->upload($product, $this->image('foto-asli.jpg', $this->jpeg()));

        $response->assertOk()->assertJsonPath('data.id', $product->id);

        $path = $response->json('data.image_path');

        $this->assertMatchesRegularExpression(
            '#^businesses/'.$business->id.'/products/'.$product->id.'/[0-9a-f-]{36}\.jpg$#',
            $path,
        );
        $this->assertStringNotContainsString('foto-asli', $path);
        $this->assertSame('https://images.example.test/'.$path, $response->json('data.image_url'));
        Storage::disk('product_images')->assertExists($path);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'image_path' => $path]);
    }

    public function test_owner_can_replace_a_product_image_and_the_old_file_is_deleted(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $oldPath = $this->upload($product, $this->image('lama.jpg', $this->jpeg()))->json('data.image_path');

        $response = $this->upload($product, $this->image('baru.png', $this->png()))->assertOk();
        $newPath = $response->json('data.image_path');

        $this->assertNotSame($oldPath, $newPath);
        $this->assertStringEndsWith('.png', $newPath);
        Storage::disk('product_images')->assertMissing($oldPath);
        Storage::disk('product_images')->assertExists($newPath);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'image_path' => $newPath]);
    }

    public function test_webp_is_accepted(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $path = $this->upload($product, $this->image('menu.webp', $this->webp()))
            ->assertOk()
            ->json('data.image_path');

        $this->assertStringEndsWith('.webp', $path);
        Storage::disk('product_images')->assertExists($path);
    }

    public function test_owner_can_delete_a_product_image(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $path = $this->upload($product, $this->image('menu.jpg', $this->jpeg()))->json('data.image_path');

        $this->deleteJson("/api/v1/products/{$product->id}/image")
            ->assertOk()
            ->assertJsonPath('data.image_path', null)
            ->assertJsonPath('data.image_url', null);

        Storage::disk('product_images')->assertMissing($path);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'image_path' => null]);
    }

    public function test_storage_failure_after_database_update_is_reported_without_reverting_the_product(): void
    {
        [$owner, $business] = $this->merchant();
        $oldPath = 'businesses/1/products/1/lama.jpg';
        $product = Product::factory()->for($business)->create(['image_path' => $oldPath]);
        Storage::disk('product_images')->put($oldPath, 'lama');

        $disk = Mockery::mock(Filesystem::class);
        $disk->shouldReceive('delete')->once()->with($oldPath)->andThrow(new RuntimeException('storage unavailable'));
        Storage::shouldReceive('disk')->with('product_images')->andReturn($disk);

        $handler = Mockery::mock(ExceptionHandler::class);
        $handler->shouldReceive('report')->once()->with(Mockery::type(RuntimeException::class));
        $this->app->instance(ExceptionHandler::class, $handler);

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/products/{$product->id}/image")
            ->assertOk()
            ->assertJsonPath('data.image_path', null);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'image_path' => null]);
    }

    public function test_product_without_image_returns_null_image_url(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $this->getJson("/api/v1/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.image_path', null)
            ->assertJsonPath('data.image_url', null);

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('data.0.image_url', null);
    }

    public function test_image_url_is_null_when_public_url_is_not_configured(): void
    {
        config(['filesystems.disks.product_images.url' => null]);

        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $this->upload($product, $this->image('menu.jpg', $this->jpeg()))
            ->assertOk()
            ->assertJsonPath('data.image_url', null);
    }

    public function test_image_larger_than_five_megabytes_is_rejected(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $file = $this->image('besar.jpg', $this->jpeg().str_repeat("\0", 6 * 1024 * 1024));

        $this->upload($product, $file)->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'image_path' => null]);
        $this->assertSame([], Storage::disk('product_images')->allFiles());
    }

    public function test_image_dimensions_larger_than_4096_pixels_are_rejected(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $png = $this->png();
        $png = substr_replace($png, pack('N', 5000), 16, 4);
        $png = substr_replace($png, pack('N', 5000), 20, 4);

        $this->upload($product, $this->image('lebar.png', $png))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }

    public function test_svg_and_unsupported_formats_are_rejected(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $this->upload($product, $this->image('gambar.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');

        $this->upload($product, $this->image('dokumen.pdf', '%PDF-1.4'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'image_path' => null]);
    }

    public function test_cashier_without_update_permission_cannot_upload_an_image(): void
    {
        [, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        $cashier = User::factory()->create();
        BusinessMembership::factory()->for($cashier)->create([
            'business_id' => $business->id,
            'role' => BusinessMembership::ROLE_CASHIER,
        ]);

        Sanctum::actingAs($cashier);

        $this->upload($product, $this->image('menu.jpg', $this->jpeg()))->assertForbidden();
        $this->deleteJson("/api/v1/products/{$product->id}/image")->assertForbidden();
        $this->assertSame([], Storage::disk('product_images')->allFiles());
    }

    public function test_foreign_business_cannot_upload_or_replace_another_business_image(): void
    {
        [$owner] = $this->merchant();
        [$foreignOwner, $foreignBusiness] = $this->merchant();
        $foreignProduct = Product::factory()->for($foreignBusiness)->create([
            'image_path' => "businesses/{$foreignBusiness->id}/products/99/lama.jpg",
        ]);

        Storage::disk('product_images')->put($foreignProduct->image_path, 'old');

        Sanctum::actingAs($owner);

        $this->upload($foreignProduct, $this->image('menu.jpg', $this->jpeg()))->assertNotFound();

        $this->assertDatabaseHas('products', [
            'id' => $foreignProduct->id,
            'image_path' => $foreignProduct->image_path,
        ]);
        Storage::disk('product_images')->assertExists($foreignProduct->image_path);
    }

    public function test_foreign_business_cannot_delete_another_business_image(): void
    {
        [$owner] = $this->merchant();
        [$foreignOwner, $foreignBusiness] = $this->merchant();
        $foreignProduct = Product::factory()->for($foreignBusiness)->create([
            'image_path' => "businesses/{$foreignBusiness->id}/products/99/lama.jpg",
        ]);

        Storage::disk('product_images')->put($foreignProduct->image_path, 'old');

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/v1/products/{$foreignProduct->id}/image")->assertNotFound();

        $this->assertDatabaseHas('products', [
            'id' => $foreignProduct->id,
            'image_path' => $foreignProduct->image_path,
        ]);
        Storage::disk('product_images')->assertExists($foreignProduct->image_path);
    }

    public function test_new_file_is_cleaned_up_when_the_database_update_fails(): void
    {
        [, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        // Simulasikan row hilang setelah file di-upload (kegagalan update DB).
        DB::table('products')->where('id', $product->id)->delete();

        try {
            app(StoreProductImageAction::class)->execute($product, $this->image('menu.jpg', $this->jpeg()));
            $this->fail('Database update seharusnya gagal.');
        } catch (ModelNotFoundException) {
            // expected
        }

        $this->assertSame([], Storage::disk('product_images')->allFiles());
    }

    public function test_deleting_a_product_also_deletes_its_image(): void
    {
        [$owner, $business] = $this->merchant();
        $product = Product::factory()->for($business)->create();

        Sanctum::actingAs($owner);

        $path = $this->upload($product, $this->image('menu.jpg', $this->jpeg()))->json('data.image_path');

        $this->deleteJson("/api/v1/products/{$product->id}")->assertNoContent();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        Storage::disk('product_images')->assertMissing($path);
    }

    private function upload(Product $product, UploadedFile $file)
    {
        return $this->post(
            "/api/v1/products/{$product->id}/image",
            ['image' => $file],
            ['Accept' => 'application/json'],
        );
    }

    private function image(string $name, string $content): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'dagana-image-');
        file_put_contents($path, $content);

        return new UploadedFile($path, $name, null, null, true);
    }

    private function jpeg(): string
    {
        return base64_decode(self::JPEG, true);
    }

    private function png(): string
    {
        return base64_decode(self::PNG, true);
    }

    private function webp(): string
    {
        return base64_decode(self::WEBP, true);
    }

    /**
     * @return array{User, Business}
     */
    private function merchant(): array
    {
        $owner = User::factory()->create();
        $membership = BusinessMembership::factory()->for($owner)->create();

        return [$owner, $membership->business];
    }
}

<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        /*
         * Catalog product images only (D-18 exception: public read through the
         * bucket policy). Uses an S3-compatible endpoint: MinIO locally,
         * Cloudflare R2 in production. Never falls back to the S3 API endpoint
         * as a public URL; image_url is null until PRODUCT_IMAGES_PUBLIC_URL is
         * configured.
         */
        'product_images' => [
            'driver' => 's3',
            'key' => env('PRODUCT_IMAGES_ACCESS_KEY_ID', env('R2_ACCESS_KEY_ID')),
            'secret' => env('PRODUCT_IMAGES_SECRET_ACCESS_KEY', env('R2_SECRET_ACCESS_KEY')),
            'region' => env('PRODUCT_IMAGES_REGION', env('R2_REGION', 'auto')),
            'bucket' => env('PRODUCT_IMAGES_BUCKET', env('R2_BUCKET', 'dagana-product-images')),
            'url' => env('PRODUCT_IMAGES_PUBLIC_URL', env('R2_PUBLIC_URL')),
            'endpoint' => env('PRODUCT_IMAGES_ENDPOINT', env('R2_ENDPOINT')),
            'use_path_style_endpoint' => env('PRODUCT_IMAGES_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => true,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];

<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['https://dagana-away.vercel.app', env('FRONTEND_URL', 'http://localhost:5173'), env('FRONTEND_URL_2', 'http://localhost:5174'), env('FRONTEND_URL_3', 'http://localhost:5175')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];

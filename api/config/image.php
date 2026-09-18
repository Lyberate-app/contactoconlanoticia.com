<?php

return [
    'quality' => [
        'webp' => env('IMAGE_QUALITY_WEBP', 80),
        'avif' => env('IMAGE_QUALITY_AVIF', 70),
        'jpeg' => env('IMAGE_QUALITY_JPEG', 85),
    ],
    'max_upload_mb' => env('IMAGE_MAX_UPLOAD_MB', 20),
    'conversions' => [
        'thumbnail' => ['width' => 300, 'height' => 200],
        'card'      => ['width' => 640, 'height' => 427],
        'medium'    => ['width' => 960, 'height' => 640],
        'large'     => ['width' => 1280, 'height' => 853],
        'hero'      => ['width' => 1920, 'height' => 1080],
        'og'        => ['width' => 1200, 'height' => 630],
    ],
    'formats' => ['webp', 'jpeg'], // avif when supported
];

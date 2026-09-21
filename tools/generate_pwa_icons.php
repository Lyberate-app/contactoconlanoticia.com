<?php

declare(strict_types=1);

$outDir = __DIR__ . '/../frontend/public/icons';
if (!is_dir($outDir)) {
    mkdir($outDir, 0777, true);
}

$sizes = [
    'icon-192.png' => 192,
    'icon-512.png' => 512,
    'icon-maskable.png' => 512,
    'apple-touch-icon.png' => 180,
];

foreach ($sizes as $filename => $size) {
    $img = imagecreatetruecolor($size, $size);
    $bg = imagecolorallocate($img, 12, 10, 9); // #0c0a09
    $border = imagecolorallocate($img, 41, 37, 36); // #292524
    $textCol = imagecolorallocate($img, 252, 251, 247); // #fcfbf7
    $redDot = imagecolorallocate($img, 220, 38, 38); // #dc2626

    imagefill($img, 0, 0, $bg);

    // Inner subtle border
    $inset = (int) ($size * 0.05);
    imagerectangle($img, $inset, $inset, $size - $inset, $size - $inset, $border);

    // Red accent dot in upper right corner
    $dotRadius = (int) ($size * 0.06);
    $dotX = (int) ($size * 0.76);
    $dotY = (int) ($size * 0.35);
    imagefilledellipse($img, $dotX, $dotY, $dotRadius * 2, $dotRadius * 2, $redDot);

    // Draw central 'C' representation or string
    // Built-in GD font 5
    $char = 'C';
    $font = 5;
    $fontWidth = imagefontwidth($font);
    $fontHeight = imagefontheight($font);

    // Scale up character block
    $scale = max(2, (int) ($size / 50));
    $cx = (int) ($size * 0.42);
    $cy = (int) ($size * 0.38);

    // Draw a bold Serif "C" with thick arcs
    $arcThickness = max(3, (int) ($size * 0.07));
    $outerRad = (int) ($size * 0.28);
    for ($r = $outerRad - $arcThickness; $r <= $outerRad; $r++) {
        imagearc($img, $cx, (int) ($size * 0.52), $r * 2, $r * 2, 45, 315, $textCol);
    }
    // Serifs at top and bottom ends of C
    imagefilledrectangle($img, $cx + (int)($outerRad * 0.6), (int)($size * 0.52 - $outerRad * 0.75), $cx + (int)($outerRad * 0.8), (int)($size * 0.52 - $outerRad * 0.55), $textCol);
    imagefilledrectangle($img, $cx + (int)($outerRad * 0.6), (int)($size * 0.52 + $outerRad * 0.55), $cx + (int)($outerRad * 0.8), (int)($size * 0.52 + $outerRad * 0.75), $textCol);

    imagepng($img, $outDir . '/' . $filename);
    imagedestroy($img);
    echo "Generated: {$filename} ({$size}x{$size})\n";
}

echo "All PWA PNG icons generated successfully.\n";


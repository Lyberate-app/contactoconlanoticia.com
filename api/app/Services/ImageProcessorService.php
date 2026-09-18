<?php

namespace App\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use App\Models\Media;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageProcessorService
{
    protected $manager;

    public function __construct()
    {
        $this->manager = new ImageManager(new Driver());
    }

    public function process($filePath, Media $media)
    {
        $disk = Storage::disk($media->disk);
        $fileContent = $disk->get($filePath);
        $image = $this->manager->read($fileContent);

        $conversions = config('image.conversions', []);
        $formats = config('image.formats', ['webp', 'jpeg']);
        $quality = config('image.quality', ['webp' => 80, 'jpeg' => 85]);

        $generated = [];
        $baseDir = dirname($filePath);
        $filenameWithoutExt = pathinfo($filePath, PATHINFO_FILENAME);

        foreach ($conversions as $name => $size) {
            $resized = $image->scaleDown(width: $size['width'], height: $size['height']);
            
            // Prefer webp, fallback to jpeg if only one format wanted or if formats is array
            $format = in_array('webp', $formats) ? 'webp' : 'jpeg';
            $encoded = $resized->toWebp($quality['webp']);

            $convPath = $baseDir . '/' . $filenameWithoutExt . '_' . $name . '.' . $format;
            $disk->put($convPath, (string) $encoded);
            
            $generated[$name] = $convPath;
        }

        return $generated;
    }
}

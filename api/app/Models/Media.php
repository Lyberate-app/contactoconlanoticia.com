<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_id', 'uploaded_by', 'disk', 'path', 'file_name', 
        'mime_type', 'size', 'conversions', 'alt_text', 'caption', 'photographer'
    ];

    protected $casts = [
        'conversions' => 'array',
    ];

    public function site() { return $this->belongsTo(Site::class); }
    public function uploadedBy() { return $this->belongsTo(User::class, 'uploaded_by'); }

    public function getUrlAttribute()
    {
        return \Illuminate\Support\Facades\Storage::disk($this->disk)->url($this->path);
    }

    public function conversionUrl($name)
    {
        if (isset($this->conversions[$name])) {
            return \Illuminate\Support\Facades\Storage::disk($this->disk)->url($this->conversions[$name]);
        }
        return $this->url; // fallback to original
    }
}

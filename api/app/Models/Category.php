<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['site_id', 'parent_id', 'name', 'slug', 'description', 'cover_media_id', 'sort_order'];

    public function site() { return $this->belongsTo(Site::class); }
    public function parent() { return $this->belongsTo(Category::class, 'parent_id'); }
    public function children() { return $this->hasMany(Category::class, 'parent_id'); }
    public function cover() { return $this->belongsTo(Media::class, 'cover_media_id'); }
    public function posts() { return $this->hasMany(Post::class); }
}

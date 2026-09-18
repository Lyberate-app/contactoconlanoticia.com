<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid', 'site_id', 'author_id', 'category_id', 'cover_media_id',
        'title', 'subtitle', 'slug', 'excerpt', 'content', 'content_format',
        'status', 'published_at', 'scheduled_at', 'is_featured', 'is_breaking',
        'allow_comments', 'seo_title', 'seo_description', 'seo_canonical',
        'og_title', 'og_description', 'og_image_media_id', 'seo_no_index',
        'schema_type', 'views_count', 'reading_time_minutes',
        'created_by', 'updated_by', 'legacy_source', 'legacy_id', 'legacy_url'
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_breaking' => 'boolean',
        'allow_comments' => 'boolean',
        'seo_no_index' => 'boolean',
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (!empty($model->content) && empty($model->reading_time_minutes)) {
                $wordCount = str_word_count(strip_tags($model->content));
                $model->reading_time_minutes = max(1, ceil($wordCount / 200));
            }
        });

        static::updating(function ($model) {
            if ($model->isDirty('content') && empty($model->reading_time_minutes)) {
                $wordCount = str_word_count(strip_tags($model->content));
                $model->reading_time_minutes = max(1, ceil($wordCount / 200));
            }
        });
    }

    // Relations
    public function site() { return $this->belongsTo(Site::class); }
    public function author() { return $this->belongsTo(User::class, 'author_id'); }
    public function category() { return $this->belongsTo(Category::class); }
    public function cover() { return $this->belongsTo(Media::class, 'cover_media_id'); }
    public function ogImage() { return $this->belongsTo(Media::class, 'og_image_media_id'); }
    public function createdBy() { return $this->belongsTo(User::class, 'created_by'); }
    public function updatedBy() { return $this->belongsTo(User::class, 'updated_by'); }
    public function tags() { return $this->belongsToMany(Tag::class); }
    public function revisions() { return $this->hasMany(PostRevision::class); }

    // Scopes
    public function scopePublished($query) {
        return $query->where('status', 'published')->whereNotNull('published_at')->where('published_at', '<=', now());
    }
    public function scopeFeatured($query) { return $query->where('is_featured', true); }
    public function scopeBreaking($query) { return $query->where('is_breaking', true); }
    public function scopeForSite($query, $siteId) { return $query->where('site_id', $siteId); }
}

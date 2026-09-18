<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Site extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'domain', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function users() { return $this->hasMany(User::class); }
    public function categories() { return $this->hasMany(Category::class); }
    public function tags() { return $this->hasMany(Tag::class); }
    public function posts() { return $this->hasMany(Post::class); }
    public function media() { return $this->hasMany(Media::class); }
    public function redirects() { return $this->hasMany(Redirect::class); }
    public function ads() { return $this->hasMany(Ad::class); }
    public function adSlots() { return $this->hasMany(AdSlot::class); }
    public function settings() { return $this->hasMany(Setting::class); }
    public function pageViews() { return $this->hasMany(PageView::class); }
    public function activityLogs() { return $this->hasMany(ActivityLog::class); }
}
